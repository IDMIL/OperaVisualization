"""
Aligns libretto.html dialogue lines to start times in wozzeck_1970_whisper.tsv.

Extracts the sung/spoken dialogue lines from the libretto (skipping character
names, scene headers, and italicized stage directions), then does a global
(Needleman-Wunsch style) fuzzy word alignment against the Whisper transcript
to find a start time for each line. Writes libretto_line_timings.tsv.
"""
import re
import csv
import time
import difflib
import numpy as np

SCRIPT_DIR = __import__("pathlib").Path(__file__).parent
LIBRETTO_PATH = SCRIPT_DIR / "libretto.html"
TSV_PATH = SCRIPT_DIR / "wozzeck_1970_whisper.tsv"
OUT_PATH = SCRIPT_DIR / "libretto_line_timings.tsv"

WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
GAP_PENALTY = -0.5  # cost of leaving a ref or hyp word unmatched


def normalize_words(text):
    return [w.lower() for w in WORD_RE.findall(text)]


def extract_dialogue_lines(path):
    """Return [(line_no, text), ...] for lines that are actual dialogue --
    i.e. not blank, not a <b>...</b> header/<hr>, not a fully-italic <i>...</i>
    stage direction, and not an ALL-CAPS speaker/scene label."""
    lines = []
    in_i = in_b = False
    for line_no, raw in enumerate(open(path, encoding="utf-8"), start=1):
        working = raw.rstrip("\n")
        out_chars = []
        cur_i, cur_b = in_i, in_b
        i, n = 0, len(working)
        while i < n:
            if working[i] == "<":
                if working[i:i + 3] == "<i>":
                    cur_i = True
                    i += 3
                elif working[i:i + 4] == "</i>":
                    cur_i = False
                    i += 4
                elif working[i:i + 3] == "<b>":
                    cur_b = True
                    i += 3
                elif working[i:i + 4] == "</b>":
                    cur_b = False
                    i += 4
                elif working[i:i + 3] == "<p>":
                    i += 3
                elif working[i:i + 4] in ("<br>", "<hr>", "</p>"):
                    i += 4
                else:
                    j = working.find(">", i)
                    i = n if j == -1 else j + 1
                continue
            if not cur_i and not cur_b:
                out_chars.append(working[i])
            i += 1

        in_i, in_b = cur_i, cur_b
        cleaned = "".join(out_chars).strip()
        if not cleaned:
            continue

        letters_only = re.sub(r"[^A-Za-zÀ-ÖØ-öø-ÿ]", "", cleaned)
        if letters_only and letters_only.isupper():
            continue  # speaker name or scene heading

        lines.append((line_no, cleaned))
    return lines


def load_hypothesis_words(path):
    """Return [(word, time_ms), ...] from the whisper TSV, with each word's
    time interpolated across its segment's [start, end] span. Rows that are
    the recurring 'Untertitelung des ZDF, 2020' ASR hallucination (produced
    during long silent/unclear passages) are dropped -- they are not real
    dialogue and were found to pull nearby real words to the wrong time."""
    words = []
    with open(path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        next(reader)  # header
        for row in reader:
            if len(row) < 3:
                continue
            start_s, end_s, text = row[0], row[1], row[2]
            if "ZDF" in text:
                continue
            try:
                start, end = float(start_s), float(end_s)
            except ValueError:
                continue
            ws = normalize_words(text)
            for i, w in enumerate(ws):
                t = start + (end - start) * (i / len(ws))
                words.append((w, t))
    return words


def build_similarity_matrix(ref_uniq, hyp_uniq):
    sim = np.zeros((len(ref_uniq), len(hyp_uniq)), dtype=np.float32)
    sm = difflib.SequenceMatcher()
    for i, rw in enumerate(ref_uniq):
        sm.set_seq2(rw)
        row = sim[i]
        for j, hw in enumerate(hyp_uniq):
            if abs(len(rw) - len(hw)) > max(3, 0.6 * max(len(rw), len(hw))):
                continue  # cheap prefilter, skip very different lengths
            sm.set_seq1(hw)
            row[j] = sm.ratio()
    return sim


def needleman_wunsch(match_score, gap_penalty=GAP_PENALTY):
    """Global alignment. Returns backptr array: 0=diag, 1=up (ref skipped),
    2=left (hyp skipped)."""
    n, m = match_score.shape
    dp_prev = [j * gap_penalty for j in range(m + 1)]
    backptr = np.zeros((n + 1, m + 1), dtype=np.int8)
    backptr[0, :] = 2
    backptr[:, 0] = 1
    backptr[0, 0] = -1

    for i in range(1, n + 1):
        ms_row = match_score[i - 1].tolist()
        diag_vals = [dp_prev[j] + ms_row[j] for j in range(m)]
        up_vals = [dp_prev[j + 1] + gap_penalty for j in range(m)]

        dp_cur = [0.0] * (m + 1)
        dp_cur[0] = i * gap_penalty
        bp_row = backptr[i]
        bp_row[0] = 1
        prev_val = dp_cur[0]
        for j in range(1, m + 1):
            d, u, l = diag_vals[j - 1], up_vals[j - 1], prev_val + gap_penalty
            if d >= u and d >= l:
                best, direction = d, 0
            elif u >= l:
                best, direction = u, 1
            else:
                best, direction = l, 2
            dp_cur[j] = best
            bp_row[j] = direction
            prev_val = best

        dp_prev = dp_cur

    return backptr


def traceback(backptr):
    n, m = backptr.shape[0] - 1, backptr.shape[1] - 1
    i, j = n, m
    pairs = []
    while i > 0 or j > 0:
        d = backptr[i, j]
        if d == 0:
            pairs.append((i - 1, j - 1))
            i -= 1
            j -= 1
        elif d == 1:
            pairs.append((i - 1, None))
            i -= 1
        elif d == 2:
            pairs.append((None, j - 1))
            j -= 1
        else:
            break
    pairs.reverse()
    return pairs


def interpolate_missing(line_order, line_time):
    matched_positions = [(pos, ln) for pos, ln in enumerate(line_order) if ln in line_time]
    pos_of_line = {ln: pos for pos, ln in enumerate(line_order)}

    def interpolate(pos):
        before = after = None
        for p, ln in matched_positions:
            if p <= pos:
                before = (p, ln)
            if p >= pos and after is None:
                after = (p, ln)
                break
        if before is None:
            return line_time[after[1]]
        if after is None or before[0] == after[0]:
            return line_time[before[1]]
        t0, t1 = line_time[before[1]], line_time[after[1]]
        frac = (pos - before[0]) / (after[0] - before[0])
        return t0 + (t1 - t0) * frac

    for ln in line_order:
        if ln not in line_time:
            line_time[ln] = interpolate(pos_of_line[ln])
    return line_time


def main():
    t0 = time.time()
    dialogue_lines = extract_dialogue_lines(LIBRETTO_PATH)
    ref_words = [(w, line_no) for line_no, text in dialogue_lines for w in normalize_words(text)]
    hyp_words = load_hypothesis_words(TSV_PATH)
    print(f"dialogue lines: {len(dialogue_lines)}  ref words: {len(ref_words)}  hyp words: {len(hyp_words)}")

    ref_uniq = sorted(set(w for w, _ in ref_words))
    hyp_uniq = sorted(set(w for w, _ in hyp_words))
    ref_index = {w: i for i, w in enumerate(ref_uniq)}
    hyp_index = {w: i for i, w in enumerate(hyp_uniq)}

    sim = build_similarity_matrix(ref_uniq, hyp_uniq)
    print(f"similarity matrix built: {sim.shape}  ({time.time() - t0:.1f}s)")

    ref_id = np.array([ref_index[w] for w, _ in ref_words], dtype=np.int32)
    hyp_id = np.array([hyp_index[w] for w, _ in hyp_words], dtype=np.int32)
    match_score = (2.0 * sim[ref_id][:, hyp_id] - 1.0).astype(np.float32)

    backptr = needleman_wunsch(match_score)
    print(f"alignment done ({time.time() - t0:.1f}s)")

    pairs = traceback(backptr)

    ref_time = {r: hyp_words[h][1] for r, h in pairs if r is not None and h is not None}

    line_order = [ln for ln, _ in dialogue_lines]
    line_word_indices = {}
    for idx, (_, ln) in enumerate(ref_words):
        line_word_indices.setdefault(ln, []).append(idx)

    line_time = {}
    for ln in line_order:
        times = [ref_time[i] for i in line_word_indices.get(ln, []) if i in ref_time]
        if times:
            line_time[ln] = min(times)
    matched_lines = set(line_time)

    line_time = interpolate_missing(line_order, line_time)

    text_by_line = dict(dialogue_lines)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("line_no\tstart_ms\tstart_s\tmatched\ttext\n")
        for ln in line_order:
            t_ms = line_time[ln]
            matched = 1 if ln in matched_lines else 0
            f.write(f"{ln}\t{t_ms:.0f}\t{t_ms / 1000:.3f}\t{matched}\t{text_by_line[ln]}\n")

    print(f"wrote {OUT_PATH} ({len(line_order)} lines, {len(matched_lines)} directly matched)")


if __name__ == "__main__":
    main()

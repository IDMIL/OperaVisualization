"""
Aligns libretto.html dialogue lines to (act, measure) positions using OCR'd
text from the printed score (Input Processing/bar_text.json), instead of an
audio transcript.

bar_text.json contains, for every Act_<act>_Bar_<bar> crop, a list of OCR
detections -- some are the sung lyric text printed under the vocal staff,
others are unrelated score markings (dynamics, articulations, tempo/rehearsal
marks, instrument names, stage directions). This script builds an ordered
"hypothesis" word stream from those detections (ordered by act, then bar,
then detection order) and does the same fuzzy Needleman-Wunsch word alignment
that align_libretto_to_audio.py does against the whisper transcript, matching
each libretto line to the earliest bar its words are detected in.

This is expected to be far more accurate than the old audio-alignment
approach for act/measure (the thing librettoTimings.ts is actually used for),
since it matches directly against the score rather than against a whisper
transcript position that then had to be snapped to the nearest bar via
recording timestamps for one specific recording.

Writes:
  - libretto_line_score_timings.tsv (line_no, act, measure, matched, text) for review
  - overwrites site/src/data/librettoTimings.ts with the new predictions
"""
import json
import re
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
INPUT_PROCESSING_DIR = SCRIPT_DIR.parent
SITE_DATA_DIR = INPUT_PROCESSING_DIR.parent / "site" / "src" / "data"

LIBRETTO_PATH = SCRIPT_DIR / "libretto.html"
BAR_TEXT_PATH = INPUT_PROCESSING_DIR / "bar_text.json"
RECORDING_TIMESTAMPS_PATH = SITE_DATA_DIR / "recording_timestamps.ts"
RECORDING_ID = "rHFFPyU41_0"

OUT_TSV_PATH = SCRIPT_DIR / "libretto_line_score_timings.tsv"
OUT_TS_PATH = SITE_DATA_DIR / "librettoTimings.ts"

sys.path.insert(0, str(SCRIPT_DIR))
from align_libretto_to_audio import (  # noqa: E402
    extract_dialogue_lines,
    normalize_words,
    build_similarity_matrix,
    needleman_wunsch,
    traceback,
    interpolate_missing,
)

WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
BAR_NAME_RE = re.compile(r"Act_(\d+)_Bar_(\d+)$")


def load_hyp_words(path):
    """Return [(word, act, bar), ...] ordered by act, then bar, then
    detection order within the bar. Hyphens/underscores are stripped before
    tokenizing so syllable-split lyrics like "Woz-zeck" or "Lang-sam,"
    rejoin into single words instead of being cut at the hyphen."""
    with open(path, encoding="utf8") as f:
        bar_text = json.load(f)

    keys = sorted(
        bar_text.keys(),
        key=lambda k: tuple(int(g) for g in BAR_NAME_RE.search(k).groups()),
    )

    hyp_words = []
    for key in keys:
        act, bar = (int(g) for g in BAR_NAME_RE.search(key).groups())
        for det in bar_text[key]:
            cleaned = det["text"].replace("-", "").replace("_", "")
            for w in WORD_RE.findall(cleaned):
                hyp_words.append((w.lower(), act, bar))
    return hyp_words


def load_recording_timestamps(path, recording_id):
    content = path.read_text(encoding="utf-8")
    obj_text = content[content.index("=") + 1:].strip()
    if obj_text.endswith(";"):
        obj_text = obj_text[:-1]
    import ast
    data = ast.literal_eval(obj_text)
    rec = data[recording_id]
    return {(int(act), int(bar)): t for act, bars in rec.items() for bar, t in bars.items()}


def fmt_num(x):
    if x == int(x):
        return str(int(x))
    return f"{x:.3f}".rstrip("0").rstrip(".")


def main():
    t0 = time.time()
    dialogue_lines = extract_dialogue_lines(LIBRETTO_PATH)
    ref_words = [(w, line_no) for line_no, text in dialogue_lines for w in normalize_words(text)]
    hyp_words = load_hyp_words(BAR_TEXT_PATH)
    print(f"dialogue lines: {len(dialogue_lines)}  ref words: {len(ref_words)}  hyp words: {len(hyp_words)}")

    ref_uniq = sorted(set(w for w, _ in ref_words))
    hyp_uniq = sorted(set(w for w, _, _ in hyp_words))
    ref_index = {w: i for i, w in enumerate(ref_uniq)}
    hyp_index = {w: i for i, w in enumerate(hyp_uniq)}

    sim = build_similarity_matrix(ref_uniq, hyp_uniq)
    print(f"similarity matrix built: {sim.shape}  ({time.time() - t0:.1f}s)")

    import numpy as np
    ref_id = np.array([ref_index[w] for w, _ in ref_words], dtype=np.int32)
    hyp_id = np.array([hyp_index[w] for w, _, _ in hyp_words], dtype=np.int32)
    match_score = (2.0 * sim[ref_id][:, hyp_id] - 1.0).astype(np.float32)

    backptr = needleman_wunsch(match_score)
    print(f"alignment done ({time.time() - t0:.1f}s)")

    pairs = traceback(backptr)
    ref_pos = {r: h for r, h in pairs if r is not None and h is not None}

    line_order = [ln for ln, _ in dialogue_lines]
    line_word_indices = {}
    for idx, (_, ln) in enumerate(ref_words):
        line_word_indices.setdefault(ln, []).append(idx)

    line_pos = {}
    for ln in line_order:
        positions = [ref_pos[i] for i in line_word_indices.get(ln, []) if i in ref_pos]
        if positions:
            line_pos[ln] = min(positions)
    matched_lines = set(line_pos)

    line_pos = interpolate_missing(line_order, line_pos)

    recording_timestamps = load_recording_timestamps(RECORDING_TIMESTAMPS_PATH, RECORDING_ID)

    line_act_bar = {}
    for ln in line_order:
        idx = max(0, min(len(hyp_words) - 1, round(line_pos[ln])))
        _, act, bar = hyp_words[idx]
        line_act_bar[ln] = (act, bar)

    text_by_line = dict(dialogue_lines)
    with open(OUT_TSV_PATH, "w", encoding="utf-8") as f:
        f.write("line_no\tact\tmeasure\tmatched\ttext\n")
        for ln in line_order:
            act, bar = line_act_bar[ln]
            matched = 1 if ln in matched_lines else 0
            f.write(f"{ln}\t{act}\t{bar}\t{matched}\t{text_by_line[ln]}\n")
    print(f"wrote {OUT_TSV_PATH} ({len(line_order)} lines, {len(matched_lines)} directly matched)")

    lines_out = []
    for ln in line_order:
        act, bar = line_act_bar[ln]
        start_s = recording_timestamps.get((act, bar))
        if start_s is None:
            raise SystemExit(f"no recording timestamp for act {act} bar {bar} (line {ln})")
        lines_out.append(
            f"    {{lineNo: {ln}, startS: {fmt_num(start_s)}, act: {act}, measure: {bar}}},"
        )

    ts_content = (
        "export interface LibrettoLineTiming {\n"
        "    lineNo: number;\n"
        "    startS: number;\n"
        "    act: number;\n"
        "    measure: number;\n"
        "}\n"
        "\n"
        "// Generated from Input Processing/libretto/align_libretto_to_score.py\n"
        "// Maps each dialogue line in libretto.html (by 1-indexed source line number)\n"
        "// to the act/measure position it is sung at, found by fuzzily aligning the\n"
        "// libretto text against OCR'd lyrics from the printed score\n"
        "// (Input Processing/bar_text.json). startS is the corresponding time (from\n"
        "// recordingTimestamps['" + RECORDING_ID + "']) at which that measure occurs.\n"
        "export const librettoLineTimings: Array<LibrettoLineTiming> = [\n"
        + "\n".join(lines_out) + "\n"
        "];\n"
    )
    OUT_TS_PATH.write_text(ts_content, encoding="utf-8")
    print(f"wrote {OUT_TS_PATH} ({len(lines_out)} entries)")


if __name__ == "__main__":
    main()

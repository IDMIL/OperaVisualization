import argparse
import json
import time

import librosa
import numpy as np

SR = 22050
N_FFT = 4096
HOP = 2048
BLOCK = 8  # aggregate this many native chroma frames -> ~0.743s per aggregated frame


def load_chroma(path):
    t0 = time.time()
    y, sr = librosa.load(path, sr=SR, mono=True)
    print(f"[{path}] loaded {len(y) / sr:.2f}s in {time.time() - t0:.1f}s", flush=True)

    t0 = time.time()
    chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP)
    print(f"[{path}] chroma shape {chroma.shape} in {time.time() - t0:.1f}s", flush=True)
    del y

    n_native = chroma.shape[1]
    n_blocks = n_native // BLOCK
    trimmed = chroma[:, : n_blocks * BLOCK]
    agg = trimmed.reshape(chroma.shape[0], n_blocks, BLOCK).mean(axis=2)
    agg = agg.astype(np.float32) + 1e-6  # avoid exact-zero (silent) vectors -> NaN in cosine distance
    agg /= np.linalg.norm(agg, axis=0, keepdims=True)

    block_center_native_frame = np.arange(n_blocks) * BLOCK + (BLOCK - 1) / 2.0
    times = block_center_native_frame * HOP / sr
    return agg, times


def build_time_map(ref_path, target_path):
    ref_chroma, ref_times = load_chroma(ref_path)
    tgt_chroma, tgt_times = load_chroma(target_path)
    print("ref frames", ref_chroma.shape[1], "target frames", tgt_chroma.shape[1], flush=True)

    t0 = time.time()
    D, wp = librosa.sequence.dtw(X=ref_chroma, Y=tgt_chroma, metric="cosine", backtrack=True)
    print(f"dtw done in {time.time() - t0:.1f}s, path len {len(wp)}, final cost {D[-1, -1]:.3f}", flush=True)

    wp = wp[::-1]  # librosa returns the path from (N-1,M-1) to (0,0); we want it increasing
    i_idx, j_idx = wp[:, 0], wp[:, 1]

    print("path start (i,j)", wp[0], "-> ref_t", ref_times[wp[0, 0]], "target_t", tgt_times[wp[0, 1]], flush=True)
    print("path end   (i,j)", wp[-1], "-> ref_t", ref_times[wp[-1, 0]], "target_t", tgt_times[wp[-1, 1]], flush=True)

    # collapse many-to-one steps: for each unique ref frame index, average the target
    # frame indices it was matched to, giving a strictly increasing ref_t -> target_t map
    uniq_i = np.unique(i_idx)
    sums = np.bincount(i_idx, weights=j_idx.astype(np.float64))
    counts = np.bincount(i_idx)
    mean_j = sums[uniq_i] / counts[uniq_i]

    map_ref_t = ref_times[uniq_i]
    map_target_t = np.interp(mean_j, np.arange(len(tgt_times)), tgt_times)
    return map_ref_t, map_target_t


def convert_timings(timings, ref_to_target):
    def convert(node):
        if isinstance(node, dict):
            return {k: convert(v) for k, v in node.items()}
        elif isinstance(node, (int, float)):
            return float(np.interp(node, ref_to_target[0], ref_to_target[1]))
        else:
            return node

    return convert(timings)


def main():
    parser = argparse.ArgumentParser(
        description="Align a reference audio recording's timing map to another recording via chroma DTW."
    )
    parser.add_argument("--ref-audio", default="film.mp3", help="Reference audio file (default: film.mp3)")
    parser.add_argument("--ref-timings", default="film_timings.json", help="Timings JSON for the reference audio")
    parser.add_argument("target_audio", help="Audio file to align to, e.g. wiener.mp3")
    parser.add_argument("output_timings", help="Output timings JSON path, e.g. wiener_timings.json")
    args = parser.parse_args()

    map_ref_t, map_target_t = build_time_map(args.ref_audio, args.target_audio)

    with open(args.ref_timings, "r", encoding="utf-8") as f:
        ref_timings = json.load(f)

    target_timings = convert_timings(ref_timings, (map_ref_t, map_target_t))

    with open(args.output_timings, "w", encoding="utf-8") as f:
        json.dump(target_timings, f)

    print(f"wrote {args.output_timings}", flush=True)


if __name__ == "__main__":
    main()

"""
Runs OCR over each cropped bar image and writes the extracted text to a JSON file.

Reads every Act_<act>_Bar_<bar>.png in Input Processing/cropped_bars (produced by
crop_bar_images.py) and extracts any printed text found in it -- dynamics, tempo
markings, stage directions, lyrics, rehearsal marks, etc. -- via EasyOCR.

Usage:
    python extract_bar_text.py
"""

import glob
import json
import os
import re

import easyocr

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CROPPED_BARS_DIR = os.path.join(SCRIPT_DIR, "cropped_bars")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "bar_text.json")

# Detections below this confidence are almost always staff lines / note heads
# misread as glyphs, not real text.
MIN_CONFIDENCE = 0.2

NAME_RE = re.compile(r"Act_(\d+)_Bar_(\d+)\.png$")


def main() -> None:
    reader = easyocr.Reader(["de", "en"])

    paths = sorted(
        glob.glob(os.path.join(CROPPED_BARS_DIR, "Act_*_Bar_*.png")),
        key=lambda p: tuple(int(g) for g in NAME_RE.search(os.path.basename(p)).groups()),
    )
    if not paths:
        raise SystemExit(f"no cropped bar images found in {CROPPED_BARS_DIR}")

    results = {}
    for i, path in enumerate(paths):
        name = os.path.basename(path)
        act, bar = NAME_RE.search(name).groups()
        key = f"Act_{act}_Bar_{bar}"

        detections = reader.readtext(path, detail=1, paragraph=False)
        results[key] = [
            {"text": text, "confidence": round(float(conf), 3)}
            for _bbox, text, conf in detections
            if conf >= MIN_CONFIDENCE
        ]

        if (i + 1) % 50 == 0 or i + 1 == len(paths):
            print(f"{i + 1}/{len(paths)} processed")
            with open(OUTPUT_PATH, "w", encoding="utf8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_PATH, "w", encoding="utf8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(results)} entries to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

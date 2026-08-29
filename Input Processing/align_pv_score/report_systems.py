"""Print, for each page, the number of systems detected and the number of
bars (measures) found in each system. Reads the JSON produced by
detect_measures.py."""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path", nargs="?", default="measures_full.json", type=Path)
    args = parser.parse_args()

    pages = json.loads(args.json_path.read_text(encoding="utf-8"))

    for p in pages:
        n_systems = len(p["systems"])
        bars_per_system = [max(0, len(s["barline_xs"]) - 1) for s in p["systems"]]
        total = sum(bars_per_system)
        print(f"{p['page']}: {n_systems} system(s), bars/system={bars_per_system}, total={total}")

        boxes = sorted(p["number_boxes"], key=lambda b: (b["y"], b["x"]))
        if boxes:
            labels = [
                str(b["value"]) if b["value"] is not None else f"?({b['raw_text']!r})"
                for b in boxes
            ]
            print(f"    OCR measure numbers: {', '.join(labels)}")
        else:
            print("    OCR measure numbers: (none detected)")


if __name__ == "__main__":
    main()

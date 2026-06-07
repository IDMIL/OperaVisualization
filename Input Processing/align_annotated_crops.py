"""
Crops annotated score pages to align with their reference counterparts in both dimensions.

For each site/data/pages/Act*/annotated/sheet*.png, finds the matching
site/data/pages/Act*/sheet*.png and crops the annotated image so that the music
content occupies the same fraction of the image width and height as in the reference,
making the two pages align when displayed at the same size.

Usage:
    python align_annotated_crops.py            # crop in place
    python align_annotated_crops.py --dry-run  # report without modifying
    python align_annotated_crops.py --debug    # show content-fraction details
"""

import glob
import os
import sys

import numpy as np
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
PAGES_DIR = os.path.join(REPO_ROOT, "site", "data", "pages")

# Pixels below this brightness (in any channel) are considered content, not white margin.
WHITE_THRESHOLD = 240

# If all four edge fractions already agree within this amount, skip cropping.
TOLERANCE = 0.015


def content_bounds(img: Image.Image) -> tuple[int, int, int, int]:
    """Return (top, bottom, left, right) rows/cols of the content bounding box."""
    arr = np.array(img.convert("RGB"))
    # Min across RGB channels so coloured pixels (red annotation boxes) count as content.
    dark = arr.min(axis=2) < WHITE_THRESHOLD

    rows = np.where(np.any(dark, axis=1))[0]
    cols = np.where(np.any(dark, axis=0))[0]

    if len(rows) == 0 or len(cols) == 0:
        return 0, arr.shape[0] - 1, 0, arr.shape[1] - 1

    return int(rows[0]), int(rows[-1]), int(cols[0]), int(cols[-1])


def _axis_crop(
    content_px: int,
    content_start: int,
    ref_start_frac: float,
    ref_content_frac: float,
    total: int,
) -> tuple[int, int]:
    """Solve for (start, end) crop on one axis."""
    new_size = content_px / ref_content_frac
    start = round(content_start - ref_start_frac * new_size)
    end = round(start + new_size)
    return max(0, start), min(total, end)


def compute_crop(
    ref: Image.Image, ann: Image.Image, debug: bool = False
) -> tuple[int, int, int, int] | None:
    """
    Compute (x_start, y_start, x_end, y_end) crop for ann to align with ref.

    Solves independently for each axis so that the content's fractional position
    within the cropped image matches the reference, making both images align when
    scaled to the same display size.

    Returns None if no meaningful crop is needed.
    """
    ref_h, ref_w = ref.height, ref.width
    ann_h, ann_w = ann.height, ann.width

    ref_top, ref_bot, ref_left, ref_right = content_bounds(ref)
    ann_top, ann_bot, ann_left, ann_right = content_bounds(ann)

    ref_top_frac   = ref_top   / ref_h
    ref_bot_frac   = ref_bot   / ref_h
    ref_left_frac  = ref_left  / ref_w
    ref_right_frac = ref_right / ref_w

    ann_top_frac   = ann_top   / ann_h
    ann_bot_frac   = ann_bot   / ann_h
    ann_left_frac  = ann_left  / ann_w
    ann_right_frac = ann_right / ann_w

    if debug:
        print(
            f"  ref: {ref_w}x{ref_h}  "
            f"top={ref_top}({ref_top_frac:.3f}) bot={ref_bot}({ref_bot_frac:.3f})  "
            f"left={ref_left}({ref_left_frac:.3f}) right={ref_right}({ref_right_frac:.3f})"
        )
        print(
            f"  ann: {ann_w}x{ann_h}  "
            f"top={ann_top}({ann_top_frac:.3f}) bot={ann_bot}({ann_bot_frac:.3f})  "
            f"left={ann_left}({ann_left_frac:.3f}) right={ann_right}({ann_right_frac:.3f})"
        )

    needs_crop = (
        abs(ann_top_frac   - ref_top_frac)   > TOLERANCE
        or abs(ann_bot_frac   - ref_bot_frac)   > TOLERANCE
        or abs(ann_left_frac  - ref_left_frac)  > TOLERANCE
        or abs(ann_right_frac - ref_right_frac) > TOLERANCE
    )
    if not needs_crop:
        return None

    y_start, y_end = _axis_crop(
        ann_bot - ann_top, ann_top,
        ref_top_frac, ref_bot_frac - ref_top_frac,
        ann_h,
    )
    x_start, x_end = _axis_crop(
        ann_right - ann_left, ann_left,
        ref_left_frac, ref_right_frac - ref_left_frac,
        ann_w,
    )

    # Skip if the crop is essentially the whole image in both dimensions.
    if x_start <= 2 and y_start <= 2 and x_end >= ann_w - 2 and y_end >= ann_h - 2:
        return None

    return x_start, y_start, x_end, y_end


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    debug = "--debug" in sys.argv

    for act_dir in sorted(glob.glob(os.path.join(PAGES_DIR, "Act*"))):
        annotated_dir = os.path.join(act_dir, "annotated")
        if not os.path.isdir(annotated_dir):
            continue

        act_name = os.path.basename(act_dir)

        for ann_path in sorted(
            glob.glob(os.path.join(annotated_dir, "sheet*.png")),
            key=lambda p: int(os.path.basename(p).removeprefix("sheet").removesuffix(".png")),
        ):
            sheet_name = os.path.basename(ann_path)
            ref_path = os.path.join(act_dir, sheet_name)

            if not os.path.exists(ref_path):
                print(f"WARNING: no reference for {act_name}/annotated/{sheet_name}")
                continue

            ref = Image.open(ref_path)
            ann = Image.open(ann_path)

            if debug:
                print(f"{act_name}/{sheet_name}:")
            crop = compute_crop(ref, ann, debug=debug)

            if crop is None:
                print(f"  {act_name}/{sheet_name}: aligned, skip")
                continue

            x_start, y_start, x_end, y_end = crop
            verb = "would crop" if dry_run else "cropping"
            print(
                f"  {act_name}/{sheet_name}: {verb} "
                f"x[{x_start}:{x_end}] y[{y_start}:{y_end}] "
                f"(was {ann.width}x{ann.height})"
            )

            if not dry_run:
                ann.crop((x_start, y_start, x_end, y_end)).save(ann_path)


if __name__ == "__main__":
    main()

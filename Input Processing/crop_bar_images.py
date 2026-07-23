"""
Crops each bar's bounding box out of its score page image.

Reads site/src/data/barToPage.ts (bar_to_page: one dict per act, mapping bar
number to its page image and fractional bounding box) and, for every bar,
crops that box out of the referenced page image under site/data/pages/.
Crops are written to Input Processing/cropped_bars/Act_<act>_Bar_<bar>.png.

Usage:
    python crop_bar_images.py
"""

import ast
import os
import re

from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
SITE_DIR = os.path.join(REPO_ROOT, "site")
BAR_TO_PAGE_PATH = os.path.join(SITE_DIR, "src", "data", "barToPage.ts")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "cropped_bars")


def load_bar_to_page(path: str) -> list[dict]:
    """Parse the `bar_to_page` array out of the TypeScript source file."""
    with open(path, "r", encoding="utf8") as f:
        contents = f.read()

    match = re.search(
        r"export const bar_to_page\s*:\s*Array<ActInfo>\s*=\s*(\[.*\]);",
        contents,
        re.DOTALL,
    )
    if match is None:
        raise ValueError(f"could not find bar_to_page array in {path}")

    # The TS object literal (single-quoted strings, bare int keys) is valid
    # Python literal syntax, so it can be parsed directly.
    return ast.literal_eval(match.group(1))


def main() -> None:
    acts = load_bar_to_page(BAR_TO_PAGE_PATH)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    image_cache: dict[str, Image.Image] = {}

    for act_index, bars in enumerate(acts):
        act_number = act_index + 1
        for bar_number, info in sorted(bars.items(), key=lambda kv: int(kv[0])):
            image_rel_path = info["image"]
            if image_rel_path not in image_cache:
                image_cache[image_rel_path] = Image.open(
                    os.path.join(SITE_DIR, image_rel_path)
                )
            page_image = image_cache[image_rel_path]
            width, height = page_image.size

            left = round(info["x"] * width)
            top = round(info["y"] * height)
            right = round((info["x"] + info["w"]) * width)
            bottom = round((info["y"] + info["h"]) * height)

            left = max(0, min(left, width))
            top = max(0, min(top, height))
            right = max(left, min(right, width))
            bottom = max(top, min(bottom, height))

            crop = page_image.crop((left, top, right, bottom))
            out_name = f"Act_{act_number}_Bar_{bar_number}.png"
            crop.save(os.path.join(OUTPUT_DIR, out_name))

        print(f"Act {act_number}: cropped {len(bars)} bars")


if __name__ == "__main__":
    main()

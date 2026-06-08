"""
Converts PDFs listed in annotations/graphical.csv into per-page PNGs.

Output: site/data/pages/Act<act>/annotated/sheet<start_sheet + page_index>.png
        where page_index is zero-indexed.
"""

import csv
import os
import sys
import pymupdf

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

ANNOTATIONS_DIR = os.path.join(REPO_ROOT, "annotations")
PAGES_DIR = os.path.join(REPO_ROOT, "site", "data", "pages")
GRAPHICAL_CSV = os.path.join(ANNOTATIONS_DIR, "graphical.csv")

# Resolution: 150 DPI is a good balance of quality and file size.
DPI = 150


def main():
    with open(GRAPHICAL_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for row in rows:
        pdf_filename = row["file"].strip()
        act = int(row["act"].strip())
        start_sheet = int(row["start_sheet"].strip())

        pdf_path = os.path.join(ANNOTATIONS_DIR, pdf_filename)
        if not os.path.exists(pdf_path):
            print(f"WARNING: {pdf_path} not found, skipping.", file=sys.stderr)
            continue

        out_dir = os.path.join(PAGES_DIR, f"Act{act}", "annotated")
        os.makedirs(out_dir, exist_ok=True)

        doc = pymupdf.open(pdf_path)
        print(f"{pdf_filename}: {len(doc)} pages -> Act{act}/annotated/ starting at sheet{start_sheet}")

        matrix = pymupdf.Matrix(DPI / 72, DPI / 72)

        for page_index, page in enumerate(doc):
            sheet_number = start_sheet + page_index
            out_path = os.path.join(out_dir, f"sheet{sheet_number}.png")
            pix = page.get_pixmap(matrix=matrix)
            pix.save(out_path)
            print(f"  -> sheet{sheet_number}.png")

        doc.close()

    print("Done.")


if __name__ == "__main__":
    main()

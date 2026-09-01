"""
Converts the Serge Garant piano-vocal score PDFs (serge_garant/) into per-page PNGs.

Output: site/data/Garant_pages/Act<act>/sheet<page_number>.png
        where page_number is 1-indexed, reset per act.
"""

import os
import pymupdf

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

GARANT_DIR = os.path.join(REPO_ROOT, "serge_garant")
OUT_DIR = os.path.join(REPO_ROOT, "site", "data", "Garant_pages")

# Resolution: 150 DPI is a good balance of quality and file size.
DPI = 150

PDFS = [
    ("Garant_Wozzeck_Acte1.pdf", 1),
    ("Garant_Wozzeck_Acte2.pdf", 2),
    ("Garant_Wozzeck_Acte3.pdf", 3),
]


def main():
    matrix = pymupdf.Matrix(DPI / 72, DPI / 72)

    for pdf_filename, act in PDFS:
        pdf_path = os.path.join(GARANT_DIR, pdf_filename)
        out_dir = os.path.join(OUT_DIR, f"Act{act}")
        os.makedirs(out_dir, exist_ok=True)

        doc = pymupdf.open(pdf_path)
        print(f"{pdf_filename}: {len(doc)} pages -> Act{act}/")

        for page_index, page in enumerate(doc):
            sheet_number = page_index + 1
            out_path = os.path.join(out_dir, f"sheet{sheet_number}.png")
            pix = page.get_pixmap(matrix=matrix)
            pix.save(out_path)
            print(f"  -> sheet{sheet_number}.png")

        doc.close()

    print("Done.")


if __name__ == "__main__":
    main()

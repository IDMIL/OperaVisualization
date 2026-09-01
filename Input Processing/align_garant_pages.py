"""
Aligns the Serge Garant piano-vocal scan (site/data/Garant_pages/) against the
reference PV scan (site/data/PVpages/) and produces site/src/data/GarantBarToPage.ts.

The Garant scan is the same piano-vocal score as PVpages, but scanned with a
different crop/scale/rotation and with extra non-music pages interspersed
(so page numbers don't line up 1:1, e.g. Garant Act1 sheet7 == PV page_010).

Approach:
  1. For each act, detect ORB features on every PV page and every Garant page.
  2. Score every (PV page, Garant page) pair by count of good feature matches.
  3. Run a monotonic DP alignment (like sequence alignment with free gaps on
     the Garant side) to find, for every PV page, the best corresponding
     Garant page, preserving page order and allowing Garant pages to be
     skipped (the interspersed non-music pages).
  4. For each matched page pair, estimate an affine transform from the ORB
     correspondences and use it to map each bar's bounding box from PV page
     fractions into Garant page fractions.
  5. Emit GarantBarToPage.ts in the same shape as PVbarToPage.ts.
"""

import json
import os

import cv2
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

PV_PAGES_DIR = os.path.join(REPO_ROOT, "site", "data", "PVpages")
GARANT_PAGES_DIR = os.path.join(REPO_ROOT, "site", "data", "Garant_pages")
PV_BOUNDING_BOXES = os.path.join(SCRIPT_DIR, "PV_bounding_boxes.json")
OUT_TS = os.path.join(REPO_ROOT, "site", "src", "data", "GarantBarToPage.ts")

NUM_BARS = [717, 818, 392]
DETECT_MAX_DIM = 900
ORB_FEATURES = 1500
RATIO_TEST = 0.75
MIN_AFFINE_POINTS = 8


def load_gray(path, max_dim=DETECT_MAX_DIM):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    h, w = img.shape
    scale = max_dim / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def detect(orb, path):
    """Returns (descriptors, Nx2 array of keypoint fraction-coords)."""
    img = load_gray(path)
    h, w = img.shape
    kp, des = orb.detectAndCompute(img, None)
    if des is None:
        return None, np.zeros((0, 2), dtype=np.float32)
    pts = np.array([[p.pt[0] / w, p.pt[1] / h] for p in kp], dtype=np.float32)
    return des, pts


def good_matches(bf, des_a, des_b):
    if des_a is None or des_b is None or len(des_a) < 2 or len(des_b) < 2:
        return []
    matches = bf.knnMatch(des_a, des_b, k=2)
    return [m for m, n in matches if m.distance < RATIO_TEST * n.distance]


def build_pv_mappings():
    """Same logic as getBarMappingsDummyMeasurebounds.py's pvMappings section."""
    with open(PV_BOUNDING_BOXES) as f:
        data = json.load(f)

    pv_mappings = [{}, {}, {}]
    for coord in data["data"]["score"]["barcoords"]:
        bar_number = coord["barIdx"]
        act_number = 1
        for act_num_bars in NUM_BARS:
            if bar_number >= act_num_bars:
                bar_number -= act_num_bars
            else:
                break
            act_number += 1
        pv_mappings[act_number - 1][bar_number + 1] = {
            "page": coord["pageIdx"] + 1,
            "x": coord["x1"],
            "y": coord["y1"],
            "w": coord["x2"] - coord["x1"],
            "h": coord["y2"] - coord["y1"],
        }
    return pv_mappings


def align_act(act_index, pv_pages):
    """Returns dict: pv_page -> {'garant_page': int, 'affine': 2x3 array or None, 'matches': int}"""
    act_number = act_index + 1
    garant_dir = os.path.join(GARANT_PAGES_DIR, f"Act{act_number}")
    garant_count = len(
        [f for f in os.listdir(garant_dir) if f.startswith("sheet") and f.endswith(".png")]
    )
    garant_pages = list(range(1, garant_count + 1))

    orb = cv2.ORB_create(nfeatures=ORB_FEATURES)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)

    print(f"Act{act_number}: detecting features on {len(pv_pages)} PV pages...")
    pv_feat = {}
    for p in pv_pages:
        path = os.path.join(PV_PAGES_DIR, f"page_{p:03d}.png")
        pv_feat[p] = detect(orb, path)

    print(f"Act{act_number}: detecting features on {len(garant_pages)} Garant pages...")
    ga_feat = {}
    for g in garant_pages:
        path = os.path.join(garant_dir, f"sheet{g}.png")
        ga_feat[g] = detect(orb, path)

    print(f"Act{act_number}: scoring {len(pv_pages)}x{len(garant_pages)} page pairs...")
    score = np.zeros((len(pv_pages), len(garant_pages)), dtype=np.int32)
    match_cache = {}
    for i, p in enumerate(pv_pages):
        des_p, _ = pv_feat[p]
        for j, g in enumerate(garant_pages):
            des_g, _ = ga_feat[g]
            m = good_matches(bf, des_p, des_g)
            score[i, j] = len(m)

    # Monotonic DP: every PV page matched to exactly one, strictly increasing, Garant page.
    # dp[i][j] = best total score aligning first i PV pages using first j Garant pages.
    n_pv, n_ga = len(pv_pages), len(garant_pages)
    dp = np.zeros((n_pv + 1, n_ga + 1), dtype=np.int64)
    choice = np.zeros((n_pv + 1, n_ga + 1), dtype=np.int8)  # 0 = skip garant page, 1 = match
    for i in range(1, n_pv + 1):
        for j in range(1, n_ga + 1):
            skip = dp[i, j - 1]
            match = dp[i - 1, j - 1] + score[i - 1, j - 1]
            if match >= skip:
                dp[i, j] = match
                choice[i, j] = 1
            else:
                dp[i, j] = skip
                choice[i, j] = 0

    # Traceback
    assignment = {}
    i, j = n_pv, n_ga
    while i > 0:
        if choice[i, j] == 1:
            assignment[pv_pages[i - 1]] = (garant_pages[j - 1], int(score[i - 1, j - 1]))
            i -= 1
            j -= 1
        else:
            j -= 1

    result = {}
    for p in pv_pages:
        g, s = assignment[p]
        des_p, pts_p = pv_feat[p]
        des_g, pts_g = ga_feat[g]
        m = good_matches(bf, des_p, des_g)

        affine = None
        if len(m) >= MIN_AFFINE_POINTS:
            src = np.array([pts_p[mm.queryIdx] for mm in m], dtype=np.float32)
            dst = np.array([pts_g[mm.trainIdx] for mm in m], dtype=np.float32)
            affine, inliers = cv2.estimateAffine2D(
                src, dst, method=cv2.RANSAC, ransacReprojThreshold=0.02
            )
        result[p] = {"garant_page": g, "affine": affine, "matches": s}
        flag = "" if affine is not None else "  ** no reliable transform, using identity **"
        print(f"  PV page_{p:03d} -> Garant sheet{g} ({s} matches){flag}")

    return result


def transform_box(x, y, w, h, affine):
    corners = np.array(
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]], dtype=np.float32
    )
    if affine is None:
        out = corners
    else:
        ones = np.ones((4, 1), dtype=np.float32)
        homog = np.hstack([corners, ones])
        out = homog @ affine.T
    xs = out[:, 0]
    ys = out[:, 1]
    nx, ny = float(xs.min()), float(ys.min())
    nw, nh = float(xs.max() - xs.min()), float(ys.max() - ys.min())
    nx = min(max(nx, 0.0), 1.0)
    ny = min(max(ny, 0.0), 1.0)
    nw = min(max(nw, 0.0), 1.0 - nx)
    nh = min(max(nh, 0.0), 1.0 - ny)
    return nx, ny, nw, nh


def main():
    pv_mappings = build_pv_mappings()
    garant_mappings = [{}, {}, {}]

    for act_index in range(3):
        act_number = act_index + 1
        pv_pages_used = sorted({info["page"] for info in pv_mappings[act_index].values()})
        lo, hi = pv_pages_used[0], pv_pages_used[-1]
        assert pv_pages_used == list(range(lo, hi + 1)), (
            f"Act{act_number}: PV pages are not contiguous: {pv_pages_used}"
        )

        alignment = align_act(act_index, pv_pages_used)

        for bar_number, info in pv_mappings[act_index].items():
            pv_page = info["page"]
            a = alignment[pv_page]
            garant_page = a["garant_page"]
            nx, ny, nw, nh = transform_box(info["x"], info["y"], info["w"], info["h"], a["affine"])
            garant_mappings[act_index][bar_number] = {
                "page": garant_page,
                "x": nx,
                "y": ny,
                "w": nw,
                "h": nh,
                "image": f"data/Garant_pages/Act{act_number}/sheet{garant_page}.png",
            }

    with open(OUT_TS, "w") as f:
        f.write(
            'import {ActInfo} from "./barToPage";\n'
            "export const Garant_bar_to_page : Array<ActInfo> = " + str(garant_mappings) + ";\n"
        )
    print(f"\nWrote {OUT_TS}")


if __name__ == "__main__":
    main()

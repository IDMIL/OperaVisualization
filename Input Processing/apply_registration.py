"""
Apply image registration to annotated score pages.
Act1: resize by 1/1.064, crop (215, 156, 2181, 2946) → 1966×2790
Act3: crop (0, 0, 1977, 2743)
"""
import numpy as np
from PIL import Image
from skimage.registration import phase_cross_correlation
import os

ACT1_ANNOTATED = r'D:\Wozzeck\OperaVisualization\site\data\pages\Act1\annotated'
ACT1_PARENT    = r'D:\Wozzeck\OperaVisualization\site\data\pages\Act1'
ACT3_ANNOTATED = r'D:\Wozzeck\OperaVisualization\site\data\pages\Act3\annotated'
ACT3_PARENT    = r'D:\Wozzeck\OperaVisualization\site\data\pages\Act3'

SCALE = 1.064

def get_act1_offset(sheet_num):
    """Compute per-sheet offset via phase cross-correlation at full resolution."""
    pa = np.array(Image.open(f'{ACT1_PARENT}/sheet{sheet_num}.png').convert('L'), dtype=float)
    ann = Image.open(f'{ACT1_ANNOTATED}/sheet{sheet_num}.png').convert('L')
    new_w, new_h = round(2550 / SCALE), round(3300 / SCALE)
    ann_r = ann.resize((new_w, new_h), Image.LANCZOS)
    ar = np.array(ann_r, dtype=float)

    ph, pw = pa.shape
    ah, aw = ar.shape
    pa_padded = np.zeros_like(ar)
    pa_padded[:ph, :pw] = pa

    shift, error, _ = phase_cross_correlation(ar, pa_padded, upsample_factor=10)
    oy, ox = int(round(shift[0])), int(round(shift[1]))
    return ox, oy, error

def ncc(a, b):
    a = a.astype(float)
    b = b.astype(float)
    a -= a.mean(); b -= b.mean()
    denom = np.std(a) * np.std(b)
    return float(np.mean(a * b) / denom) if denom > 1e-6 else 0.0

# --- Verify offset on sample sheets ---
FIXED_OX, FIXED_OY = 215, 156
CROP_BOX = (FIXED_OX, FIXED_OY, FIXED_OX + 1966, FIXED_OY + 2790)

print("=== Verifying act1 offset on sample sheets ===")
sample_sheets = [64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 105]
offsets = []
for s in sample_sheets:
    ox, oy, err = get_act1_offset(s)
    offsets.append((ox, oy))
    print(f"  sheet{s}: offset=({ox},{oy}), error={err:.4f}")

xs = [o[0] for o in offsets]
ys = [o[1] for o in offsets]
print(f"\nOffset x: min={min(xs)}, max={max(xs)}, mean={np.mean(xs):.1f}")
print(f"Offset y: min={min(ys)}, max={max(ys)}, mean={np.mean(ys):.1f}")

# Verified offset: (215, 156) is consistent across all sheets except sheet64 which is already processed.
# 11 of 12 samples gave exactly (215,156); sheet64 gave garbage because it's already 1966x2790.
OX, OY = 215, 156
CROP_BOX_ACT1 = (OX, OY, OX + 1966, OY + 2790)
print(f"\nUsing fixed crop box: {CROP_BOX_ACT1}")

# --- Apply transformation to all Act1 annotated images ---
print("\n=== Applying Act1 transformations ===")
new_w, new_h = round(2550 / SCALE), round(3300 / SCALE)  # 2397x3102

for sheet_num in range(64, 106):
    src = f'{ACT1_ANNOTATED}/sheet{sheet_num}.png'
    if not os.path.exists(src):
        print(f"  SKIP sheet{sheet_num} (not found)")
        continue
    ann = Image.open(src)
    if ann.size == (2550, 3300):
        ann_resized = ann.resize((new_w, new_h), Image.LANCZOS)
        result = ann_resized.crop(CROP_BOX_ACT1)
        result.save(src)
        print(f"  sheet{sheet_num}: 2550x3300 -> {result.size[0]}x{result.size[1]} OK")
    elif ann.size == (1966, 2790):
        print(f"  sheet{sheet_num}: already 1966x2790, skipping")
    else:
        print(f"  sheet{sheet_num}: unexpected size {ann.size}, skipping")

# --- Apply crop to all Act3 annotated images ---
print("\n=== Applying Act3 crops ===")
act3_sheets = list(range(1, 19)) + list(range(85, 107))
ACT3_CROP = (0, 0, 1977, 2743)

for sheet_num in act3_sheets:
    src = f'{ACT3_ANNOTATED}/sheet{sheet_num}.png'
    if not os.path.exists(src):
        print(f"  SKIP sheet{sheet_num} (not found)")
        continue
    ann = Image.open(src)
    if ann.size == (1978, 2743):
        result = ann.crop(ACT3_CROP)
        result.save(src)
        print(f"  sheet{sheet_num}: 1978x2743 -> {result.size[0]}x{result.size[1]} OK")
    elif ann.size == (1977, 2743):
        print(f"  sheet{sheet_num}: already 1977x2743, no change needed")
    else:
        print(f"  sheet{sheet_num}: unexpected size {ann.size}, skipping")

print("\nDone.")


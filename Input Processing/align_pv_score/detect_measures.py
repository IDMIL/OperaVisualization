"""
Measure bounding box detection for the Wozzeck piano-vocal score.

Pipeline (per page):
  1. Binarize the page.
  2. Detect staff lines (5-line groups), tolerant of staves being interrupted
     by dense note clusters, and of short/partial-width staves (inner/outer
     ossia).
  3. Detect thin vertical "traces" on the page: these are barlines, whether
     drawn solid or as a dotted/dashed line (Berg uses dotted barlines a lot
     in this score, and they are just as real as solid ones).
  4. Group staves into systems using physical connectivity: two vertically
     adjacent staves belong to the same system iff a vertical trace actually
     connects them (a barline/brace stroke spanning the gap between them).
     This is what correctly separates unrelated systems that merely sit near
     each other (e.g. "Auf der Buhne" vs "Orchester") from a system whose
     staves are visually far apart but still one system (a separated ossia).
  5. Within each system, turn the traces into a consensus list of barline
     x-positions -> measure boundaries.
  6. Detect the boxed measure-number labels that Berg's engraver prints
     roughly every 5 measures, OCR the digits inside them, and use them to
     validate/anchor the measure count per system (and flag places where the
     barline count disagrees with the printed numbers).
  7. Emit machine-readable results (JSON) plus a debug overlay image per
     page for visual QA.

This is a heuristic computer-vision pipeline, not a perfect OMR system.
Known rough edges are called out in README-worthy comments near the
relevant function. Use --debug-dir and eyeball the overlays before trusting
the output on a page you haven't checked.
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from scipy.signal import find_peaks
from scipy.ndimage import maximum_filter1d

log = logging.getLogger("detect_measures")


# --------------------------------------------------------------------------
# Tesseract setup
# --------------------------------------------------------------------------

def _configure_tesseract() -> "module":
    import pytesseract

    if shutil.which("tesseract") is None:
        for candidate in (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ):
            if Path(candidate).exists():
                pytesseract.pytesseract.tesseract_cmd = candidate
                break
    return pytesseract


# --------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------

@dataclass
class Staff:
    top: int
    bottom: int
    line_ys: list[float]
    left: int
    right: int
    spacing: float
    matched_lines: int  # how many of the 5 lines had direct pixel support


@dataclass
class System:
    staff_indices: list[int]
    top: int
    bottom: int
    left: int
    right: int
    barline_xs: list[float] = field(default_factory=list)


@dataclass
class NumberBox:
    x: int
    y: int
    w: int
    h: int
    value: Optional[int]
    raw_text: str


@dataclass
class Measure:
    system_index: int
    index_in_system: int
    number: Optional[int]  # global measure number, if resolved
    number_source: str  # "anchor", "interpolated", "unknown"
    x0: float
    x1: float
    y0: int
    y1: int


@dataclass
class PageResult:
    page: str
    width: int
    height: int
    staves: list[Staff]
    systems: list[System]
    number_boxes: list[NumberBox]
    measures: list[Measure]
    warnings: list[str]


# --------------------------------------------------------------------------
# Stage 0: preprocessing
# --------------------------------------------------------------------------

def load_ink(path: Path) -> np.ndarray:
    """Return a uint8 0/255 mask where 255 = ink, for a grayscale scan."""
    img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(path)
    _, ink = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return ink


# --------------------------------------------------------------------------
# Stage 1: staff line / staff detection
# --------------------------------------------------------------------------

def _thin_horizontal_mask(ink: np.ndarray) -> np.ndarray:
    """Ink pixels that are part of a short vertical run (<5px) *and* a long
    horizontal run (>=10px). This isolates staff-line-like strokes while
    excluding stems/noteheads/beams/barlines (tall) and dots/flecks (short
    horizontally)."""
    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
    thick = cv2.morphologyEx(ink, cv2.MORPH_OPEN, vk)
    thin = cv2.subtract(ink, thick)
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 1))
    return cv2.morphologyEx(thin, cv2.MORPH_OPEN, hk)


def estimate_staff_spacing(row_profile: np.ndarray, peaks: np.ndarray) -> float:
    diffs = np.diff(peaks)
    plausible = diffs[(diffs >= 15) & (diffs <= 45)]
    if len(plausible) == 0:
        raise RuntimeError("could not estimate staff line spacing on this page")
    from collections import Counter
    mode = Counter(plausible.tolist()).most_common(1)[0][0]
    near = plausible[np.abs(plausible - mode) <= 2]
    return float(np.mean(near))


def detect_staves(ink: np.ndarray) -> list[Staff]:
    H, W = ink.shape
    line_mask = _thin_horizontal_mask(ink)
    row_profile = (line_mask > 0).sum(axis=1).astype(np.float64)

    peaks, _ = find_peaks(row_profile, height=25, distance=8)
    if len(peaks) < 5:
        return []
    spacing = estimate_staff_spacing(row_profile, peaks)
    tol = 3

    def support_at(y: float) -> float:
        y0, y1 = max(0, int(round(y)) - tol), min(H, int(round(y)) + tol + 1)
        if y0 >= y1:
            return 0.0
        return float(row_profile[y0:y1].max())

    candidates = []
    for p in peaks:
        for line_idx in range(5):
            y0 = p - line_idx * spacing
            ys = [y0 + k * spacing for k in range(5)]
            if ys[0] < -tol or ys[-1] >= H + tol:
                continue
            supports = [support_at(y) for y in ys]
            matched = sum(1 for s in supports if s >= 15)
            if matched >= 3:
                score = sum(supports)
                candidates.append((score, matched, ys, supports))

    candidates.sort(key=lambda c: -c[0])
    accepted: list[tuple] = []

    def overlaps(ys_a, ys_b) -> bool:
        return not (ys_a[-1] < ys_b[0] - spacing * 0.5 or ys_b[-1] < ys_a[0] - spacing * 0.5)

    for cand in candidates:
        if any(overlaps(cand[2], a[2]) for a in accepted):
            continue
        accepted.append(cand)
    accepted.sort(key=lambda a: a[2][0])

    staves = []
    for score, matched, ys, supports in accepted:
        left, right = _staff_x_extent(line_mask, ys, spacing, W)
        if right - left < 30:
            continue
        staves.append(
            Staff(
                top=int(round(ys[0])),
                bottom=int(round(ys[-1])),
                line_ys=[float(y) for y in ys],
                left=left,
                right=right,
                spacing=spacing,
                matched_lines=matched,
            )
        )
    return staves


def _staff_x_extent(line_mask: np.ndarray, ys: list[float], spacing: float, W: int) -> tuple[int, int]:
    """Union of the horizontal ink extent across the staff's 5 line rows."""
    lefts, rights = [], []
    band = max(2, int(spacing * 0.15))
    for y in ys:
        y0, y1 = max(0, int(round(y)) - band), min(line_mask.shape[0], int(round(y)) + band + 1)
        cols = np.where(line_mask[y0:y1, :].any(axis=0))[0]
        if len(cols):
            lefts.append(cols.min())
            rights.append(cols.max())
    if not lefts:
        return 0, 0
    # use a lenient percentile rather than strict min/max so a single stray
    # pixel elsewhere on the row doesn't blow out the extent
    return int(np.percentile(lefts, 10)), int(np.percentile(rights, 90))


# --------------------------------------------------------------------------
# Stage 2: vertical coverage scanning (the barline primitive)
# --------------------------------------------------------------------------
#
# Rather than trying to isolate "barline blobs" globally on the page (which
# turned out to be fragile: a vertical closing wide enough to bridge a
# dotted barline's dashes will just as happily fuse a real barline to a
# notehead/accidental sitting nearby, corrupting the width test and
# silently dropping it -- these scores are dense enough that this happened
# constantly), barlines are instead evaluated directly against the known
# geometry of a specific staff or staff-to-staff gap: "is there a thin
# vertical stroke that is inked across (almost) this whole y-range?" A
# small per-bin tolerance makes dotted barlines just as detectable as solid
# ones without any explicit dash-bridging step.

def _thin_vertical_mask(ink: np.ndarray, max_width: int) -> np.ndarray:
    """Ink pixels that are NOT part of a horizontal run >= max_width+2.
    Removes noteheads/chords/beams/thick text while preserving barlines,
    stems, and brace/bracket strokes (all of which are narrow)."""
    wide_k = cv2.getStructuringElement(cv2.MORPH_RECT, (max_width + 2, 1))
    wide = cv2.morphologyEx(ink, cv2.MORPH_OPEN, wide_k)
    return cv2.subtract(ink, wide)


def _column_coverage(thin_v: np.ndarray, y0: int, y1: int, x0: int, x1: int,
                      bin_size: int, hit_radius: int = 1) -> np.ndarray:
    """For each column in [x0, x1), the fraction of y-bins spanning [y0, y1)
    that contain ink within +/- hit_radius columns. bin_size controls how
    large a gap in a dotted line can be and still count as "covered"."""
    H = thin_v.shape[0]
    y0c, y1c = max(0, y0), min(H, y1)
    x0 = max(0, x0)
    x1 = min(thin_v.shape[1], x1)
    if y1c <= y0c or x1 <= x0:
        return np.zeros(max(0, x1 - x0))
    sub = thin_v[y0c:y1c, x0:x1] > 0
    h = sub.shape[0]
    n_bins = max(1, int(np.ceil(h / bin_size)))
    pad = n_bins * bin_size - h
    if pad > 0:
        sub = np.pad(sub, ((0, pad), (0, 0)))
    bins = sub.reshape(n_bins, bin_size, sub.shape[1]).any(axis=1)
    if hit_radius > 0:
        bins = maximum_filter1d(bins.astype(np.uint8), size=2 * hit_radius + 1, axis=1) > 0
    return bins.mean(axis=0)


def _cluster_columns(xs: np.ndarray, merge_dist: float) -> list[float]:
    if len(xs) == 0:
        return []
    xs = np.sort(xs)
    groups = [[xs[0]]]
    for x in xs[1:]:
        if x - groups[-1][-1] <= merge_dist:
            groups[-1].append(x)
        else:
            groups.append([x])
    return [float(np.mean(g)) for g in groups]


def find_barlines_in_band(thin_v: np.ndarray, y0: int, y1: int, x0: int, x1: int,
                           spacing: float, coverage_thresh: float = 0.72) -> list[float]:
    bin_size = max(6, int(round(spacing * 0.35)))
    cov = _column_coverage(thin_v, y0, y1, x0, x1, bin_size, hit_radius=1)
    hit_xs = np.where(cov >= coverage_thresh)[0] + x0
    return _cluster_columns(hit_xs, merge_dist=max(8.0, spacing * 0.35))


def band_has_connector(thin_v: np.ndarray, y0: int, y1: int, x0: int, x1: int,
                        spacing: float, coverage_thresh: float = 0.6) -> bool:
    bin_size = max(6, int(round(spacing * 0.35)))
    cov = _column_coverage(thin_v, y0, y1, x0, x1, bin_size, hit_radius=1)
    return bool(cov.size) and cov.max() >= coverage_thresh


# --------------------------------------------------------------------------
# Stage 3: system grouping via physical connectivity across staff gaps
# --------------------------------------------------------------------------

def _x_overlap_frac(a_left, a_right, b_left, b_right) -> float:
    inter = min(a_right, b_right) - max(a_left, b_left)
    if inter <= 0:
        return 0.0
    return inter / max(1, min(a_right - a_left, b_right - b_left))


def _barline_match_fraction(xs_a: list[float], xs_b: list[float], tol: float) -> float:
    if not xs_a or not xs_b:
        return 0.0
    matched = sum(1 for x in xs_a if any(abs(x - y) <= tol for y in xs_b))
    return matched / min(len(xs_a), len(xs_b))


def group_into_systems(staves: list[Staff], thin_v: np.ndarray,
                        per_staff_barlines: list[list[float]]) -> list[System]:
    """Two vertically-adjacent staves join the same system if either:
      (a) a vertical trace physically connects them across the gap (the
          common case: a barline or brace stroke runs straight through), or
      (b) no such stroke exists, but their independently-detected barline
          x-positions correlate strongly.
    (b) matters a lot for this score: Wozzeck's vocal line barlines
    routinely stop at the vocal staff and do not extend down through the
    lyrics/stage-direction gap into the piano reduction below, even though
    they share the same measure grid. Gap size alone can't distinguish this
    from an actual system break (the two can be similar), so barline
    agreement is what carries the decision when ink connectivity is absent.
    """
    n = len(staves)
    parent = list(range(n))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for i in range(n - 1):
        s_i, s_j = staves[i], staves[i + 1]
        if _x_overlap_frac(s_i.left, s_i.right, s_j.left, s_j.right) < 0.15:
            continue
        x_left = max(s_i.left, s_j.left)
        x_right = min(s_i.right, s_j.right)
        spacing = (s_i.spacing + s_j.spacing) / 2.0
        pad = int(round(spacing * 0.5))
        if band_has_connector(thin_v, s_i.bottom - pad, s_j.top + pad, x_left, x_right, spacing):
            union(i, i + 1)
            continue

        gap = s_j.top - s_i.bottom
        if gap > max(500, 16 * spacing):
            continue  # implausibly far apart to be the same system; barline
            # correlation alone isn't trusted at extreme distances since it's
            # not impossible for two *different* systems to coincidentally
            # share some barline x-positions (e.g. a shared left margin grid)
        tol = spacing * 0.4
        xs_i = [x for x in per_staff_barlines[i] if x_left <= x <= x_right]
        xs_j = [x for x in per_staff_barlines[i + 1] if x_left <= x <= x_right]
        min_needed = 1 if min(len(xs_i), len(xs_j)) <= 2 else 2
        matched = sum(1 for x in xs_i if any(abs(x - y) <= tol for y in xs_j))
        if matched >= min_needed and _barline_match_fraction(xs_i, xs_j, tol) >= 0.5:
            union(i, i + 1)

    groups: dict[int, list[int]] = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)

    systems = []
    for idxs in sorted(groups.values(), key=lambda g: staves[g[0]].top):
        idxs = sorted(idxs)
        top = min(staves[i].top for i in idxs)
        bottom = max(staves[i].bottom for i in idxs)
        left = min(staves[i].left for i in idxs)
        right = max(staves[i].right for i in idxs)
        systems.append(System(staff_indices=idxs, top=top, bottom=bottom, left=left, right=right))
    return systems


# --------------------------------------------------------------------------
# Stage 4: consensus barlines per system
# --------------------------------------------------------------------------
#
# The per-staff coverage test from stage 2 cannot, by itself, tell a real
# barline from a tall chord stem: in this score's dense secundal chords a
# stem routinely runs from the bottom of the staff to the top (often
# further, into a beam), which satisfies the same "thin stroke, high
# vertical coverage" test a barline does. Relying on it directly (as an
# earlier version of this module did) over-detects barlines by 5-8x.
#
# The fix is to stop asking "is this column inked all the way down *a
# staff*" and instead ask "is this column inked all the way down *the gap
# between two staves*". A chord stem never crosses into the neighboring
# staff's territory; a real barline -- drawn as a single rule (or brace
# stroke) through the whole grand staff -- does. Testing the gap instead of
# the staff turns out to separate real barlines from stem noise almost
# perfectly (empirically: coverage ~0.97 for true barlines vs <=0.5 for
# stem false positives in the gap band), *provided* the gap has enough
# vertical room to be a meaningful test (a few line-spacings) -- extremely
# tight gaps between two staves (near-touching, e.g. a divisi cue staff)
# give a near-zero-height band where almost any nearby ink trivially
# "covers" it, reintroducing false positives.
#
# Some systems have no staff pair with a usable gap at all: a genuinely
# single-staff system, or (the common case in this score) a vocal line
# separated from its piano accompaniment by a wide band of lyrics/stage
# directions, where the vocal barlines simply don't extend down into the
# gap. Such "orphan" systems borrow their barline positions from whichever
# neighboring system *does* have a reliable gap signal -- barlines align
# across an entire system by notation convention, so the accompaniment's
# barline grid applies to the vocal line too even where the ink doesn't
# physically connect. Only a truly isolated system (no reliable neighbor)
# falls back to strict per-staff detection.

def _pair_gap_barlines(thin_v: np.ndarray, a: Staff, b: Staff, spacing: float,
                        coverage_thresh: float = 0.78,
                        x_range: Optional[tuple[float, float]] = None) -> list[float]:
    gap = b.top - a.bottom
    if gap < max(12.0, spacing * 1.2):
        return []  # too little vertical room for the gap test to mean anything
    if x_range is not None:
        x_left, x_right = x_range
    else:
        x_left = max(a.left, b.left)
        x_right = min(a.right, b.right)
    if x_right - x_left < 30:
        return []
    return find_barlines_in_band(thin_v, a.bottom, b.top, int(x_left), int(x_right), spacing, coverage_thresh)


def compute_system_internal_barlines(system: System, staves: list[Staff], thin_v: np.ndarray,
                                      x_range: Optional[tuple[float, float]] = None) -> list[float]:
    """Real (internal, i.e. excluding the system's own left/right edges)
    barline x-positions for a system, derived from staff-gap connectivity.
    Returns [] if no member staff pair gives a usable gap signal.

    x_range, if given, overrides the per-pair staff-extent-derived search
    window (see resolve_systems: a system's own staff extents can be
    artificially narrow, and using them to bound the search would silently
    miss real barlines sitting outside that narrow window)."""
    member = [staves[i] for i in system.staff_indices]
    if len(member) < 2:
        return []
    spacing = float(np.mean([s.spacing for s in member]))
    xs = []
    for i in range(len(member) - 1):
        xs.extend(_pair_gap_barlines(thin_v, member[i], member[i + 1], spacing, x_range=x_range))
    return _cluster_columns(np.array(sorted(xs)), merge_dist=max(10.0, spacing * 0.6))


def _notehead_adjacency_frac(ink: np.ndarray, x: float, y0: int, y1: int, spacing: float,
                              exclude_frac: float = 0.18, look_frac: float = 0.75,
                              min_width_frac: float = 0.55) -> float:
    """Fraction of rows in [y0, y1) where a notehead-sized ink blob sits
    beside (not centered on) column x. High for a stem attached to a
    notehead; near zero for an isolated barline stroke."""
    y0c, y1c = max(0, int(y0)), min(ink.shape[0], int(y1))
    if y1c <= y0c:
        return 0.0
    ex = spacing * exclude_frac
    lk = spacing * look_frac
    xg0, xg1 = max(0, int(x - lk)), min(ink.shape[1], int(x + lk) + 1)
    sub = ink[y0c:y1c, xg0:xg1] > 0
    n_rows = sub.shape[0]
    minw = spacing * min_width_frac
    hit = 0
    for r in range(n_rows):
        cols = np.where(sub[r])[0]
        if len(cols) == 0:
            continue
        splits = np.where(np.diff(cols) > 1)[0]
        for run in np.split(cols, splits + 1):
            rx0, rx1 = run[0] + xg0, run[-1] + xg0
            if rx1 - rx0 + 1 < minw:
                continue
            if abs((rx0 + rx1) / 2.0 - x) > ex:
                hit += 1
                break
    return hit / max(1, n_rows)


def strict_single_staff_barlines(ink: np.ndarray, thin_v: np.ndarray, staff: Staff,
                                  coverage_thresh: float = 0.85, adjacency_max: float = 0.15,
                                  x_range: Optional[tuple[float, float]] = None) -> list[float]:
    """Best-effort barline detection for a staff with no usable cross-staff
    gap signal: a stricter coverage threshold plus rejection of candidates
    that have a notehead-sized blob sitting beside them (i.e. are more
    likely a chord stem than an isolated barline). Noisier than the
    gap-connectivity method -- used only as a last resort.

    x_range overrides the staff's own (possibly artificially narrow --
    see resolve_systems) left/right extent for the search window."""
    margin = int(round(staff.spacing * 0.15))
    x_left, x_right = (staff.left, staff.right) if x_range is None else (int(x_range[0]), int(x_range[1]))
    raw = find_barlines_in_band(thin_v, staff.top - margin, staff.bottom + margin,
                                 x_left, x_right, staff.spacing, coverage_thresh)
    return [
        x for x in raw
        if _notehead_adjacency_frac(ink, x, staff.top, staff.bottom, staff.spacing) <= adjacency_max
    ]


def resolve_systems(systems: list[System], staves: list[Staff], thin_v: np.ndarray,
                     ink: np.ndarray) -> list[System]:
    """Finalize each system's barline_xs (including its left/right edges as
    the outer measure boundaries).

    Note: an earlier version of this function tried to absorb "orphan"
    systems (no reliable staff-gap signal -- see compute_system_internal_barlines)
    into whichever *other* system on the page was nearest, on the theory
    that they were really the same system just split by a failed staff
    detection. That was wrong often enough to be dangerous: in this score
    the vertical gap between two staves of the *same* system (vocal
    separated from its piano accompaniment by a line of lyrics) is not
    reliably smaller than the gap between two genuinely *different*
    systems, so "nearest other system" silently spliced unrelated systems
    together. An orphan system almost always already has the right staff
    membership (group_into_systems got that part right) -- it just needs a
    barline source that doesn't depend on cross-staff ink connectivity, so
    it falls back to strict_single_staff_barlines on its own staves.
    """
    if not systems:
        return []

    # A system's own left/right can be artificially narrow when dense ink
    # obscures the staff-line profile near the true edges (common in this
    # score's heavy chordal passages) even though top/bottom detection
    # still succeeded. Widen suspiciously narrow systems out to the page's
    # typical system span rather than leaving them clipped -- this only
    # affects the outer measure-box edges, not barline detection itself.
    page_left = float(np.percentile([s.left for s in staves], 10))
    page_right = float(np.percentile([s.right for s in staves], 90))
    typical_width = page_right - page_left

    resolved = []
    for sysm in systems:
        left, right = sysm.left, sysm.right
        widened = typical_width > 0 and (right - left) < 0.7 * typical_width
        if widened:
            left = min(left, page_left)
            right = max(right, page_right)
        merged = System(staff_indices=sysm.staff_indices, top=sysm.top, bottom=sysm.bottom,
                         left=int(round(left)), right=int(round(right)))
        x_range = (left, right) if widened else None

        xs = compute_system_internal_barlines(sysm, staves, thin_v, x_range=x_range)
        if not xs:
            member = [staves[k] for k in sysm.staff_indices]
            xs2 = []
            for st in member:
                xs2.extend(strict_single_staff_barlines(ink, thin_v, st, x_range=x_range))
            spacing = float(np.mean([s.spacing for s in member]))
            xs = _cluster_columns(np.array(sorted(xs2)), merge_dist=max(10.0, spacing * 0.6))

        merged.barline_xs = [float(merged.left)] + [float(x) for x in xs] + [float(merged.right)]
        resolved.append(merged)
    return resolved


# --------------------------------------------------------------------------
# Stage 5: measure-number box detection + OCR
# --------------------------------------------------------------------------

def detect_number_boxes(ink: np.ndarray, pytesseract_module) -> list[NumberBox]:
    ink01 = (ink > 0).astype(np.uint8)
    contours, _ = cv2.findContours(ink01, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        # box width grows with digit count (1-3+ digit measure numbers), so
        # this is generous on the wide side; height stays roughly fixed
        if w < 30 or h < 30 or w > 320 or h > 170:
            continue
        ar = w / h
        if not (0.55 <= ar <= 2.4):
            continue
        peri = cv2.arcLength(c, True)
        if peri == 0:
            continue
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if not (4 <= len(approx) <= 6):
            continue

        region = ink01[y:y + h, x:x + w]
        mx, my = max(1, int(w * 0.12)), max(1, int(h * 0.12))
        frame_score = min(
            region[0:my, :].mean(),
            region[-my:, :].mean(),
            region[:, 0:mx].mean(),
            region[:, -mx:].mean(),
        )
        if frame_score < 0.4:
            continue

        ii, ij = int(h * 0.22), int(w * 0.22)
        interior = region[ii:h - ii, ij:w - ij]
        if interior.size == 0:
            continue
        interior_fill = interior.mean()
        if not (0.03 <= interior_fill <= 0.65):
            continue

        boxes.append((x, y, w, h))

    results = []
    for x, y, w, h in boxes:
        pad_x, pad_y = max(6, int(w * 0.16)), max(6, int(h * 0.16))
        crop = ink01[y + pad_y:y + h - pad_y, x + pad_x:x + w - pad_x]
        if crop.size == 0:
            continue
        crop_img = ((1 - crop) * 255).astype("uint8")
        scale = 3
        crop_img = cv2.resize(
            crop_img, (crop_img.shape[1] * scale, crop_img.shape[0] * scale),
            interpolation=cv2.INTER_CUBIC,
        )
        # tesseract needs a quiet white margin around the glyphs -- a tight
        # crop (no margin) measurably degrades recognition, e.g. a solid
        # majority of "5"s were misread or dropped entirely without this
        border = 24
        crop_img = cv2.copyMakeBorder(crop_img, border, border, border, border,
                                       cv2.BORDER_CONSTANT, value=255)
        txt = pytesseract_module.image_to_string(
            crop_img, config="--psm 7 -c tessedit_char_whitelist=0123456789"
        ).strip()
        value = int(txt) if txt.isdigit() else None
        results.append(NumberBox(x=x, y=y, w=w, h=h, value=value, raw_text=txt))
    return results


# --------------------------------------------------------------------------
# Stage 6: assemble measures, cross-reference with number boxes
# --------------------------------------------------------------------------

def assign_number_boxes_to_systems(
    boxes: list[NumberBox], systems: list[System]
) -> dict[int, list[NumberBox]]:
    by_system: dict[int, list[NumberBox]] = {i: [] for i in range(len(systems))}
    for box in boxes:
        if box.value is None:
            continue
        box_cx = box.x + box.w / 2.0
        best_i, best_d = None, None
        for i, sysm in enumerate(systems):
            if sysm.top < box.y:
                continue  # box must sit above the system it labels
            if not (sysm.left - 200 <= box_cx <= sysm.right + 50):
                continue
            d = sysm.top - (box.y + box.h)
            if d < -20:
                continue
            if best_d is None or d < best_d:
                best_d, best_i = d, i
        if best_i is not None:
            by_system[best_i].append(box)
    return by_system


# --------------------------------------------------------------------------
# Debug overlay
# --------------------------------------------------------------------------

def draw_overlay(
    ink: np.ndarray,
    staves: list[Staff],
    systems: list[System],
    boxes: list[NumberBox],
    measures: list[Measure],
) -> np.ndarray:
    canvas = cv2.cvtColor(255 - ink, cv2.COLOR_GRAY2BGR)

    colors = [
        (230, 60, 60), (60, 160, 230), (60, 200, 100), (200, 160, 40),
        (180, 80, 220), (40, 200, 200),
    ]
    for si, sysm in enumerate(systems):
        color = colors[si % len(colors)]
        cv2.rectangle(canvas, (sysm.left, sysm.top - 4), (sysm.right, sysm.bottom + 4), color, 2)
        for x in sysm.barline_xs:
            cv2.line(canvas, (int(x), sysm.top - 4), (int(x), sysm.bottom + 4), color, 1)

    for s in staves:
        cv2.rectangle(canvas, (s.left, s.top), (s.right, s.bottom), (150, 150, 150), 1)

    for box in boxes:
        color = (0, 200, 0) if box.value is not None else (0, 0, 220)
        cv2.rectangle(canvas, (box.x, box.y), (box.x + box.w, box.y + box.h), color, 2)
        label = str(box.value) if box.value is not None else "?"
        cv2.putText(canvas, label, (box.x, box.y - 6), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, color, 2, cv2.LINE_AA)

    for m in measures:
        if m.number is not None:
            cv2.putText(
                canvas, str(m.number), (int(m.x0) + 4, m.y0 + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (120, 0, 160), 1, cv2.LINE_AA,
            )
    return canvas


# --------------------------------------------------------------------------
# Main per-page pipeline
# --------------------------------------------------------------------------

def process_page(path: Path, pytesseract_module, running_measure_number: Optional[int]) -> tuple[PageResult, np.ndarray, Optional[int]]:
    warnings: list[str] = []
    ink = load_ink(path)
    H, W = ink.shape

    staves = detect_staves(ink)
    if not staves:
        warnings.append("no staves detected on this page")
        result = PageResult(page=path.name, width=W, height=H, staves=[], systems=[],
                             number_boxes=[], measures=[], warnings=warnings)
        return result, cv2.cvtColor(255 - ink, cv2.COLOR_GRAY2BGR), running_measure_number

    avg_spacing = float(np.mean([s.spacing for s in staves]))
    max_barline_width = max(6, int(round(avg_spacing * 0.4)))
    thin_v = _thin_vertical_mask(ink, max_barline_width)

    per_staff_barlines = [
        find_barlines_in_band(
            thin_v, s.top - int(round(s.spacing * 0.15)), s.bottom + int(round(s.spacing * 0.15)),
            s.left, s.right, s.spacing,
        )
        for s in staves
    ]

    systems = group_into_systems(staves, thin_v, per_staff_barlines)
    systems = resolve_systems(systems, staves, thin_v, ink)

    boxes = detect_number_boxes(ink, pytesseract_module)
    by_system = assign_number_boxes_to_systems(boxes, systems)

    measures: list[Measure] = []
    for si, sysm in enumerate(systems):
        bxs = sysm.barline_xs
        n_measures = max(0, len(bxs) - 1)
        anchors = sorted(by_system.get(si, []), key=lambda b: b.x)

        # match each anchor box to its nearest barline index in this system
        anchor_pairs = []  # (barline_index, measure_number)
        for box in anchors:
            box_cx = box.x + box.w / 2.0
            if not bxs:
                continue
            idx = int(np.argmin([abs(box_cx - x) for x in bxs]))
            anchor_pairs.append((idx, box.value))

        # validate spacing between consecutive anchors
        for (idx_a, num_a), (idx_b, num_b) in zip(anchor_pairs, anchor_pairs[1:]):
            expected = num_b - num_a
            actual = idx_b - idx_a
            if expected != actual:
                warnings.append(
                    f"{path.name} system {si}: measure-number boxes {num_a}->{num_b} "
                    f"expect {expected} barline gap(s) but detected {actual} "
                    f"(possible missed/spurious barline around x={bxs[idx_a]:.0f}-{bxs[idx_b]:.0f})"
                )

        numbering: dict[int, tuple[Optional[int], str]] = {}
        if anchor_pairs:
            first_idx, first_num = anchor_pairs[0]
            for k in range(n_measures):
                numbering[k] = (first_num + (k - first_idx), "interpolated")
            for idx, num in anchor_pairs:
                if idx < n_measures:
                    numbering[idx] = (num, "anchor")
        elif running_measure_number is not None:
            for k in range(n_measures):
                numbering[k] = (running_measure_number + k, "carried-over")
        else:
            for k in range(n_measures):
                numbering[k] = (None, "unknown")

        for k in range(n_measures):
            num, source = numbering.get(k, (None, "unknown"))
            measures.append(
                Measure(
                    system_index=si, index_in_system=k, number=num, number_source=source,
                    x0=bxs[k], x1=bxs[k + 1], y0=sysm.top, y1=sysm.bottom,
                )
            )
        if n_measures > 0:
            last_num = numbering.get(n_measures - 1, (None, None))[0]
            if last_num is not None:
                running_measure_number = last_num + 1

    overlay = draw_overlay(ink, staves, systems, boxes, measures)
    result = PageResult(
        page=path.name, width=W, height=H, staves=staves, systems=systems,
        number_boxes=boxes, measures=measures, warnings=warnings,
    )
    return result, overlay, running_measure_number


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def _dataclass_json(obj):
    if isinstance(obj, list):
        return [_dataclass_json(o) for o in obj]
    if hasattr(obj, "__dataclass_fields__"):
        return {k: _dataclass_json(v) for k, v in asdict(obj).items()}
    return obj


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input-dir", default="input", type=Path)
    parser.add_argument("--pattern", default="page_*.png")
    parser.add_argument("--output-json", default="measures.json", type=Path)
    parser.add_argument("--debug-dir", default=None, type=Path,
                         help="if set, write an annotated overlay PNG per page here")
    parser.add_argument("--start", default=None, help="first page filename (inclusive) to process")
    parser.add_argument("--end", default=None, help="last page filename (inclusive) to process")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING,
                         format="%(levelname)s %(message)s")

    pytesseract_module = _configure_tesseract()

    pages = sorted(args.input_dir.glob(args.pattern))
    if args.start:
        pages = [p for p in pages if p.name >= args.start]
    if args.end:
        pages = [p for p in pages if p.name <= args.end]
    if not pages:
        print("no input pages matched", file=sys.stderr)
        sys.exit(1)

    if args.debug_dir:
        args.debug_dir.mkdir(parents=True, exist_ok=True)

    all_results = []
    running_measure_number = None
    all_warnings = []
    for path in pages:
        log.info("processing %s", path.name)
        result, overlay, running_measure_number = process_page(path, pytesseract_module, running_measure_number)
        all_results.append(result)
        all_warnings.extend(result.warnings)
        for w in result.warnings:
            log.warning(w)
        if args.debug_dir:
            out_path = args.debug_dir / (path.stem + "_overlay.png")
            cv2.imwrite(str(out_path), overlay)

    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(_dataclass_json(all_results), f, indent=2)

    print(f"processed {len(pages)} page(s); wrote {args.output_json}")
    if all_warnings:
        print(f"{len(all_warnings)} cross-reference warning(s) -- see log output with -v, or the "
              f"'warnings' field per page in {args.output_json}")


if __name__ == "__main__":
    main()

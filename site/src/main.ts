import { LanguageCode } from "./data/text";
import {TimeManager} from "./TimeManager";
import {ScoreManager, SCORE_HEADER_HEIGHT} from "./ScoreManager";
import {TransportManager} from "./TransportManager";
import {TimelineManager} from "./TimelineManager";
import {AnnotationManager} from "./AnnotationManager";
import {globals} from "./globals";
import {ArchitectureManager} from "./ArchitectureManager";
import {TitleSectionManager} from "./TitleSectionManager";
import {ScoreTransportOverlay} from "./ScoreTransportOverlay";
import {VideoPlayerManager} from "./VideoPlayerManager";
import {CurrentPageAnnotations} from "./CurrentPageAnnotations";
import {ScoreDrawingOverlay} from "./ScoreDrawingOverlay";
import {Tutorial} from "./Tutorial";
import {SectionRect, IS_MOBILE_LAYOUT, GAP} from "./SectionManager";
import {PanelVisibilityManager} from "./PanelVisibilityManager";
import {LibrettoManager} from "./LibrettoManager";

// Only a fallback for positioning the title bar before it's measured (see
// buildWindow) — its actual rendered height is auto and grows at narrow
// widths, when its links row wraps onto multiple lines.
const HEADER_HEIGHT_FALLBACK = 50;
const TIMELINES_HEIGHT = 82;
const VISIBILITY_BAR_HEIGHT = 40;

// Matches the score page images' fixed pixel dimensions (see
// ScoreManager.getAspectRatio, which reads the same ratio from the loaded
// image once available). Used here so the default score panel is already
// correctly proportioned before any page image has loaded.
const SCORE_ASPECT_RATIO = 1966 / 2790;

// Mobile layout (see SectionManager.IS_MOBILE_LAYOUT): panels stack in a
// vertical flexbox instead of being freely positioned, so only a starting
// height matters here — top/left/width on the returned rects are ignored by
// SectionManager.applyMobileRect. The score viewer isn't listed: its height
// comes from its aspect ratio via CSS once its image loads (see
// applyMobileRect), so its rect below only needs a starting height that
// roughly matches that ratio to avoid a visible jump once the image loads.
// Timelines isn't listed either — like the title bar, it's pinned chrome
// outside the flex stack (see buildWindow), not one of these freely
// draggable/resizable panels.
const MOBILE_DEFAULT_HEIGHTS: { [sectionId: string]: number } = {
    "transport-section": 160,
    "annotations-section": 420,
    "architecture-list": 260,
    "video-player-section": 220,
    "libretto-section": 420,
};

function computeMobileDefaultRects(): { [sectionId: string]: SectionRect } {
    const vw = window.innerWidth;
    const rects: { [sectionId: string]: SectionRect } = {};
    for (const sectionId in MOBILE_DEFAULT_HEIGHTS) {
        rects[sectionId] = {top: 0, left: 0, width: vw, height: MOBILE_DEFAULT_HEIGHTS[sectionId]};
    }
    rects["score-viewer-section"] = {
        top: 0, left: 0, width: vw, height: Math.round(vw / SCORE_ASPECT_RATIO) + SCORE_HEADER_HEIGHT
    };
    rects["panel-visibility-bar"] = {
        top: window.innerHeight - VISIBILITY_BAR_HEIGHT, left: 0, width: vw, height: VISIBILITY_BAR_HEIGHT
    };
    return rects;
}

// Default on-screen rectangle for each section. These are only a starting
// point — every section's edges are independently draggable afterward, so
// the exact numbers just need to produce a sane initial arrangement.
//
// Only the annotations and score panels are visible on load (see
// PanelVisibilityManager's initial checkbox state) — the timeline is pinned
// chrome and always visible (see buildWindow), and the rest of the vertical
// space below it is split between annotations (left) and the score (right),
// with the score's width driven by its aspect ratio and annotations taking
// whatever remains.
//
// `headerHeight` is the title bar's actual measured height (see buildWindow)
// rather than a constant, since at narrow widths its content wraps onto
// extra lines and grows taller.
function computeDefaultRects(headerHeight: number): { [sectionId: string]: SectionRect } {
    if (IS_MOBILE_LAYOUT) {
        return computeMobileDefaultRects();
    }

    const vw = window.innerWidth;
    // Reserve space at the bottom for the fixed panel-visibility bar.
    const vh = window.innerHeight - VISIBILITY_BAR_HEIGHT;

    const contentTop = headerHeight + TIMELINES_HEIGHT + GAP;
    const contentHeight = vh - contentTop - GAP;

    // The score panel gets the same contentHeight as every other panel, so
    // its image only gets what's left after the header row — see
    // SCORE_HEADER_HEIGHT. Sizing the width off the full contentHeight
    // instead would make the box SCORE_HEADER_HEIGHT too tall to fit, pushing
    // its bottom edge under the pinned panel-visibility bar.
    const scoreImageHeight = contentHeight - SCORE_HEADER_HEIGHT;
    const scoreWidth = Math.round(scoreImageHeight * SCORE_ASPECT_RATIO);
    const scoreLeft = vw - scoreWidth;
    const annotationsWidth = scoreLeft - GAP;

    // Hidden by default (see PanelVisibilityManager) — these defaults only
    // matter as a starting arrangement for whenever the user toggles them on.
    const leftColumnWidth = Math.round(vw * 0.4);
    const transportHeight = 130;
    const archVideoTop = contentTop + transportHeight + GAP;
    const archListHeight = Math.round((vh - archVideoTop - GAP) * 0.4);
    const videoTop = archVideoTop + archListHeight + GAP;

    return {
        "transport-section": {top: contentTop, left: 0, width: leftColumnWidth, height: transportHeight},
        "annotations-section": {top: contentTop, left: 0, width: annotationsWidth, height: contentHeight},
        "architecture-list": {top: archVideoTop, left: 0, width: leftColumnWidth, height: archListHeight},
        "video-player-section": {
            top: videoTop, left: 0, width: leftColumnWidth, height: vh - videoTop - GAP
        },
        "libretto-section": {top: contentTop, left: 0, width: leftColumnWidth, height: contentHeight},
        "score-viewer-section": {
            top: contentTop, left: scoreLeft, width: scoreWidth, height: contentHeight
        },
        "panel-visibility-bar": {
            top: window.innerHeight - VISIBILITY_BAR_HEIGHT, left: 0, width: vw, height: VISIBILITY_BAR_HEIGHT
        },
    };
}

async function buildWindow(lang : LanguageCode ) {
    globals.language = lang;

    document.body.innerHTML  = `
  <div id="layout-sections">
    <div class="section" id="title-section"></div>
    <div class="section" id="timelines-section"></div>
    <div class="section" id="transport-section"></div>
    <div class="section" id="annotations-section"></div>
    <div class="section" id="architecture-list"></div>
    <div class="section" id="video-player-section"></div>
    <div class="section" id="libretto-section"></div>
    <div class="section" id="score-viewer-section"></div>
    <div class="section" id="panel-visibility-bar"></div>
  </div>
    `;

    // Drives the vertical-flexbox panel stack (see .mobile-layout in
    // styles.css) — layout mode is decided once here, at load, and doesn't
    // change if the viewport is later resized or rotated (see IS_MOBILE_LAYOUT).
    if (IS_MOBILE_LAYOUT) {
        document.body.classList.add("mobile-layout");
    }

    // Build the title bar first and measure its actual rendered height —
    // it's auto-sized and grows at narrow widths (its links row wraps onto
    // extra lines), so the rest of the layout needs the real number rather
    // than an assumed constant. Wait for the webfont first: at DOMContentLoaded
    // it's usually still loading, so an immediate measurement would catch the
    // title bar at its fallback-font height and bake that stale, too-short
    // number into the timeline's pinned top offset (see timelineRect below),
    // leaving it overlapping the title bar once Jost swaps in and the
    // title bar's own height:auto grows to fit.
    new TitleSectionManager({top: 0, left: 0, width: window.innerWidth, height: HEADER_HEIGHT_FALLBACK});
    await document.fonts.ready;
    const titleElement = document.getElementById("title-section");
    const headerHeight = titleElement ? titleElement.getBoundingClientRect().height : HEADER_HEIGHT_FALLBACK;

    // The timeline is pinned chrome too (see TimelineManager), flush against
    // the title bar's bottom edge in both layouts — not part of either
    // computeDefaultRects/computeMobileDefaultRects, the same way the title
    // bar's own rect above isn't.
    const timelineRect: SectionRect = {
        top: headerHeight, left: 0, width: window.innerWidth, height: TIMELINES_HEIGHT
    };

    // The panel stack sits between the pinned title/timeline chrome and the
    // panel-visibility bar, so it needs room reserved above/below it for
    // them — headerHeight is dynamic (see above) so this can't be expressed
    // as static CSS.
    if (IS_MOBILE_LAYOUT) {
        const layoutSections = document.getElementById("layout-sections");
        if (layoutSections) {
            layoutSections.style.paddingTop = `${headerHeight + TIMELINES_HEIGHT + GAP}px`;
            layoutSections.style.paddingBottom = `${VISIBILITY_BAR_HEIGHT + GAP}px`;
        }
    }

    const rects = computeDefaultRects(headerHeight);

    let timeManager = new TimeManager();

    let scoreManager = new ScoreManager(timeManager, rects["score-viewer-section"]);
    let transportManager = new TransportManager(timeManager, rects["transport-section"]);
    let timelineManager = new TimelineManager(timeManager, timelineRect);
    let annotationManager = new AnnotationManager(timeManager, rects["annotations-section"]);
    let currentPageAnnotations = new CurrentPageAnnotations(() => annotationManager.getAllAnnotations());
    let scoreDrawingOverlay = new ScoreDrawingOverlay(() => annotationManager.getAllAnnotations());
    annotationManager.setOnAnnotationsChanged(() => scoreDrawingOverlay.refresh());
    let architectureManager = new ArchitectureManager(timeManager, rects["architecture-list"]);
    let videoPlayerManager = new VideoPlayerManager(timeManager, rects["video-player-section"]);
    let librettoManager = new LibrettoManager(timeManager, rects["libretto-section"]);
    new PanelVisibilityManager(rects["panel-visibility-bar"]);
    new ScoreTransportOverlay(timeManager, scoreManager);
    timeManager.listeners.push(scoreManager);
    timeManager.listeners.push(transportManager);
    timeManager.listeners.push(timelineManager);
    timeManager.listeners.push(annotationManager);
    timeManager.listeners.push(currentPageAnnotations);
    timeManager.listeners.push(scoreDrawingOverlay);
    timeManager.listeners.push(architectureManager);
    timeManager.listeners.push(videoPlayerManager);
    timeManager.listeners.push(librettoManager);

    timeManager.notifyListeners("init");

    new Tutorial();
}

// Expose to window so index.html can call it
(window as any).buildWindow = buildWindow;

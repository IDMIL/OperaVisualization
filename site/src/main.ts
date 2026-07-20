import { LanguageCode } from "./data/text";
import {TimeManager} from "./TimeManager";
import {ScoreManager} from "./ScoreManager";
import {TransportManager} from "./TransportManager";
import {TimelineManager} from "./TimelineManager";
import {AnnotationManager} from "./AnnotationManager";
import {globals} from "./globals";
import {ArchitectureManager} from "./ArchitectureManager";
import {TitleSectionManager} from "./TitleSectionManager";
import {ScoreTransportOverlay} from "./ScoreTransportOverlay";
import {VideoPlayerManager} from "./VideoPlayerManager";
import {CurrentPageAnnotations} from "./CurrentPageAnnotations";
import {Tutorial} from "./Tutorial";
import {SectionRect} from "./SectionManager";
import {PanelVisibilityManager} from "./PanelVisibilityManager";

// Only a fallback for positioning the title bar before it's measured (see
// buildWindow) — its actual rendered height is auto and grows at narrow
// widths, when its links row wraps onto multiple lines.
const HEADER_HEIGHT_FALLBACK = 50;
const TIMELINES_HEIGHT = 80;
const VISIBILITY_BAR_HEIGHT = 40;
const GAP = 10;

// Matches the score page images' fixed pixel dimensions (see
// ScoreManager.getAspectRatio, which reads the same ratio from the loaded
// image once available). Used here so the default score panel is already
// correctly proportioned before any page image has loaded.
const SCORE_ASPECT_RATIO = 1966 / 2790;

// Default on-screen rectangle for each section. These are only a starting
// point — every section's edges are independently draggable afterward, so
// the exact numbers just need to produce a sane initial arrangement.
//
// Only the timeline, annotations, and score panels are visible on load (see
// PanelVisibilityManager's initial checkbox state) — the timeline keeps its
// usual spot under the title bar, and the rest of the vertical space is
// split between annotations (left) and the score (right), with the score's
// width driven by its aspect ratio and annotations taking whatever remains.
//
// `headerHeight` is the title bar's actual measured height (see buildWindow)
// rather than a constant, since at narrow widths its content wraps onto
// extra lines and grows taller.
function computeDefaultRects(headerHeight: number): { [sectionId: string]: SectionRect } {
    const vw = window.innerWidth;
    // Reserve space at the bottom for the fixed panel-visibility bar.
    const vh = window.innerHeight - VISIBILITY_BAR_HEIGHT;

    const contentTop = headerHeight + TIMELINES_HEIGHT + GAP;
    const contentHeight = vh - contentTop - GAP;

    const scoreWidth = Math.round(contentHeight * SCORE_ASPECT_RATIO);
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
        "timelines-section": {top: headerHeight, left: 0, width: vw, height: TIMELINES_HEIGHT},
        "transport-section": {top: contentTop, left: 0, width: leftColumnWidth, height: transportHeight},
        "annotations-section": {top: contentTop, left: 0, width: annotationsWidth, height: contentHeight},
        "architecture-list": {top: archVideoTop, left: 0, width: leftColumnWidth, height: archListHeight},
        "video-player-section": {
            top: videoTop, left: 0, width: leftColumnWidth, height: vh - videoTop - GAP
        },
        "score-viewer-section": {top: contentTop, left: scoreLeft, width: scoreWidth, height: contentHeight},
        "panel-visibility-bar": {
            top: window.innerHeight - VISIBILITY_BAR_HEIGHT, left: 0, width: vw, height: VISIBILITY_BAR_HEIGHT
        },
    };
}

function buildWindow(lang : LanguageCode ) {
    globals.language = lang;

    document.body.innerHTML  = `
  <div id="layout-sections">
    <div class="section" id="title-section"></div>
    <div class="section" id="timelines-section"></div>
    <div class="section" id="transport-section"></div>
    <div class="section" id="annotations-section"></div>
    <div class="section" id="architecture-list"></div>
    <div class="section" id="video-player-section"></div>
    <div class="section" id="score-viewer-section"></div>
    <div class="section" id="panel-visibility-bar"></div>
  </div>
    `;

    // Build the title bar first and measure its actual rendered height —
    // it's auto-sized and grows at narrow widths (its links row wraps onto
    // extra lines), so the rest of the layout needs the real number rather
    // than an assumed constant.
    new TitleSectionManager({top: 0, left: 0, width: window.innerWidth, height: HEADER_HEIGHT_FALLBACK});
    const titleElement = document.getElementById("title-section");
    const headerHeight = titleElement ? titleElement.getBoundingClientRect().height : HEADER_HEIGHT_FALLBACK;

    const rects = computeDefaultRects(headerHeight);

    let timeManager = new TimeManager();

    let scoreManager = new ScoreManager(timeManager, rects["score-viewer-section"]);
    let transportManager = new TransportManager(timeManager, rects["transport-section"]);
    let timelineManager = new TimelineManager(timeManager, rects["timelines-section"]);
    let annotationManager = new AnnotationManager(timeManager, rects["annotations-section"]);
    let currentPageAnnotations = new CurrentPageAnnotations(() => annotationManager.getAllAnnotations());
    let architectureManager = new ArchitectureManager(timeManager, rects["architecture-list"]);
    let videoPlayerManager = new VideoPlayerManager(timeManager, rects["video-player-section"]);
    new PanelVisibilityManager(rects["panel-visibility-bar"]);
    new ScoreTransportOverlay(timeManager, scoreManager);
    timeManager.listeners.push(scoreManager);
    timeManager.listeners.push(transportManager);
    timeManager.listeners.push(timelineManager);
    timeManager.listeners.push(annotationManager);
    timeManager.listeners.push(currentPageAnnotations);
    timeManager.listeners.push(architectureManager);
    timeManager.listeners.push(videoPlayerManager);

    timeManager.notifyListeners("init");

    new Tutorial();
}

// Expose to window so index.html can call it
(window as any).buildWindow = buildWindow;

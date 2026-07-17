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

const HEADER_HEIGHT = 50;
const TIMELINES_HEIGHT = 80;
const VISIBILITY_BAR_HEIGHT = 40;
const GAP = 10;

// Default on-screen rectangle for each section. These are only a starting
// point — every section's edges are independently draggable afterward, so
// the exact numbers just need to produce a sane initial arrangement.
function computeDefaultRects(): { [sectionId: string]: SectionRect } {
    const vw = window.innerWidth;
    // Reserve space at the bottom for the fixed panel-visibility bar.
    const vh = window.innerHeight - VISIBILITY_BAR_HEIGHT;

    const contentTop = HEADER_HEIGHT + TIMELINES_HEIGHT + GAP;

    const leftColumnWidth = Math.round(vw * 0.4);
    const rightColumnLeft = leftColumnWidth + GAP;
    const rightColumnWidth = vw - rightColumnLeft;

    const transportHeight = 130;
    const annotationsTop = contentTop + transportHeight + GAP;
    const annotationsWidth = Math.round(leftColumnWidth * 0.55);
    const archVideoLeft = annotationsWidth + GAP;
    const archVideoWidth = leftColumnWidth - archVideoLeft;
    const archListHeight = Math.round((vh - annotationsTop - GAP) * 0.4);
    const videoTop = annotationsTop + archListHeight + GAP;

    return {
        "title-section": {top: 0, left: 0, width: vw, height: HEADER_HEIGHT},
        "timelines-section": {top: HEADER_HEIGHT, left: 0, width: vw, height: TIMELINES_HEIGHT},
        "transport-section": {top: contentTop, left: 0, width: leftColumnWidth, height: transportHeight},
        "annotations-section": {
            top: annotationsTop, left: 0, width: annotationsWidth, height: vh - annotationsTop - GAP
        },
        "architecture-list": {top: annotationsTop, left: archVideoLeft, width: archVideoWidth, height: archListHeight},
        "video-player-section": {
            top: videoTop, left: archVideoLeft, width: archVideoWidth, height: vh - videoTop - GAP
        },
        "score-viewer-section": {
            top: contentTop, left: rightColumnLeft, width: rightColumnWidth, height: vh - contentTop - GAP
        },
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

    const rects = computeDefaultRects();

    let timeManager = new TimeManager();

    let scoreManager = new ScoreManager(timeManager, rects["score-viewer-section"]);
    let transportManager = new TransportManager(timeManager, rects["transport-section"]);
    let timelineManager = new TimelineManager(timeManager, rects["timelines-section"]);
    let annotationManager = new AnnotationManager(timeManager, rects["annotations-section"]);
    let currentPageAnnotations = new CurrentPageAnnotations(() => annotationManager.getAllAnnotations());
    let architectureManager = new ArchitectureManager(timeManager, rects["architecture-list"]);
    let videoPlayerManager = new VideoPlayerManager(timeManager, rects["video-player-section"]);
    new TitleSectionManager(rects["title-section"]);
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

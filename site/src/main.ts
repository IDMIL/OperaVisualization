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

function buildWindow(lang : LanguageCode ) {
    globals.language = lang;

    document.body.innerHTML  = `
  <div id="layout-sections">
    <div class="section" id="title-section"></div>
    <div class="section" id="timelines-section"></div>
    <div class="main-area">
        <div class="main-area-left">
          <div class="section" id="transport-section"></div>
          <div id="analysis-tabs">
            <div class="section" id="annotations-section"></div>
            <div id="column-resizer" aria-hidden="true"></div>
            <div id="architecture-video-column">
              <div class="section" id="architecture-list"></div>
              <div class="section" id="video-player-section"></div>
            </div>
          </div>
        </div>
      <div class="section" id="score-viewer-section"></div>
    </div>
  </div>
    `;

    let timeManager = new TimeManager();

    let scoreManager = new ScoreManager(timeManager);
    let transportManager = new TransportManager(timeManager);
    let timelineManager = new TimelineManager(timeManager);
    let annotationManager = new AnnotationManager(timeManager);
    let currentPageAnnotations = new CurrentPageAnnotations(() => annotationManager.getAllAnnotations());
    let architectureManager = new ArchitectureManager(timeManager);
    let videoPlayerManager = new VideoPlayerManager(timeManager);
    new TitleSectionManager();
    new ScoreTransportOverlay(timeManager, scoreManager);

    timeManager.listeners.push(scoreManager);
    timeManager.listeners.push(transportManager);
    timeManager.listeners.push(timelineManager);
    timeManager.listeners.push(annotationManager);
    timeManager.listeners.push(currentPageAnnotations);
    timeManager.listeners.push(architectureManager);
    timeManager.listeners.push(videoPlayerManager);

    timeManager.notifyListeners("init");

    setupColumnResizer();
}

function setupColumnResizer() {
    const resizer   = document.getElementById('column-resizer')!;
    const leftPanel = document.getElementById('annotations-section')!;

    resizer.addEventListener('mousedown', (e: MouseEvent) => {
        const startX     = e.clientX;
        const startWidth = leftPanel.getBoundingClientRect().width;

        resizer.classList.add('dragging');
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMouseMove(e: MouseEvent) {
            const newWidth = Math.max(120, startWidth + (e.clientX - startX));
            leftPanel.style.flexBasis = `${newWidth}px`;
        }

        function onMouseUp() {
            resizer.classList.remove('dragging');
            document.body.style.cursor     = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup',   onMouseUp);
        e.preventDefault();
    });
}

// Expose to window so index.html can call it
(window as any).buildWindow = buildWindow;
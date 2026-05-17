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
    let architectureManager = new ArchitectureManager(timeManager);
    let videoPlayerManager = new VideoPlayerManager(timeManager);
    new TitleSectionManager();
    new ScoreTransportOverlay(timeManager, scoreManager);

    timeManager.listeners.push(scoreManager);
    timeManager.listeners.push(transportManager);
    timeManager.listeners.push(timelineManager);
    timeManager.listeners.push(annotationManager);
    timeManager.listeners.push(architectureManager);
    timeManager.listeners.push(videoPlayerManager);

    timeManager.notifyListeners("init");

}

// Expose to window so index.html can call it
(window as any).buildWindow = buildWindow;
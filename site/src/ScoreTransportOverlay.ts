import {TimeManager} from "./TimeManager";

export class ScoreTransportOverlay {
    constructor(timeManager: TimeManager) {
        const scoreSection = document.getElementById('score-viewer-section');
        if (!scoreSection) return;

        const overlay = document.createElement('div');
        overlay.id = 'score-transport-overlay';

        const prevBtn = document.createElement('button');
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.innerHTML = '&#8592;';
        prevBtn.onclick = () => timeManager.advancePage(-1, 'transport-click');

        const nextBtn = document.createElement('button');
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.innerHTML = '&#8594;';
        nextBtn.onclick = () => timeManager.advancePage(1, 'transport-click');

        overlay.appendChild(prevBtn);
        overlay.appendChild(nextBtn);
        scoreSection.appendChild(overlay);
    }
}

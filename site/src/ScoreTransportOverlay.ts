import {TimeManager} from "./TimeManager";
import {ScoreManager} from "./ScoreManager";

const EXPAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
const COMPRESS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`;

export class ScoreTransportOverlay {
    private isFullscreen = false;
    private darkenEl: HTMLElement | null = null;
    private fullscreenBtn!: HTMLButtonElement;
    private zoom = 1;
    private panX = 0;
    private panY = 0;
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;

    scoreManager;

    constructor(timeManager: TimeManager, sm: ScoreManager) {
        this.scoreManager = sm;

        const scoreSection = document.getElementById('score-viewer-section');
        if (!scoreSection) return;

        const overlay = document.createElement('div');
        overlay.id = 'score-transport-overlay';

        const prevBtn = document.createElement('button');
        prevBtn.setAttribute('aria-label', 'Previous page');
        prevBtn.innerHTML = '&#8592;';
        prevBtn.onclick = () => timeManager.advancePage(-1, 'transport-click');

        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.setAttribute('aria-label', 'Fullscreen');
        this.fullscreenBtn.innerHTML = EXPAND_SVG;
        this.fullscreenBtn.onclick = () => this.toggleFullscreen();

        const nextBtn = document.createElement('button');
        nextBtn.setAttribute('aria-label', 'Next page');
        nextBtn.innerHTML = '&#8594;';
        nextBtn.onclick = () => timeManager.advancePage(1, 'transport-click');

        overlay.appendChild(prevBtn);
        overlay.appendChild(this.fullscreenBtn);
        overlay.appendChild(nextBtn);
        scoreSection.appendChild(overlay);
    }

    private toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    private enterFullscreen() {
        const scoreSection = document.getElementById('score-viewer-section');
        if (!scoreSection) return;

        const darken = document.createElement('div');
        darken.id = 'score-darken';
        darken.onclick = () => this.exitFullscreen();
        const layoutSections = document.getElementById('layout-sections');
        (layoutSections ?? document.body).appendChild(darken);
        this.darkenEl = darken;

        scoreSection.classList.add('score-fullscreen');
        this.fullscreenBtn.innerHTML = COMPRESS_SVG;
        this.isFullscreen = true;

        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        scoreSection.style.cursor = 'grab';
        scoreSection.addEventListener('wheel', this.handleWheel, { passive: false });
        scoreSection.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    private exitFullscreen() {
        const scoreSection = document.getElementById('score-viewer-section');
        if (!scoreSection) return;

        this.darkenEl?.remove();
        this.darkenEl = null;

        scoreSection.classList.remove('score-fullscreen');
        this.fullscreenBtn.innerHTML = EXPAND_SVG;
        this.isFullscreen = false;

        scoreSection.style.cursor = '';
        scoreSection.removeEventListener('wheel', this.handleWheel);
        scoreSection.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);

        const img = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (img) img.style.transform = '';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        this.scoreManager.rebuildOveralysAtCurrentTime();
    }

    private applyTransform() {
        const img = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (img) img.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        this.zoom = Math.max(0.5, Math.min(5, this.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
        this.applyTransform();
    };

    private handleMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
        const scoreSection = document.getElementById('score-viewer-section');
        if (scoreSection) scoreSection.style.cursor = 'grabbing';
    };

    private handleMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.applyTransform();
    };

    private handleMouseUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        const scoreSection = document.getElementById('score-viewer-section');
        if (scoreSection) scoreSection.style.cursor = 'grab';
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.exitFullscreen();
    };
}

import {capitalizeFirstLetter, text} from "./data/text";
import {globals} from "./globals";

const EXPAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
const COMPRESS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>`;

// Minimal interface implemented by ScoreManager, PVScoreManager, and
// GarantScoreManager — exitFullscreen calls this to re-sync bar overlays
// now that the image has been resized back down out of fullscreen.
export interface ScoreOverlayHost {
    rebuildOveralysAtCurrentTime(): void;
}

// One instance per score panel (main score, PV score, Garant score — see
// main.ts) — same prev/fullscreen/next chrome and pan/zoom-in-fullscreen
// behavior for each, parameterized by which panel's section id to act on
// and how that panel turns pages (see advancePage; the three panels' page
// boundaries don't line up with each other, so each supplies its own).
export class ScoreTransportOverlay {
    private isFullscreen = false;
    private darkenEl: HTMLElement | null = null;
    private fullscreenBtn!: HTMLButtonElement;
    // SectionManager sets top/left/width/height as inline styles, which would
    // otherwise always beat the .score-fullscreen CSS rule (inset: 32px).
    // Stash them while fullscreen and restore on exit.
    private savedInlineRect: string | null = null;
    private zoom = 1;
    private panX = 0;
    private panY = 0;
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;

    scoreManager: ScoreOverlayHost;

    constructor(
        private readonly sectionId: string,
        scoreManager: ScoreOverlayHost,
        private readonly advancePage: (direction: 1 | -1) => void
    ) {
        this.scoreManager = scoreManager;

        const scoreSection = document.getElementById(this.sectionId);
        if (!scoreSection) return;

        const overlay = document.createElement('div');
        overlay.classList.add('score-transport-overlay');

        const prevBtn = document.createElement('button');
        prevBtn.setAttribute('aria-label', capitalizeFirstLetter(text.PREV_PAGE[globals.language]));
        prevBtn.innerHTML = '&#8592;';
        prevBtn.onclick = () => this.advancePage(-1);

        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.setAttribute('aria-label', text.FULLSCREEN[globals.language]);
        this.fullscreenBtn.innerHTML = EXPAND_SVG;
        this.fullscreenBtn.onclick = () => this.toggleFullscreen();

        const nextBtn = document.createElement('button');
        nextBtn.setAttribute('aria-label', capitalizeFirstLetter(text.NEXT_PAGE[globals.language]));
        nextBtn.innerHTML = '&#8594;';
        nextBtn.onclick = () => this.advancePage(1);

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
        const scoreSection = document.getElementById(this.sectionId);
        if (!scoreSection) return;

        const darken = document.createElement('div');
        darken.id = 'score-darken';
        darken.onclick = () => this.exitFullscreen();
        const layoutSections = document.getElementById('layout-sections');
        (layoutSections ?? document.body).appendChild(darken);
        this.darkenEl = darken;

        this.savedInlineRect = scoreSection.style.cssText;
        scoreSection.style.top = '';
        scoreSection.style.left = '';
        scoreSection.style.width = '';
        scoreSection.style.height = '';
        // Mobile layout sets these two inline (see SectionManager.applyMobileRect)
        // and, being inline, they'd otherwise beat the .score-fullscreen CSS
        // rule's position:fixed/inset:32px. Restored along with everything
        // else via the cssText stash below on exit.
        scoreSection.style.position = '';
        scoreSection.style.aspectRatio = '';
        // Same story for the panel-stacking z-index (see bringSectionToFront):
        // it's inline and far below #score-darken's, so leaving it on would
        // sink the fullscreen score behind its own dimming overlay.
        scoreSection.style.zIndex = '';

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
        const scoreSection = document.getElementById(this.sectionId);
        if (!scoreSection) return;

        this.darkenEl?.remove();
        this.darkenEl = null;

        scoreSection.classList.remove('score-fullscreen');
        this.fullscreenBtn.innerHTML = EXPAND_SVG;
        this.isFullscreen = false;

        if (this.savedInlineRect !== null) {
            scoreSection.style.cssText = this.savedInlineRect;
            this.savedInlineRect = null;
        }

        scoreSection.style.cursor = '';
        scoreSection.removeEventListener('wheel', this.handleWheel);
        scoreSection.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);

        const holder = this.getHolder();
        if (holder) holder.style.transform = '';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        this.scoreManager.rebuildOveralysAtCurrentTime();
    }

    // Bar-highlight overlays (.score-overlay) and, on the main score,
    // user-drawn annotation overlays (.score-drawing-overlay) are separate
    // elements sized/positioned to exactly match the score image (see
    // ScoreManager.positionOverlay / ScoreDrawingOverlay) rather than being
    // part of it. Transforming their common parent (.score-image-holder)
    // instead of the <img> itself carries all of them along with the same
    // pan/zoom, keeping bar highlights and drawings aligned to the page
    // underneath instead of staying put while the page moves under them.
    private getHolder(): HTMLElement | null {
        return document.getElementById(this.sectionId)?.querySelector<HTMLElement>('.score-image-holder') ?? null;
    }

    private applyTransform() {
        const holder = this.getHolder();
        if (!holder) return;
        holder.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
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
        const scoreSection = document.getElementById(this.sectionId);
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
        const scoreSection = document.getElementById(this.sectionId);
        if (scoreSection) scoreSection.style.cursor = 'grab';
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.exitFullscreen();
    };
}

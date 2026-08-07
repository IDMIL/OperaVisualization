import {ScoreTime, TimeManagerListener, UpdateSource} from "./TimeManager";
import type {Annotation} from "./AnnotationManager";
import {bar_to_page} from "./data/barToPage";

// Displays saved graphical ('graph'-coded) annotations as image overlays on
// top of the score page in the main score viewer — the counterpart to
// DrawingPanel, which is where those overlays get drawn. Mirrors
// CurrentPageAnnotations' pattern (a getAnnotations callback re-read on
// every render, rather than owning annotation state itself) and
// ScoreManager's own bar-overlay positioning math (see imageOffset there),
// duplicated here in miniature since ScoreManager doesn't know about
// annotations and shouldn't need to.
export class ScoreDrawingOverlay extends TimeManagerListener {
    private readonly getAnnotations: () => Annotation[];
    private readonly imageHolder: HTMLElement | null;
    private currentImage: string | undefined;

    constructor(getAnnotations: () => Annotation[]) {
        super();
        this.getAnnotations = getAnnotations;
        this.imageHolder = document.getElementById('image-holder');

        const img = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (img) {
            new ResizeObserver(() => {
                // Skip the initial synchronous callback fired by observe()
                // itself — no page has loaded yet at construction time.
                if (this.currentImage === undefined) return;
                this.render();
            }).observe(img);
        }
    }

    async timeUpdated(scoreTime: ScoreTime, _updateSource: UpdateSource) {
        this.currentImage = bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        this.render();
    }

    // Called after annotations are added/edited/deleted/imported so a
    // graphical annotation on the page currently on screen shows up (or
    // disappears) immediately, without waiting for the next navigation.
    refresh() {
        this.render();
    }

    private imageOffset(): {x: number, y: number} {
        const im = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (!this.imageHolder || !im) return {x: 0, y: 0};
        const holderRect = this.imageHolder.getBoundingClientRect();
        const imageRect = im.getBoundingClientRect();
        return {x: imageRect.left - holderRect.left, y: imageRect.top - holderRect.top};
    }

    private render() {
        if (!this.imageHolder || this.currentImage === undefined) return;

        this.imageHolder.querySelectorAll('.score-drawing-overlay').forEach(el => el.remove());

        const im = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (!im || !im.width || !im.height) return;
        const {x: offsetX, y: offsetY} = this.imageOffset();

        for (const annotation of this.getAnnotations()) {
            if (!annotation.drawing || annotation.drawingImage !== this.currentImage) continue;

            const overlay = document.createElement('img');
            overlay.className = 'score-drawing-overlay';
            overlay.alt = '';
            overlay.src = annotation.drawing;
            overlay.style.top = `${offsetY}px`;
            overlay.style.left = `${offsetX}px`;
            overlay.style.width = `${im.width}px`;
            overlay.style.height = `${im.height}px`;
            this.imageHolder.appendChild(overlay);
        }
    }
}

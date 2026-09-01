import {ScoreTime, TimeManager} from "./TimeManager";
import {bar_to_page, BarInfo} from "./data/barToPage";
import {SectionManager, SectionRect} from "./SectionManager";
import {text} from "./data/text";
import {globals} from "./globals";

// Height (px) reserved for the in-flow header row above the score image —
// see #score-header in styles.css. Exported so main.ts's default-rect math
// can size the panel to fit both the header and a full-width image (see
// getAspectRatio below, which folds this same constant into the ratio used
// while resizing).
export const SCORE_HEADER_HEIGHT = 28;

export class ScoreManager extends SectionManager {
    private currentPage: undefined | string;
    private currentAct: undefined | number;

    constructor(tm : TimeManager, rect: SectionRect) {
        super("score-viewer-section", rect);
        this.currentPage = undefined;
        this.currentAct = undefined;
        this.timeManager = tm;

        const scoreViewer = this.element;
        if (scoreViewer) {
            scoreViewer.innerHTML = `
            <div id="score-header" class="score-panel-header">
              <div id="score-title"></div>
            </div>
            <div id="image-holder" class="score-image-holder">
              <img class="score-page-image" id="score-viewer-image"/>
            </div>`

            const title = document.getElementById("score-title");
            if (title) title.innerText = text.SCORE_VIEWER[globals.language];

            this.initResizeHandles();
        }

        // Recalculate overlay positions whenever the score image is resized.
        // ResizeObserver fires after layout, so im.width/height and the image's
        // position within #image-holder are already up-to-date when the callback
        // runs. This covers window resizes, entering fullscreen, and exiting
        // fullscreen without any per-trigger wiring in ScoreTransportOverlay.
        const img = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (img) {
            new ResizeObserver(() => {
                // Skip the initial synchronous callback that fires on observe() —
                // no page has loaded yet at construction time.
                if (this.currentPage === undefined) return;

                // In mobile layout, the panel's box is still at its static
                // placeholder height the first time this fires (image wasn't
                // loaded yet at construction) — switch it over to the live
                // CSS aspect-ratio box now that getAspectRatio() has a real
                // value. Cheap/idempotent on every later call too, EXCEPT
                // while fullscreen: entering/exiting fullscreen also resizes
                // the image (this observer fires either way), and
                // refreshMobileRect's inline styles would beat the
                // .score-fullscreen CSS rule (see ScoreTransportOverlay,
                // which already deliberately clears those same inline
                // properties for exactly this reason).
                if (!this.element?.classList.contains('score-fullscreen')) {
                    this.refreshMobileRect();
                }

                // Called directly (no debounce) so the overlay tracks the
                // image live while dragging a resize handle, rather than
                // lagging a fixed delay behind every frame. ResizeObserver
                // already coalesces to at most once per animation frame, so
                // this doesn't add extra work beyond what's necessary.
                this.rebuildOveralysAtCurrentTime();
            }).observe(img);
        }
    }

    // Keeps the panel's own shape matching the currently displayed score
    // page (rather than the page ending up letterboxed inside a
    // mismatched box) whenever the user drags one of its edges. The box is
    // taller than the image alone by SCORE_HEADER_HEIGHT (see #score-header),
    // so the ratio returned here is the image's ratio adjusted for that fixed
    // offset at the panel's current width — not a true constant, but close
    // enough moment-to-moment since it's re-read on every drag step (see
    // SectionManager.beginDrag) and width changes gradually during a drag.
    protected getAspectRatio(): number | null {
        const img = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (!img || !img.naturalWidth || !img.naturalHeight) return null;
        const imageRatio = img.naturalWidth / img.naturalHeight;
        const width = this.element?.offsetWidth;
        if (!width) return imageRatio;
        return width / (width / imageRatio + SCORE_HEADER_HEIGHT);
    }

    async preloadTime(time: ScoreTime) {
        this.preloadImage(bar_to_page[time.act - 1][time.bar].image);
    }

    preloadImage(url : string) {
        let img=new Image();
        img.src=url;
    }

    preloadAround(time : ScoreTime, numBars: number) {
        let timeCopy : ScoreTime = {act: time.act, bar: time.bar,barLength: time.barLength};
        for (let i = 0; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, i);
            this.preloadImage(bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
        timeCopy = {act: time.act, bar: time.bar, barLength: time.barLength};
        for (let i = 1; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, -i);
            this.preloadImage(bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
    }

    // Returns how far the rendered image is offset from the top-left corner of
    // #image-holder. In normal mode this is (0, 0); in fullscreen the image is
    // centred, so there may be horizontal and/or vertical whitespace.
    private imageOffset(): { x: number; y: number } {
        const imageHolder = document.getElementById('image-holder');
        const im = document.getElementById('score-viewer-image') as HTMLImageElement | null;
        if (!imageHolder || !im) return { x: 0, y: 0 };
        const hr = imageHolder.getBoundingClientRect();
        const ir = im.getBoundingClientRect();
        return { x: ir.left - hr.left, y: ir.top - hr.top };
    }

    private positionOverlay(overlay: HTMLElement, barInfo: BarInfo,
                            w: number, h: number,
                            offsetX: number, offsetY: number) {
        overlay.style.top    = (barInfo.y * h + offsetY) + "px";
        overlay.style.left   = (barInfo.x * w + offsetX) + "px";
        overlay.style.width  = (barInfo.w * w) + "px";
        overlay.style.height = (barInfo.h * h) + "px";
    }

    rebuildOveralysAtCurrentTime() {
        if (this.currentPage === undefined) return;
        this.rebuildPageOverlays(this.timeManager.scoreTime);
    }

    private rebuildPageOverlays(scoreTime: ScoreTime) {
        const imageHolder = document.getElementById('image-holder');
        if (!imageHolder) return;

        imageHolder.querySelectorAll('.score-overlay').forEach(el => el.remove());

        const im = document.getElementById('score-viewer-image') as HTMLImageElement;
        const w = im.width;
        const h = im.height;
        const { x: offsetX, y: offsetY } = this.imageOffset();

        const currentImage = bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        const actBars = bar_to_page[scoreTime.act - 1];

        for (const barNum in actBars) {
            const barInfo = actBars[barNum];
            if (barInfo.image !== currentImage) continue;

            const div = document.createElement('div');
            div.classList.add('score-overlay');
            div.dataset.bar = barNum;
            if (parseInt(barNum) === scoreTime.bar) {
                div.id = 'current-bar-overlay';
            } else {
                div.classList.add('other-bar-overlay');
                div.addEventListener('click', () => {
                    this.timeManager.goToTime(scoreTime.act, parseInt(barNum), "score-click");
                });
            }
            this.positionOverlay(div, barInfo, w, h, offsetX, offsetY);
            imageHolder.appendChild(div);
        }
    }

    private updateCurrentBarOverlay(scoreTime: ScoreTime) {
        const prev = document.getElementById('current-bar-overlay');
        if (prev) {
            const prevBar = parseInt(prev.dataset.bar!);
            prev.removeAttribute('id');
            prev.classList.add('other-bar-overlay');
            prev.addEventListener('click', () => {
                this.timeManager.goToTime(scoreTime.act, prevBar, "score-click");
            });
        }
        const imageHolder = document.getElementById('image-holder');
        if (!imageHolder) return;
        const newCurrent = imageHolder.querySelector(`[data-bar="${scoreTime.bar}"]`) as HTMLElement | null;
        if (newCurrent) {
            newCurrent.id = 'current-bar-overlay';
            newCurrent.classList.remove('other-bar-overlay');
        }
    }

    async timeUpdated(scoreTime : ScoreTime) {
        let newPage : string = bar_to_page[scoreTime.act-1][scoreTime.bar].image;
        let im = document.getElementById('score-viewer-image') as HTMLImageElement;

        if (newPage !== this.currentPage || scoreTime.act !== this.currentAct) {
            this.currentPage = newPage;
            this.currentAct = scoreTime.act;
            im.src = newPage;
            await new Promise<void>(resolve => { im.onload = () => resolve(); });
            this.rebuildPageOverlays(scoreTime);
        } else {
            this.updateCurrentBarOverlay(scoreTime);
        }

        this.preloadAround(scoreTime, 5);
    }

    timeManager;
}

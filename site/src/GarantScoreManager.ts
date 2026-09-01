import {ScoreTime, TimeManager} from "./TimeManager";
import {Garant_bar_to_page} from "./data/GarantBarToPage";
import {BarInfo} from "./data/barToPage";
import {SectionManager, SectionRect} from "./SectionManager";
import {text} from "./data/text";
import {globals} from "./globals";
import {SCORE_HEADER_HEIGHT} from "./ScoreManager";

// Same panel as ScoreManager, but reads its page/bar layout from
// Garant_bar_to_page (the Serge Garant piano-vocal score scan) instead of
// bar_to_page — see ScoreManager for the behavior and layout notes this
// mirrors. Kept as a separate class (rather than a parameterized
// ScoreManager) so each panel's DOM ids stay distinct and all three can be
// shown at once.
export class GarantScoreManager extends SectionManager {
    private currentPage: undefined | string;
    private currentAct: undefined | number;

    constructor(tm : TimeManager, rect: SectionRect) {
        super("garant-score-viewer-section", rect);
        this.currentPage = undefined;
        this.currentAct = undefined;
        this.timeManager = tm;

        const scoreViewer = this.element;
        if (scoreViewer) {
            scoreViewer.innerHTML = `
            <div id="garant-score-header" class="score-panel-header">
              <div id="garant-score-title"></div>
            </div>
            <div id="garant-image-holder" class="score-image-holder">
              <img class="score-page-image" id="garant-score-viewer-image"/>
            </div>`

            const title = document.getElementById("garant-score-title");
            if (title) title.innerText = text.GARANT_SCORE_VIEWER[globals.language];

            this.initResizeHandles();
        }

        const img = document.getElementById('garant-score-viewer-image') as HTMLImageElement | null;
        if (img) {
            new ResizeObserver(() => {
                if (this.currentPage === undefined) return;

                if (!this.element?.classList.contains('score-fullscreen')) {
                    this.refreshMobileRect();
                }

                // Called directly (no debounce) so the overlay tracks the
                // image live while dragging a resize handle — see
                // ScoreManager's copy of this observer for why.
                this.rebuildOveralysAtCurrentTime();
            }).observe(img);
        }
    }

    protected getAspectRatio(): number | null {
        const img = document.getElementById('garant-score-viewer-image') as HTMLImageElement | null;
        if (!img || !img.naturalWidth || !img.naturalHeight) return null;
        const imageRatio = img.naturalWidth / img.naturalHeight;
        const width = this.element?.offsetWidth;
        if (!width) return imageRatio;
        return width / (width / imageRatio + SCORE_HEADER_HEIGHT);
    }

    // Walks bar-by-bar from the current time in `direction` until the
    // displayed page image changes, then jumps there — the Garant scan's
    // own page boundaries don't line up with the main score's (see
    // TimeManager.advancePage, which the main score's transport overlay
    // uses instead), so this panel needs its own page-turning logic based
    // directly on where its own images change. addToTime clamps at the
    // start/end of the whole piece rather than wrapping, so a walk that
    // reaches either edge without finding a new image leaves time unchanged
    // and simply stops.
    advancePage(direction: 1 | -1) {
        const scoreTime = this.timeManager.scoreTime;
        const startImage = Garant_bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        const time: ScoreTime = {...scoreTime};

        for (;;) {
            const before = {act: time.act, bar: time.bar};
            this.timeManager.addToTime(time, direction);
            if (time.act === before.act && time.bar === before.bar) return;
            if (Garant_bar_to_page[time.act - 1][time.bar].image !== startImage) {
                this.timeManager.goToTime(time.act, time.bar, "transport-click");
                return;
            }
        }
    }

    async preloadTime(time: ScoreTime) {
        this.preloadImage(Garant_bar_to_page[time.act - 1][time.bar].image);
    }

    preloadImage(url : string) {
        let img=new Image();
        img.src=url;
    }

    preloadAround(time : ScoreTime, numBars: number) {
        let timeCopy : ScoreTime = {act: time.act, bar: time.bar,barLength: time.barLength};
        for (let i = 0; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, i);
            this.preloadImage(Garant_bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
        timeCopy = {act: time.act, bar: time.bar, barLength: time.barLength};
        for (let i = 1; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, -i);
            this.preloadImage(Garant_bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
    }

    private imageOffset(): { x: number; y: number } {
        const imageHolder = document.getElementById('garant-image-holder');
        const im = document.getElementById('garant-score-viewer-image') as HTMLImageElement | null;
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
        const imageHolder = document.getElementById('garant-image-holder');
        if (!imageHolder) return;

        imageHolder.querySelectorAll('.score-overlay').forEach(el => el.remove());

        const im = document.getElementById('garant-score-viewer-image') as HTMLImageElement;
        const w = im.width;
        const h = im.height;
        const { x: offsetX, y: offsetY } = this.imageOffset();

        const currentImage = Garant_bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        const actBars = Garant_bar_to_page[scoreTime.act - 1];

        for (const barNum in actBars) {
            const barInfo = actBars[barNum];
            if (barInfo.image !== currentImage) continue;

            const div = document.createElement('div');
            div.classList.add('score-overlay');
            div.dataset.bar = barNum;
            if (parseInt(barNum) === scoreTime.bar) {
                div.id = 'garant-current-bar-overlay';
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
        const prev = document.getElementById('garant-current-bar-overlay');
        if (prev) {
            const prevBar = parseInt(prev.dataset.bar!);
            prev.removeAttribute('id');
            prev.classList.add('other-bar-overlay');
            prev.addEventListener('click', () => {
                this.timeManager.goToTime(scoreTime.act, prevBar, "score-click");
            });
        }
        const imageHolder = document.getElementById('garant-image-holder');
        if (!imageHolder) return;
        const newCurrent = imageHolder.querySelector(`[data-bar="${scoreTime.bar}"]`) as HTMLElement | null;
        if (newCurrent) {
            newCurrent.id = 'garant-current-bar-overlay';
            newCurrent.classList.remove('other-bar-overlay');
        }
    }

    async timeUpdated(scoreTime : ScoreTime) {
        let newPage : string = Garant_bar_to_page[scoreTime.act-1][scoreTime.bar].image;
        let im = document.getElementById('garant-score-viewer-image') as HTMLImageElement;

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

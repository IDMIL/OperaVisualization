import {ScoreTime, TimeManager, TimeManagerListener} from "./TimeManager";
import {bar_to_page, BarInfo} from "./data/barToPage";

export class ScoreManager extends TimeManagerListener {
    private currentPage: undefined | string;
    private currentAct: undefined | number;
    constructor(tm : TimeManager) {
        super();
        this.currentPage = undefined;
        this.currentAct = undefined;
        this.timeManager = tm;

        const scoreViewer = document.getElementById("score-viewer-section");
        if (scoreViewer) {
            scoreViewer.innerHTML = `
            <div id="image-holder">
              <img class="score-page-image" id="score-viewer-image"/>
            </div>`
        }
    }

    async preloadTime(time: ScoreTime) {
        this.preloadImage(bar_to_page[time.act - 1][time.bar].image);
    }

    preloadImage(url : string) {
        let img=new Image();
        img.src=url;
    }

    preloadAround(time : ScoreTime, numBars: number) {
        let timeCopy : ScoreTime = {act: time.act, bar: time.bar, beat: time.beat, barLength: time.barLength};
        for (let i = 0; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, i);
            this.preloadImage(bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
        timeCopy = {act: time.act, bar: time.bar, beat: time.beat, barLength: time.barLength};
        for (let i = 1; i <= numBars; ++i) {
            this.timeManager.addToTime(timeCopy, -i);
            this.preloadImage(bar_to_page[timeCopy.act - 1][timeCopy.bar].image);
        }
    }

    private positionOverlay(overlay: HTMLElement, barInfo: BarInfo, w: number, h: number) {
        overlay.style.top = (barInfo.y * h) + "px";
        overlay.style.left = (barInfo.x * w) + "px";
        overlay.style.width = (barInfo.w * w) + "px";
        overlay.style.height = (barInfo.h * h) + "px";
    }

    private rebuildPageOverlays(scoreTime: ScoreTime) {
        const imageHolder = document.getElementById('image-holder');
        if (!imageHolder) return;

        imageHolder.querySelectorAll('.score-overlay').forEach(el => el.remove());

        const im = document.getElementById('score-viewer-image') as HTMLImageElement;
        const w = im.width;
        const h = im.height;
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
                    this.timeManager.goToTime(scoreTime.act, parseInt(barNum), 1, "score-click");
                });
            }
            this.positionOverlay(div, barInfo, w, h);
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
                this.timeManager.goToTime(scoreTime.act, prevBar, 1, "score-click");
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

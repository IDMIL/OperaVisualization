import {scene_bar_ranges} from "./data/sceneBarRanges";
import {act_starting_pages, bar_to_page} from "./data/barToPage";


export type Act = number;
export type Bar = number;
export type Beat = number;
export type Scene = number;
export type BarLength = number;
export type UpdateSource = "timeline-click" | "annotation-click" | "transport-click" | "score-click" | "libretto-click" | "video-playhead" | "init";

export interface ScoreTime {
    act: Act,
    bar: Bar,
    barLength: BarLength,
}

export class TimeManagerListener {
    async timeUpdated(_ : ScoreTime, __ : UpdateSource) {
        // Called when the time is set to this time. Classes should modify the view as needed to reflect this position.
    }

    async preloadTime(_ : ScoreTime) {
        // Called when a user action suggests an intent to go to a time (for example, hovering over a button). Classes
        // should fetch resources or perform calculations as needed for the update, so that they can respond quicker.
    }
}

export class TimeManager {
    constructor() {

    }

    goToTime(act : Act, bar : Bar, updateSource: UpdateSource) {
        this.scoreTime.act = act;
        this.scoreTime.bar = bar;
        console.log(this.scoreTime);
        this.notifyListeners(updateSource);
    }

    preloadTime(time: ScoreTime) {
        for (const listener of this.listeners) {
            listener.preloadTime(time);
        }
    }

    addToTime(time : ScoreTime, numBars : number) {
        time.bar = time.bar + numBars;

        while (time.bar < 1) {
            if (time.act > 1) {
                time.act -= 1;
                time.bar += this.getLengthOfAct(time.act);
            } else {
                time.bar = 1;
            }
        }

        while (time.bar > this.getLengthOfAct(time.act)) {
            if (time.act < this.getNumActs()) {
                time.bar -= this.getLengthOfAct(time.act);
                time.act += 1;
            } else {
                time.bar = this.getLengthOfAct(time.act);
            }
        }
    }

    advanceBar(numBars : number, updateSource: UpdateSource = "transport-click") {
        this.addToTime(this.scoreTime, numBars);

        this.notifyListeners(updateSource);
    }

    advancePage(numPages : number, updateSource: UpdateSource) {
        console.log("advancePage", numPages);

        const firstPage = act_starting_pages[0];
        const lastPage = 486;

        // Compute current absolute page (act-relative page is 1-based, so subtract 1 before adding act offset)
        const currentActIndex = this.scoreTime.act - 1;
        const currentWithinActPage = bar_to_page[currentActIndex][this.scoreTime.bar].page;
        const currentAbsolutePage = currentWithinActPage - 1 + act_starting_pages[currentActIndex];

        const targetAbsolutePage = Math.max(firstPage, Math.min(lastPage, currentAbsolutePage + numPages));

        // Search outward from targetAbsolutePage in the direction of travel until we find a
        // page that has at least one bar starting on it.  This handles pages that fall in
        // the middle of a bar (no bar starts there) without silently doing nothing.
        const direction = numPages >= 0 ? 1 : -1;

        for (let page = targetAbsolutePage; page >= firstPage && page <= lastPage; page += direction) {
            // Determine which act this absolute page belongs to (last act whose start ≤ page)
            let actIndex = -1;
            for (let a = act_starting_pages.length - 1; a >= 0; a--) {
                if (page >= act_starting_pages[a]) {
                    actIndex = a;
                    break;
                }
            }
            if (actIndex === -1) continue;

            const withinActPage = page - act_starting_pages[actIndex] + 1;

            // Numeric keys in JS objects iterate in ascending order, so the first match is
            // the lowest-numbered (i.e. first) bar that starts on this page.
            for (const barStr in bar_to_page[actIndex]) {
                if (bar_to_page[actIndex][barStr].page === withinActPage) {
                    this.goToTime(actIndex + 1, Number(barStr), updateSource);
                    return;
                }
            }
        }
    }

    notifyListeners(updateSource: UpdateSource) {
        console.log("updateSource", updateSource, "time", this.scoreTime);
        for (const listener of this.listeners) {
            listener.timeUpdated(this.scoreTime, updateSource);
        }
    }

    getCurrentAct() : Act {
        return this.scoreTime.act;
    }

    getCurrentBarWithinAct() : Bar {
        return this.scoreTime.bar;
    }

    getCurrentScene() : Scene  {
        return this.getScene(this.getCurrentAct(), this.getCurrentBarWithinAct());
        // const sceneRanges = scene_bar_ranges[this.getCurrentAct() - 1];
        // for (let i = 0; i < sceneRanges.length; i++) {
        //   if (sceneRanges[i][0] <= this.getCurrentBarWithinAct() && this.getCurrentBarWithinAct() <= sceneRanges[i][1]) {
        //     return i + 1;
        //   }
        // }
    }

    getScene(act : Act, bar : Bar) : Scene {
        const sceneRanges = scene_bar_ranges[act - 1];
        for (let i = 0; i < sceneRanges.length; i++) {
            if (sceneRanges[i][0] <= bar && bar <= sceneRanges[i][1]) {
                return i + 1;
            }
        }
        return 1;
    }

    getNumActs() : number {
        return scene_bar_ranges.length;
    }

    getLengthOfAct(act: Act) : number {
        return scene_bar_ranges[act-1][scene_bar_ranges[act-1].length - 1][1];
    }

    getLengthOfCurrentScene(): number {
        const sceneRanges = scene_bar_ranges[this.getCurrentAct() - 1];
        for (let i = 0; i < sceneRanges.length; ++i) {
            if (sceneRanges[i][0] <= this.getCurrentBarWithinAct() && this.getCurrentBarWithinAct() <= sceneRanges[i][1]) {
                return (sceneRanges[i][1] + 1 - sceneRanges[i][0]);
            }
        }
        return 0;
    }

    getProportionOfCurrentScene() : number {
        const sceneRanges = scene_bar_ranges[this.getCurrentAct() - 1];
        for (let i = 0; i < sceneRanges.length; ++i) {
            if (sceneRanges[i][0] <= this.getCurrentBarWithinAct() && this.getCurrentBarWithinAct() <= sceneRanges[i][1]) {
                return (this.getCurrentBarWithinAct() - sceneRanges[i][0]) / (sceneRanges[i][1] + 1 - sceneRanges[i][0]);
            }
        }
        return 0;
    }

    scoreTime : ScoreTime = {
        act: 1,
        bar: 1,
        barLength: 4
    }

    listeners : TimeManagerListener[] = [];
}
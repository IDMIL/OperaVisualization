import {scene_bar_ranges} from "./data/sceneBarRanges";
import {act_starting_pages, bar_to_page} from "./data/barToPage";


export type Act = number;
export type Bar = number;
export type Beat = number;
export type Scene = number;
export type BarLength = number;
export type UpdateSource = "timeline-click" | "annotation-click" | "transport-click" | "score-click" | "video-playhead" | "init";

export interface ScoreTime {
    act: Act,
    bar: Bar,
    beat: Beat,
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

    goToTime(act : Act, bar : Bar, beat : Beat, updateSource: UpdateSource) {
        this.scoreTime.act = act;
        this.scoreTime.bar = bar;
        this.scoreTime.beat = beat;
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
        const currentPage = bar_to_page[this.scoreTime.act - 1][this.scoreTime.bar].page - 1
            + act_starting_pages[this.scoreTime.act - 1];
        let targetPage = currentPage + numPages;
        if (targetPage < act_starting_pages[0]) {
            targetPage = act_starting_pages[0];
        } else if (targetPage >= 486) {
            targetPage = 486;
        }

        for (let act = 0; act < bar_to_page.length; ++act) {
            if (targetPage >= act_starting_pages[act] && targetPage < act_starting_pages[act + 1]) {
                targetPage -= act_starting_pages[act];
                targetPage += 1;
                for (const bar in bar_to_page[act]) {
                    if (bar_to_page[act][bar].page === targetPage) {
                        this.goToTime(act + 1, Number(bar), this.scoreTime.beat, updateSource);
                        return;
                    }
                }
            }
        }
    }

    notifyListeners(updateSource: UpdateSource) {
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
        beat: 1,
        barLength: 4
    }

    listeners : TimeManagerListener[] = [];
}
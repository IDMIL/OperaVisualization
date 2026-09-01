import {ScoreTime, TimeManager} from "./TimeManager";
import {scene_bar_ranges} from "./data/sceneBarRanges";
import {text} from "./data/text";
import {getRomanNumerals, globals} from "./globals";
import {SectionManager, SectionRect} from "./SectionManager";

function getSceneNumber(scoreTime : ScoreTime) {
    const act = scoreTime.act;
    const bar = scoreTime.bar;
    const sceneRanges = scene_bar_ranges[act-1];
    let sceneNumber = 1;
    for (const range of sceneRanges) {
        if (bar >= range[0] && bar <= range[1]) {
            return sceneNumber;
        }
        sceneNumber++;
    }
    console.error("scene not found for", scoreTime);
    return 1;
}

function getSceneStartBar(act : number, scene : number) : number {
    return scene_bar_ranges[act - 1][scene - 1][0];
}

function getNumScenesInAct(act : number) : number {
    return scene_bar_ranges[act - 1].length;
}


export class TransportManager extends SectionManager {
    constructor(tm : TimeManager, rect: SectionRect) {
        super("transport-section", rect);
        this.timeManager = tm;

        const transportSection = this.element;
        if (transportSection === null) {
            return;
        }

        const actOptions = Array.from({length: tm.getNumActs()}, (_, i) => i + 1)
            .map(act => `<option value="${act}">${getRomanNumerals(act)}</option>`)
            .join('');

        transportSection.innerHTML = `
      <h2>` + text.TRANSPORT[globals.language] + `</h2>
      <div id="position-text">
      <p class="level-name">` + text.ACT[globals.language] + `</p>
        <select id="transport-act-select">${actOptions}</select>
        <p class="level-name">` + text.SCENE[globals.language] + `</p>
        <select id="transport-scene-select"></select>
        <p class="level-name">` + text.BAR[globals.language] + `</p>
        <input type="number" id="transport-bar-input" min="1" step="1">
        <p class="level-name">` + text.PAGE[globals.language] + `</p>
        <input type="number" id="transport-page-input" min="${tm.getFirstPage()}" max="${tm.getLastPage()}" step="1">
      </div>`;

        // Rebuilds the scene dropdown's options whenever the act changes, since
        // each act has its own number of scenes (see scene_bar_ranges).
        const populateSceneSelect = (act: number, selectedScene: number) => {
            const sceneSelect = document.getElementById("transport-scene-select") as HTMLSelectElement | null;
            if (sceneSelect === null) return;
            sceneSelect.innerHTML = Array.from({length: getNumScenesInAct(act)}, (_, i) => i + 1)
                .map(scene => `<option value="${scene}">${scene}</option>`)
                .join('');
            sceneSelect.value = selectedScene.toString();
        };
        populateSceneSelect(this.timeManager.getCurrentAct(), getSceneNumber(this.timeManager.scoreTime));

        const actSelect = document.getElementById("transport-act-select") as HTMLSelectElement | null;
        if (actSelect !== null) {
            actSelect.value = this.timeManager.getCurrentAct().toString();
            actSelect.addEventListener("change", () => {
                const act = Number(actSelect.value);
                populateSceneSelect(act, 1);
                this.timeManager.goToTime(act, getSceneStartBar(act, 1), "transport-click");
            });
        }

        const sceneSelect = document.getElementById("transport-scene-select") as HTMLSelectElement | null;
        if (sceneSelect !== null) {
            sceneSelect.addEventListener("change", () => {
                const act = this.timeManager.getCurrentAct();
                const scene = Number(sceneSelect.value);
                this.timeManager.goToTime(act, getSceneStartBar(act, scene), "transport-click");
            });
        }

        const barInput = document.getElementById("transport-bar-input") as HTMLInputElement | null;
        if (barInput !== null) {
            barInput.addEventListener("change", () => {
                const act = this.timeManager.getCurrentAct();
                const bar = Math.max(1, Math.min(this.timeManager.getLengthOfAct(act), Math.round(Number(barInput.value)) || 1));
                this.timeManager.goToTime(act, bar, "transport-click");
            });
        }

        const pageInput = document.getElementById("transport-page-input") as HTMLInputElement | null;
        if (pageInput !== null) {
            pageInput.addEventListener("change", () => {
                const page = Math.max(this.timeManager.getFirstPage(), Math.min(this.timeManager.getLastPage(), Math.round(Number(pageInput.value)) || this.timeManager.getFirstPage()));
                this.timeManager.goToPage(page, "transport-click");
            });
        }

        this.initResizeHandles();
    }

    async timeUpdated(scoreTime : ScoreTime) {
        const actSelect = document.getElementById("transport-act-select") as HTMLSelectElement | null;
        const sceneSelect = document.getElementById("transport-scene-select") as HTMLSelectElement | null;
        const scene = getSceneNumber(scoreTime);

        if (actSelect !== null && sceneSelect !== null) {
            // The scene dropdown's options depend on the act, so it must be
            // rebuilt whenever the act changes rather than just re-valued.
            if (actSelect.value !== scoreTime.act.toString()) {
                actSelect.value = scoreTime.act.toString();
                sceneSelect.innerHTML = Array.from({length: getNumScenesInAct(scoreTime.act)}, (_, i) => i + 1)
                    .map(s => `<option value="${s}">${s}</option>`)
                    .join('');
            }
            sceneSelect.value = scene.toString();
        }

        const transportBarInput = document.getElementById("transport-bar-input") as HTMLInputElement | null;
        if (transportBarInput !== null && document.activeElement !== transportBarInput) {
            transportBarInput.value = scoreTime.bar.toString();
        }

        const transportPageInput = document.getElementById("transport-page-input") as HTMLInputElement | null;
        if (transportPageInput !== null && document.activeElement !== transportPageInput) {
            transportPageInput.value = this.timeManager.getCurrentAbsolutePage().toString();
        }
    }

    timeManager;
}
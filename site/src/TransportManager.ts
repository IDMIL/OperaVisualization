import {ScoreTime, TimeManager, TimeManagerListener} from "./TimeManager";
import {scene_bar_ranges} from "./data/sceneBarRanges";
import {text} from "./data/text";
import {getRomanNumerals, globals} from "./globals";

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


export class TransportManager extends TimeManagerListener {
    constructor(tm : TimeManager) {
        super();
        this.timeManager = tm;

        const transportSection = document.getElementById("transport-section");
        if (transportSection === null) {
            return;
        }
        transportSection.innerHTML = `
      <div id="position-text">
      <p class="level-name">` + text[globals.language].ACT + `</p>
        <p id="transport-act-number">1</p>
        <p class="level-name">` + text[globals.language].SCENE + `</p>
        <p id="transport-scene-number">1</p>
        <p class="level-name">` + text[globals.language].BAR + `</p>
        <p id="transport-bar-number">1</p>
        <p class="level-name">` + text[globals.language].BEAT + `</p>
        <p id="transport-beat-number">1</p>
      </div>
      <div class="transport buttons">
        <button id="prev-bar-button">` + text[globals.language].PREV_BAR + `</button>
        <button id="next-bar-button">` + text[globals.language].NEXT_BAR + `</button>
        <button id="prev-page-button">` + text[globals.language].PREV_PAGE + `</button>
        <button id="next-page-button">` + text[globals.language].NEXT_PAGE + `</button>
      </div>`;

        const prevBarButton = document.getElementById("prev-bar-button");
        if (prevBarButton !== null) {
            prevBarButton.onclick = () => {
                    this.timeManager.advanceBar(-1);
            }
        }

        const nextBarButton = document.getElementById("next-bar-button");

        if (nextBarButton !== null) {
            nextBarButton.onclick = () => {
                this.timeManager.advanceBar(1);
            }
        }

        const prevPageButton = document.getElementById("prev-page-button");
        if (prevPageButton !== null) {
            prevPageButton.onclick = () => {
                this.timeManager.advancePage(-1, 'transport-click');
            }
        }

        const nextPageButton = document.getElementById("next-page-button");
        if (nextPageButton !== null) {
            nextPageButton.onclick = () => {
                this.timeManager.advancePage(1, 'transport-click');
            }
        }
    }

    async timeUpdated(scoreTime : ScoreTime) {
        const transportActNumber = document.getElementById("transport-act-number");
        if (transportActNumber !== null) {
            transportActNumber.innerText = getRomanNumerals(scoreTime.act);
        }
        const transportSceneNumber = document.getElementById("transport-scene-number");
        if (transportSceneNumber !== null) {
            transportSceneNumber.innerText = getSceneNumber(scoreTime).toString();
        }
        const transportBarNumber = document.getElementById("transport-bar-number");
        if (transportBarNumber !== null) {
            transportBarNumber.innerText = scoreTime.bar.toString();
        }
        const transportBeatNumber = document.getElementById("transport-beat-number");
        if (transportBeatNumber !== null) {
            transportBeatNumber.innerText = scoreTime.beat.toString();
        }
    }

    timeManager;
}
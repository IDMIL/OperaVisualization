import {ScoreTime, TimeManager} from "./TimeManager";
import {architecture} from "./data/architecture";
import {globals} from "./globals";
import {SectionManager, SectionRect} from "./SectionManager";

export class ArchitectureManager extends SectionManager {
    constructor(tm: TimeManager, rect: SectionRect) {
        super("architecture-list", rect);
        this.timeManager = tm;

        const archList = this.element;
        if (archList === null) {
            return;
        }

        const archListHeader = document.createElement("h3");
        archListHeader.id = "architecture-list-header";
        const archListInner = document.createElement("div");
        archListInner.id = "architecture-list-inner";

        archList.appendChild(archListHeader);
        archList.appendChild(archListInner);

        this.initResizeHandles();

        this.timeUpdated(this.timeManager.scoreTime);
    }

    async timeUpdated(scoreTime : ScoreTime) {
        const archList = document.getElementById("architecture-list-inner");
        if (archList === null) {
            return;
        }


        const actArchitecture = architecture[this.timeManager.getCurrentAct()];
        if (actArchitecture === undefined) {
            return;
        }
        const sceneArchitecture = actArchitecture[this.timeManager.getCurrentScene()];
        if (sceneArchitecture === undefined) {
            return;
        }


        if (this.timeManager.getCurrentAct() != this.currentAct || this.timeManager.getCurrentScene() != this.currentScene) {
            this.currentAct = this.timeManager.getCurrentAct();
            this.currentScene = this.timeManager.getCurrentScene();
            const archHeader = document.getElementById("architecture-list-header");
            if (archHeader !== null) {
                archHeader.innerText = sceneArchitecture.scene_name[globals.language];
            }

            const archList = document.getElementById("architecture-list-inner");
            if (archList === null) {
                return;
            }
            archList.innerHTML = '';
            for (const annotation of sceneArchitecture.annotations) {
                const archListItem = document.createElement('div');
                archListItem.classList.add('architecture-list-item');
                if (annotation.range[0] === annotation.range[1]) {
                    archListItem.innerText = annotation.annotation[globals.language] + ' m. ' + annotation.range[0];
                } else {
                    archListItem.innerText = annotation.annotation[globals.language] + ' (m. ' + annotation.range[0] + '‒' + annotation.range[1] + ')';
                }
                archListItem.onclick = () => {
                    this.timeManager.goToTime(this.currentAct, annotation.range[0],
                        "timeline-click");
                }
                archList.appendChild(archListItem);
            }
        }

        let items = document.getElementsByClassName("architecture-list-item");

        sceneArchitecture.annotations.forEach((arch, index) => {
            if (arch.range[0] <= scoreTime.bar && arch.range[1] >= scoreTime.bar) {
                items[index].classList.add("architecture-list-item--active");
            } else {
                items[index].classList.remove("architecture-list-item--active");
            }
        })
    }


    currentAct = -1;
    currentScene = -1;
    timeManager: TimeManager;
}
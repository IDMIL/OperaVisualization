import {ScoreTime, TimeManager} from "./TimeManager";
import {scene_bar_ranges} from "./data/sceneBarRanges";
import {getRomanNumerals, globals} from "./globals";
import {text} from "./data/text";
import {act_starting_pages, bar_to_page} from "./data/barToPage";
import {SectionManager, SectionRect} from "./SectionManager";

export class TimelineManager extends SectionManager {
    constructor(tm : TimeManager, rect: SectionRect) {
        // Pinned chrome like the title bar (see TitleSectionManager) — always
        // visible right below it, not draggable/resizable.
        super("timelines-section", rect, false);
        this.timeManager = tm;

        let actLengths = [];
        let totalLength = 0;
        for (const actBarRanges of scene_bar_ranges) {
            const l = actBarRanges[actBarRanges.length - 1][1] + 1 - actBarRanges[0][0];
            totalLength += l;
            actLengths.push(l);
        }

        let timelineSection = this.element;
        if (timelineSection === null) {
            return;
        }

        const heading = document.createElement("h2");
        heading.innerText = text.TIMELINES[globals.language];
        timelineSection.appendChild(heading);

        // Collapsing hides every .timeline-container row (see the
        // #timelines-section.collapsed CSS rule) — the heading above and
        // this button are the only other direct children, so they're
        // untouched by that rule. Shrinking to height:auto rather than a
        // second hardcoded pixel height lets it size to exactly the
        // (still-visible) title row; expanding restores the fixed height
        // this panel was constructed with.
        const collapseButton = document.createElement("div");
        collapseButton.id = "timeline-collapse-button";
        collapseButton.title = text.COLLAPSE[globals.language];
        collapseButton.addEventListener("click", () => {
            const collapsed = timelineSection!.classList.toggle("collapsed");
            timelineSection!.style.height = collapsed ? "auto" : `${rect.height}px`;
        });
        timelineSection.appendChild(collapseButton);


        let actsSection = document.createElement("div");
        actsSection.id = "acts-timeline";
        actsSection.classList.add("timeline-container");
        let actsHeading = document.createElement("h3");
        actsHeading.innerText = text.ACTS[globals.language];
        let actsTimeline = document.createElement("div");
        actsTimeline.classList.add("timeline");

        actsSection.appendChild(actsHeading);
        actsSection.appendChild(actsTimeline);
        timelineSection.appendChild(actsSection);


        let scenesSection = document.createElement("div");
        scenesSection.id = "scenes-timeline";
        scenesSection.classList.add("timeline-container");
        let scenesHeading = document.createElement("h3");
        scenesHeading.innerText = text.SCENES[globals.language];
        let scenesTimeline = document.createElement("div");
        scenesTimeline.classList.add("timeline");

        scenesSection.appendChild(scenesHeading);
        scenesSection.appendChild(scenesTimeline);
        timelineSection.appendChild(scenesSection);


        let sceneStructureSection = document.createElement("div");
        sceneStructureSection.id = "scene-structure-timeline";
        sceneStructureSection.classList.add("timeline-container");
        let sceneStructureHeading = document.createElement("h3");
        sceneStructureHeading.innerText = text.SCENE_STRUCTURE[globals.language];
        let sceneStructureTimeline = document.createElement("div");
        sceneStructureTimeline.classList.add("timeline");

        sceneStructureSection.appendChild(sceneStructureHeading);
        sceneStructureSection.appendChild(sceneStructureTimeline);
        timelineSection.appendChild(sceneStructureSection);

        for (let i = 0; i < actLengths.length; i++) {
            let actDiv = document.createElement("div");
            actDiv.id = "timeline-act-" + (i + 1);
            actDiv.classList.add("timeline-button");
            actDiv.classList.add("timeline-act");
            let actDivText = document.createElement("span");
            actDivText.innerText = getRomanNumerals(i + 1);
            actDiv.append(actDivText);
            actDiv.style.width = (actLengths[i] * 100 / totalLength) + "%";
            actDiv.onclick = () => {
                this.timeManager.goToTime(i + 1, 1, 'timeline-click');
            }
            actDiv.onmouseenter = () => {
                this.timeManager.preloadTime({act: i + 1, bar: 1, barLength: 1});
            }

            actsTimeline.appendChild(actDiv);
        }

        let actNumber = 1;
        for (const actBarRange of scene_bar_ranges) {
            let sceneNumber = 1;
            for (const sceneBarRange of actBarRange) {
                let sceneDiv = document.createElement("div");
                sceneDiv.id = "timeline-act-" + actNumber + "-scene-" + sceneNumber;
                sceneDiv.classList.add("timeline-button");
                sceneDiv.classList.add("timeline-scene");
                sceneDiv.style.width = ((sceneBarRange[1] + 1 - sceneBarRange[0]) * 100 / totalLength) + "%";
                let sceneDivText = document.createElement("span");
                sceneDivText.innerText = sceneNumber.toString();
                sceneDiv.appendChild(sceneDivText);
                const a = actNumber;
                const sceneBar = sceneBarRange[0];
                sceneDiv.onclick = () => {
                    this.timeManager.goToTime(a, sceneBar, 'timeline-click');
                }

                sceneDiv.onmouseenter = () => {
                    this.timeManager.preloadTime({act: a, bar: sceneBar, barLength: 1});
                }
                scenesTimeline.appendChild(sceneDiv);
                sceneNumber++;
            }
            actNumber++;
        }

        let sceneStructureDiv = document.createElement("div");
        sceneStructureDiv.classList.add("timeline-button");
        sceneStructureDiv.id = "scene-structure-button";
        sceneStructureDiv.style.width = "100%";
        sceneStructureTimeline.appendChild(sceneStructureDiv);

        let currentBarCursorDiv = document.createElement("div");
        currentBarCursorDiv.id = "timeline-current-bar-cursor";
        sceneStructureDiv.appendChild(currentBarCursorDiv);

        let cursorDiv = document.createElement("div");
        cursorDiv.id = "timeline-cursor";
        sceneStructureDiv.appendChild(cursorDiv);
        let cursorLabel = document.createElement("div");
        cursorLabel.id = "timeline-cursor-label";
        cursorDiv.appendChild(cursorLabel);

        sceneStructureDiv.addEventListener("mouseenter", () => {
            let timelineCursor = document.getElementById("timeline-cursor");
            if (timelineCursor !== null) {
                timelineCursor.style.display = "block";
            }
        });

        sceneStructureDiv.addEventListener("mouseleave", () => {
            let timelineCursor = document.getElementById("timeline-cursor");
            if (timelineCursor !== null) {
                timelineCursor.style.display = "none";
            }
        });


        sceneStructureDiv.addEventListener("mousemove", (event) => {
            let timelineCursor = document.getElementById("timeline-cursor");
            if (timelineCursor !== null) {
                const rect = sceneStructureDiv.getBoundingClientRect();
                console.log(event.clientX, rect.x);
                const numBars = this.timeManager.getLengthOfCurrentScene();
                const proportion = (event.clientX - rect.x) / (rect.width);
                const lo = Math.floor(proportion * numBars) / numBars;
                const hi = (Math.floor(proportion * numBars) + 1) / numBars;
                timelineCursor.style.left = rect.width * lo + "px";
                timelineCursor.style.width = rect.width * (hi - lo) + "px";

                const barNumber = this.#getBarAtProportionOfCurrentScene(proportion);
                const pageNumber = bar_to_page[this.timeManager.getCurrentAct() - 1][barNumber].page + act_starting_pages[this.timeManager.getCurrentAct() - 1] - 1;
                cursorLabel.innerText = text.BAR[globals.language] + " " + barNumber + ", " +
                    text.PAGE[globals.language] + " " + pageNumber;
                this.timeManager.preloadTime({act: this.timeManager.getCurrentAct(), bar: barNumber, barLength: 1})
                if (proportion > 0.5) {
                    timelineCursor.classList.add("left");
                } else {
                    timelineCursor.classList.remove("left");
                }
            }


        });

        sceneStructureDiv.addEventListener("click", (event) => {
            const rect = sceneStructureDiv.getBoundingClientRect();
            const clickProportion = (event.clientX - rect.x) / (rect.width);

            this.timeManager.goToTime(
                this.timeManager.getCurrentAct(),
                this.#getBarAtProportionOfCurrentScene(clickProportion),
                'timeline-click');
        });

        this.initResizeHandles();
    }

    async timeUpdated(_ : ScoreTime) {

        const act = this.timeManager.getCurrentAct();
        const scene = this.timeManager.getCurrentScene();

        const actsElement = document.getElementById("acts-timeline");
        if (actsElement !== null) {
            for (const child of actsElement.getElementsByClassName('timeline-button')) {
                if (child.id === "timeline-act-" + act) {
                    child.classList.add("current-act");
                } else {
                    child.classList.remove("current-act");
                }
            }
        }

        const scenesElement = document.getElementById("scenes-timeline");
        if (scenesElement !== null) {
            for (const child of scenesElement.getElementsByClassName('timeline-button')) {
                if (child.id === "timeline-act-" + act + "-scene-" + scene) {
                    child.classList.add("current-scene");
                } else {
                    child.classList.remove("current-scene");
                }
            }
        }

        const currentBarCursor = document.getElementById("timeline-current-bar-cursor");
        let sceneStructure = document.getElementById("scene-structure-button");
        if (sceneStructure !== null && currentBarCursor !== null) {
            const rect = sceneStructure.getBoundingClientRect();
            const p = rect.width * this.timeManager.getProportionOfCurrentScene();
            currentBarCursor.style.left = p + "px";
            currentBarCursor.style.width = rect.width / this.timeManager.getLengthOfCurrentScene() + "px";
        }
    }

    #getBarAtProportionOfCurrentScene(proportion : number) {
        const sceneRange = scene_bar_ranges[this.timeManager.getCurrentAct()-1][this.timeManager.getCurrentScene()-1];
        return Math.floor(sceneRange[0] + proportion * (sceneRange[1] - sceneRange[0]));
    }

    timeManager;
}
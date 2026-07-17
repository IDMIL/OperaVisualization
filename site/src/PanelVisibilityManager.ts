import {SectionManager, SectionRect} from "./SectionManager";
import {text} from "./data/text";
import {globals} from "./globals";

interface ToggleablePanel {
    id: string;
    label: () => string;
}

const TOGGLEABLE_PANELS: ToggleablePanel[] = [
    {id: "timelines-section", label: () => text.TIMELINES[globals.language]},
    {id: "transport-section", label: () => text.TRANSPORT[globals.language]},
    {id: "annotations-section", label: () => text.ANNOTATIONS[globals.language]},
    {id: "architecture-list", label: () => text.ARCHITECTURE[globals.language]},
    {id: "video-player-section", label: () => text.VIDEO_PLAYER[globals.language]},
    {id: "score-viewer-section", label: () => text.SCORE_VIEWER[globals.language]},
];

// Fixed bar pinned to the bottom of the page (like the title bar is pinned to
// the top) with a checkbox per movable/resizable panel, letting the user
// show or hide each one independently.
export class PanelVisibilityManager extends SectionManager {
    constructor(rect: SectionRect) {
        super("panel-visibility-bar", rect, false);

        const bar = this.element;
        if (bar === null) {
            return;
        }

        const heading = document.createElement("span");
        heading.id = "panel-visibility-heading";
        heading.innerText = text.PANELS[globals.language];
        bar.appendChild(heading);

        for (const panel of TOGGLEABLE_PANELS) {
            const target = document.getElementById(panel.id);
            if (target === null) continue;

            const toggleLabel = document.createElement("label");
            toggleLabel.classList.add("panel-visibility-toggle");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.addEventListener("change", () => {
                target.style.display = checkbox.checked ? "" : "none";
            });

            toggleLabel.appendChild(checkbox);
            toggleLabel.appendChild(document.createTextNode(panel.label()));
            bar.appendChild(toggleLabel);
        }

        this.initResizeHandles();
    }
}

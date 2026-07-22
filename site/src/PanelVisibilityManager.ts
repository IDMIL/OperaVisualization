import {SectionManager, SectionRect} from "./SectionManager";
import {text} from "./data/text";
import {globals} from "./globals";

interface ToggleablePanel {
    id: string;
    label: () => string;
    visibleByDefault: boolean;
}

// Only the timeline, annotations, and score panels are shown on load (see
// computeDefaultRects in main.ts, which lays out that trio to fill the
// screen) — the rest start hidden until the user opts in.
const TOGGLEABLE_PANELS: ToggleablePanel[] = [
    {id: "timelines-section", label: () => text.TIMELINES[globals.language], visibleByDefault: true},
    {id: "transport-section", label: () => text.TRANSPORT[globals.language], visibleByDefault: false},
    {id: "annotations-section", label: () => text.ANNOTATIONS[globals.language], visibleByDefault: true},
    {id: "architecture-list", label: () => text.ARCHITECTURE[globals.language], visibleByDefault: false},
    {id: "video-player-section", label: () => text.VIDEO_PLAYER[globals.language], visibleByDefault: false},
    {id: "libretto-section", label: () => text.LIBRETTO[globals.language], visibleByDefault: false},
    {id: "score-viewer-section", label: () => text.SCORE_VIEWER[globals.language], visibleByDefault: true},
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

        // Shared by every toggle — appended straight to <body> (not `bar`,
        // whose own z-index only lifts it above other panels, not above a
        // panel that's currently stacked on top of the one being hovered)
        // with a z-index above all panels, so it's visible no matter which
        // panel is on top at the hovered one's location.
        const highlight = document.createElement("div");
        highlight.id = "panel-highlight-overlay";
        document.body.appendChild(highlight);

        for (const panel of TOGGLEABLE_PANELS) {
            const target = document.getElementById(panel.id);
            if (target === null) continue;

            const toggleLabel = document.createElement("label");
            toggleLabel.classList.add("panel-visibility-toggle");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = panel.visibleByDefault;
            target.style.display = panel.visibleByDefault ? "" : "none";
            checkbox.addEventListener("change", () => {
                target.style.display = checkbox.checked ? "" : "none";
            });

            toggleLabel.addEventListener("mouseenter", () => {
                const rect = target.getBoundingClientRect();
                highlight.style.top = `${rect.top}px`;
                highlight.style.left = `${rect.left}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
                highlight.style.display = "block";
            });
            toggleLabel.addEventListener("mouseleave", () => {
                highlight.style.display = "none";
            });

            toggleLabel.appendChild(checkbox);
            toggleLabel.appendChild(document.createTextNode(panel.label()));
            bar.appendChild(toggleLabel);
        }

        this.initResizeHandles();
    }
}

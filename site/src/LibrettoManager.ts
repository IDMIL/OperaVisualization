import {text} from "./data/text";
import {globals} from "./globals";
import {SectionManager, SectionRect} from "./SectionManager";
import {ScoreTime, TimeManager, UpdateSource} from "./TimeManager";
import {librettoLineTimings} from "./data/librettoTimings";
import librettoHtml from "./data/libretto.html?raw";

export class LibrettoManager extends SectionManager {
    private timeManager: TimeManager;
    private lineElements: Map<number, HTMLElement> = new Map();
    private currentLineElement: HTMLElement | null = null;

    constructor(timeManager: TimeManager, rect: SectionRect) {
        super("libretto-section", rect);

        this.timeManager = timeManager;

        const section = this.element;
        if (section === null) {
            return;
        }

        const header = document.createElement("h2");
        header.innerText = text.LIBRETTO[globals.language];

        const inner = document.createElement("div");
        inner.id = "libretto-inner";
        inner.innerHTML = librettoHtml;

        const timingByLine = new Map(librettoLineTimings.map(t => [t.lineNo, t]));

        for (const span of inner.querySelectorAll<HTMLElement>(".libretto-line")) {
            const lineNo = parseInt(span.dataset.lineNo ?? "", 10);
            if (!isNaN(lineNo)) {
                this.lineElements.set(lineNo, span);

                const timing = timingByLine.get(lineNo);
                if (timing !== undefined) {
                    span.classList.add("libretto-line-clickable");
                    span.addEventListener("click", () => {
                        this.timeManager.goToTime(timing.act, timing.measure, "libretto-click");
                    });
                }
            }
        }

        section.appendChild(header);
        section.appendChild(inner);

        this.initResizeHandles();
    }

    async timeUpdated(scoreTime: ScoreTime, updateSource: UpdateSource) {
        let current = null;
        for (const entry of librettoLineTimings) {
            if (entry.act < scoreTime.act || (entry.act === scoreTime.act && entry.measure <= scoreTime.bar)) {
                current = entry;
            } else {
                break;
            }
        }

        if (this.currentLineElement !== null) {
            this.currentLineElement.classList.remove("current-libretto-line");
            this.currentLineElement = null;
        }

        if (current !== null) {
            const span = this.lineElements.get(current.lineNo);
            if (span !== undefined) {
                span.classList.add("current-libretto-line");
                this.currentLineElement = span;
                if (updateSource !== "init") {
                    span.scrollIntoView({behavior: "smooth", block: "center"});
                }
            }
        }
    }
}

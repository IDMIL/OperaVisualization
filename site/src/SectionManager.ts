import {TimeManagerListener} from "./TimeManager";

export interface SectionRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

type Edge = "top" | "right" | "bottom" | "left";

const EDGES: Edge[] = ["top", "right", "bottom", "left"];
const MIN_WIDTH = 160;
const MIN_HEIGHT = 80;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

// Base class for every major page section. Owns the section's on-screen
// rectangle (position: fixed, in px) and gives it four independently
// draggable edges so the user can resize/reposition it freely, clamped to
// the viewport. Subclasses look up their content root via `this.element`
// instead of re-querying the DOM.
export abstract class SectionManager extends TimeManagerListener {
    protected readonly element: HTMLElement | null;
    private readonly resizable: boolean;
    private readonly autoHeight: boolean;

    // `resizable` lets a subclass opt out of the four draggable edges (e.g.
    // the title bar, which stays pinned to the top of the page like before).
    // `autoHeight` (only meaningful when !resizable) sizes the section to
    // fit its content instead of a fixed pixel height, for chrome whose
    // content can wrap onto more lines at smaller widths (e.g. the title
    // bar's links row) — without it the bar would clip that extra content.
    protected constructor(
        sectionId: string, defaultRect: SectionRect, resizable: boolean = true, autoHeight: boolean = false
    ) {
        super();
        this.resizable = resizable;
        this.autoHeight = autoHeight;
        this.element = document.getElementById(sectionId);
        if (this.element === null) {
            return;
        }
        // Pinned chrome (title bar, panel-visibility bar) always renders above
        // movable panels — see .pinned-section — so a dragged/resized or
        // content-grown movable panel can never cover it.
        this.element.classList.add(this.resizable ? "draggable-section" : "pinned-section");
        this.applyRect(defaultRect);
    }

    // Subclasses must call this once they've finished building their content
    // (replacing innerHTML, appending children, etc.) — resize handles are
    // appended as direct children of the section, so attaching them any
    // earlier would just have them wiped out by the subclass's own setup.
    // No-ops for non-resizable sections.
    protected initResizeHandles(): void {
        if (!this.resizable) return;
        this.attachResizeHandles();
    }

    private applyRect(rect: SectionRect): void {
        const el = this.element;
        if (el === null) return;
        el.style.position = "fixed";

        if (this.resizable) {
            // Movable panels are pinned in place with fixed pixel offsets —
            // by design they don't track viewport changes (see initResizeHandles).
            el.style.top = `${rect.top}px`;
            el.style.left = `${rect.left}px`;
            el.style.right = "";
            el.style.bottom = "";
            el.style.width = `${rect.width}px`;
            el.style.height = `${rect.height}px`;
            return;
        }

        // Non-resizable sections are page chrome (title bar, panel-visibility
        // bar) meant to stay attached to whichever edge(s) they were placed
        // against. Anchor with CSS (left+right / top+bottom) instead of a
        // fixed pixel width/position, so they track the viewport on resize
        // instead of drifting off-screen like a stale px width would.
        const touchesLeft = rect.left <= 0;
        const touchesRight = rect.left + rect.width >= window.innerWidth;
        const touchesTop = rect.top <= 0;
        const touchesBottom = rect.top + rect.height >= window.innerHeight;

        if (touchesLeft && touchesRight) {
            el.style.left = "0";
            el.style.right = "0";
            el.style.width = "";
        } else {
            el.style.left = `${rect.left}px`;
            el.style.right = "";
            el.style.width = `${rect.width}px`;
        }

        const height = this.autoHeight ? "auto" : `${rect.height}px`;
        if (touchesBottom && !touchesTop) {
            el.style.bottom = "0";
            el.style.top = "";
            el.style.height = height;
        } else {
            el.style.top = `${rect.top}px`;
            el.style.bottom = "";
            el.style.height = height;
        }
    }

    private currentRect(): SectionRect {
        const el = this.element as HTMLElement;
        return {
            top: el.offsetTop,
            left: el.offsetLeft,
            width: el.offsetWidth,
            height: el.offsetHeight,
        };
    }

    private attachResizeHandles(): void {
        const el = this.element;
        if (el === null) return;
        for (const edge of EDGES) {
            const handle = document.createElement("div");
            handle.classList.add("section-resize-handle", `section-resize-${edge}`);
            handle.addEventListener("mousedown", (e) => this.beginDrag(e, edge));
            el.appendChild(handle);
        }
    }

    private beginDrag(event: MouseEvent, edge: Edge): void {
        event.preventDefault();
        event.stopPropagation();

        const start = this.currentRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const handle = event.currentTarget as HTMLElement;

        handle.classList.add("dragging");
        document.body.style.userSelect = "none";

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            const rect: SectionRect = {...start};

            switch (edge) {
                case "left": {
                    const newLeft = clamp(start.left + dx, 0, start.left + start.width - MIN_WIDTH);
                    rect.width = start.width + (start.left - newLeft);
                    rect.left = newLeft;
                    break;
                }
                case "right": {
                    rect.width = clamp(start.width + dx, MIN_WIDTH, window.innerWidth - start.left);
                    break;
                }
                case "top": {
                    const newTop = clamp(start.top + dy, 0, start.top + start.height - MIN_HEIGHT);
                    rect.height = start.height + (start.top - newTop);
                    rect.top = newTop;
                    break;
                }
                case "bottom": {
                    rect.height = clamp(start.height + dy, MIN_HEIGHT, window.innerHeight - start.top);
                    break;
                }
            }

            this.applyRect(rect);
        };

        const onMouseUp = () => {
            handle.classList.remove("dragging");
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }
}

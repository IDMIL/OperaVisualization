import {TimeManagerListener} from "./TimeManager";

export interface SectionRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

type Edge = "top" | "right" | "bottom" | "left";
type Handle = Edge | "top-left" | "top-right" | "bottom-right" | "bottom-left";

// Each handle drags one or two edges at once — a corner combines its two
// adjacent edges' independent formulas (e.g. "top-left" runs the "top" and
// "left" cases together), which naturally anchors the resize at the
// opposite corner since each formula already keeps its own far side fixed.
const HANDLES: { name: Handle; edges: Edge[] }[] = [
    {name: "top", edges: ["top"]},
    {name: "right", edges: ["right"]},
    {name: "bottom", edges: ["bottom"]},
    {name: "left", edges: ["left"]},
    {name: "top-left", edges: ["top", "left"]},
    {name: "top-right", edges: ["top", "right"]},
    {name: "bottom-right", edges: ["bottom", "right"]},
    {name: "bottom-left", edges: ["bottom", "left"]},
];
const MIN_WIDTH = 160;
const MIN_HEIGHT = 80;

// Mobile/desktop layout is decided once, at load — no live re-layout on
// resize or rotation (see SectionManager's mobile-mode notes below).
export const MOBILE_BREAKPOINT = 700;
export const IS_MOBILE_LAYOUT = window.innerWidth <= MOBILE_BREAKPOINT;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

interface VerticalBounds {
    top: number;
    bottom: number;
}

// Movable panels may be dragged/resized anywhere except behind the pinned
// top/bottom chrome (title bar, panel-visibility bar) — those bars' current
// rendered edges become the effective top/bottom of the viewport for
// resizing purposes. Read fresh each drag move since the title bar's height
// can itself change (see autoHeight).
function getVerticalDragBounds(): VerticalBounds {
    let top = 0;
    let bottom = window.innerHeight;
    for (const el of document.querySelectorAll<HTMLElement>(".pinned-section")) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 0) {
            top = Math.max(top, rect.bottom);
        }
        if (rect.bottom >= window.innerHeight) {
            bottom = Math.min(bottom, rect.top);
        }
    }
    return {top, bottom};
}

// Base class for every major page section. Owns the section's on-screen
// rectangle (position: fixed, in px) and gives it four independently
// draggable edges plus four corners (each corner just combines its two
// adjacent edges) so the user can resize/reposition it freely, clamped to
// the viewport. Subclasses look up their content root via `this.element`
// instead of re-querying the DOM.
export abstract class SectionManager extends TimeManagerListener {
    protected readonly element: HTMLElement | null;
    private readonly resizable: boolean;
    private readonly autoHeight: boolean;
    // Mobile layout only replaces the free-form fixed-position behavior of
    // resizable (movable) panels — pinned chrome (title bar, panel-visibility
    // bar) keeps its normal pinned-to-edge behavior in both modes (see
    // applyRect's non-resizable branch, used whenever `mobile` is false).
    private readonly mobile: boolean;

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
        this.mobile = IS_MOBILE_LAYOUT && resizable;
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

    // Overridden by subclasses (e.g. the score viewer) whose content has a
    // fixed aspect ratio that resizing should preserve. Returning a number
    // makes every edge drag resize the perpendicular sides too, growing them
    // symmetrically around the section's current center so the box's own
    // shape always matches the content's ratio.
    protected getAspectRatio(): number | null {
        return null;
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

        if (this.mobile) {
            this.applyMobileRect(rect.height);
            return;
        }

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

    // Mobile layout: the panel becomes a normal flex item (100% wide, stacked
    // vertically with its siblings — see .mobile-layout #layout-sections)
    // instead of a position:fixed box. `position: relative` (not the default
    // static) is required, not cosmetic — the resize/move handles are
    // position:absolute children that need a positioned ancestor to anchor
    // to, which on desktop comes for free from position:fixed.
    private applyMobileRect(heightPx: number): void {
        const el = this.element;
        if (el === null) return;
        el.style.position = "relative";
        el.style.top = "";
        el.style.left = "";
        el.style.right = "";
        el.style.bottom = "";
        el.style.width = "100%";

        const aspectRatio = this.getAspectRatio();
        if (aspectRatio !== null) {
            // Locked-aspect content (e.g. the score viewer) derives its
            // height from the 100%-wide box via CSS instead of a stored px
            // height — see beginMobileResize, which refuses to run in this case.
            el.style.height = "";
            el.style.aspectRatio = `${aspectRatio}`;
        } else {
            el.style.aspectRatio = "";
            el.style.height = `${heightPx}px`;
        }
    }

    // Re-applies the current mobile layout — a no-op on desktop/pinned
    // chrome. Needed because applyMobileRect only runs once at construction
    // (via applyRect(defaultRect)), which for a subclass whose aspect ratio
    // becomes available asynchronously (see ScoreManager, whose image hasn't
    // loaded yet at construction time) would otherwise leave the panel stuck
    // at its static placeholder height instead of switching to the live CSS
    // aspect-ratio box once getAspectRatio() stops returning null.
    protected refreshMobileRect(): void {
        if (!this.mobile) return;
        const el = this.element;
        if (el === null) return;
        this.applyMobileRect(el.offsetHeight);
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

    // A single-edge drag already set rect's width (left/right) or height
    // (top/bottom) directly; derive the other dimension from the aspect
    // ratio and grow/shrink it symmetrically from both of ITS sides — e.g.
    // dragging the right edge changes the width, then resizes the top and
    // bottom sides together (equally) to fit the new height.
    //
    // A corner drag already set both dimensions directly (independently),
    // anchored at the opposite corner. Keep that anchor fixed and pick
    // whichever axis moved further (in equivalent units) as authoritative,
    // deriving the other one from the ratio.
    //
    // Either way, deriving one dimension involves a *second* clamp against
    // the section's position (the symmetric-growth or corner-anchor math
    // above) — on top of the first clamp against its raw size. When the
    // pinned top/bottom bars (or, on the horizontal axis, the viewport
    // edges) squeeze that position clamp, the second clamp can shrink the
    // derived dimension below what the first pass already locked the
    // *other* (directly-dragged) dimension to — leaving a box whose
    // width/height no longer actually match the aspect ratio. The
    // matchWidthToHeight/matchHeightToWidth calls below re-derive that
    // other dimension from whatever size was actually achievable, so the
    // final box is always correctly proportioned (a no-op whenever the
    // second clamp didn't end up tighter than the first).
    private constrainToAspectRatio(
        rect: SectionRect, start: SectionRect, edges: Edge[], aspectRatio: number, bounds: VerticalBounds
    ): void {
        const availableHeight = bounds.bottom - bounds.top;

        if (edges.length === 1) {
            const edge = edges[0];
            if (edge === "left" || edge === "right") {
                const desiredHeight = clamp(rect.width / aspectRatio, MIN_HEIGHT, availableHeight);
                const newTop = clamp(
                    rect.top - (desiredHeight - rect.height) / 2, bounds.top, bounds.bottom - MIN_HEIGHT
                );
                const finalHeight = clamp(desiredHeight, MIN_HEIGHT, bounds.bottom - newTop);
                rect.top = newTop;
                rect.height = finalHeight;
                this.matchWidthToHeight(rect, edge === "left" ? "right" : "left", finalHeight, aspectRatio);
            } else {
                const desiredWidth = clamp(rect.height * aspectRatio, MIN_WIDTH, window.innerWidth);
                const newLeft = clamp(rect.left - (desiredWidth - rect.width) / 2, 0, window.innerWidth - MIN_WIDTH);
                const finalWidth = clamp(desiredWidth, MIN_WIDTH, window.innerWidth - newLeft);
                rect.left = newLeft;
                rect.width = finalWidth;
                this.matchHeightToWidth(rect, edge === "top" ? "bottom" : "top", finalWidth, aspectRatio, bounds);
            }
            return;
        }

        const widthDelta = Math.abs(rect.width - start.width);
        const heightDeltaAsWidth = Math.abs(rect.height - start.height) * aspectRatio;

        if (widthDelta >= heightDeltaAsWidth) {
            const desiredHeight = clamp(rect.width / aspectRatio, MIN_HEIGHT, availableHeight);
            let finalHeight: number;
            if (edges.includes("top")) {
                const bottomY = start.top + start.height;
                const newTop = clamp(bottomY - desiredHeight, bounds.top, bounds.bottom - MIN_HEIGHT);
                finalHeight = clamp(desiredHeight, MIN_HEIGHT, bounds.bottom - newTop);
                rect.top = newTop;
            } else {
                finalHeight = clamp(desiredHeight, MIN_HEIGHT, bounds.bottom - rect.top);
            }
            rect.height = finalHeight;
            this.matchWidthToHeight(rect, edges.includes("left") ? "right" : "left", finalHeight, aspectRatio);
        } else {
            const desiredWidth = clamp(rect.height * aspectRatio, MIN_WIDTH, window.innerWidth);
            let finalWidth: number;
            if (edges.includes("left")) {
                const rightX = start.left + start.width;
                const newLeft = clamp(rightX - desiredWidth, 0, window.innerWidth - MIN_WIDTH);
                finalWidth = clamp(desiredWidth, MIN_WIDTH, window.innerWidth - newLeft);
                rect.left = newLeft;
            } else {
                finalWidth = clamp(desiredWidth, MIN_WIDTH, window.innerWidth - rect.left);
            }
            rect.width = finalWidth;
            this.matchHeightToWidth(rect, edges.includes("top") ? "bottom" : "top", finalWidth, aspectRatio, bounds);
        }
    }

    // Re-derives width from a (possibly further-clamped) final height so the
    // box matches the aspect ratio exactly, keeping `fixedEdge` — whichever
    // side this resize's own formula treats as the anchor — in place. A
    // no-op when `height` already matches the width already on `rect`.
    private matchWidthToHeight(rect: SectionRect, fixedEdge: "left" | "right", height: number, aspectRatio: number): void {
        const width = height * aspectRatio;
        if (fixedEdge === "right") {
            const rightX = rect.left + rect.width;
            const newLeft = clamp(rightX - width, 0, window.innerWidth - MIN_WIDTH);
            rect.left = newLeft;
            rect.width = clamp(rightX - newLeft, MIN_WIDTH, window.innerWidth - newLeft);
        } else {
            rect.width = clamp(width, MIN_WIDTH, window.innerWidth - rect.left);
        }
    }

    // Mirror of matchWidthToHeight for the vertical axis, respecting the
    // pinned top/bottom bars via `bounds`.
    private matchHeightToWidth(
        rect: SectionRect, fixedEdge: "top" | "bottom", width: number, aspectRatio: number, bounds: VerticalBounds
    ): void {
        const height = width / aspectRatio;
        if (fixedEdge === "bottom") {
            const bottomY = rect.top + rect.height;
            const newTop = clamp(bottomY - height, bounds.top, bounds.bottom - MIN_HEIGHT);
            rect.top = newTop;
            rect.height = clamp(bottomY - newTop, MIN_HEIGHT, bounds.bottom - newTop);
        } else {
            rect.height = clamp(height, MIN_HEIGHT, bounds.bottom - rect.top);
        }
    }

    private attachResizeHandles(): void {
        const el = this.element;
        if (el === null) return;

        if (this.mobile) {
            this.attachMobileHandles(el);
            return;
        }

        for (const handle of HANDLES) {
            const div = document.createElement("div");
            div.classList.add("section-resize-handle", `section-resize-${handle.name}`);
            div.addEventListener("mousedown", (e) => this.beginDrag(e, handle.edges));
            el.appendChild(div);
        }

        const moveHandle = document.createElement("div");
        moveHandle.classList.add("section-move-handle");
        moveHandle.title = "Move";
        moveHandle.addEventListener("mousedown", (e) => this.beginMove(e));
        el.appendChild(moveHandle);
    }

    // Mobile: only a bottom-edge height handle (disabled when the panel's
    // aspect ratio is locked — see updateMobileResizeDisabled) plus the move
    // handle, now wired to beginMobileMove (reorder) instead of beginMove
    // (free XY drag). Pointer Events (not mouse events) so these work with
    // touch on an actual phone — the desktop handles above stay mouse-only
    // since they don't need touch support.
    private attachMobileHandles(el: HTMLElement): void {
        const bottomHandle = document.createElement("div");
        bottomHandle.classList.add("section-resize-handle", "section-resize-bottom");
        bottomHandle.addEventListener("pointerdown", (e) => this.beginMobileResize(e));
        bottomHandle.addEventListener("pointerenter", () => this.updateMobileResizeDisabled(bottomHandle));
        this.updateMobileResizeDisabled(bottomHandle);
        el.appendChild(bottomHandle);

        const moveHandle = document.createElement("div");
        moveHandle.classList.add("section-move-handle");
        moveHandle.title = "Move";
        moveHandle.addEventListener("pointerdown", (e) => this.beginMobileMove(e));
        el.appendChild(moveHandle);
    }

    // The score viewer's aspect ratio isn't known until its first image
    // loads (see ScoreManager.getAspectRatio), so this is re-checked on
    // pointerenter rather than only once at handle creation.
    private updateMobileResizeDisabled(handle: HTMLElement): void {
        handle.classList.toggle("section-resize-disabled", this.getAspectRatio() !== null);
    }

    // Bottom-edge-only height drag. No-ops entirely when the aspect ratio is
    // locked (see getAspectRatio) — that's what "disables" the handle, backed
    // by pointer-events:none in CSS as a second guard. No upper clamp and no
    // pinned-chrome bounds check (unlike the desktop drag): the page just
    // scrolls, there's no fixed viewport to collide with.
    private beginMobileResize(event: PointerEvent): void {
        if (this.getAspectRatio() !== null) return;
        event.preventDefault();
        event.stopPropagation();

        const el = this.element as HTMLElement;
        const handle = event.currentTarget as HTMLElement;
        const startHeight = el.offsetHeight;
        const startY = event.clientY;

        handle.setPointerCapture(event.pointerId);
        handle.classList.add("dragging");
        document.body.style.userSelect = "none";

        const onMove = (moveEvent: PointerEvent) => {
            const dy = moveEvent.clientY - startY;
            el.style.height = `${Math.max(MIN_HEIGHT, startHeight + dy)}px`;
        };

        const onUp = () => {
            handle.classList.remove("dragging");
            document.body.style.userSelect = "";
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
        };

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
    }

    // Reorders the panel among its siblings in the vertical stack by directly
    // swapping DOM order — no transform-based "lift" and placeholder — as the
    // pointer crosses each visible sibling's vertical midpoint. Simple and
    // correct given the small (<10) panel count; hidden (toggled-off) panels
    // are excluded so they don't act as invisible drop targets.
    private beginMobileMove(event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const el = this.element as HTMLElement;
        const parent = el.parentElement;
        const handle = event.currentTarget as HTMLElement;
        if (parent === null) return;

        handle.setPointerCapture(event.pointerId);
        el.classList.add("dragging");
        document.body.style.userSelect = "none";

        const onMove = (moveEvent: PointerEvent) => {
            const pointerY = moveEvent.clientY;
            const siblings = Array.from(parent.children).filter(
                (child): child is HTMLElement =>
                    child instanceof HTMLElement &&
                    child !== el &&
                    child.classList.contains("draggable-section") &&
                    child.style.display !== "none"
            );

            for (const sibling of siblings) {
                const rect = sibling.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                const siblingIsAfter = Boolean(
                    el.compareDocumentPosition(sibling) & Node.DOCUMENT_POSITION_FOLLOWING
                );
                if (siblingIsAfter && pointerY > mid) {
                    parent.insertBefore(el, sibling.nextSibling);
                } else if (!siblingIsAfter && pointerY < mid) {
                    parent.insertBefore(el, sibling);
                }
            }
        };

        const onUp = () => {
            el.classList.remove("dragging");
            document.body.style.userSelect = "";
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
        };

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
    }

    // Drags the whole section by its top-right move handle, translating
    // top/left together while leaving width/height untouched. Clamped the
    // same way an edge drag is: horizontally to the viewport, vertically to
    // whatever the pinned chrome currently allows (see getVerticalDragBounds).
    private beginMove(event: MouseEvent): void {
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
            const bounds = getVerticalDragBounds();

            const newLeft = clamp(start.left + dx, 0, window.innerWidth - start.width);
            const newTop = clamp(start.top + dy, bounds.top, bounds.bottom - start.height);

            this.applyRect({...start, left: newLeft, top: newTop});
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

    private beginDrag(event: MouseEvent, edges: Edge[]): void {
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
            const bounds = getVerticalDragBounds();

            for (const edge of edges) {
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
                        const newTop = clamp(start.top + dy, bounds.top, start.top + start.height - MIN_HEIGHT);
                        rect.height = start.height + (start.top - newTop);
                        rect.top = newTop;
                        break;
                    }
                    case "bottom": {
                        rect.height = clamp(start.height + dy, MIN_HEIGHT, bounds.bottom - start.top);
                        break;
                    }
                }
            }

            const aspectRatio = this.getAspectRatio();
            if (aspectRatio !== null) {
                this.constrainToAspectRatio(rect, start, edges, aspectRatio, bounds);
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

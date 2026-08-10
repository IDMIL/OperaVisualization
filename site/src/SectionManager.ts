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

// Fired on a panel's section element by PanelVisibilityManager whenever the
// user shows or hides that panel (via its toggle or its × handle), with the
// new visibility as the event's `detail`. SectionManager forwards it to the
// subclass hook onVisibilityChanged.
export const PANEL_VISIBILITY_EVENT = "panel-visibility-changed";

// Shared spacing constant between panels/chrome — used by main.ts's default
// layout math and by TimelineManager, which re-derives #layout-sections'
// mobile top padding when the timeline collapses/expands (its height then
// no longer matches what that padding was originally computed from).
export const GAP = 10;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

// Movable panels have no z-index of their own, so they stack in DOM order —
// which means re-showing a panel could leave it buried under whichever panels
// happen to come after it in buildWindow's markup, with no hint that it came
// back at all. bringSectionToFront restacks them so the given one paints on
// top (see PanelVisibilityManager, which calls this when a panel is shown).
//
// Rather than handing out ever-increasing z-indexes, this renumbers all the
// panels from PANEL_Z_BASE on every call, preserving their existing relative
// order. That keeps the values bounded by the number of panels — they must
// stay below .pinned-section's z-index (50) so the title bar, timeline, and
// panel-visibility bar are never covered, and below .floating-panel (60).
const PANEL_Z_BASE = 1;

function panelZIndex(el: HTMLElement): number {
    const z = Number.parseInt(el.style.zIndex, 10);
    return Number.isNaN(z) ? 0 : z;
}

export function bringSectionToFront(el: HTMLElement): void {
    const others = Array.from(document.querySelectorAll<HTMLElement>(".draggable-section"))
        .filter((panel) => panel !== el)
        // Sort is stable, so panels not yet restacked (no inline z-index, hence
        // 0) keep their DOM order relative to each other — the same order
        // they're already painted in.
        .sort((a, b) => panelZIndex(a) - panelZIndex(b));
    others.forEach((panel, i) => {
        panel.style.zIndex = `${PANEL_Z_BASE + i}`;
    });
    el.style.zIndex = `${PANEL_Z_BASE + others.length}`;
}

interface VerticalBounds {
    top: number;
    bottom: number;
}

// Movable panels may be dragged/resized anywhere except behind the pinned
// chrome stacked against the top (title bar, then the timeline directly
// below it) and the bottom (panel-visibility bar) — the innermost edge of
// each stack becomes the effective top/bottom of the viewport for dragging
// and resizing purposes. Read fresh each drag move since these heights
// change at runtime: the title bar's content can wrap (see autoHeight), the
// timeline collapses (see TimelineManager), and either can be hidden.
// Firefox's getBoundingClientRect() is more prone than Chromium's to returning
// fractional values for position:fixed elements (e.g. 899.98 instead of 900),
// so an exact edge comparison can miss a bar that's visually flush against the
// viewport edge. This tolerance absorbs that subpixel rounding.
const EDGE_EPSILON = 1;

// Chrome only counts against a bound when it's flush with the stack already
// accumulated from that edge, so a bar floating in the middle of the page
// (were one ever added) wouldn't swallow everything above/below it. Walking
// inward from each edge — rather than testing each bar against the viewport
// edge alone — is what lets the timeline count: it's flush against the title
// bar's bottom, not against the top of the viewport.
function getVerticalDragBounds(): VerticalBounds {
    const rects = Array.from(document.querySelectorAll<HTMLElement>(".pinned-section"))
        .map((el) => el.getBoundingClientRect())
        // Hidden chrome (a panel toggled off — see PanelVisibilityManager)
        // measures as a zero-height rect and reserves no space.
        .filter((rect) => rect.height > 0);

    let top = 0;
    for (const rect of [...rects].sort((a, b) => a.top - b.top)) {
        if (rect.top <= top + EDGE_EPSILON) {
            top = Math.max(top, rect.bottom);
        }
    }

    let bottom = window.innerHeight;
    for (const rect of [...rects].sort((a, b) => b.bottom - a.bottom)) {
        if (rect.bottom >= bottom - EDGE_EPSILON) {
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
        this.element.addEventListener(PANEL_VISIBILITY_EVENT, (event) => {
            this.onVisibilityChanged((event as CustomEvent<boolean>).detail);
        });
        this.applyRect(defaultRect);
    }

    // Whether this panel is currently shown — PanelVisibilityManager toggles
    // panels purely by setting `display` on the section element. Subclasses
    // use it to skip work that would be pointless while hidden (e.g. the
    // video player, which doesn't seek an off-screen player).
    protected isVisible(): boolean {
        return this.element !== null && this.element.style.display !== "none";
    }

    // Called when the user shows or hides this panel — never for the initial
    // default visibility set at construction, only for later changes. Default
    // no-op; overridden by subclasses that need to react (see
    // VideoPlayerManager).
    protected onVisibilityChanged(_visible: boolean): void {}

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

        // No dedicated move handle — the whole panel background is the drag
        // surface. Only starts a move when the mousedown didn't land on
        // something the panel's own content already treats as clickable (see
        // isInteractiveTarget), so buttons/links/inputs/etc. keep working
        // normally and only empty space initiates a drag.
        el.addEventListener("mousedown", (e) => {
            if (el.classList.contains("score-fullscreen")) return;
            if (this.isInteractiveTarget(e.target)) return;
            this.beginMove(e);
        });

        this.attachCloseHandle(el);
    }

    // Elements that already handle their own clicks — form controls, links,
    // buttons, and anything the codebase marks clickable via cursor:pointer
    // (the convention used throughout this project's CSS for custom
    // clickable divs, e.g. timeline buttons, libretto lines, annotation
    // items) — should not also start a panel drag. Resize/close handles are
    // separate elements with their own mousedown listeners that stop
    // propagation before it reaches this one, so they don't need handling here.
    private static readonly NATIVE_INTERACTIVE_TAGS = new Set([
        "A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "LABEL", "OPTION", "SUMMARY",
    ]);

    private isInteractiveTarget(target: EventTarget | null): boolean {
        if (!(target instanceof Element)) return false;
        if (SectionManager.NATIVE_INTERACTIVE_TAGS.has(target.tagName)) return true;
        if (target instanceof HTMLElement && target.isContentEditable) return true;
        const role = target.getAttribute("role");
        if (role === "button" || role === "link") return true;
        return getComputedStyle(target).cursor === "pointer";
    }

    // Mobile keeps a dedicated move handle (unlike desktop's anywhere-not-
    // clickable drag surface): touching anywhere in a panel to pick it up
    // would fight with scrolling the panel's own content, so reordering stays
    // opt-in via this small handle, wired to beginMobileMove (reorder) rather
    // than beginMove (free XY drag). Plus a bottom-edge height handle
    // (disabled when the panel's aspect ratio is locked — see
    // updateMobileResizeDisabled). Pointer Events (not mouse events) so these
    // work with touch on an actual phone — the desktop resize handles stay
    // mouse-only since they don't need touch support.
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

        this.attachCloseHandle(el);
    }

    // Small × button next to the move handle. Firing "panel-close-request" on
    // the section element (rather than closing it directly here) keeps
    // SectionManager ignorant of the panel-visibility bar — PanelVisibilityManager
    // listens for the event on each target it manages and treats it exactly
    // like unchecking that panel's toggle.
    private attachCloseHandle(el: HTMLElement): void {
        const closeHandle = document.createElement("div");
        closeHandle.classList.add("section-close-handle");
        closeHandle.title = "Close";
        closeHandle.textContent = "×";
        closeHandle.addEventListener("mousedown", (e) => e.stopPropagation());
        closeHandle.addEventListener("pointerdown", (e) => e.stopPropagation());
        closeHandle.addEventListener("click", (e) => {
            e.stopPropagation();
            el.dispatchEvent(new CustomEvent("panel-close-request"));
        });
        el.appendChild(closeHandle);
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

    // Lifts the panel out of the flex flow so it can travel with the pointer
    // (position:fixed, pinned to its pre-drag width/left — only its vertical
    // position tracks the pointer, since this is a single-column vertical
    // list) while a fixed-height dashed placeholder (see .mobile-move-placeholder,
    // height set in CSS) marks where it will land, reordering among siblings
    // exactly as the panel itself used to (compare each visible sibling's
    // midpoint against the pointer). Dropping (pointerup/cancel) reinserts
    // the panel where the placeholder ended up and restores its normal
    // in-flow mobile styling via applyMobileRect.
    private beginMobileMove(event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();

        const el = this.element as HTMLElement;
        const parent = el.parentElement;
        const handle = event.currentTarget as HTMLElement;
        if (parent === null) return;

        const startRect = el.getBoundingClientRect();
        const startHeight = el.offsetHeight;
        const grabOffsetY = event.clientY - startRect.top;

        const placeholder = document.createElement("div");
        placeholder.classList.add("mobile-move-placeholder");
        parent.insertBefore(placeholder, el);

        handle.setPointerCapture(event.pointerId);
        el.classList.add("mobile-dragging");
        document.body.style.userSelect = "none";

        el.style.position = "fixed";
        el.style.zIndex = "1000";
        el.style.width = `${startRect.width}px`;
        el.style.left = `${startRect.left}px`;
        el.style.top = `${startRect.top}px`;

        const onMove = (moveEvent: PointerEvent) => {
            el.style.top = `${moveEvent.clientY - grabOffsetY}px`;

            const pointerY = moveEvent.clientY;
            const siblings = Array.from(parent.children).filter(
                (child): child is HTMLElement =>
                    child instanceof HTMLElement &&
                    child !== el &&
                    child !== placeholder &&
                    child.classList.contains("draggable-section") &&
                    child.style.display !== "none"
            );

            for (const sibling of siblings) {
                const rect = sibling.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                const placeholderIsAfter = Boolean(
                    placeholder.compareDocumentPosition(sibling) & Node.DOCUMENT_POSITION_FOLLOWING
                );
                if (placeholderIsAfter && pointerY > mid) {
                    parent.insertBefore(placeholder, sibling.nextSibling);
                } else if (!placeholderIsAfter && pointerY < mid) {
                    parent.insertBefore(placeholder, sibling);
                }
            }
        };

        const onEnd = () => {
            el.classList.remove("mobile-dragging");
            document.body.style.userSelect = "";
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onEnd);
            handle.removeEventListener("pointercancel", onEnd);

            parent.insertBefore(el, placeholder);
            placeholder.remove();
            el.style.zIndex = "";
            this.applyMobileRect(startHeight);
        };

        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onEnd);
        handle.addEventListener("pointercancel", onEnd);
    }

    // Drags the whole section from a mousedown anywhere on its non-interactive
    // background (see isInteractiveTarget), translating top/left together
    // while leaving width/height untouched. Clamped the same way an edge drag
    // is: horizontally to the viewport, vertically to whatever the pinned
    // chrome currently allows (see getVerticalDragBounds).
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

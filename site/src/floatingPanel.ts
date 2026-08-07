// Shared positioning for the app's floating (non-draggable) panels — the
// add-annotation form and the drawing tool — which cascade next to an
// anchor element rather than covering it. Kept separate from SectionManager
// since these aren't part of the main draggable/resizable layout system.
export function positionFloatingPanel(panel: HTMLElement, anchor: HTMLElement, desiredWidth: number): void {
    const gap = 10;
    const anchorRect = anchor.getBoundingClientRect();
    const width = Math.min(desiredWidth, window.innerWidth - 2 * gap);

    // Prefer floating to the right of the anchor; fall back to the left if
    // there's no room, then clamp to the viewport either way.
    let left = anchorRect.right + gap;
    if (left + width > window.innerWidth) {
        left = anchorRect.left - width - gap;
    }
    left = Math.min(Math.max(left, gap), window.innerWidth - width - gap);

    const minVisibleHeight = 200;
    const top = Math.min(Math.max(anchorRect.top, gap), window.innerHeight - minVisibleHeight - gap);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${width}px`;
    panel.style.maxHeight = `${window.innerHeight - top - gap}px`;
}

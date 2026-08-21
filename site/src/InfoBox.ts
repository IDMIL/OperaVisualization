// Gap between the icon and its popup — matches the arrow drawn on
// .info-box-popup::before, which points back at the icon across it.
const POPUP_GAP = 10;

// The popup is appended to <body> rather than to the icon: the panel it sits
// in gets an inline z-index (see bringSectionToFront), which makes that panel
// a stacking context — a popup nested inside it can never paint above the
// pinned chrome (title bar, timeline, panel-visibility bar), however high its
// own z-index. On <body> its z-index is compared against theirs directly.
// The cost is that it's no longer laid out relative to the icon, so hovering
// positions it here instead.
export function addInfoBox(element: HTMLElement, info: string) {
    const infoBoxIcon = document.createElement("div");
    infoBoxIcon.classList.add("info-box-icon");
    infoBoxIcon.innerText = "?";

    const popup = document.createElement("div");
    popup.classList.add("info-box-popup");
    popup.textContent = info;
    document.body.appendChild(popup);

    infoBoxIcon.addEventListener("mouseenter", () => {
        const iconRect = infoBoxIcon.getBoundingClientRect();
        popup.style.left = `${iconRect.right + POPUP_GAP}px`;
        // The CSS translateY(-50%) turns this into a vertical centring on
        // the icon, as the old top: 50% did while nested inside it.
        popup.style.top = `${iconRect.top + iconRect.height / 2}px`;
        popup.classList.add("info-box-popup-visible");
    });
    infoBoxIcon.addEventListener("mouseleave", () => {
        popup.classList.remove("info-box-popup-visible");
    });

    element.appendChild(infoBoxIcon);
}

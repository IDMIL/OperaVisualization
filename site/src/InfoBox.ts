export function addInfoBox(element: HTMLElement, info: string) {
    const infoBoxIcon = document.createElement("div");
    infoBoxIcon.classList.add("info-box-icon");
    infoBoxIcon.innerText = "?";

    const popup = document.createElement("div");
    popup.classList.add("info-box-popup");
    popup.textContent = info;
    infoBoxIcon.appendChild(popup);

    element.appendChild(infoBoxIcon);
}

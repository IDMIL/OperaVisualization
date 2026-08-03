import {AnnotationCode} from "./data/annotations";

// Shared between AnnotationManager's sidebar list and CurrentPageAnnotations'
// score overlay so both render annotation codes the same way: one colored dot
// per code, or a single muted dot for an uncoded annotation.
export function buildAnnotationBullet(codes: Array<AnnotationCode>): HTMLElement {
    const bulletDiv = document.createElement("div");
    bulletDiv.classList.add("annotation-bullet");
    const dotCodes = codes.length === 0 ? [null] : codes;
    for (const code of dotCodes) {
        const dot = document.createElement("span");
        dot.classList.add("annotation-bullet-dot");
        if (code !== null) {
            dot.classList.add(code + "-annotation-dot");
        }
        bulletDiv.appendChild(dot);
    }
    return bulletDiv;
}

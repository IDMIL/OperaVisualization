import {ScoreTime, TimeManagerListener, UpdateSource} from "./TimeManager";
import {Annotation, AnnotationCode} from "./data/annotations";
import {bar_to_page} from "./data/barToPage";
import {globals} from "./globals";

// Maps each annotation code to the CSS custom-property that defines its colour.
// Reading from the computed style keeps the colour values in one place (styles.css).
const CODE_CSS_VAR: Record<AnnotationCode, string> = {
    'dy':    '--dynamiques-color',
    'du':    '--duree-color',
    'for':   '--formes-color',
    'int':   '--intonation-color',
    'mo':    '--motifs-color',
    'tim':   '--timbre-color',
    'graph': '--graph-color',
};

function annotationColor(codes: AnnotationCode[]): string {
    for (const code of codes) {
        if (code !== 'graph') {
            const cssVar = CODE_CSS_VAR[code];
            return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        }
    }
    return '';
}

export class CurrentPageAnnotations extends TimeManagerListener {
    private readonly container: HTMLElement;
    private readonly getAnnotations: () => Annotation[];
    private readonly imageHolder: HTMLElement | null;

    constructor(getAnnotations: () => Annotation[]) {
        super();
        this.getAnnotations = getAnnotations;

        this.container = document.createElement('div');
        this.container.id = 'current-page-annotations';

        this.imageHolder = document.getElementById('image-holder');
        this.imageHolder?.appendChild(this.container);

        // Set up delegated listeners on imageHolder so bar-overlay events are
        // caught regardless of when ScoreManager adds or removes those elements.
        if (this.imageHolder) {
            this.setupBarHoverDelegation(this.imageHolder);
        }
    }

    async timeUpdated(scoreTime: ScoreTime, _updateSource: UpdateSource) {
        this.render(scoreTime);
    }

    // ── Page membership ───────────────────────────────────────

    private barsOnCurrentPage(scoreTime: ScoreTime): Set<number> {
        const currentImage = bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        const actBars = bar_to_page[scoreTime.act - 1];
        const result = new Set<number>();
        for (const barNum in actBars) {
            if (actBars[barNum].image === currentImage) {
                result.add(Number(barNum));
            }
        }
        return result;
    }

    private annotationsForPage(scoreTime: ScoreTime): Annotation[] {
        const onPage = this.barsOnCurrentPage(scoreTime);
        return this.getAnnotations().filter(annotation => {
            if (annotation.act !== scoreTime.act) return false;
            for (let bar = annotation.measure_range[0]; bar <= annotation.measure_range[1]; bar++) {
                if (onPage.has(bar)) return true;
            }
            return false;
        });
    }

    private highlightBarsForAnnotation(range: [number, number], codes: AnnotationCode[]) {
        if (!this.imageHolder) return;
        const color = annotationColor(codes);
        for (const el of this.imageHolder.querySelectorAll<HTMLElement>('[data-bar]')) {
            const bar = Number(el.dataset.bar);
            const inRange = bar >= range[0] && bar <= range[1];
            el.classList.toggle('annotation-highlight', inRange);
            // Override the default pink background with the annotation-category colour.
            // Inline styles beat class rules, so this shows through the opacity set by
            // .annotation-highlight.  Cleared back to '' when the hover ends.
            el.style.background = inRange && color ? color : '';
        }
    }

    private clearBarHighlights() {
        this.imageHolder
            ?.querySelectorAll<HTMLElement>('[data-bar].annotation-highlight')
            .forEach(el => {
                el.classList.remove('annotation-highlight');
                el.style.background = '';
            });
    }

    // ── Hover: bar overlays → annotation divs (delegated) ────

    private setupBarHoverDelegation(imageHolder: HTMLElement) {
        imageHolder.addEventListener('mouseover', (e: MouseEvent) => {
            const from = (e.relatedTarget as HTMLElement | null)
                ?.closest<HTMLElement>('[data-bar]');
            const to = (e.target as HTMLElement)
                .closest<HTMLElement>('[data-bar]');
            // Only act when entering a different bar overlay (ignores moves within one).
            if (to && to !== from) {
                this.highlightAnnotationsForBar(Number(to.dataset.bar));
            }
        });

        imageHolder.addEventListener('mouseout', (e: MouseEvent) => {
            const from = (e.target as HTMLElement)
                .closest<HTMLElement>('[data-bar]');
            const to = (e.relatedTarget as HTMLElement | null)
                ?.closest<HTMLElement>('[data-bar]');
            // Only clear when leaving a bar overlay entirely (ignores moves within one).
            if (from && from !== to) {
                this.clearAnnotationHighlights();
            }
        });
    }

    private highlightAnnotationsForBar(bar: number) {
        for (const el of this.container.querySelectorAll<HTMLElement>('.page-annotation')) {
            const start = Number(el.dataset.measureStart);
            const end   = Number(el.dataset.measureEnd);
            el.classList.toggle('annotation-highlight', bar >= start && bar <= end);
        }
    }

    private clearAnnotationHighlights() {
        this.container
            .querySelectorAll<HTMLElement>('.page-annotation.annotation-highlight')
            .forEach(el => el.classList.remove('annotation-highlight'));
    }

    // ── Render ────────────────────────────────────────────────

    private render(scoreTime: ScoreTime) {
        const annotations = this.annotationsForPage(scoreTime);

        this.container.classList.toggle('has-annotations', annotations.length > 0);
        this.container.innerHTML = '';

        for (const annotation of annotations) {
            const div = document.createElement('div');
            div.classList.add('page-annotation');
            for (const code of annotation.code) {
                div.classList.add(`${code}-annotation`);
            }
            if (annotation.code.length === 0) {
                div.classList.add('unclassified-annotation');
            }

            // Store measure range as data attributes so the bar-hover handler
            // can determine which annotations to highlight without holding a
            // closure over the full annotation object for each bar overlay.
            div.dataset.measureStart = String(annotation.measure_range[0]);
            div.dataset.measureEnd   = String(annotation.measure_range[1]);

            div.addEventListener('mouseenter', () =>
                this.highlightBarsForAnnotation(annotation.measure_range, annotation.code));
            div.addEventListener('mouseleave', () =>
                this.clearBarHighlights());

            const text = document.createElement('div');
            text.classList.add('page-annotation-text');
            text.innerHTML = annotation.annotation[globals.language];
            div.appendChild(text);

            this.container.appendChild(div);
        }
    }
}

import {ScoreTime, TimeManager, TimeManagerListener, UpdateSource} from "./TimeManager";
import {Annotation, AnnotationCode, annotations} from "./data/annotations";
import {globals} from "./globals";
import {text} from "./data/text";
import {AddAnnotationPanel} from "./AddAnnotationPanel";

export class AnnotationManager extends TimeManagerListener {
    annotationCodes : { [code in AnnotationCode] : string; } = {
        'dy' : 'Dynamiques',
        'du': 'Durée',
        'for' : 'Formes',
        'int' : 'Intonation',
        'mo' : 'Motifs',
        'tim' : 'Timbre',
        'graph' : 'Graphique'
    }

    soloedAnnotationCategories : Array<AnnotationCode> = [];
    userAnnotations: Array<Annotation> = [];
    private annotationEntries: Array<{div: HTMLElement, annotation: Annotation}> = [];
    private searchText: string = '';
    private timeManager: TimeManager;

    constructor(timeManager : TimeManager) {
        super();

        this.timeManager = timeManager;

        let annotationsSection = document.getElementById('annotations-section');
        if (annotationsSection === null) {
            return;
        }

        const header = document.createElement("h2");
        header.innerText = text[globals.language].ANNOTATIONS;
        annotationsSection.appendChild(header);

        let annotationTypeSelectorDiv = document.createElement('div');
        annotationTypeSelectorDiv.id = 'annotation-type-selectors';

        Object.keys(this.annotationCodes).forEach((key) => {
            const code = key as AnnotationCode;
            let codeButton = document.createElement('button');
            codeButton.innerText = this.annotationCodes[code];
            codeButton.classList.add('annotation-type');
            codeButton.classList.add(code + '-annotation-type');
            codeButton.onclick = (event) => {
                if (event.shiftKey && !this.soloedAnnotationCategories.includes(code)) {
                    this.soloedAnnotationCategories.push(code);
                } else if (event.shiftKey) {
                    return;
                } else if (this.soloedAnnotationCategories.includes(code)) {
                    this.soloedAnnotationCategories = this.soloedAnnotationCategories.filter(item => item !== code);
                } else {
                    this.soloedAnnotationCategories = [code];
                }
                this.setAnnotationVisibilityFromState();
            }
            annotationTypeSelectorDiv.appendChild(codeButton);
        });

        annotationsSection.appendChild(annotationTypeSelectorDiv);

        let searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'annotation-search';
        searchInput.placeholder = text[globals.language].SEARCH_PLACEHOLDER;
        searchInput.addEventListener('input', () => {
            this.searchText = searchInput.value;
            this.setAnnotationVisibilityFromState();
        });
        let searchRow = document.createElement('div');
        searchRow.id = 'annotation-search-row';
        searchRow.appendChild(searchInput);

        let addButton = document.createElement('button');
        addButton.id = 'annotation-add-button';
        addButton.textContent = '+';
        searchRow.appendChild(addButton);

        annotationsSection.appendChild(searchRow);

        let scrollerDiv = document.createElement('div');
        scrollerDiv.id = 'annotations-scroller';
        scrollerDiv.classList.add('scroller-area');
        annotationsSection.appendChild(scrollerDiv);

        const addAnnotationPanel = new AddAnnotationPanel(scrollerDiv, this.annotationCodes, (annotation) => {
            this.userAnnotations.push(annotation);
            const div = this.buildAnnotationDiv(annotation);
            const insertIndex = this.annotationEntries.findIndex(
                e => e.annotation.act > annotation.act ||
                    (e.annotation.act === annotation.act &&
                     e.annotation.measure_range[0] > annotation.measure_range[0])
            );
            if (insertIndex === -1) {
                scrollerDiv.appendChild(div);
                this.annotationEntries.push({div, annotation});
            } else {
                scrollerDiv.insertBefore(div, this.annotationEntries[insertIndex].div);
                this.annotationEntries.splice(insertIndex, 0, {div, annotation});
            }
            this.setAnnotationVisibilityFromState();
        });
        addButton.addEventListener('click', () => addAnnotationPanel.open());

        for (const annotation of annotations) {
            const div = this.buildAnnotationDiv(annotation);
            scrollerDiv.appendChild(div);
            this.annotationEntries.push({div, annotation});
        }
    }

    private buildAnnotationDiv(annotation: Annotation): HTMLElement {
        const annotationDiv = document.createElement("div");
        annotationDiv.classList.add("annotation");
        for (const code of annotation.code) {
            annotationDiv.classList.add(code + "-annotation");
        }
        if (annotation.code.length === 0) {
            annotationDiv.classList.add('unclassified-annotation');
        }

        const timeStampDiv = document.createElement("div");
        timeStampDiv.classList.add("annotation-time-stamp");
        timeStampDiv.innerText = this.getStringForTimestamp(annotation);
        annotationDiv.appendChild(timeStampDiv);

        const annotationTextDiv = document.createElement("div");
        annotationTextDiv.classList.add("annotation-text");
        annotationTextDiv.dataset.originalHtml = annotation.annotation;
        annotationTextDiv.innerHTML = annotation.annotation;
        annotationTextDiv.dataset.originalText = annotationTextDiv.textContent || '';
        annotationDiv.appendChild(annotationTextDiv);

        annotationDiv.onclick = () => {
            this.timeManager.goToTime(annotation.act, annotation.measure_range[0], 1, "annotation-click");
        };

        return annotationDiv;
    }

    getStringForTimestamp(annotation : Annotation) {
        const act_scene = text[globals.language]["ACT"] + ' ' +
            annotation.act + ', ' + text[globals.language]["SCENE"] + ' ' +
            this.timeManager.getScene(annotation.act, annotation.measure_range[0]);

        if (annotation.is_general) {
            const pages = text[globals.language]["PAGE"] + ' ' + (
            (annotation.page_range[0] === annotation.page_range[1])
                ? annotation.page_range[0] : [annotation.page_range[0]] + '–' + annotation.page_range[1]);
            return act_scene + ', ' + pages;
        }

        const mr = annotation.measure_range;
        const measure = (mr[0] === mr[1]) ?
            (text[globals.language]["BAR"] + ' ' + mr[0]) :
            (text[globals.language]["BARS"] + ' ' + mr[0] + '–' + mr[1]);

        return act_scene + ', ' + measure;
    }

    setAnnotationVisibilityFromState() {
        const searchLower = this.searchText.toLowerCase();

        for (const key in this.annotationCodes) {
            for (const elem of document.getElementsByClassName(key + '-annotation-type')) {
                if (this.soloedAnnotationCategories.length === 0 || this.soloedAnnotationCategories.includes(key as AnnotationCode)) {
                    elem.classList.remove('annotation-type-hidden');
                } else {
                    elem.classList.add('annotation-type-hidden');
                }
            }
        }

        const scroller = document.getElementById('annotations-scroller');
        if (!scroller) return;

        for (const annotationDiv of scroller.children) {
            const textEl = annotationDiv.querySelector('.annotation-text') as HTMLElement | null;
            const originalText = textEl?.dataset.originalText ?? '';
            const matchesSearch = searchLower === '' || originalText.toLowerCase().includes(searchLower);

            let matchesCategory: boolean;
            if (this.soloedAnnotationCategories.length === 0) {
                matchesCategory = true;
            } else if (annotationDiv.classList.contains('unclassified-annotation')) {
                matchesCategory = false;
            } else {
                matchesCategory = this.soloedAnnotationCategories.some(
                    code => annotationDiv.classList.contains(code + '-annotation')
                );
            }

            if (matchesSearch && matchesCategory) {
                annotationDiv.classList.remove('annotation-hidden');
            } else {
                annotationDiv.classList.add('annotation-hidden');
            }

            if (textEl) {
                const originalHtml = textEl.dataset.originalHtml ?? originalText;
                if (searchLower !== '' && matchesSearch) {
                    textEl.innerHTML = this.highlightText(originalHtml, this.searchText);
                } else {
                    textEl.innerHTML = originalHtml;
                }
            }
        }
    }

    private highlightText(html: string, query: string): string {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(${escaped})`, 'gi');
        // Apply highlighting only to text nodes, not inside HTML tags
        return html.replace(/(<[^>]+>)|([^<]+)/g, (_, tag, text) => {
            if (tag) return tag;
            return text.replace(re, '<mark class="search-highlight">$1</mark>');
        });
    }

    async timeUpdated(scoreTime : ScoreTime, updateSource : UpdateSource) {
        let firstAnnotationSeen = false;
        for (const {div, annotation} of this.annotationEntries) {
            if (annotation.act === scoreTime.act &&
                annotation.measure_range[0] <= scoreTime.bar &&
                annotation.measure_range[1] >= scoreTime.bar) {
                div.classList.add("current-annotation");
                if (!firstAnnotationSeen && updateSource !== "annotation-click") {
                    div.scrollIntoView({behavior: 'smooth'});
                    firstAnnotationSeen = true;
                }
            } else {
                div.classList.remove("current-annotation");
            }
        }
    }
}
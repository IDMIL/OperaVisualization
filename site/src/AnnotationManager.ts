import {ScoreTime, TimeManager, UpdateSource} from "./TimeManager";
import {Annotation, AnnotationCode, annotations} from "./data/annotations";
import {globals} from "./globals";
import {AddAnnotationPanel} from "./AddAnnotationPanel";
import {addInfoBox} from "./InfoBox";
import {text} from "./data/text";
import {SectionManager, SectionRect} from "./SectionManager";

interface AnnotationSources {
    [source_name: string]: {description: string, annotations: Array<Annotation>}
}

export class AnnotationManager extends SectionManager {
    annotationCodes : { [code in AnnotationCode] : string; } = {
        'dy' : text.DYNAMICS[globals.language],
        'du': text.DURATION[globals.language],
        'for' : text.FORM[globals.language],
        'int' : text.INTONATION[globals.language],
        'mo' : text.MOTIFS[globals.language],
        'tim' : text.TIMBRE[globals.language],
        'graph' : text.GRAPHICAL[globals.language]
    }

    private allAnnotations : AnnotationSources = {
        "René Schmidt": {description:text.SCHMIDT_DESCRIPTION[globals.language], annotations: annotations},
        "Serge Garant": {description:text.GARANT_DESCRIPTION[globals.language], annotations: []},
        "George Perle": {description:text.PERLE_DESCRIPTION[globals.language], annotations: []},
        "User": {description: text.USER_DESCRIPTION[globals.language], annotations: []}};

    soloedAnnotationCategories : Array<AnnotationCode> = [];
    private annotationEntries: Array<{div: HTMLElement, annotation: Annotation}> = [];
    private searchText: string = '';
    private enabledSources: Set<string> = new Set(Object.keys(this.allAnnotations));
    private timeManager: TimeManager;
    private addAnnotationPanel!: AddAnnotationPanel;
    private downloadButton!: HTMLButtonElement;
    private uploadButton!: HTMLButtonElement;
    scrollerDiv : HTMLElement | undefined;

    constructor(timeManager : TimeManager, rect: SectionRect) {
        super("annotations-section", rect);

        this.timeManager = timeManager;

        let annotationsSection = this.element;
        if (annotationsSection === null) {
            return;
        }

        const header = document.createElement("h2");
        header.innerText = text.ANNOTATIONS[globals.language];
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

        let sourceFilterDiv = document.createElement('div');
        sourceFilterDiv.id = 'annotation-source-filters';
        Object.keys(this.allAnnotations).forEach((source) => {
            const label = document.createElement('label');
            label.classList.add('annotation-source-label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.classList.add('annotation-source-checkbox');
            checkbox.dataset.source = source;
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.enabledSources.add(source);
                } else {
                    this.enabledSources.delete(source);
                }
                this.setAnnotationVisibilityFromState();
            });
            label.appendChild(checkbox);
            let labelText = source === "User" ? text.USER[globals.language] : source;
            label.appendChild(document.createTextNode(labelText));
            addInfoBox(label, this.allAnnotations[source].description);
            sourceFilterDiv.appendChild(label);
        });
        annotationsSection.appendChild(sourceFilterDiv);

        let searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'annotation-search';
        searchInput.placeholder = text.SEARCH_PLACEHOLDER[globals.language];
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

        this.downloadButton = document.createElement('button');
        this.downloadButton.id = 'annotation-download-button';
        this.downloadButton.title = 'Download user annotations as JSON';
        this.downloadButton.textContent = '↓';
        this.downloadButton.addEventListener('click', () => this.downloadUserAnnotations());
        searchRow.appendChild(this.downloadButton);

        this.uploadButton = document.createElement('button');
        this.uploadButton.id = 'annotation-upload-button';
        this.uploadButton.title = 'Upload annotations from JSON';
        this.uploadButton.textContent = '↑';
        searchRow.appendChild(this.uploadButton);

        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', () => this.handleAnnotationUpload(fileInput));
        document.body.appendChild(fileInput);
        this.uploadButton.addEventListener('click', () => fileInput.click());

        annotationsSection.appendChild(searchRow);

        this.scrollerDiv = document.createElement('div');
        this.scrollerDiv.id = 'annotations-scroller';
        this.scrollerDiv.classList.add('scroller-area');
        annotationsSection.appendChild(this.scrollerDiv);

        this.addAnnotationPanel = new AddAnnotationPanel(this.scrollerDiv, this.annotationCodes, (annotation) => {
            this.allAnnotations["User"].annotations.push(annotation);
            this.insertAnnotationAtCorrectPosition(annotation, 'User');
            this.setAnnotationVisibilityFromState();
            this.saveUserAnnotations();
        }, this.timeManager, (old, updated) => {
            const index = this.annotationEntries.findIndex(e => e.annotation === old);
            if (index !== -1) {
                this.annotationEntries[index].div.remove();
                this.annotationEntries.splice(index, 1);
            }
            const userIndex = this.allAnnotations["User"].annotations.indexOf(old);
            if (userIndex !== -1) {
                this.allAnnotations["User"].annotations.splice(userIndex, 1);
            }
            this.allAnnotations["User"].annotations.push(updated);
            this.insertAnnotationAtCorrectPosition(updated, 'User');
            this.setAnnotationVisibilityFromState();
            this.saveUserAnnotations();
        });
        addButton.addEventListener('click', () => this.addAnnotationPanel.open());

        const saved = localStorage.getItem('wozzeck-user-annotations');
        if (saved) {
            try {
                this.allAnnotations["User"].annotations = JSON.parse(saved);
            } catch {
                // ignore malformed stored data
            }
        }

        for (const key in this.allAnnotations) {
            for (const annotation of this.allAnnotations[key].annotations) {
                this.insertAnnotationAtCorrectPosition(annotation, key);
            }
        }
        this.setAnnotationVisibilityFromState();

        this.updateTransferButtons();

        this.initResizeHandles();
    }

    insertAnnotationAtCorrectPosition(annotation: Annotation, source: string = 'User') {
        const div = this.buildAnnotationDiv(annotation);
        div.dataset.source = source;
        if (source === 'User') {
            const editButton = document.createElement('button');
            editButton.classList.add('annotation-edit-button');
            editButton.textContent = '✎';
            editButton.onclick = (event) => {
                event.stopPropagation();
                this.addAnnotationPanel.open(annotation);
            };
            div.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('annotation-delete-button');
            deleteButton.textContent = '✕';
            deleteButton.onclick = (event) => {
                event.stopPropagation();
                const index = this.annotationEntries.findIndex(e => e.annotation === annotation);
                if (index !== -1) {
                    this.annotationEntries[index].div.remove();
                    this.annotationEntries.splice(index, 1);
                }
                const userIndex = this.allAnnotations["User"].annotations.indexOf(annotation);
                if (userIndex !== -1) {
                    this.allAnnotations["User"].annotations.splice(userIndex, 1);
                }
                this.saveUserAnnotations();
            };
            div.appendChild(deleteButton);
        }
        const insertIndex = this.annotationEntries.findIndex(
            e => e.annotation.act > annotation.act ||
                (e.annotation.act === annotation.act &&
                    e.annotation.measure_range[0] > annotation.measure_range[0])
        );
        if (insertIndex === -1 && this.scrollerDiv !== undefined) {
            this.scrollerDiv.appendChild(div);
            this.annotationEntries.push({div, annotation});
        } else if (this.scrollerDiv !== undefined) {
            this.scrollerDiv.insertBefore(div, this.annotationEntries[insertIndex].div);
            this.annotationEntries.splice(insertIndex, 0, {div, annotation});
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
        annotationTextDiv.dataset.originalHtml = annotation.annotation[globals.language];
        annotationTextDiv.innerHTML = annotation.annotation[globals.language];
        annotationTextDiv.dataset.originalText = annotationTextDiv.textContent || '';
        annotationDiv.appendChild(annotationTextDiv);

        annotationDiv.onclick = () => {
            this.timeManager.goToTime(annotation.act, annotation.measure_range[0], "annotation-click");
        };

        return annotationDiv;
    }

    getStringForTimestamp(annotation : Annotation) {
        const act_scene = text["ACT"][globals.language] + ' ' +
            annotation.act + ', ' + text["SCENE"][globals.language] + ' ' +
            this.timeManager.getScene(annotation.act, annotation.measure_range[0]);

        if (annotation.is_general) {
            const pages = text["PAGE"][globals.language] + ' ' + (
            (annotation.page_range[0] === annotation.page_range[1])
                ? annotation.page_range[0] : [annotation.page_range[0]] + '–' + annotation.page_range[1]);
            return act_scene + ', ' + pages;
        }

        const mr = annotation.measure_range;
        const measure = (mr[0] === mr[1]) ?
            (text["BAR"][globals.language] + ' ' + mr[0]) :
            (text["BARS"][globals.language] + ' ' + mr[0] + '–' + mr[1]);

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

            const source = (annotationDiv as HTMLElement).dataset.source ?? '';
            const matchesSource = !source || this.enabledSources.has(source);

            if (matchesSearch && matchesCategory && matchesSource) {
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

    getAllAnnotations(): Annotation[] {
        return Object.values(this.allAnnotations).flatMap(source => source.annotations);
    }

    private downloadUserAnnotations() {
        const data = JSON.stringify(this.allAnnotations["User"], null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wozzeck-annotations.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    private handleAnnotationUpload(fileInput: HTMLInputElement) {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string) as Annotation[];
                for (const annotation of imported) {
                    this.allAnnotations["User"].annotations.push(annotation);
                    this.insertAnnotationAtCorrectPosition(annotation, 'User');
                }
                this.setAnnotationVisibilityFromState();
                this.saveUserAnnotations();
            } catch {
                // ignore malformed data
            }
            fileInput.value = '';
        };
        reader.readAsText(file);
    }

    private updateTransferButtons() {
        const hasUserAnnotations = this.allAnnotations["User"].annotations.length > 0;
        this.downloadButton.disabled = !hasUserAnnotations;
        this.uploadButton.disabled = !hasUserAnnotations;
    }

    private saveUserAnnotations() {
        localStorage.setItem('wozzeck-user-annotations', JSON.stringify(this.allAnnotations["User"]));
        this.updateTransferButtons();
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
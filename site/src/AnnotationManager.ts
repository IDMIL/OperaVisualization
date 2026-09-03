import {ScoreTime, TimeManager, UpdateSource} from "./TimeManager";
import {Annotation as AnnotationContent, AnnotationCode, AnnotationGroup, annotations as annotationGroupsData} from "./data/annotations";
import {globals} from "./globals";
import {AddAnnotationPanel} from "./AddAnnotationPanel";
import {addInfoBox} from "./InfoBox";
import {text} from "./data/text";
import {SectionManager, SectionRect} from "./SectionManager";
import {buildAnnotationBullet} from "./AnnotationBullet";

// Flat view of an annotation with its group's time-range context merged in,
// used by UI code (the add/edit panel, the current-page view) that deals with
// one annotation at a time.
export interface Annotation extends AnnotationContent {
    act: number;
    is_general: boolean;
    page_range: [number, number];
    measure_range: [number, number];
}

function flattenAnnotationGroups(groups: Array<AnnotationGroup>): Array<Annotation> {
    return groups.flatMap(group => group.annotations.map(a => ({
        ...a,
        act: group.act,
        is_general: group.is_general,
        page_range: group.page_range,
        measure_range: group.measure_range,
    })));
}

function sameTimeRange(a: AnnotationGroup, b: AnnotationGroup): boolean {
    return a.act === b.act && a.is_general === b.is_general &&
        a.page_range[0] === b.page_range[0] && a.page_range[1] === b.page_range[1] &&
        a.measure_range[0] === b.measure_range[0] && a.measure_range[1] === b.measure_range[1];
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

    private sourceDescriptions : { [source_name: string]: string } = {
        "René Schmidt": text.SCHMIDT_DESCRIPTION[globals.language],
        "Serge Garant": text.GARANT_DESCRIPTION[globals.language],
        "George Perle": text.PERLE_DESCRIPTION[globals.language],
        "User": text.USER_DESCRIPTION[globals.language],
    };

    // Master store, in the same grouped-by-time-range shape as data/annotations.ts.
    // User-created annotations are merged into it too, tagged via annotation_source.
    private annotationGroups: Array<AnnotationGroup> =
        annotationGroupsData.map(g => ({...g, annotations: [...g.annotations]}));

    soloedAnnotationCategories : Array<AnnotationCode> = [];
    // One bubble (rendered div) per group, holding a <ul> of one <li> per annotation.
    private groupEntries: Array<{div: HTMLElement, group: AnnotationGroup, listEl: HTMLElement}> = [];
    // Lets us find/remove the <li> for a given annotation without walking the DOM.
    private annotationItemElements: Map<AnnotationContent, HTMLElement> = new Map();
    private editingEntry: {group: AnnotationGroup, annotation: AnnotationContent} | null = null;
    private searchText: string = '';
    private enabledSources: Set<string> = new Set(Object.keys(this.sourceDescriptions));
    private timeManager: TimeManager;
    private addAnnotationPanel!: AddAnnotationPanel;
    private downloadButton!: HTMLButtonElement;
    private uploadButton!: HTMLButtonElement;
    // Notified whenever annotation data changes (add/edit/delete/upload) —
    // lets ScoreDrawingOverlay pick up a graphical annotation on the
    // currently displayed page right away, instead of only on navigation.
    private onAnnotationsChanged: () => void = () => {};
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
        Object.keys(this.sourceDescriptions).forEach((source) => {
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
            addInfoBox(label, this.sourceDescriptions[source]);
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
        this.downloadButton.title = text.DOWNLOAD_ANNOTATIONS[globals.language];
        this.downloadButton.textContent = '↓';
        this.downloadButton.addEventListener('click', () => this.downloadUserAnnotations());
        searchRow.appendChild(this.downloadButton);

        this.uploadButton = document.createElement('button');
        this.uploadButton.id = 'annotation-upload-button';
        this.uploadButton.title = text.UPLOAD_ANNOTATIONS[globals.language];
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

        this.addAnnotationPanel = new AddAnnotationPanel(annotationsSection, this.annotationCodes, (flatAnnotation) => {
            const {group, annotation} = this.insertIntoGroups(flatAnnotation);
            this.insertAnnotationAtCorrectPosition(group, annotation);
            this.setAnnotationVisibilityFromState();
            this.saveUserAnnotations();
        }, this.timeManager, (_old, updatedFlatAnnotation) => {
            if (this.editingEntry) {
                this.removeAnnotationEntry(this.editingEntry.group, this.editingEntry.annotation);
                this.editingEntry = null;
            }
            const {group, annotation} = this.insertIntoGroups(updatedFlatAnnotation);
            this.insertAnnotationAtCorrectPosition(group, annotation);
            this.setAnnotationVisibilityFromState();
            this.saveUserAnnotations();
        });
        addButton.addEventListener('click', () => this.addAnnotationPanel.open());

        const saved = localStorage.getItem('wozzeck-user-annotations');
        if (saved) {
            try {
                const savedUserAnnotations = JSON.parse(saved) as Array<Annotation>;
                for (const flatAnnotation of savedUserAnnotations) {
                    this.insertIntoGroups(flatAnnotation);
                }
            } catch {
                // ignore malformed stored data
            }
        }

        for (const group of this.annotationGroups) {
            for (const annotation of group.annotations) {
                this.insertAnnotationAtCorrectPosition(group, annotation);
            }
        }
        this.setAnnotationVisibilityFromState();

        this.updateTransferButtons();

        this.initResizeHandles();
    }

    // Finds the group with the same time range as flatAnnotation, creating one
    // if none exists yet, and adds the annotation content to it.
    private insertIntoGroups(flatAnnotation: Annotation): {group: AnnotationGroup, annotation: AnnotationContent} {
        const {act, is_general, page_range, measure_range, ...content} = flatAnnotation;
        const wantedRange: AnnotationGroup = {act, is_general, page_range, measure_range, annotations: []};
        let group = this.annotationGroups.find(g => sameTimeRange(g, wantedRange));
        if (!group) {
            group = {act, is_general, page_range, measure_range, annotations: []};
            this.annotationGroups.push(group);
        }
        group.annotations.push(content);
        return {group, annotation: content};
    }

    private removeAnnotationEntry(group: AnnotationGroup, annotation: AnnotationContent) {
        const li = this.annotationItemElements.get(annotation);
        if (li) {
            li.remove();
            this.annotationItemElements.delete(annotation);
        }
        const annotationIndex = group.annotations.indexOf(annotation);
        if (annotationIndex !== -1) {
            group.annotations.splice(annotationIndex, 1);
        }
        if (group.annotations.length === 0) {
            const groupIndex = this.annotationGroups.indexOf(group);
            if (groupIndex !== -1) {
                this.annotationGroups.splice(groupIndex, 1);
            }
            const entryIndex = this.groupEntries.findIndex(e => e.group === group);
            if (entryIndex !== -1) {
                this.groupEntries[entryIndex].div.remove();
                this.groupEntries.splice(entryIndex, 1);
            }
        }
    }

    private toFlatAnnotation(group: AnnotationGroup, annotation: AnnotationContent): Annotation {
        return {
            ...annotation,
            act: group.act,
            is_general: group.is_general,
            page_range: group.page_range,
            measure_range: group.measure_range,
        };
    }

    // Finds (or creates and correctly positions) the bubble for a group.
    private ensureGroupBubble(group: AnnotationGroup): {div: HTMLElement, listEl: HTMLElement} {
        const existing = this.groupEntries.find(e => e.group === group);
        if (existing) {
            return existing;
        }

        const div = this.buildGroupBubble(group);
        const listEl = div.querySelector('.annotation-list') as HTMLElement;
        const entry = {div, group, listEl};

        const insertIndex = this.groupEntries.findIndex(
            e => e.group.act > group.act ||
                (e.group.act === group.act && e.group.measure_range[0] > group.measure_range[0])
        );
        if (insertIndex === -1 && this.scrollerDiv !== undefined) {
            this.scrollerDiv.appendChild(div);
            this.groupEntries.push(entry);
        } else if (this.scrollerDiv !== undefined) {
            this.scrollerDiv.insertBefore(div, this.groupEntries[insertIndex].div);
            this.groupEntries.splice(insertIndex, 0, entry);
        }
        return entry;
    }

    insertAnnotationAtCorrectPosition(group: AnnotationGroup, annotation: AnnotationContent) {
        const {listEl} = this.ensureGroupBubble(group);
        const item = this.buildAnnotationItem(group, annotation);
        listEl.appendChild(item);
        this.annotationItemElements.set(annotation, item);
    }

    private buildGroupBubble(group: AnnotationGroup): HTMLElement {
        const groupDiv = document.createElement("div");
        groupDiv.classList.add("annotation-group");

        const timeStampDiv = document.createElement("div");
        timeStampDiv.classList.add("annotation-time-stamp");
        timeStampDiv.innerText = this.getStringForTimestamp(group);
        groupDiv.appendChild(timeStampDiv);

        const listEl = document.createElement("ul");
        listEl.classList.add("annotation-list");
        groupDiv.appendChild(listEl);

        groupDiv.onclick = () => {
            this.timeManager.goToTime(group.act, group.measure_range[0], "annotation-click");
        };

        return groupDiv;
    }

    private buildAnnotationItem(group: AnnotationGroup, annotation: AnnotationContent): HTMLElement {
        const item = document.createElement("li");
        item.classList.add("annotation-item");
        item.dataset.source = annotation.annotation_source;
        for (const code of annotation.code) {
            item.classList.add(code + "-annotation");
        }
        if (annotation.code.length === 0) {
            item.classList.add('unclassified-annotation');
        }

        item.appendChild(buildAnnotationBullet(annotation.code));

        const annotationTextDiv = document.createElement("div");
        annotationTextDiv.classList.add("annotation-text");
        annotationTextDiv.dataset.originalHtml = annotation.annotation[globals.language];
        annotationTextDiv.innerHTML = annotation.annotation[globals.language];
        annotationTextDiv.dataset.originalText = annotationTextDiv.textContent || '';
        item.appendChild(annotationTextDiv);

        if (annotation.annotation_source === 'User') {
            const editButton = document.createElement('button');
            editButton.classList.add('annotation-edit-button');
            editButton.textContent = '✎';
            editButton.onclick = (event) => {
                event.stopPropagation();
                this.editingEntry = {group, annotation};
                this.addAnnotationPanel.open(this.toFlatAnnotation(group, annotation));
            };
            item.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('annotation-delete-button');
            deleteButton.textContent = '✕';
            deleteButton.onclick = (event) => {
                event.stopPropagation();
                this.removeAnnotationEntry(group, annotation);
                this.saveUserAnnotations();
            };
            item.appendChild(deleteButton);
        }

        return item;
    }

    getStringForTimestamp(group : AnnotationGroup) {
        const act_scene = text["ACT"][globals.language] + ' ' +
            group.act + ', ' + text["SCENE"][globals.language] + ' ' +
            this.timeManager.getScene(group.act, group.measure_range[0]);

        if (group.is_general) {
            const pages = text["PAGE"][globals.language] + ' ' + (
            (group.page_range[0] === group.page_range[1])
                ? group.page_range[0] : [group.page_range[0]] + '–' + group.page_range[1]);
            return act_scene + ', ' + pages;
        }

        const mr = group.measure_range;
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

        for (const groupDiv of scroller.children) {
            let anyItemVisible = false;

            for (const item of groupDiv.querySelectorAll('.annotation-item')) {
                const textEl = item.querySelector('.annotation-text') as HTMLElement | null;
                const originalText = textEl?.dataset.originalText ?? '';
                const matchesSearch = searchLower === '' || originalText.toLowerCase().includes(searchLower);

                let matchesCategory: boolean;
                if (this.soloedAnnotationCategories.length === 0) {
                    matchesCategory = true;
                } else if (item.classList.contains('unclassified-annotation')) {
                    matchesCategory = false;
                } else {
                    matchesCategory = this.soloedAnnotationCategories.some(
                        code => item.classList.contains(code + '-annotation')
                    );
                }

                const source = (item as HTMLElement).dataset.source ?? '';
                const matchesSource = !source || this.enabledSources.has(source);

                if (matchesSearch && matchesCategory && matchesSource) {
                    item.classList.remove('annotation-hidden');
                    anyItemVisible = true;
                } else {
                    item.classList.add('annotation-hidden');
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

            groupDiv.classList.toggle('annotation-hidden', !anyItemVisible);
        }
    }

    getAllAnnotations(): Annotation[] {
        return flattenAnnotationGroups(this.annotationGroups);
    }

    private downloadUserAnnotations() {
        const userAnnotations = flattenAnnotationGroups(this.annotationGroups)
            .filter(a => a.annotation_source === 'User');
        const data = JSON.stringify(userAnnotations, null, 2);
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
                for (const flatAnnotation of imported) {
                    const {group, annotation} = this.insertIntoGroups({...flatAnnotation, annotation_source: 'User'});
                    this.insertAnnotationAtCorrectPosition(group, annotation);
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
        const hasUserAnnotations = this.annotationGroups.some(
            g => g.annotations.some(a => a.annotation_source === 'User')
        );
        this.downloadButton.disabled = !hasUserAnnotations;
        this.uploadButton.disabled = !hasUserAnnotations;
    }

    private saveUserAnnotations() {
        const userAnnotations = flattenAnnotationGroups(this.annotationGroups)
            .filter(a => a.annotation_source === 'User');
        localStorage.setItem('wozzeck-user-annotations', JSON.stringify(userAnnotations));
        this.updateTransferButtons();
        this.onAnnotationsChanged();
    }

    setOnAnnotationsChanged(callback: () => void) {
        this.onAnnotationsChanged = callback;
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
        let firstGroupSeen = false;
        for (const {div, group} of this.groupEntries) {
            if (group.act === scoreTime.act &&
                group.measure_range[0] <= scoreTime.bar &&
                group.measure_range[1] >= scoreTime.bar) {
                div.classList.add("current-annotation");
                if (!firstGroupSeen && updateSource !== "annotation-click") {
                    if (this.scrollerDiv !== undefined) {
                        const containerRect = this.scrollerDiv.getBoundingClientRect();
                        const divRect = div.getBoundingClientRect();
                        const targetScrollTop = this.scrollerDiv.scrollTop + (divRect.top - containerRect.top);
                        this.scrollerDiv.scrollTo({top: targetScrollTop, behavior: 'smooth'});
                    }
                    firstGroupSeen = true;
                }
            } else {
                div.classList.remove("current-annotation");
            }
        }
    }
}

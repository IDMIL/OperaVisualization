import {AnnotationCode} from "./data/annotations";
import type {Annotation} from "./AnnotationManager";
import {TimeManager} from "./TimeManager";
import {globals} from "./globals";

export class AddAnnotationPanel {
    private panel: HTMLElement;
    // Panel this form floats alongside (the annotations section) — used only
    // to anchor its position, never hidden or otherwise touched, so the
    // annotation list stays visible behind/beside the form instead of being
    // covered by it.
    private readonly anchor: HTMLElement;
    private heading!: HTMLElement;

    private readonly annotationCodes: { [code in AnnotationCode]: string };
    private readonly onAdd: (annotation: Annotation) => void;
    private readonly onEdit: (old: Annotation, updated: Annotation) => void;
    private readonly timeManager: TimeManager;
    private editingAnnotation: Annotation | null = null;
    private submitButton!: HTMLButtonElement;

    constructor(
        anchor: HTMLElement,
        annotationCodes: { [code in AnnotationCode]: string },
        onAdd: (annotation: Annotation) => void,
        timeManager: TimeManager,
        onEdit: (old: Annotation, updated: Annotation) => void,
    ) {
        this.anchor = anchor;
        this.annotationCodes = annotationCodes;
        this.onAdd = onAdd;
        this.timeManager = timeManager;
        this.onEdit = onEdit;

        this.panel = document.createElement('div');
        this.panel.id = 'add-annotation-panel';
        this.panel.hidden = true;

        this.heading = document.createElement('h2');
        this.heading.id = 'add-annotation-heading';
        this.panel.appendChild(this.heading);

        this.panel.appendChild(this.buildForm());

        document.body.appendChild(this.panel);

        // Re-anchor on viewport resize so the floating form doesn't drift
        // away from the panel it belongs to.
        window.addEventListener('resize', () => {
            if (!this.panel.hidden) this.position();
        });
    }

    // Floats the form next to its anchor panel (to the right if there's
    // room, otherwise to the left) rather than on top of it, so the
    // annotation list underneath stays visible instead of being covered.
    private position() {
        const anchorRect = this.anchor.getBoundingClientRect();
        const gap = 10;
        const panelWidth = Math.min(340, window.innerWidth - 2 * gap);

        let left = anchorRect.right + gap;
        if (left + panelWidth > window.innerWidth) {
            left = anchorRect.left - panelWidth - gap;
        }
        left = Math.min(Math.max(left, gap), window.innerWidth - panelWidth - gap);

        const minVisibleHeight = 200;
        const top = Math.min(Math.max(anchorRect.top, gap), window.innerHeight - minVisibleHeight - gap);

        this.panel.style.left = `${left}px`;
        this.panel.style.top = `${top}px`;
        this.panel.style.width = `${panelWidth}px`;
        this.panel.style.maxHeight = `${window.innerHeight - top - gap}px`;
    }

    private buildForm(): HTMLElement {
        const form = document.createElement('div');
        form.id = 'add-annotation-form';

        // Location row: Act, Scene, Bar
        const locationRow = document.createElement('div');
        locationRow.id = 'add-annotation-location-row';

        locationRow.appendChild(this.buildLabelledControl('Act', this.buildSelect('add-annotation-act', [
            {value: '1', label: 'I'},
            {value: '2', label: 'II'},
            {value: '3', label: 'III'},
        ])));

        locationRow.appendChild(this.buildLabelledControl('Scene', this.buildSelect('add-annotation-scene', [
            {value: '1', label: '1'},
            {value: '2', label: '2'},
            {value: '3', label: '3'},
            {value: '4', label: '4'},
            {value: '5', label: '5'},
        ])));

        const barInput = document.createElement('input');
        barInput.type = 'number';
        barInput.id = 'add-annotation-bar';
        barInput.min = '1';
        barInput.placeholder = '—';
        locationRow.appendChild(this.buildLabelledControl('Bar', barInput));

        form.appendChild(locationRow);

        // Category checkboxes
        const categoriesGroup = document.createElement('div');
        categoriesGroup.id = 'add-annotation-categories';

        const categoriesLabel = document.createElement('span');
        categoriesLabel.classList.add('add-annotation-field-label');
        categoriesLabel.textContent = 'Categories';
        categoriesGroup.appendChild(categoriesLabel);

        const checkboxRow = document.createElement('div');
        checkboxRow.id = 'add-annotation-checkbox-row';

        for (const key of Object.keys(this.annotationCodes) as AnnotationCode[]) {
            const label = document.createElement('label');
            label.classList.add('add-annotation-category-label');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'annotation-category';
            checkbox.value = key;
            checkbox.classList.add('add-annotation-category-checkbox');

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(this.annotationCodes[key]));
            checkboxRow.appendChild(label);
        }

        categoriesGroup.appendChild(checkboxRow);
        form.appendChild(categoriesGroup);

        // Annotation text
        const textGroup = document.createElement('div');
        textGroup.id = 'add-annotation-text-group';

        const textLabel = document.createElement('label');
        textLabel.classList.add('add-annotation-field-label');
        textLabel.htmlFor = 'add-annotation-text';
        textLabel.textContent = 'Annotation';
        textGroup.appendChild(textLabel);

        const textarea = document.createElement('textarea');
        textarea.id = 'add-annotation-text';
        textarea.rows = 6;
        textarea.placeholder = 'Enter annotation text…';
        textGroup.appendChild(textarea);

        form.appendChild(textGroup);

        // Buttons row
        const buttonsRow = document.createElement('div');
        buttonsRow.id = 'add-annotation-buttons-row';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.id = 'add-annotation-close-button';
        closeButton.addEventListener('click', () => this.close());
        buttonsRow.appendChild(closeButton);

        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.id = 'add-annotation-add-button';
        addButton.addEventListener('click', () => this.submitAnnotation());
        buttonsRow.appendChild(addButton);
        this.submitButton = addButton;

        form.appendChild(buttonsRow);

        return form;
    }

    private buildSelect(id: string, options: {value: string, label: string}[]): HTMLSelectElement {
        const select = document.createElement('select');
        select.id = id;
        for (const opt of options) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        }
        return select;
    }

    private buildLabelledControl(labelText: string, control: HTMLElement): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.classList.add('add-annotation-field');

        const label = document.createElement('label');
        label.classList.add('add-annotation-field-label');
        if (control.id) label.htmlFor = control.id;
        label.textContent = labelText;

        wrapper.appendChild(label);
        wrapper.appendChild(control);
        return wrapper;
    }

    private submitAnnotation() {
        const act = parseInt((this.panel.querySelector('#add-annotation-act') as HTMLSelectElement).value);
        const bar = parseInt((this.panel.querySelector('#add-annotation-bar') as HTMLInputElement).value);
        const text = (this.panel.querySelector('#add-annotation-text') as HTMLTextAreaElement).value;
        const checkboxes = Array.from(
            this.panel.querySelectorAll<HTMLInputElement>('.add-annotation-category-checkbox:checked')
        );
        const codes = checkboxes.map(cb => cb.value as AnnotationCode);

        const annotation: Annotation = {
            act,
            code: codes,
            annotation: {'fr': text, 'en': text, 'de': text, "pt": text},
            annotation_source: 'User',
            is_general: false,
            page_range: [0, 0],
            measure_range: [bar, bar],
        };

        if (this.editingAnnotation) {
            this.onEdit(this.editingAnnotation, annotation);
        } else {
            this.onAdd(annotation);
        }
        this.close();
    }

    open(annotationToEdit?: Annotation) {
        this.editingAnnotation = annotationToEdit ?? null;

        if (annotationToEdit) {
            (this.panel.querySelector('#add-annotation-act') as HTMLSelectElement).value =
                String(annotationToEdit.act);
            (this.panel.querySelector('#add-annotation-scene') as HTMLSelectElement).value =
                String(this.timeManager.getScene(annotationToEdit.act, annotationToEdit.measure_range[0]));
            (this.panel.querySelector('#add-annotation-bar') as HTMLInputElement).value =
                String(annotationToEdit.measure_range[0]);
            for (const checkbox of this.panel.querySelectorAll<HTMLInputElement>('.add-annotation-category-checkbox')) {
                checkbox.checked = annotationToEdit.code.includes(checkbox.value as AnnotationCode);
            }
            (this.panel.querySelector('#add-annotation-text') as HTMLTextAreaElement).value =
                annotationToEdit.annotation[globals.language];
            this.submitButton.textContent = 'Save';
            this.heading.textContent = 'Edit Annotation';
        } else {
            (this.panel.querySelector('#add-annotation-act') as HTMLSelectElement).value =
                String(this.timeManager.getCurrentAct());
            (this.panel.querySelector('#add-annotation-scene') as HTMLSelectElement).value =
                String(this.timeManager.getCurrentScene());
            (this.panel.querySelector('#add-annotation-bar') as HTMLInputElement).value =
                String(this.timeManager.getCurrentBarWithinAct());
            for (const checkbox of this.panel.querySelectorAll<HTMLInputElement>('.add-annotation-category-checkbox')) {
                checkbox.checked = false;
            }
            (this.panel.querySelector('#add-annotation-text') as HTMLTextAreaElement).value = '';
            this.submitButton.textContent = 'Add';
            this.heading.textContent = 'Add Annotation';
        }

        this.panel.hidden = false;
        this.position();
    }

    close() {
        this.panel.hidden = true;
    }
}

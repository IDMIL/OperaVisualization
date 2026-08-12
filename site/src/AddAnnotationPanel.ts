import {AnnotationCode} from "./data/annotations";
import type {Annotation} from "./AnnotationManager";
import {TimeManager} from "./TimeManager";
import {globals} from "./globals";
import {capitalizeFirstLetter, text} from "./data/text";
import {bar_to_page} from "./data/barToPage";
import {positionFloatingPanel} from "./floatingPanel";
import {DrawingPanel} from "./DrawingPanel";

const PANEL_WIDTH = 340;

export class AddAnnotationPanel {
    private panel: HTMLElement;
    // Panel this form floats alongside (the annotations section) — used only
    // to anchor its position, never hidden or otherwise touched, so the
    // annotation list stays visible behind/beside the form instead of being
    // covered by it.
    private readonly anchor: HTMLElement;
    private heading!: HTMLElement;
    private graphCheckbox!: HTMLInputElement;
    private readonly drawingPanel: DrawingPanel;
    // The in-progress graphical drawing for the annotation currently being
    // composed — kept here (rather than inside DrawingPanel) since it must
    // survive the drawing panel being closed and reopened, and needs to be
    // read back out when the form is submitted.
    private pendingDrawing: string | null = null;
    private pendingDrawingImage: string | null = null;

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
        this.panel.classList.add('floating-panel');
        this.panel.hidden = true;

        this.heading = document.createElement('h2');
        this.panel.appendChild(this.heading);

        this.panel.appendChild(this.buildForm());

        document.body.appendChild(this.panel);

        // Cascades off this panel rather than the annotations list, so it
        // follows the add/edit form around instead of the section behind it.
        this.drawingPanel = new DrawingPanel(this.panel, (dataUrl, image) => {
            this.pendingDrawing = dataUrl;
            this.pendingDrawingImage = dataUrl ? image : null;
        });

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
        positionFloatingPanel(this.panel, this.anchor, PANEL_WIDTH);
    }

    // Opens (or moves) the drawing tool onto whichever page image the
    // pending drawing already belongs to, or the page currently shown in
    // the main score viewer if there isn't one yet.
    private openDrawingPanel() {
        const scoreTime = this.timeManager.scoreTime;
        const currentImage = bar_to_page[scoreTime.act - 1][scoreTime.bar].image;
        const image = this.pendingDrawingImage ?? currentImage;
        this.drawingPanel.open(image, this.pendingDrawing ?? undefined);
    }

    private buildForm(): HTMLElement {
        const form = document.createElement('div');
        form.id = 'add-annotation-form';

        // Location row: Act, Scene, Bar
        const locationRow = document.createElement('div');
        locationRow.id = 'add-annotation-location-row';

        locationRow.appendChild(this.buildLabelledControl(capitalizeFirstLetter(text.ACT[globals.language]), this.buildSelect('add-annotation-act', [
            {value: '1', label: 'I'},
            {value: '2', label: 'II'},
            {value: '3', label: 'III'},
        ])));

        locationRow.appendChild(this.buildLabelledControl(capitalizeFirstLetter(text.SCENE[globals.language]), this.buildSelect('add-annotation-scene', [
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
        locationRow.appendChild(this.buildLabelledControl(capitalizeFirstLetter(text.BAR[globals.language]), barInput));

        form.appendChild(locationRow);

        // Category checkboxes
        const categoriesGroup = document.createElement('div');
        categoriesGroup.id = 'add-annotation-categories';

        const categoriesLabel = document.createElement('span');
        categoriesLabel.classList.add('add-annotation-field-label');
        categoriesLabel.textContent = text.CATEGORIES[globals.language];
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

            if (key === 'graph') {
                this.graphCheckbox = checkbox;
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.openDrawingPanel();
                    } else {
                        this.drawingPanel.close();
                    }
                });
            }

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
        textLabel.textContent = text.ANNOTATION[globals.language];
        textGroup.appendChild(textLabel);

        const textarea = document.createElement('textarea');
        textarea.id = 'add-annotation-text';
        textarea.rows = 6;
        textarea.placeholder = text.ANNOTATION_PLACEHOLDER[globals.language];
        textGroup.appendChild(textarea);

        form.appendChild(textGroup);

        // Buttons row
        const buttonsRow = document.createElement('div');
        buttonsRow.id = 'add-annotation-buttons-row';

        const closeButton = document.createElement('button');
        closeButton.textContent = capitalizeFirstLetter(text.CLOSE[globals.language]);
        closeButton.id = 'add-annotation-close-button';
        closeButton.addEventListener('click', () => this.close());
        buttonsRow.appendChild(closeButton);

        const addButton = document.createElement('button');
        addButton.textContent = text.ADD[globals.language];
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
        const annotationText = (this.panel.querySelector('#add-annotation-text') as HTMLTextAreaElement).value;
        const checkboxes = Array.from(
            this.panel.querySelectorAll<HTMLInputElement>('.add-annotation-category-checkbox:checked')
        );
        const codes = checkboxes.map(cb => cb.value as AnnotationCode);

        const annotation: Annotation = {
            act,
            code: codes,
            annotation: {'fr': annotationText, 'en': annotationText, 'de': annotationText, "pt": annotationText},
            annotation_source: 'User',
            is_general: false,
            page_range: [0, 0],
            measure_range: [bar, bar],
        };

        // Only attach the drawing if Graphique is still checked — the user
        // may have drawn something and then unchecked the category, in
        // which case the drawing shouldn't be saved onto this annotation.
        if (codes.includes('graph') && this.pendingDrawing && this.pendingDrawingImage) {
            annotation.drawing = this.pendingDrawing;
            annotation.drawingImage = this.pendingDrawingImage;
        }

        if (this.editingAnnotation) {
            this.onEdit(this.editingAnnotation, annotation);
        } else {
            this.onAdd(annotation);
        }
        this.close();
    }

    open(annotationToEdit?: Annotation) {
        this.editingAnnotation = annotationToEdit ?? null;
        this.pendingDrawing = annotationToEdit?.drawing ?? null;
        this.pendingDrawingImage = annotationToEdit?.drawingImage ?? null;

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
            this.submitButton.textContent = text.SAVE[globals.language];
            this.heading.textContent = text.EDIT_ANNOTATION[globals.language];
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
            this.submitButton.textContent = text.ADD[globals.language];
            this.heading.textContent = text.ADD_ANNOTATION[globals.language];
        }

        this.panel.hidden = false;
        this.position();

        // Reflects the (possibly just-populated) Graphique checkbox state —
        // covers both editing an existing graphical annotation and simply
        // reopening the form with it left checked from before.
        if (this.graphCheckbox.checked) {
            this.openDrawingPanel();
        } else {
            this.drawingPanel.close();
        }
    }

    close() {
        this.panel.hidden = true;
        this.drawingPanel.close();
    }
}

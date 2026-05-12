import {Annotation, AnnotationCode} from "./data/annotations";

export class AddAnnotationPanel {
    private panel: HTMLElement;
    private scroller: HTMLElement;

    private readonly annotationCodes: { [code in AnnotationCode]: string };
    private readonly onAdd: (annotation: Annotation) => void;

    constructor(
        scroller: HTMLElement,
        annotationCodes: { [code in AnnotationCode]: string },
        onAdd: (annotation: Annotation) => void,
    ) {
        this.scroller = scroller;
        this.annotationCodes = annotationCodes;
        this.onAdd = onAdd;

        this.panel = document.createElement('div');
        this.panel.id = 'add-annotation-panel';
        this.panel.classList.add('scroller-area');
        this.panel.hidden = true;

        this.panel.appendChild(this.buildForm());

        scroller.parentElement!.appendChild(this.panel);
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
            annotation: text,
            is_general: false,
            page_range: [0, 0],
            measure_range: [bar, bar],
        };

        console.log(annotation);
        this.onAdd(annotation);
    }

    open() {
        this.scroller.hidden = true;
        this.panel.hidden = false;
    }

    close() {
        this.panel.hidden = true;
        this.scroller.hidden = false;
    }
}

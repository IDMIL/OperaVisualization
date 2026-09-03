import {positionFloatingPanel} from "./floatingPanel";
import {capitalizeFirstLetter, text} from "./data/text";
import {globals} from "./globals";

const PANEL_WIDTH = 400;
// Internal canvas resolution is capped well below the score pages' full
// resolution (~1966x2790, see SCORE_ASPECT_RATIO in main.ts) — the overlay
// is always displayed scaled to fit whatever panel shows it (see
// ScoreDrawingOverlay), so full source resolution buys no visible sharpness
// but multiplies the size of the saved data URL (and, in turn, of
// localStorage and any exported JSON).
const CANVAS_MAX_DIM = 1400;
const DISPLAY_WIDTH = 380;

type Tool = 'pen' | 'eraser';

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

// Floating panel opened from AddAnnotationPanel when the Graphique category
// is checked — shows the score page the annotation is attached to and lets
// the user draw a transparent-background overlay on top of it with a basic
// pen/eraser/color toolset. The result is reported back via the onChange
// callback as a data URL each time a stroke finishes, rather than pulled on
// demand, since the panel can be closed (and its own state discarded) at
// any point while the add/edit form stays open.
export class DrawingPanel {
    private readonly anchor: HTMLElement;
    private readonly onChange: (dataUrl: string | null, image: string) => void;

    private panel: HTMLElement;
    private bgImage: HTMLImageElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private colorInput!: HTMLInputElement;
    private penButton!: HTMLButtonElement;
    private eraserButton!: HTMLButtonElement;
    private undoButton!: HTMLButtonElement;
    private redoButton!: HTMLButtonElement;
    private sizeInput!: HTMLInputElement;

    private tool: Tool = 'pen';
    private currentImage: string = '';
    private isDrawing = false;
    private lastPoint: {x: number, y: number} | null = null;
    // Tracked directly rather than scanning canvas pixels on every change —
    // an annotation with an untouched (or just-cleared) canvas should save
    // no drawing at all rather than a fully-transparent one.
    private hasStrokes = false;

    // Undo/redo history, reset on each open() since it's keyed to a
    // specific canvas size. historyIndex points at the entry currently
    // shown on the canvas; entries after it are the redo stack.
    private history: {data: ImageData, hasStrokes: boolean}[] = [];
    private historyIndex = -1;

    constructor(anchor: HTMLElement, onChange: (dataUrl: string | null, image: string) => void) {
        this.anchor = anchor;
        this.onChange = onChange;

        this.panel = document.createElement('div');
        this.panel.id = 'drawing-panel';
        this.panel.classList.add('floating-panel');
        this.panel.hidden = true;

        const heading = document.createElement('h2');
        heading.textContent = text.DRAW_ON_SCORE[globals.language];
        this.panel.appendChild(heading);

        this.panel.appendChild(this.buildToolbar());

        const canvasWrap = document.createElement('div');
        canvasWrap.id = 'drawing-canvas-wrap';

        this.bgImage = document.createElement('img');
        this.bgImage.id = 'drawing-bg-image';
        this.bgImage.alt = '';
        canvasWrap.appendChild(this.bgImage);

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'drawing-canvas';
        canvasWrap.appendChild(this.canvas);

        this.panel.appendChild(canvasWrap);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('2D canvas context unavailable');
        this.ctx = ctx;

        this.attachPointerHandlers();
        this.attachKeyboardShortcuts();
        this.panel.appendChild(this.buildButtonsRow());

        document.body.appendChild(this.panel);

        window.addEventListener('resize', () => {
            if (!this.panel.hidden) this.position();
        });
    }

    private buildToolbar(): HTMLElement {
        const toolbar = document.createElement('div');
        toolbar.id = 'drawing-toolbar';

        this.colorInput = document.createElement('input');
        this.colorInput.type = 'color';
        this.colorInput.id = 'drawing-color';
        this.colorInput.value = '#e0393e';
        toolbar.appendChild(this.colorInput);

        this.penButton = document.createElement('button');
        this.penButton.type = 'button';
        this.penButton.textContent = text.PEN[globals.language];
        this.penButton.classList.add('drawing-tool-button');
        this.penButton.addEventListener('click', () => this.setTool('pen'));
        toolbar.appendChild(this.penButton);

        this.eraserButton = document.createElement('button');
        this.eraserButton.type = 'button';
        this.eraserButton.textContent = text.ERASER[globals.language];
        this.eraserButton.classList.add('drawing-tool-button');
        this.eraserButton.addEventListener('click', () => this.setTool('eraser'));
        toolbar.appendChild(this.eraserButton);

        this.undoButton = document.createElement('button');
        this.undoButton.type = 'button';
        this.undoButton.textContent = text.UNDO[globals.language];
        this.undoButton.title = `${text.UNDO[globals.language]} (Ctrl+Z)`;
        this.undoButton.classList.add('drawing-tool-button');
        this.undoButton.addEventListener('click', () => this.undo());
        toolbar.appendChild(this.undoButton);

        this.redoButton = document.createElement('button');
        this.redoButton.type = 'button';
        this.redoButton.textContent = text.REDO[globals.language];
        this.redoButton.title = `${text.REDO[globals.language]} (Ctrl+Shift+Z)`;
        this.redoButton.classList.add('drawing-tool-button');
        this.redoButton.addEventListener('click', () => this.redo());
        toolbar.appendChild(this.redoButton);

        const sizeLabel = document.createElement('label');
        sizeLabel.id = 'drawing-size-label';
        sizeLabel.textContent = text.SIZE[globals.language];
        this.sizeInput = document.createElement('input');
        this.sizeInput.type = 'range';
        this.sizeInput.min = '2';
        this.sizeInput.max = '40';
        this.sizeInput.value = '10';
        sizeLabel.appendChild(this.sizeInput);
        toolbar.appendChild(sizeLabel);

        this.updateToolButtons();
        this.updateHistoryButtons();
        return toolbar;
    }

    private buildButtonsRow(): HTMLElement {
        const buttonsRow = document.createElement('div');
        buttonsRow.id = 'drawing-buttons-row';

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.textContent = text.CLEAR[globals.language];
        clearButton.id = 'drawing-clear-button';
        clearButton.addEventListener('click', () => this.clear());
        buttonsRow.appendChild(clearButton);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = capitalizeFirstLetter(text.CLOSE[globals.language]);
        closeButton.id = 'drawing-close-button';
        closeButton.addEventListener('click', () => this.close());
        buttonsRow.appendChild(closeButton);

        return buttonsRow;
    }

    private setTool(tool: Tool) {
        this.tool = tool;
        this.updateToolButtons();
    }

    private updateToolButtons() {
        this.penButton.classList.toggle('active', this.tool === 'pen');
        this.eraserButton.classList.toggle('active', this.tool === 'eraser');
    }

    private updateHistoryButtons() {
        this.undoButton.disabled = this.historyIndex <= 0;
        this.redoButton.disabled = this.historyIndex >= this.history.length - 1;
    }

    // Snapshots the current canvas as a new history entry, discarding any
    // redo entries past the current point. Called once a stroke finishes
    // (not on every pointermove) and after clear().
    private pushHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({
            data: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
            hasStrokes: this.hasStrokes,
        });
        this.historyIndex = this.history.length - 1;
        this.updateHistoryButtons();
    }

    private restoreHistory() {
        const entry = this.history[this.historyIndex];
        this.ctx.putImageData(entry.data, 0, 0);
        this.hasStrokes = entry.hasStrokes;
        this.onChange(this.hasStrokes ? this.canvas.toDataURL('image/png') : null, this.currentImage);
        this.updateHistoryButtons();
    }

    private undo() {
        if (this.historyIndex <= 0) return;
        this.historyIndex--;
        this.restoreHistory();
    }

    private redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        this.historyIndex++;
        this.restoreHistory();
    }

    private attachKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (this.panel.hidden) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            // Don't hijack undo/redo while the user is typing in a text
            // field elsewhere on the page (e.g. the annotation form behind
            // this panel).
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

            const key = e.key.toLowerCase();
            if (key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            } else if (key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    private position() {
        positionFloatingPanel(this.panel, this.anchor, PANEL_WIDTH);
    }

    private attachPointerHandlers() {
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.canvas.setPointerCapture(e.pointerId);
            this.isDrawing = true;
            this.lastPoint = null;
            // Draws a dot on a plain click/tap, not just while dragging.
            this.strokeTo(this.toCanvasPoint(e));
        });
        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDrawing) return;
            this.strokeTo(this.toCanvasPoint(e));
        });
        const end = (_e: PointerEvent) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.lastPoint = null;
            this.emitChange();
            this.pushHistory();
        };
        this.canvas.addEventListener('pointerup', end);
        this.canvas.addEventListener('pointercancel', end);
        this.canvas.addEventListener('pointerleave', end);
    }

    private toCanvasPoint(e: PointerEvent): {x: number, y: number} {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    private strokeTo(point: {x: number, y: number}) {
        // The size slider is calibrated in on-screen pixels (so it feels
        // consistent regardless of the page's native resolution) — convert
        // to canvas-space using the same ratio as the point coordinates.
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = Number(this.sizeInput.value) * scale;

        if (this.tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.colorInput.value;
        }

        const from = this.lastPoint ?? point;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();

        this.lastPoint = point;
        this.hasStrokes = true;
    }

    private emitChange() {
        this.onChange(this.hasStrokes ? this.canvas.toDataURL('image/png') : null, this.currentImage);
    }

    private clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasStrokes = false;
        this.onChange(null, this.currentImage);
        this.pushHistory();
    }

    // Loads `image` (a score page path) as the drawing surface's background
    // reference, sized down to CANVAS_MAX_DIM, and optionally replays an
    // existing drawing data URL onto the canvas for editing. Both loads are
    // typically instant since ScoreManager already preloads nearby pages.
    async open(image: string, existingDrawing?: string) {
        this.currentImage = image;
        this.tool = 'pen';
        this.updateToolButtons();

        const pageImg = await loadImage(image);
        const scale = Math.min(1, CANVAS_MAX_DIM / Math.max(pageImg.naturalWidth, pageImg.naturalHeight));
        const canvasWidth = Math.round(pageImg.naturalWidth * scale);
        const canvasHeight = Math.round(pageImg.naturalHeight * scale);

        const displayWidth = Math.min(DISPLAY_WIDTH, canvasWidth);
        const displayHeight = displayWidth / (canvasWidth / canvasHeight);

        this.bgImage.src = image;
        this.bgImage.style.width = `${displayWidth}px`;
        this.bgImage.style.height = `${displayHeight}px`;

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        this.hasStrokes = false;

        if (existingDrawing) {
            const drawingImg = await loadImage(existingDrawing);
            this.ctx.drawImage(drawingImg, 0, 0, canvasWidth, canvasHeight);
            this.hasStrokes = true;
        }

        this.history = [];
        this.historyIndex = -1;
        this.pushHistory();

        this.panel.hidden = false;
        this.position();
    }

    close() {
        this.panel.hidden = true;
        this.isDrawing = false;
        this.lastPoint = null;
    }
}

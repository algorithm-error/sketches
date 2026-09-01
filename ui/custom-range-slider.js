const THUMB = 1.125;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; }
        .track {
            position: relative;
            height: ${THUMB}rem;
            display: flex;
            align-items: center;
        }
        .rail, .fill {
            position: absolute;
            height: 0.5rem;
            border-radius: 0.125rem;
        }
        .rail {
            left: 0;
            right: 0;
            background: #dcdcdc;
        }
        /* Thumb centres travel between THUMB/2 and width - THUMB/2, so the fill
           is placed in those coordinates instead of a plain 0–100% ratio. */
        .fill {
            background: var(--fill, var(--primary));
            left: calc(${THUMB / 2}rem + (100% - ${THUMB}rem) * var(--from-ratio, 0));
            right: calc(100% - ${THUMB / 2}rem - (100% - ${THUMB}rem) * var(--to-ratio, 1));
            /* The inputs above pass their pointer events through, so the fill can
               take them and drag the whole range without disturbing the thumbs. */
            cursor: grab;
            touch-action: none;
        }
        .fill.dragging {
            cursor: grabbing;
        }
        :host([disabled]) .fill {
            cursor: not-allowed;
            pointer-events: none;
        }
        /* Both inputs span the full width and stack on top of each other; only
           the thumbs take pointer events, so each handle stays grabbable. */
        input[type="range"] {
            position: absolute;
            left: 0;
            width: 100%;
            height: ${THUMB}rem;
            margin: 0;
            appearance: none;
            background: none;
            pointer-events: none;
            outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: ${THUMB}rem;
            height: ${THUMB}rem;
            border-radius: 50%;
            background: var(--fill, var(--primary));
            pointer-events: auto;
            cursor: pointer;
        }
        :host([disabled]) .fill {
            opacity: 0.4;
        }
        :host([disabled]) input[type="range"]::-webkit-slider-thumb {
            opacity: 0.4;
            cursor: not-allowed;
        }
        input[type="range"]:focus-visible {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 0.1875rem;
        }
    </style>
    <div class="track">
        <div class="rail"></div>
        <div class="fill"></div>
        <input type="range" class="from" />
        <input type="range" class="to" />
    </div>
`;

const DEFAULT_DEBOUNCE = 100;

// Two-handle range: a low ("from") and a high ("to") value on one track. The
// handles can meet but never cross — each one clamps against the other.
export class CustomRangeSlider extends HTMLElement {
    static get observedAttributes() {
        return ['min', 'max', 'step', 'from', 'to', 'disabled', 'debounce'];
    }

    fromInput;
    toInput;
    track;
    fill;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.fromInput = shadow.querySelector('.from');
        this.toInput = shadow.querySelector('.to');
        this.track = shadow.querySelector('.track');
        this.fill = shadow.querySelector('.fill');
        this.fill.addEventListener('pointerdown', (event) => this.startFillDrag(event));

        [this.fromInput, this.toInput].forEach((input) => {
            input.addEventListener('input', (event) => {
                event.stopPropagation();
                this.clamp(input);
                this.updateFill();
                this.emitDebounced('input');
            });
            input.addEventListener('change', (event) => {
                event.stopPropagation();
                this.clamp(input);
                this.updateFill();
                this.emit('change');
            });
        });
    }

    connectedCallback() {
        this.sync();
    }

    disconnectedCallback() {
        clearTimeout(this.debounceTimer);
    }

    attributeChangedCallback() {
        this.sync();
    }

    get from() {
        return Number(this.fromInput.value);
    }

    set from(v) {
        this.setAttribute('from', v);
    }

    get to() {
        return Number(this.toInput.value);
    }

    set to(v) {
        this.setAttribute('to', v);
    }

    get value() {
        return { from: this.from, to: this.to };
    }

    sync() {
        [this.fromInput, this.toInput].forEach((input) => {
            input.min = this.getAttribute('min') ?? 0;
            input.max = this.getAttribute('max') ?? 100;
            input.step = this.getAttribute('step') ?? 1;
            input.disabled = this.hasAttribute('disabled');
        });
        if (this.hasAttribute('from')) this.fromInput.value = this.getAttribute('from');
        if (this.hasAttribute('to')) this.toInput.value = this.getAttribute('to');
        this.clamp();
        this.updateFill();
    }

    // The handle being dragged is the one that crossed, so pull it back to meet
    // the other instead of pushing the other along.
    clamp(source = this.fromInput) {
        if (this.from <= this.to) return;
        if (source === this.toInput) this.toInput.value = this.fromInput.value;
        else this.fromInput.value = this.toInput.value;
    }

    // Dragging the fill slides the whole range, keeping its length: both handles
    // move together until one of them reaches an end.
    startFillDrag(event) {
        if (this.hasAttribute('disabled')) {
            return;
        }
        event.preventDefault();
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const travel = this.track.getBoundingClientRect().width - THUMB * rootSize;
        if (travel <= 0) {
            return;
        }
        const min = Number(this.fromInput.min);
        const max = Number(this.fromInput.max);
        const step = Number(this.fromInput.step) || 1;
        const perPixel = (max - min) / travel;
        const startX = event.clientX;
        const startFrom = this.from;
        const span = this.to - this.from;

        this.fill.setPointerCapture(event.pointerId);
        this.fill.classList.add('dragging');

        const onMove = (moveEvent) => {
            const shifted = startFrom + (moveEvent.clientX - startX) * perPixel;
            const snapped = min + Math.round((shifted - min) / step) * step;
            const from = Math.min(Math.max(snapped, min), max - span);
            this.fromInput.value = from;
            this.toInput.value = from + span;
            this.updateFill();
            this.emitDebounced('input');
        };
        const onUp = (upEvent) => {
            this.fill.releasePointerCapture(upEvent.pointerId);
            this.fill.classList.remove('dragging');
            this.fill.removeEventListener('pointermove', onMove);
            this.fill.removeEventListener('pointerup', onUp);
            this.emit('change');
        };
        this.fill.addEventListener('pointermove', onMove);
        this.fill.addEventListener('pointerup', onUp);
    }

    ratio(value) {
        const min = Number(this.fromInput.min);
        const max = Number(this.fromInput.max);
        return max > min ? (value - min) / (max - min) : 0;
    }

    updateFill() {
        const fromRatio = this.ratio(this.from);
        this.fill.style.setProperty('--from-ratio', fromRatio);
        this.fill.style.setProperty('--to-ratio', this.ratio(this.to));
        // When both handles sit on the same spot, keep the one that can still
        // travel inwards on top so the range never gets stuck.
        this.fromInput.style.zIndex = fromRatio > 0.5 ? 2 : 1;
        this.toInput.style.zIndex = fromRatio > 0.5 ? 1 : 2;
    }

    emitDebounced(kind) {
        const wait = this.hasAttribute('debounce') ? Number(this.getAttribute('debounce')) : DEFAULT_DEBOUNCE;
        clearTimeout(this.debounceTimer);
        if (!wait) {
            this.emit(kind);
            return;
        }
        this.debounceTimer = setTimeout(() => this.emit(kind), wait);
    }

    emit(kind) {
        this.dispatchEvent(
            new CustomEvent(kind, {
                detail: { from: this.from, to: this.to },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('custom-range-slider', CustomRangeSlider);

const CENTER = 50;
const RADIUS = 38;
const DEFAULT_DEBOUNCE = 100;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: inline-block;
            width: 4em;
            aspect-ratio: 1;
        }
        :host([disabled]) svg { opacity: 0.4; pointer-events: none; }
        svg {
            display: block;
            width: 100%;
            height: 100%;
            touch-action: none;
        }
        .track {
            fill: none;
            stroke: #dcdcdc;
            stroke-width: 6;
        }
        .hand {
            stroke: var(--fill, var(--primary));
            stroke-width: 2;
        }
        .hub {
            fill: var(--fill, var(--primary));
        }
        .knob {
            fill: var(--fill, var(--primary));
            cursor: grab;
        }
        .knob:focus-visible {
            outline: 2px solid var(--highlight);
            outline-offset: 1px;
        }
    </style>
    <svg viewBox="0 0 100 100">
        <circle class="track" cx="${CENTER}" cy="${CENTER}" r="${RADIUS}"/>
        <line class="hand" x1="${CENTER}" y1="${CENTER}" x2="${CENTER}" y2="${CENTER - RADIUS}"/>
        <circle class="hub" cx="${CENTER}" cy="${CENTER}" r="2.5"/>
        <circle class="knob" tabindex="0" role="slider" cx="${CENTER}" cy="${CENTER - RADIUS}" r="7"/>
    </svg>
`;

export class AngleSlider extends HTMLElement {
    static get observedAttributes() {
        return ['min', 'max', 'step', 'value', 'disabled', 'debounce'];
    }

    svg;
    knob;
    hand;
    dragging = false;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.svg = shadow.querySelector('svg');
        this.knob = shadow.querySelector('.knob');
        this.hand = shadow.querySelector('.hand');

        this.knob.addEventListener('pointerdown', (event) => this.startDrag(event));
        this.svg.querySelector('.track').addEventListener('pointerdown', (event) => this.startDrag(event));
        this.knob.addEventListener('keydown', (event) => this.onKeydown(event));
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

    get min() {
        return this.hasAttribute('min') ? Number(this.getAttribute('min')) : 0;
    }

    get max() {
        return this.hasAttribute('max') ? Number(this.getAttribute('max')) : 360;
    }

    get step() {
        return this.hasAttribute('step') ? Number(this.getAttribute('step')) : 1;
    }

    get wraps() {
        return this.max - this.min >= 360;
    }

    get value() {
        return Number(this.getAttribute('value') ?? 0);
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    startDrag(event) {
        if (this.hasAttribute('disabled')) return;
        event.preventDefault();
        this.dragging = true;
        this.knob.setPointerCapture(event.pointerId);
        this.knob.focus();
        this.updateFromPointer(event);

        const onMove = (e) => {
            if (this.dragging) this.updateFromPointer(e);
        };
        const onUp = (e) => {
            if (!this.dragging) return;
            this.dragging = false;
            this.updateFromPointer(e);
            this.emit('change');
            this.knob.removeEventListener('pointermove', onMove);
            this.knob.removeEventListener('pointerup', onUp);
        };
        this.knob.addEventListener('pointermove', onMove);
        this.knob.addEventListener('pointerup', onUp);
    }

    updateFromPointer(event) {
        const rect = this.svg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const angle = ((rawDeg % 360) + 360) % 360;
        this.value = this.snapAngle(angle);
        this.emitDebounced('input');
    }

    onKeydown(event) {
        if (this.hasAttribute('disabled')) return;
        const step = this.step || 1;
        if (event.key === 'Home') {
            this.value = this.snapAngle(this.min);
        } else if (event.key === 'End') {
            this.value = this.snapAngle(this.max);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            this.value = this.snapAngle(this.value + step);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            this.value = this.snapAngle(this.value - step);
        } else {
            return;
        }
        event.preventDefault();
        this.emit('input');
        this.emit('change');
    }

    snapAngle(angle) {
        const step = this.step || 1;
        if (this.wraps) {
            return Math.round((((angle % 360) + 360) % 360) / step) * step;
        }
        let a = ((angle % 360) + 360) % 360;
        if (a < this.min || a > this.max) {
            const distToMin = Math.min(Math.abs(a - this.min), 360 - Math.abs(a - this.min));
            const distToMax = Math.min(Math.abs(a - this.max), 360 - Math.abs(a - this.max));
            a = distToMin <= distToMax ? this.min : this.max;
        }
        return Math.min(this.max, Math.max(this.min, Math.round(a / step) * step));
    }

    sync() {
        const rad = (this.value * Math.PI) / 180;
        const x = CENTER + RADIUS * Math.cos(rad);
        const y = CENTER + RADIUS * Math.sin(rad);
        this.knob.setAttribute('cx', x);
        this.knob.setAttribute('cy', y);
        this.hand.setAttribute('x2', x);
        this.hand.setAttribute('y2', y);
        this.knob.setAttribute('aria-valuenow', this.value);
        this.knob.setAttribute('aria-valuemin', this.min);
        this.knob.setAttribute('aria-valuemax', this.max);
        this.knob.setAttribute('aria-disabled', this.hasAttribute('disabled'));
        this.knob.tabIndex = this.hasAttribute('disabled') ? -1 : 0;
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
        const valueEvent = new CustomEvent(kind, {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
        });
        // `value` sits on the event itself too, so handlers can read `event.value`.
        valueEvent.value = this.value;
        this.dispatchEvent(valueEvent);
    }
}

customElements.define('angle-slider', AngleSlider);

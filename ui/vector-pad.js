// The viewBox is SPAN wide and SPAN / ratio tall, so the drawing scales
// uniformly however the box is stretched — knobs stay round, strokes even.
const SPAN = 100;
const DEFAULT_DEBOUNCE = 100;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: inline-block;
            width: 8em;
            /* Width over height, so a pad standing in for a 16:9 canvas reads
               --ratio: 1.778. Values stay min..max on both axes either way. */
            aspect-ratio: var(--ratio, 1);
        }
        :host([disabled]) svg { opacity: 0.4; pointer-events: none; }
        svg {
            display: block;
            width: 100%;
            height: 100%;
            overflow: visible;
            touch-action: none;
        }
        .track {
            fill: none;
            stroke: #dcdcdc;
            stroke-width: 2;
            /* An unfilled shape only hit-tests on its stroke, so without this a
               click inside the pad would fall through instead of moving the knob. */
            pointer-events: all;
        }
        :host([mode="polar"]) .track-rect { display: none; }
        :host(:not([mode="polar"])) .track-circle { display: none; }
        .axis {
            stroke: #dcdcdc;
            stroke-width: 1;
        }
        .hand {
            stroke: var(--fill, var(--primary));
            stroke-width: 2;
        }
        /* A plain position has nothing to point away from, so point mode drops
           the line back to the middle and the hub it grows from. */
        :host([point]) .hand,
        :host([point]) .hub { display: none; }
        .hub {
            fill: var(--fill, var(--primary));
        }
        .knob {
            fill: var(--fill, var(--primary));
            cursor: grab;
        }
        .knob:focus {
            outline: none;
        }
        .knob:focus-visible {
            outline: 2px solid var(--highlight);
            outline-offset: 1px;
        }
    </style>
    <svg viewBox="0 0 ${SPAN} ${SPAN}">
        <rect class="track track-rect" x="0" y="0"/>
        <circle class="track track-circle"/>
        <line class="axis axis-h"/>
        <line class="axis axis-v"/>
        <line class="hand"/>
        <circle class="hub" r="2"/>
        <circle class="knob" tabindex="0" role="slider" r="6"/>
    </svg>
`;

// x and y increase left-to-right / top-to-bottom, matching p5's canvas and
// angle-slider's convention (0° east, increasing clockwise), so length/angle
// derived here line up with angle-slider's values.
export class VectorPad extends HTMLElement {
    static get observedAttributes() {
        return ['min', 'max', 'step', 'x', 'y', 'mode', 'point', 'disabled', 'debounce'];
    }

    svg;
    knob;
    hand;
    hub;
    trackRect;
    trackCircle;
    axisH;
    axisV;
    dragging = false;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.svg = shadow.querySelector('svg');
        this.knob = shadow.querySelector('.knob');
        this.hand = shadow.querySelector('.hand');
        this.hub = shadow.querySelector('.hub');
        this.trackRect = shadow.querySelector('.track-rect');
        this.trackCircle = shadow.querySelector('.track-circle');
        this.axisH = shadow.querySelector('.axis-h');
        this.axisV = shadow.querySelector('.axis-v');

        this.knob.addEventListener('pointerdown', (event) => this.startDrag(event));
        shadow
            .querySelectorAll('.track')
            .forEach((track) => track.addEventListener('pointerdown', (event) => this.startDrag(event)));
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
        return this.hasAttribute('min') ? Number(this.getAttribute('min')) : -1;
    }

    get max() {
        return this.hasAttribute('max') ? Number(this.getAttribute('max')) : 1;
    }

    get step() {
        return this.hasAttribute('step') ? Number(this.getAttribute('step')) : 0;
    }

    // Width over height of the box, read from the --ratio custom property
    // (layout, so a CSS var rather than an attribute).
    get ratio() {
        const raw = getComputedStyle(this).getPropertyValue('--ratio').trim();
        const value = Number(raw);
        return raw === '' || !Number.isFinite(value) || value <= 0 ? 1 : value;
    }

    get x() {
        return Number(this.getAttribute('x') ?? 0);
    }

    set x(v) {
        this.setAttribute('x', v);
    }

    get y() {
        return Number(this.getAttribute('y') ?? 0);
    }

    set y(v) {
        this.setAttribute('y', v);
    }

    get length() {
        return Math.hypot(this.x, this.y);
    }

    get angle() {
        const deg = (Math.atan2(this.y, this.x) * 180) / Math.PI;
        return ((deg % 360) + 360) % 360;
    }

    startDrag(event) {
        if (this.hasAttribute('disabled')) return;
        event.preventDefault();
        this.dragging = true;
        // Capture keeps a drag that leaves the pad alive; not every pointer can
        // be captured, and failing to is no reason to drop the drag.
        try {
            this.knob.setPointerCapture(event.pointerId);
        } catch (error) {
            // ignored on purpose
        }
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
        const fx = (event.clientX - rect.left) / rect.width;
        const fy = (event.clientY - rect.top) / rect.height;
        this.x = this.snap(this.min + this.clampFraction(fx) * (this.max - this.min));
        this.y = this.snap(this.min + this.clampFraction(fy) * (this.max - this.min));
        this.emitDebounced('input');
    }

    onKeydown(event) {
        if (this.hasAttribute('disabled')) return;
        const step = this.step || (this.max - this.min) * 0.05;
        if (event.key === 'ArrowRight') {
            this.x = this.clampValue(this.snap(this.x + step));
        } else if (event.key === 'ArrowLeft') {
            this.x = this.clampValue(this.snap(this.x - step));
        } else if (event.key === 'ArrowDown') {
            this.y = this.clampValue(this.snap(this.y + step));
        } else if (event.key === 'ArrowUp') {
            this.y = this.clampValue(this.snap(this.y - step));
        } else {
            return;
        }
        event.preventDefault();
        this.emit('input');
        this.emit('change');
    }

    clampFraction(t) {
        return Math.min(1, Math.max(0, t));
    }

    clampValue(value) {
        return Math.min(this.max, Math.max(this.min, value));
    }

    snap(value) {
        const step = this.step;
        if (!step) return value;
        return Math.round((value - this.min) / step) * step + this.min;
    }

    // Lays out the track, axes and hub for the current --ratio. Called from
    // sync() rather than once at startup, so a --ratio set after upgrade (or
    // changed later) is picked up on the next value change or attribute set.
    syncGeometry(height) {
        this.svg.setAttribute('viewBox', `0 0 ${SPAN} ${height}`);
        this.trackRect.setAttribute('width', SPAN);
        this.trackRect.setAttribute('height', height);
        this.trackCircle.setAttribute('cx', SPAN / 2);
        this.trackCircle.setAttribute('cy', height / 2);
        this.trackCircle.setAttribute('r', Math.min(SPAN, height) / 2);
        this.axisH.setAttribute('x1', 0);
        this.axisH.setAttribute('x2', SPAN);
        this.axisH.setAttribute('y1', height / 2);
        this.axisH.setAttribute('y2', height / 2);
        this.axisV.setAttribute('x1', SPAN / 2);
        this.axisV.setAttribute('x2', SPAN / 2);
        this.axisV.setAttribute('y1', 0);
        this.axisV.setAttribute('y2', height);
        this.hub.setAttribute('cx', SPAN / 2);
        this.hub.setAttribute('cy', height / 2);
        this.hand.setAttribute('x1', SPAN / 2);
        this.hand.setAttribute('y1', height / 2);
    }

    sync() {
        const height = SPAN / this.ratio;
        this.syncGeometry(height);
        const tx = this.max - this.min === 0 ? 0 : (this.x - this.min) / (this.max - this.min);
        const ty = this.max - this.min === 0 ? 0 : (this.y - this.min) / (this.max - this.min);
        const px = tx * SPAN;
        const py = ty * height;
        this.knob.setAttribute('cx', px);
        this.knob.setAttribute('cy', py);
        this.hand.setAttribute('x2', px);
        this.hand.setAttribute('y2', py);
        this.knob.setAttribute('aria-valuetext', `${this.x}, ${this.y}`);
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
        this.dispatchEvent(
            new CustomEvent(kind, {
                detail: { x: this.x, y: this.y, length: this.length, angle: this.angle },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('vector-pad', VectorPad);

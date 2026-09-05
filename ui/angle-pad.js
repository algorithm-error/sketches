const CENTER = 50;
const RADIUS = 38;
const DEFAULT_DEBOUNCE = 100;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: inline-block;
            /* Small by default; medium matches vector-pad's box. */
            width: 4em;
            aspect-ratio: 1;
        }
        :host([size="medium"]) { width: 8em; }
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
            /* Same viewBox units as vector-pad's track, so at matching sizes the
               two read as the same weight. */
            stroke-width: 2;
            /* An unfilled shape only hit-tests on its stroke, and this one is
               thin — this makes the whole dial a target, not just the ring. */
            pointer-events: all;
        }
        .hand {
            stroke-width: 2;
        }
        .hand-1 { stroke: var(--fill, var(--primary)); }
        .hand-2 { stroke: var(--fill-2, var(--red)); }
        .hub {
            fill: var(--fill, var(--primary));
        }
        .knob {
            cursor: grab;
        }
        .knob-1 { fill: var(--fill, var(--primary)); }
        .knob-2 { fill: var(--fill-2, var(--red)); }
        .knob:focus {
            outline: none;
        }
        .knob:focus-visible {
            outline: 2px solid var(--highlight);
            outline-offset: 1px;
        }
        /* A knob focused by pointerdown (so arrow keys work right after a drag)
           should not wear the keyboard focus ring. */
        .knob[data-pointer]:focus-visible {
            outline: none;
        }
    </style>
    <svg viewBox="0 0 100 100">
        <circle class="track" cx="${CENTER}" cy="${CENTER}" r="${RADIUS}"/>
        <line class="hand hand-1" x1="${CENTER}" y1="${CENTER}" x2="${CENTER}" y2="${CENTER - RADIUS}"/>
        <line class="hand hand-2" x1="${CENTER}" y1="${CENTER}" x2="${CENTER}" y2="${CENTER - RADIUS}"/>
        <circle class="hub" cx="${CENTER}" cy="${CENTER}" r="2.5"/>
        <circle class="knob knob-1" tabindex="0" role="slider" cx="${CENTER}" cy="${CENTER - RADIUS}" r="7"/>
        <circle class="knob knob-2" tabindex="0" role="slider" cx="${CENTER}" cy="${CENTER - RADIUS}" r="7"/>
    </svg>
`;

// A dial carrying two independent angles on one track — neither is clamped
// against the other, so they can cross freely. For a single angle use
// angle-slider; the two share their geometry, snapping and 0°-east convention.
export class AnglePad extends HTMLElement {
    static get observedAttributes() {
        return ['min', 'max', 'step', 'angle1', 'angle2', 'disabled', 'debounce'];
    }

    svg;
    knobs;
    hands;
    dragging = null;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.svg = shadow.querySelector('svg');
        this.knobs = [shadow.querySelector('.knob-1'), shadow.querySelector('.knob-2')];
        this.hands = [shadow.querySelector('.hand-1'), shadow.querySelector('.hand-2')];

        this.knobs.forEach((knob, index) => {
            knob.addEventListener('pointerdown', (event) => this.startDrag(event, index));
            knob.addEventListener('keydown', (event) => this.onKeydown(event, index));
            knob.addEventListener('blur', () => delete knob.dataset.pointer);
        });
        // Clicking anywhere but a handle moves whichever one is already closest,
        // so the far one never jumps across the dial unasked.
        this.svg.querySelector('.track').addEventListener('pointerdown', (event) => {
            this.startDrag(event, this.nearestHandle(event));
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

    get angle1() {
        return Number(this.getAttribute('angle1') ?? 0);
    }

    set angle1(v) {
        this.setAttribute('angle1', v);
    }

    get angle2() {
        return Number(this.getAttribute('angle2') ?? 0);
    }

    set angle2(v) {
        this.setAttribute('angle2', v);
    }

    angleAt(index) {
        return index === 0 ? this.angle1 : this.angle2;
    }

    setAngleAt(index, value) {
        if (index === 0) this.angle1 = value;
        else this.angle2 = value;
    }

    nearestHandle(event) {
        const pointerAngle = this.pointerAngle(event);
        const distance = (angle) => {
            const delta = Math.abs((((pointerAngle - angle) % 360) + 360) % 360);
            return Math.min(delta, 360 - delta);
        };
        return distance(this.angle1) <= distance(this.angle2) ? 0 : 1;
    }

    startDrag(event, index) {
        if (this.hasAttribute('disabled')) return;
        event.preventDefault();
        const knob = this.knobs[index];
        this.dragging = index;
        // Capture keeps a drag that leaves the dial alive; not every pointer can
        // be captured, and failing to is no reason to drop the drag.
        try {
            knob.setPointerCapture(event.pointerId);
        } catch (error) {
            // ignored on purpose
        }
        knob.dataset.pointer = '';
        knob.focus();
        this.updateFromPointer(event, index);

        const onMove = (e) => {
            if (this.dragging === index) this.updateFromPointer(e, index);
        };
        const onUp = (e) => {
            if (this.dragging !== index) return;
            this.dragging = null;
            this.updateFromPointer(e, index);
            this.emit('change');
            knob.removeEventListener('pointermove', onMove);
            knob.removeEventListener('pointerup', onUp);
        };
        knob.addEventListener('pointermove', onMove);
        knob.addEventListener('pointerup', onUp);
    }

    pointerAngle(event) {
        const rect = this.svg.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        return ((rawDeg % 360) + 360) % 360;
    }

    updateFromPointer(event, index) {
        this.setAngleAt(index, this.snapAngle(this.pointerAngle(event)));
        this.emitDebounced('input');
    }

    onKeydown(event, index) {
        if (this.hasAttribute('disabled')) return;
        delete this.knobs[index].dataset.pointer;
        const step = this.step || 1;
        const angle = this.angleAt(index);
        if (event.key === 'Home') {
            this.setAngleAt(index, this.snapAngle(this.min));
        } else if (event.key === 'End') {
            this.setAngleAt(index, this.snapAngle(this.max));
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            this.setAngleAt(index, this.snapAngle(angle + step));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            this.setAngleAt(index, this.snapAngle(angle - step));
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
        const disabled = this.hasAttribute('disabled');
        this.knobs.forEach((knob, index) => {
            const angle = this.angleAt(index);
            const rad = (angle * Math.PI) / 180;
            const x = CENTER + RADIUS * Math.cos(rad);
            const y = CENTER + RADIUS * Math.sin(rad);
            knob.setAttribute('cx', x);
            knob.setAttribute('cy', y);
            this.hands[index].setAttribute('x2', x);
            this.hands[index].setAttribute('y2', y);
            knob.setAttribute('aria-valuenow', angle);
            knob.setAttribute('aria-valuemin', this.min);
            knob.setAttribute('aria-valuemax', this.max);
            knob.setAttribute('aria-disabled', disabled);
            knob.tabIndex = disabled ? -1 : 0;
        });
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
                detail: { angle1: this.angle1, angle2: this.angle2 },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('angle-pad', AnglePad);

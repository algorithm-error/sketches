import './vector-pad.js';
import './coordinate-input.js';
import './help-text.js';
import './control-row.js';
import './control-column.js';

const DEFAULT_DEBOUNCE = 100;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; font-size: var(--font-size); }
        .head {
            display: flex;
            gap: 0.75em;
            margin-bottom: 0.625em;
        }
        .label {
            color: var(--color);
        }
        /* control-row lays the pad and the help/inputs column out in equal
           columns, and the pad is usually smaller than its cell (more so with a
           wide --ratio), so it sits centred in it. */
        .pad {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        coordinate-input {
            align-self: flex-end;
        }
    </style>
    <div class="head">
        <label class="label" part="label"></label>
    </div>
    <control-row>
        <div class="pad">
            <vector-pad></vector-pad>
        </div>
        <control-column>
            <help-text part="help" style="--line-clamp: 3;"></help-text>
            <coordinate-input size="small" style="--direction: column"></coordinate-input>
        </control-column>
    </control-row>
`;

// The pad always reports every pointer move instantly (debounce is forced to
// 0 on it below) so coordinate-input's fields never lag behind the dragged
// knob. The compound's own "input" event to outside listeners is what
// respects the debounce/default-debounce, kept separate from that sync.
export class VectorSlider extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'help', 'min', 'max', 'step', 'x', 'y', 'decimals', 'debounce', 'disabled', 'mode', 'point'];
    }

    labelEl;
    helpEl;
    pad;
    coordInput;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
        this.helpEl = shadow.querySelector('help-text');
        this.pad = shadow.querySelector('vector-pad');
        this.pad.setAttribute('debounce', '0');
        this.coordInput = shadow.querySelector('coordinate-input');

        this.pad.addEventListener('input', (event) => {
            event.stopPropagation();
            this.applyValue(event.detail.x, event.detail.y, 'input');
        });
        this.pad.addEventListener('change', (event) => {
            event.stopPropagation();
            this.applyValue(event.detail.x, event.detail.y, 'change');
        });
        this.coordInput.addEventListener('change', (event) => {
            event.stopPropagation();
            this.applyValue(event.detail.x, event.detail.y, 'change');
        });
    }

    connectedCallback() {
        this.syncAll();
    }

    disconnectedCallback() {
        clearTimeout(this.debounceTimer);
    }

    attributeChangedCallback() {
        this.syncAll();
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

    get mode() {
        return this.getAttribute('mode') === 'polar' ? 'polar' : 'cartesian';
    }

    syncAll() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        this.helpEl.textContent = this.getAttribute('help') || '';

        [this.pad, this.coordInput].forEach((el) => {
            el.setAttribute('mode', this.mode);
            ['min', 'max', 'step'].forEach((attr) => {
                if (this.hasAttribute(attr)) el.setAttribute(attr, this.getAttribute(attr));
                else el.removeAttribute(attr);
            });
            el.toggleAttribute('disabled', this.hasAttribute('disabled'));
            el.toggleAttribute('point', this.hasAttribute('point'));
            el.setAttribute('x', this.x);
            el.setAttribute('y', this.y);
        });
        this.coordInput.setAttribute('decimals', this.hasAttribute('decimals') ? this.getAttribute('decimals') : '2');
    }

    applyValue(x, y, kind) {
        this.setAttribute('x', x);
        this.setAttribute('y', y);
        if (kind === 'change') this.emit('change');
        else this.emitDebounced('input');
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

customElements.define('vector-slider', VectorSlider);

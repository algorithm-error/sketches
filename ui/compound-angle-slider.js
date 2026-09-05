import './numeric-input.js';
import './angle-slider.js';
import './help-text.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; font-size: var(--font-size); }
        .label {
            color: var(--color);
            display: block;
            margin-bottom: 0.625em;
        }
        .body {
            display: flex;
            gap: 0.75em;
            align-items: flex-start;
        }
        .side {
            display: flex;
            flex-direction: column;
            gap: 0.5em;
            align-items: flex-end;
            flex: 1;
        }
        help-text {
            width: 100%;
            --line-clamp: 3;
        }
        numeric-input {
            width: 5em;
            flex-shrink: 0;
        }
        angle-slider {
            flex-shrink: 0;
        }
        :host([size="medium"]) angle-slider { width: 8em; }
    </style>
    <label class="label" part="label"></label>
    <div class="body">
        <angle-slider></angle-slider>
        <div class="side">
            <help-text part="help"></help-text>
            <numeric-input part="value" size="small"></numeric-input>
        </div>
    </div>
`;

// compound-angle-pad's single-angle counterpart: a label, a help line, an
// angle-slider dial and one number field. A dial rather than a track because a
// direction wraps, and a track has ends.
export class CompoundAngleSlider extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'help', 'min', 'max', 'step', 'value', 'decimals', 'size', 'disabled', 'debounce'];
    }

    labelEl;
    helpEl;
    dial;
    numberInput;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
        this.helpEl = shadow.querySelector('help-text');
        this.dial = shadow.querySelector('angle-slider');
        this.numberInput = shadow.querySelector('numeric-input');

        this.dial.addEventListener('input', (event) => {
            event.stopPropagation();
            this.setValue(event.detail.value, { fromDial: true, silent: true });
        });
        this.dial.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setValue(event.detail.value, { fromDial: true });
        });
        this.numberInput.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setValue(event.detail.value, { fromNumber: true });
        });
    }

    connectedCallback() {
        this.syncAll();
    }

    attributeChangedCallback() {
        this.syncAll();
    }

    get value() {
        return Number(this.getAttribute('value') ?? 0);
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    decimals() {
        return Number(this.getAttribute('decimals') || 0);
    }

    syncAll() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        this.helpEl.textContent = this.getAttribute('help') || '';
        ['min', 'max', 'step', 'debounce'].forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.dial.setAttribute(attr, this.getAttribute(attr));
                this.numberInput.setAttribute(attr, this.getAttribute(attr));
            }
        });
        // A dial covering a whole turn has no ends, so the field steps 0 -> 359
        // instead of stopping at the bound. The bounds have to reach the input
        // for that (they default to the dial's own 0..360) since the wrap is
        // measured against them.
        const min = this.hasAttribute('min') ? Number(this.getAttribute('min')) : 0;
        const max = this.hasAttribute('max') ? Number(this.getAttribute('max')) : 360;
        const wraps = max - min >= 360;
        if (wraps) {
            this.numberInput.setAttribute('min', min);
            this.numberInput.setAttribute('max', max);
        }
        this.numberInput.toggleAttribute('wrap', wraps);
        [this.dial, this.numberInput].forEach((el) => el.toggleAttribute('disabled', this.hasAttribute('disabled')));
        const value = this.value;
        this.dial.setAttribute('value', value);
        this.numberInput.setAttribute('value', value.toFixed(this.decimals()));
    }

    setValue(value, { fromDial, fromNumber, silent } = {}) {
        const num = Number(value);
        this.setAttribute('value', num);
        if (!fromNumber) this.numberInput.setAttribute('value', num.toFixed(this.decimals()));
        if (!fromDial) this.dial.setAttribute('value', num);
        if (silent) return;
        const valueEvent = new CustomEvent('change', {
            detail: { value: num },
            bubbles: true,
            composed: true,
        });
        // `value` sits on the event itself too, so handlers can read `event.value`.
        valueEvent.value = num;
        this.dispatchEvent(valueEvent);
    }
}

customElements.define('compound-angle-slider', CompoundAngleSlider);

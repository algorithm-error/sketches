import './numeric-input.js';
import './custom-slider.js';
import './help-text.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; }
        :host([variant="secondary"]) {
            box-sizing: border-box;
            border: 1px solid var(--foreground);
            background: #f2f2f2;
            border-radius: 0.25rem;
            padding: 1rem;
        }
        .head {
            margin-bottom: 0.625rem;
            width: 100%;
        }
        .label {
            color: var(--color);
        }
        help-text {
            --size: var(--font-size);
            --line-clamp: 1;
            width: 100%;
        }
        .row {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            align-items: center;
            width: 100%;
            justify-content: space-between;
        }
        numeric-input {
            width: 5rem;
            flex-shrink: 0;
        }
        :host([direction="vertical"]) {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
            gap: 0.5rem;
        }
        :host([direction="vertical"]) .head {
            margin-bottom: 0;
            display: contents;
        }
        :host([direction="vertical"]) .row {
            flex-direction: column-reverse;
            gap: 0.5rem;
        }
        :host([direction="vertical"]) .label,
        :host([direction="vertical"]) help-text {
            text-align: center;
        }
    </style>
    <div class="head">
        <div class="row">
            <label class="label" part="label" for="numeric-input"></label>
            <numeric-input size="small" id="numeric-input"></numeric-input>
        </div>
        <help-text part="help"></help-text>
    </div>
    <custom-slider></custom-slider>
`;

export class UICompoundSlider extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'help', 'min', 'max', 'step', 'value', 'decimals', 'size', 'direction', 'length', 'debounce'];
    }

    labelEl;
    helpEl;
    slider;
    numberInput;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
        this.helpEl = shadow.querySelector('help-text');
        this.slider = shadow.querySelector('custom-slider');
        this.numberInput = shadow.querySelector('numeric-input');

        this.slider.addEventListener('input', (event) => {
            this.setValue(event.detail.value, { fromSlider: true, silent: true });
        });
        this.slider.addEventListener('change', (event) => {
            this.setValue(event.detail.value, { fromSlider: true });
        });
        this.numberInput.addEventListener('change', (event) => {
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
        return Number(this.getAttribute('value'));
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
        if (this.hasAttribute('size')) this.numberInput.setAttribute('size', this.getAttribute('size'));
        const vertical = this.getAttribute('direction') === 'vertical';
        if (vertical) {
            this.slider.setAttribute('direction', 'vertical');
            this.numberInput.setAttribute('stretch', '');
        } else {
            this.slider.removeAttribute('direction');
            this.numberInput.removeAttribute('stretch');
        }
        if (this.hasAttribute('length')) this.slider.style.setProperty('--slider-length', this.getAttribute('length'));
        if (this.hasAttribute('debounce')) {
            this.slider.setAttribute('debounce', this.getAttribute('debounce'));
            this.numberInput.setAttribute('debounce', this.getAttribute('debounce'));
        }
        ['min', 'max', 'step'].forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.slider.setAttribute(attr, this.getAttribute(attr));
                this.numberInput.setAttribute(attr, this.getAttribute(attr));
            }
        });
        const value = this.value;
        this.slider.setAttribute('value', value);
        this.numberInput.setAttribute('value', value.toFixed(this.decimals()));
    }

    setValue(value, { fromSlider, fromNumber, silent } = {}) {
        const num = Number(value);
        this.setAttribute('value', num);
        if (!fromNumber) this.numberInput.setAttribute('value', num.toFixed(this.decimals()));
        if (!fromSlider) this.slider.setAttribute('value', num);
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

customElements.define('compound-slider', UICompoundSlider);

import './numeric-input.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: flex;
            align-items: center;
        }
        label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75em;
            width: 100%;
            font-size: var(--font-size);
            color: var(--color);
        }
        label:has(numeric-input[disabled]) {
            cursor: not-allowed;
            opacity: 0.4;
        }
        .label-text {
            white-space: nowrap;
        }
        numeric-input {
            width: 5em;
            flex-shrink: 0;
        }
    </style>
    <label>
        <span class="label-text" part="label"></span>
    </label>
`;

export class LabeledNumericInput extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'value', 'disabled', 'size', 'stretch', 'min', 'max', 'step'];
    }

    labelEl;
    input;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label-text');
        this.input = document.createElement('numeric-input');
        this.input.setAttribute('part', 'input');
        shadow.querySelector('label').appendChild(this.input);
        this.input.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setAttribute('value', event.detail.value);
            const valueEvent = new CustomEvent('change', {
                detail: { value: event.detail.value },
                bubbles: true,
                composed: true,
            });
            // `value` sits on the event itself too, so handlers can read `event.value`.
            valueEvent.value = event.detail.value;
            this.dispatchEvent(valueEvent);
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get value() {
        return this.input.value;
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    sync() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        if (this.hasAttribute('value')) this.input.setAttribute('value', this.getAttribute('value'));
        this.input.toggleAttribute('disabled', this.hasAttribute('disabled'));
        this.input.toggleAttribute('stretch', this.hasAttribute('stretch'));
        ['size', 'min', 'max', 'step'].forEach((attr) => {
            if (this.hasAttribute(attr)) this.input.setAttribute(attr, this.getAttribute(attr));
            else this.input.removeAttribute(attr);
        });
    }
}

customElements.define('labeled-numeric-input', LabeledNumericInput);

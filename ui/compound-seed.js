import './control-row.js';
import './numeric-input.js';
import './random-seed-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; }
        random-seed-button, numeric-input { flex: 1; }
    </style>
    <control-row>
        <random-seed-button part="button" variant="noise" stretch></random-seed-button>
        <numeric-input part="input" stretch></numeric-input>
    </control-row>
`;

export class UICompoundSeed extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled', 'size'];
    }

    button;
    numberInput;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('random-seed-button');
        this.numberInput = shadow.querySelector('numeric-input');

        // Rolling a seed is this control's own business: the button moves the
        // number, and the outside only ever hears one `change`, as from any input.
        this.button.addEventListener('seed', (event) => {
            event.stopPropagation();
            this.setValue(event.value);
        });
        this.numberInput.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setValue(event.value, { fromNumber: true });
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

    syncAll() {
        ['disabled', 'size'].forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.button.setAttribute(attr, this.getAttribute(attr));
                this.numberInput.setAttribute(attr, this.getAttribute(attr));
            } else {
                this.button.removeAttribute(attr);
                this.numberInput.removeAttribute(attr);
            }
        });
        this.numberInput.setAttribute('value', this.value);
    }

    setValue(value, { fromNumber, silent } = {}) {
        const num = Number(value);
        this.setAttribute('value', num);
        if (!fromNumber) this.numberInput.setAttribute('value', num);
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

customElements.define('compound-seed', UICompoundSeed);

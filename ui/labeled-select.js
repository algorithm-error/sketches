import './custom-select.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: flex;
            align-items: center;
        }
        label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            font-size: var(--font-size);
            color: var(--color);
        }
        :host([direction="column"]) label {
            flex-direction: column;
            align-items: flex-start;
        }
        label:has(custom-select[disabled]) {
            cursor: not-allowed;
            opacity: 0.4;
        }
        .label-text {
            white-space: nowrap;
        }
    </style>
    <label>
        <span class="label-text" part="label"></span>
    </label>
`;

export class LabeledSelect extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'value', 'disabled', 'size', 'stretch', 'direction'];
    }

    labelEl;
    select = null;
    initialized = false;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label-text');
    }

    connectedCallback() {
        // Build the nested custom-select with its <option>s already attached
        // *before* it's inserted into the (now-connected) shadow tree. If we
        // appended it empty and cloned options in afterward, its own connectedCallback
        // would fire immediately on insertion with zero children, mark itself
        // initialized, and never pick the options up.
        if (!this.initialized) {
            this.select = document.createElement('custom-select');
            this.select.setAttribute('part', 'select');
            Array.from(this.children).forEach((child) => this.select.appendChild(child.cloneNode(true)));
            this.shadowRoot.querySelector('label').appendChild(this.select);
            this.select.addEventListener('change', (event) => {
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
            this.initialized = true;
        }
        this.sync();
    }

    attributeChangedCallback() {
        if (this.initialized) this.sync();
    }

    get value() {
        return this.select ? this.select.value : this.getAttribute('value');
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    sync() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        if (!this.select) return;
        if (this.hasAttribute('value')) this.select.setAttribute('value', this.getAttribute('value'));
        this.select.toggleAttribute('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('size')) this.select.setAttribute('size', this.getAttribute('size'));
        else this.select.removeAttribute('size');
        this.select.toggleAttribute('stretch', this.hasAttribute('stretch'));
    }
}

customElements.define('labeled-select', LabeledSelect);

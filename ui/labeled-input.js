import './help-text.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.25rem;
        }
        :host([stretch]) { width: 100%; }
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
        label:has([disabled]),
        label:has(:disabled) {
            cursor: not-allowed;
            opacity: 0.4;
        }
        .label-text {
            white-space: nowrap;
        }
        /* Full width under the label-plus-control row, like compound-slider's. */
        help-text {
            --size: var(--font-size);
            width: 100%;
        }
        :host(:not([help])) help-text {
            display: none;
        }
        :host([disabled]) help-text {
            opacity: 0.4;
        }
        ::slotted(*) {
            flex-shrink: 0;
        }
        :host([stretch]) ::slotted(*) {
            width: 100%;
            box-sizing: border-box;
        }
    </style>
    <label>
        <span class="label-text" part="label"></span>
        <slot></slot>
    </label>
    <help-text part="help"></help-text>
`;

// A generic label-plus-control row: unlike labeled-select/labeled-numeric-input,
// this one doesn't construct the control itself, it just lays out and labels
// whatever's slotted in — a plain <input>, <select>, custom-select, color-swatches,
// anything that reflects a `disabled` attribute/property and fires `change`.
export class LabeledInput extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'help', 'disabled', 'direction', 'stretch'];
    }

    labelEl;
    helpEl;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label-text');
        this.helpEl = shadow.querySelector('help-text');
        shadow.querySelector('label').addEventListener('change', (event) => {
            if (event.target === this.labelEl) return;
            event.stopPropagation();
            const valueEvent = new CustomEvent('change', {
                detail: { value: event.target.value },
                bubbles: true,
                composed: true,
            });
            // `value` sits on the event itself too, so handlers can read `event.value`.
            valueEvent.value = event.target.value;
            this.dispatchEvent(valueEvent);
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get control() {
        return this.querySelector(':scope > *');
    }

    get value() {
        return this.control ? this.control.value : undefined;
    }

    sync() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        this.helpEl.textContent = this.getAttribute('help') || '';
        const disabled = this.hasAttribute('disabled');
        const stretch = this.hasAttribute('stretch');
        Array.from(this.children).forEach((child) => {
            child.toggleAttribute('disabled', disabled);
            child.toggleAttribute('stretch', stretch);
        });
    }
}

customElements.define('labeled-input', LabeledInput);

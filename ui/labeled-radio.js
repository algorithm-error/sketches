const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-flex;
            align-items: center;
        }
        label {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: var(--font-size);
            color: var(--color);
            cursor: pointer;
        }
        label:has(input:disabled) {
            cursor: not-allowed;
            opacity: 0.4;
        }
        input[type="radio"] {
            appearance: none;
            box-sizing: border-box;
            margin: 0;
            width: 1.125rem;
            height: 1.125rem;
            border-radius: 50%;
            border: 0.125rem solid var(--primary);
            background: var(--background);
            cursor: pointer;
        }
        input[type="radio"]:checked {
            background: var(--primary);
            box-shadow: inset 0 0 0 0.2rem var(--background);
        }
        input[type="radio"]:disabled {
            cursor: not-allowed;
        }
        input[type="radio"]:focus-visible {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 0.125rem;
        }
    </style>
    <label>
        <input type="radio" part="radio" autocomplete="off" />
        <slot></slot>
    </label>
`;

class LabeledRadio extends HTMLElement {
    static get observedAttributes() {
        return ['name', 'value', 'checked', 'disabled'];
    }

    input;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input');
        this.input.addEventListener('change', () => {
            this.dispatchEvent(
                new CustomEvent('change', {
                    detail: { checked: this.input.checked, value: this.input.value },
                    bubbles: true,
                    composed: true,
                }),
            );
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get checked() {
        return this.input.checked;
    }

    set checked(v) {
        if (v) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
    }

    sync() {
        if (this.hasAttribute('name')) this.input.setAttribute('name', this.getAttribute('name'));
        if (this.hasAttribute('value')) this.input.setAttribute('value', this.getAttribute('value'));
        this.input.checked = this.hasAttribute('checked');
        this.input.disabled = this.hasAttribute('disabled');
    }
}

customElements.define('labeled-radio', LabeledRadio);

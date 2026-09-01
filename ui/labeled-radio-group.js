const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
        }
        .options {
            display: flex;
            flex-direction: var(--direction, column);
            gap: 1rem;
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
    <div class="options" part="options"></div>
`;

// A single component owning a set of labeled radio options. Unlike composing
// several standalone <labeled-radio> elements (each with its own Shadow DOM,
// so native radio grouping can't cross them and exclusivity has to be
// re-implemented in JS — which turned out to be unreliable), every option
// here is a plain <input type="radio"> living in one Shadow DOM, so the
// browser enforces "only one checked" natively.
//
// Options are declared as light-DOM <option value="...">Label</option>
// children, cloned in once on connect (matching custom-select's approach).
//
// Layout is a CSS variable: `--direction: row` lays the options out
// horizontally, the default `column` stacks them.
class LabeledRadioGroup extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled'];
    }

    container;
    optionsMoved = false;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.container = shadow.querySelector('.options');
        this.container.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setAttribute('value', event.target.value);
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
        if (!this.optionsMoved) {
            Array.from(this.children).forEach((option) => {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'option';
                input.autocomplete = 'off';
                input.value = option.getAttribute('value') || option.textContent.trim();
                label.appendChild(input);
                label.appendChild(document.createTextNode(option.textContent));
                this.container.appendChild(label);
            });
            this.optionsMoved = true;
        }
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    sync() {
        const value = this.getAttribute('value');
        const disabled = this.hasAttribute('disabled');
        Array.from(this.container.querySelectorAll('input')).forEach((input) => {
            input.checked = input.value === value;
            input.disabled = disabled;
        });
    }
}

customElements.define('labeled-radio-group', LabeledRadioGroup);

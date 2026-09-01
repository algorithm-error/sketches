const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-flex;
        }
        input[type="radio"] {
            appearance: none;
            box-sizing: border-box;
            margin: 0;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 0.25rem;
            border: 1px solid color-mix(in srgb, var(--foreground) 50%, transparent);
            background: var(--swatch-color, var(--background));
            cursor: pointer;
        }
        :host([size="small"]) input[type="radio"] {
            width: 1.125rem;
            height: 1.125rem;
        }
        input[type="radio"]:checked {
            box-shadow: 0 0 0 0.125rem var(--background), 0 0 0 0.25rem var(--primary);
        }
        input[type="radio"]:disabled {
            cursor: not-allowed;
            opacity: 0.4;
        }
        input[type="radio"]:focus-visible {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 0.1875rem;
        }
        .swatches {
            display: flex;
            gap: 0.5rem;
        }
    </style>
    <div class="swatches" part="swatches"></div>
`;

const parseList = (attr) =>
    (attr || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

// A single component owning a set of color swatches. Unlike composing several
// standalone radio-backed elements (each with its own Shadow DOM, so native
// radio grouping can't cross them and exclusivity has to be re-implemented in
// JS), every swatch here is a plain <input type="radio"> living in this one
// Shadow DOM — the browser enforces "only one checked" natively, for free.
//
// Colors are declared as a plain attribute (each color doubles as its own
// value), e.g. colors="#000000,#ff0000,#00ffff", with an optional parallel
// `labels` attribute for accessible names.
class ColorSwatches extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled', 'size', 'colors', 'labels'];
    }

    container;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.container = shadow.querySelector('.swatches');
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
        this.rebuild();
    }

    attributeChangedCallback(name) {
        if (name === 'colors' || name === 'labels') this.rebuild();
        else this.sync();
    }

    get value() {
        return this.getAttribute('value') || '';
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    rebuild() {
        const colors = parseList(this.getAttribute('colors'));
        const labels = parseList(this.getAttribute('labels'));
        if (!this.hasAttribute('value') && colors.length) this.setAttribute('value', colors[0]);
        this.container.innerHTML = '';
        colors.forEach((color, i) => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'swatch';
            input.autocomplete = 'off';
            input.value = color;
            input.style.setProperty('--swatch-color', color);
            input.setAttribute('aria-label', labels[i] || color);
            this.container.appendChild(input);
        });
        this.sync();
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

customElements.define('color-swatches', ColorSwatches);

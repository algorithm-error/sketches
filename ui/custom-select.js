const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; font-size: var(--font-size); height: 2em; }
        :host([size="small"]) { height: 1.5em; }
        :host([stretch]) { display: block; width: 100%; }
        :host([stretch]) select { width: 100%; }
        select {
            appearance: none;
            box-sizing: border-box;
            height: 100%;
            font-family: var(--monospace);
            font-size: var(--small-font-size);
            color: var(--color);
            background-color: var(--background);
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23191919' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.5714em center;
            background-size: 0.8571em;
            border: 1px solid color-mix(in srgb, var(--foreground) 50%, transparent);
            border-radius: 0.2857em;
            padding: 0.4286em 2em 0.4286em 0.5714em;
            cursor: pointer;
        }
        :host([size="small"]) select {
            font-size: var(--xsmall-font-size);
            padding: 0.3333em 2em 0.3333em 0.6667em;
            background-size: 0.8333em;
        }
        select:focus-visible {
            outline: 2px solid var(--highlight);
            outline-offset: 1px;
        }
        select:disabled { opacity: 0.4; cursor: not-allowed; }
    </style>
    <select part="select"></select>
`;

export class UISelect extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled'];
    }

    select;
    optionsMoved = false;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.select = shadow.querySelector('select');
        this.select.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setAttribute('value', this.select.value);
            const valueEvent = new CustomEvent('change', {
                detail: { value: this.select.value },
                bubbles: true,
                composed: true,
            });
            // `value` sits on the event itself too, so handlers can read `event.value`.
            valueEvent.value = this.select.value;
            this.dispatchEvent(valueEvent);
        });
    }

    connectedCallback() {
        // Native <select> doesn't render <option>s projected through a <slot> —
        // clone the light-DOM options into the shadow <select> instead (leaving
        // the originals in place keeps introspection/tooling working normally).
        if (!this.optionsMoved) {
            Array.from(this.children).forEach((child) => this.select.appendChild(child.cloneNode(true)));
            this.optionsMoved = true;
        }
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get value() {
        return this.select.value;
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    sync() {
        if (this.hasAttribute('value')) this.select.value = this.getAttribute('value');
        this.select.disabled = this.hasAttribute('disabled');
    }
}

customElements.define('custom-select', UISelect);

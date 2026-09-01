const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            position: relative;
            box-sizing: border-box;
            display: block;
            border: 1px solid color-mix(in srgb, var(--foreground) 50%, transparent);
            border-radius: 0.25rem;
            padding: 1.25rem 0.75rem 1rem 0.75rem;
        }
        .label {
            position: absolute;
            top: -0.65rem;
            left: 1rem;
            color: var(--color);
            background: var(--background);
            padding: 0 0.5rem;
        }
    </style>
    <div class="label" part="label"></div>
    <slot></slot>
`;

class CustomFieldset extends HTMLElement {
    static get observedAttributes() {
        return ['label'];
    }

    labelEl;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    sync() {
        this.labelEl.textContent = this.getAttribute('label') || '';
    }
}

customElements.define('custom-fieldset', CustomFieldset);

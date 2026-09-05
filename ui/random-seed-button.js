import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; font-size: var(--font-size); }
        :host([stretch]) { display: block; width: 100%; }
        svg {
            display: inline-block;
            flex-shrink: 0;
            width: 1.1429em;
            height: 1.1429em;
            position: relative;
            top: -0.0571em;
            vertical-align: middle;
            transform: rotate(70deg);
        }
        :host([variant="noise"]) svg { display: none; }
    </style>
    <custom-button part="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="1.2em" height="1.2em"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8" cy="8" r="1" fill="currentColor"></circle><circle cx="16" cy="8" r="1" fill="currentColor"></circle><circle cx="12" cy="12" r="1" fill="currentColor"></circle><circle cx="8" cy="16" r="1" fill="currentColor"></circle><circle cx="16" cy="16" r="1" fill="currentColor"></circle></svg>
        <slot>Seed</slot>
    </custom-button>
`;

export class UIRandomSeedButton extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'type', 'stretch', 'size', 'variant'];
    }

    button;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('custom-button');
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    sync() {
        UIRandomSeedButton.observedAttributes.forEach((attr) => {
            if (this.hasAttribute(attr)) this.button.setAttribute(attr, this.getAttribute(attr));
            else this.button.removeAttribute(attr);
        });
    }
}

customElements.define('random-seed-button', UIRandomSeedButton);

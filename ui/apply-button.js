import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; font-size: var(--font-size); }
        :host([stretch]) { display: block; width: 100%; }
        :host([stretch]) custom-button { width: 100%; }
        :host([in-progress]) .label { display: none; }
        :host(:not([in-progress])) .applying { display: none; }
    </style>
    <custom-button part="button">
        <span class="label"><slot></slot></span>
        <span class="applying">Applying...</span>
    </custom-button>
`;

export class ApplyButton extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'in-progress', 'variant', 'size', 'stretch'];
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

    get inProgress() {
        return this.hasAttribute('in-progress');
    }

    set inProgress(v) {
        this.toggleAttribute('in-progress', Boolean(v));
    }

    sync() {
        this.button.toggleAttribute('disabled', this.hasAttribute('disabled') || this.inProgress);
        if (this.hasAttribute('variant')) this.button.setAttribute('variant', this.getAttribute('variant'));
        else this.button.removeAttribute('variant');
        if (this.hasAttribute('size')) this.button.setAttribute('size', this.getAttribute('size'));
        else this.button.removeAttribute('size');
        this.button.toggleAttribute('stretch', this.hasAttribute('stretch'));
    }
}

customElements.define('apply-button', ApplyButton);

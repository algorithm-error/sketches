import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; }
        :host([stretch]) { display: block; width: 100%; }
        :host([stretch]) custom-button { width: 100%; }
        :host([confirmed]) .label { display: none; }
        :host(:not([confirmed])) .confirm { display: none; }
    </style>
    <custom-button part="button">
        <span class="label"><slot></slot></span>
        <span class="confirm"><slot name="confirm">Done</slot></span>
    </custom-button>
`;

export class AcknowledgeButton extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'variant', 'size', 'stretch'];
    }

    button;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('custom-button');
        this.button.addEventListener('click', () => {
            this.confirmed = true;
        });
        this.addEventListener('mouseleave', () => {
            this.confirmed = false;
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get confirmed() {
        return this.hasAttribute('confirmed');
    }

    set confirmed(value) {
        this.toggleAttribute('confirmed', Boolean(value));
    }

    sync() {
        this.button.toggleAttribute('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('variant')) this.button.setAttribute('variant', this.getAttribute('variant'));
        else this.button.removeAttribute('variant');
        if (this.hasAttribute('size')) this.button.setAttribute('size', this.getAttribute('size'));
        else this.button.removeAttribute('size');
        this.button.toggleAttribute('stretch', this.hasAttribute('stretch'));
    }
}

customElements.define('acknowledge-button', AcknowledgeButton);

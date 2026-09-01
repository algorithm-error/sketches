const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: grid;
            gap: 1.5em;
        }
    </style>
    <slot></slot>
`;

class CustomGrid extends HTMLElement {
    static get observedAttributes() {
        return ['columns'];
    }

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    sync() {
        const columns = this.getAttribute('columns') || 3;
        this.style.gridTemplateColumns = `repeat(${columns}, max-content)`;
    }
}

customElements.define('custom-grid', CustomGrid);

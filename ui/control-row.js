const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: flex;
            flex-direction: row;
            gap: 1rem;
        }
        :host(.columns) {
            display: grid;
            width: 100%;
        }
    </style>
    <slot></slot>
`;

class ControlRow extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.sync();
    }

    sync() {
        const raw = getComputedStyle(this).getPropertyValue('--columns').trim();
        const columns = raw === '' ? 2 : Number(raw) || 0;
        this.classList.toggle('columns', columns > 0);
        this.style.gridTemplateColumns = columns > 0 ? `repeat(${columns}, 1fr)` : '';
    }
}

customElements.define('control-row', ControlRow);

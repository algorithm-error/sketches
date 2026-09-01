const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: flex;
            flex-direction: row;
            gap: 1em;
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
        const ratio = raw === '' ? '1 1' : raw;
        const weights = ratio.split(/\s+/).map(Number);
        const isGrid = weights.every((weight) => weight > 0);
        this.classList.toggle('columns', isGrid);
        this.style.gridTemplateColumns = isGrid ? weights.map((weight) => `${weight}fr`).join(' ') : '';
    }
}

customElements.define('control-row', ControlRow);

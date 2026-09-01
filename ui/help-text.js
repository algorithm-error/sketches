const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: block;
            font-size: var(--size, var(--small-font-size));
            line-height: var(--small-line-height);
            color: #767676;
        }
        .help {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: var(--line-clamp, none);
            overflow: hidden;
            text-overflow: ellipsis;
        }
    </style>
    <div class="help" part="help"><slot></slot></div>
`;

export class HelpText extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('help-text', HelpText);

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            /* FIXME Consider using prefixes css vars not to interfere with css vars used for component customization */
            display: contents;
            --white: #ffffff;
            --black: #191919;
            --background: var(--white);
            --color: var(--black);
            --foreground: var(--black);
            --primary: #0000ff;
            --highlight: #ffd800;
            --green: #00ff00;
            --red: #ff0000;
            /*--font-family: 'SFMono-Regular', Consolas, Menlo, monospace;*/
            --monospace: monospace;
            --font-family: serif;
            --regular-font-size: 1em;
            --small-font-size: 0.875em;
            --xsmall-font-size: 0.75em;
            --font-size: 16px;
            --line-height: 1.25;
            --small-line-height: 1.25;
            color-scheme: light;
        }
        :host([variant="dark"]) {
            --background: #191919;
            --color: #ffffff;
            --foreground: #ffffff;
            color-scheme: dark;
        }
    </style>
    <slot></slot>
`;

class UITheme extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('custom-theme', UITheme);

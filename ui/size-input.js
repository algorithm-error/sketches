import './numeric-input.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        :host([stretch]) {
            display: flex;
            width: 100%;
        }
        :host([stretch]) numeric-input {
            flex: 1;
        }
        .separator {
            color: var(--color);
            font-size: var(--font-size);
            flex-shrink: 0;
        }
    </style>
    <numeric-input part="width"></numeric-input>
    <span class="separator">&times;</span>
    <numeric-input part="height"></numeric-input>
`;

export class SizeInput extends HTMLElement {
    static get observedAttributes() {
        return ['width', 'height', 'min', 'max', 'step', 'cols', 'disabled', 'size', 'stretch'];
    }

    widthInput;
    heightInput;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        [this.widthInput, this.heightInput] = shadow.querySelectorAll('numeric-input');

        const onChange = (event) => {
            event.stopPropagation();
            // Capture both values before either setAttribute call: sync()
            // unconditionally re-applies both host attributes onto their
            // inputs, so setting "width" first would otherwise clobber a
            // not-yet-committed "height" change back to its old value.
            const width = this.widthInput.value;
            const height = this.heightInput.value;
            this.setAttribute('width', width);
            this.setAttribute('height', height);
            this.dispatchEvent(
                new CustomEvent('change', {
                    detail: { width, height, value: `${width}x${height}` },
                    bubbles: true,
                    composed: true,
                }),
            );
        };
        this.widthInput.addEventListener('change', onChange);
        this.heightInput.addEventListener('change', onChange);
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get width() {
        return this.widthInput.value;
    }

    set width(v) {
        this.setAttribute('width', v);
    }

    get height() {
        return this.heightInput.value;
    }

    set height(v) {
        this.setAttribute('height', v);
    }

    get value() {
        return `${this.width}x${this.height}`;
    }

    sync() {
        if (this.hasAttribute('width')) this.widthInput.setAttribute('value', this.getAttribute('width'));
        if (this.hasAttribute('height')) this.heightInput.setAttribute('value', this.getAttribute('height'));
        [this.widthInput, this.heightInput].forEach((input) => {
            ['min', 'max', 'step', 'cols'].forEach((attr) => {
                if (this.hasAttribute(attr)) input.setAttribute(attr, this.getAttribute(attr));
                else input.removeAttribute(attr);
            });
            input.toggleAttribute('disabled', this.hasAttribute('disabled'));
            if (this.hasAttribute('size')) input.setAttribute('size', this.getAttribute('size'));
            else input.removeAttribute('size');
            input.toggleAttribute('stretch', this.hasAttribute('stretch'));
        });
    }
}

customElements.define('size-input', SizeInput);

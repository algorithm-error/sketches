const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-flex; }
        label {
            position: relative;
            display: inline-flex;
            cursor: pointer;
        }
        label:has(input:disabled) {
            cursor: not-allowed;
            opacity: 0.4;
        }
        input[type="checkbox"] {
            position: absolute;
            inset: 0;
            margin: 0;
            opacity: 0;
            cursor: pointer;
        }
        input[type="checkbox"]:disabled {
            cursor: not-allowed;
        }
        .track {
            width: 2.25rem;
            height: 1.125rem;
            border-radius: 0.5625rem;
            background: #dcdcdc;
            transition: background 0.15s;
        }
        .thumb {
            position: absolute;
            top: 0.125rem;
            left: 0.125rem;
            width: 0.875rem;
            height: 0.875rem;
            border-radius: 50%;
            background: var(--background);
            transition: transform 0.15s;
        }
        input[type="checkbox"]:checked ~ .track {
            background: var(--primary);
        }
        input[type="checkbox"]:checked ~ .thumb {
            transform: translateX(1.125rem);
        }
        input[type="checkbox"]:focus-visible ~ .track {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 0.125rem;
        }
    </style>
    <label>
        <input type="checkbox" part="input" autocomplete="off" />
        <span class="track" part="track"></span>
        <span class="thumb" part="thumb"></span>
    </label>
`;

export class CustomToggle extends HTMLElement {
    static get observedAttributes() {
        return ['checked', 'disabled'];
    }

    input;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input');
        this.input.addEventListener('change', (event) => {
            event.stopPropagation();
            this.checked = this.input.checked;
            this.dispatchEvent(
                new CustomEvent('change', {
                    detail: { checked: this.checked },
                    bubbles: true,
                    composed: true,
                }),
            );
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get checked() {
        return this.input.checked;
    }

    set checked(v) {
        if (v) this.setAttribute('checked', '');
        else this.removeAttribute('checked');
    }

    sync() {
        this.input.checked = this.hasAttribute('checked');
        this.input.disabled = this.hasAttribute('disabled');
    }
}

customElements.define('custom-toggle', CustomToggle);

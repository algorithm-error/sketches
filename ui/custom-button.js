const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-block;
            height: 2rem;
            --button-bg: var(--fill, var(--foreground));
            --button-border: var(--foreground);
            --button-color: var(--fill-color, var(--background));
            --button-hover-bg: color-mix(in srgb, var(--fill, var(--foreground)) 85%, white);
        }
        :host([size="small"]) {
            height: 1.5rem;
        }
        :host([icon]) {
            width: 2rem;
            height: 2rem;
        }
        :host([icon][size="small"]) {
            width: 1.5rem;
            height: 1.5rem;
        }
        :host([stretch]) { display: block; width: 100%; }
        :host([stretch]) button { width: 100%; }
        button {
            box-sizing: border-box;
            height: 2rem;
            font-family: var(--monospace);
            font-size: var(--small-font-size);
            line-height: var(--line-height);
            text-transform: uppercase;
            padding: 0 1.25rem;
            border-radius: 1px;
            border: var(--button-border);
            background: var(--button-bg);
            color: var(--button-color);
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 2px 2px 0 color-mix(in srgb, var(--foreground) 25%, transparent);
        }
        :host([size="small"]) button {
            height: 1.5rem;
            font-size: var(--xsmall-font-size);
            padding: 0.25rem 0.75rem;
        }
        :host([icon]) button {
            width: 2rem;
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        :host([icon][size="small"]) button {
            width: 1.5rem;
            padding: 0.25rem 0;
        }
        :host([variant="secondary"]) {
            --button-bg: color-mix(in srgb, var(--foreground) 20%, white);
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, var(--foreground) 30%, white);
        }
        :host([variant="accent"]) {
            --button-bg: var(--primary);
            --button-border: none;
            --button-color: var(--background);
            --button-hover-bg: color-mix(in srgb, var(--primary) 70%, black);
        }
        :host([variant="outline"]) {
            --button-bg: transparent;
            --button-border: 1px solid var(--foreground);
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, var(--foreground) 10%, transparent);
        }
        :host([variant="white"]) {
            --button-bg: #fff;
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, #fff 90%, black);
        }
        :host([variant="yellow"]) {
            --button-bg: #ffff00;
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, #ffff00 90%, black);
        }
        :host([variant="red"]) {
            --button-bg: var(--red);
            --button-border: none;
            --button-color: var(--background);
            --button-hover-bg: color-mix(in srgb, var(--red) 85%, black);
        }
        :host([variant="green"]) {
            --button-bg: var(--green);
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, var(--green) 90%, black);
        }
        :host([variant="cyan"]) {
            --button-bg: #00ffff;
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, #00ffff 90%, black);
        }
        :host([variant="magenta"]) {
            --button-bg: #ff00ff;
            --button-border: none;
            --button-color: var(--background);
            --button-hover-bg: color-mix(in srgb, #ff00ff 85%, black);
        }
        :host([variant="transparent"]) {
            --button-bg: transparent;
            --button-border: none;
            --button-color: var(--color);
            --button-hover-bg: color-mix(in srgb, var(--foreground) 10%, transparent);
        }
        :host([variant="transparent"]) button {
            box-shadow: none;
        }
        :host([variant="noise"]) {
            --button-bg: #000;
            --button-border: none;
            --button-color: #fff;
        }
        button { position: relative; }
        :host([variant="noise"]) button { overflow: hidden; }
        canvas.noise-bg {
            display: none;
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
        }
        :host([variant="noise"]) canvas.noise-bg { display: block; }
        .content { position: relative; z-index: 1; }
        ::slotted(svg) { display: block; }
        :host([variant="noise"]) .content {
            color: #fff;
            text-shadow: 0 1px 0 black, 0 -1px 0 black, -1px 0 0 black, 1px 0 0 black, 0 2px 0 black, 0 -2px 0 black, -2px 0 0 black, 2px 0 0 black, 1px 1px 0 black, -1px -1px 0 black, -1px 1px 0 black, 1px -1px 0 black, 2px 2px 0 black, -2px -2px 0 black, -2px 2px 0 black, 2px -2px 0 black;
        }
        button[type="reset"] {
            background: transparent;
            color: var(--color);
        }
        button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        button:focus-visible {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 0.125rem;
        }
        button:active {
            transform: translateY(2px);
        }
        button:hover:not(:disabled) {
            background: var(--button-hover-bg);
        }
    </style>
    <button part="button">
        <canvas class="noise-bg"></canvas>
        <span class="content"><slot></slot></span>
    </button>
`;

const NOISE_COLORS = ['#00ffff', '#ff00ff', '#ffff00', '#000000', '#ffffff'];
const NOISE_CELL = 2;

class CustomButton extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'type', 'variant'];
    }

    button;
    canvas;
    resizeObserver;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('button');
        this.canvas = shadow.querySelector('canvas.noise-bg');
        this.resizeObserver = new ResizeObserver(() => this.paintNoise());
        this.button.addEventListener('click', () => this.paintNoise());
    }

    connectedCallback() {
        this.sync();
        this.resizeObserver.observe(this.button);
        this.paintNoise();
    }

    disconnectedCallback() {
        this.resizeObserver.disconnect();
    }

    attributeChangedCallback() {
        this.sync();
        this.paintNoise();
    }

    sync() {
        this.button.disabled = this.hasAttribute('disabled');
        if (this.hasAttribute('type')) this.button.setAttribute('type', this.getAttribute('type'));
        else this.button.removeAttribute('type');
    }

    paintNoise() {
        if (this.getAttribute('variant') !== 'noise') return;
        const width = Math.max(1, Math.ceil(this.button.clientWidth / NOISE_CELL));
        const height = Math.max(1, Math.ceil(this.button.clientHeight / NOISE_CELL));
        if (!width || !height) return;
        this.canvas.width = width;
        this.canvas.height = height;
        const ctx = this.canvas.getContext('2d');
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                ctx.fillStyle = NOISE_COLORS[Math.floor(Math.random() * NOISE_COLORS.length)];
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

customElements.define('custom-button', CustomButton);

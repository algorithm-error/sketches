import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: inline-block;
            --button-width: 8em;
        }
        :host([stretch]) { display: block; width: 100%; }
        :host([stretch]) custom-button { width: 100%; }
        custom-button {
            width: var(--button-width);
        }
        custom-button::part(button) {
            width: 100%;
        }
        :host([size="small"]) {
            --button-width: 7em;
        }

        /* Three periods in the button's own font, so they sit on the caption's baseline. */
        .dots,
        .dots > span {
            display: inline;
        }
        .dots > span {
            animation: dot-blink 1.2s infinite;
        }
        .dots > span:nth-child(2) {
            animation-delay: 0.2s;
        }
        .dots > span:nth-child(3) {
            animation-delay: 0.4s;
        }
        @keyframes dot-blink {
            0% { opacity: 0.25; }
            33% { opacity: 1; }
            100% { opacity: 0.25; }
        }

        span { display: none; }

        /* never played, not hovered: neutral "Not playing" */
        :host(:not([playing]):not([was-stopped])) .label-not-playing { display: inline; }

        /* played then stopped, not hovered: neutral "Stopped" */
        :host(:not([playing])[was-stopped]) .label-stopped { display: inline; }

        /* not playing, hovered (either resting state): green "Play" invitation */
        :host(:not([playing]):hover:not([suppress-hover]):not([disabled])) .label-not-playing,
        :host(:not([playing]):hover:not([suppress-hover]):not([disabled])) .label-stopped { display: none; }
        :host(:not([playing]):hover:not([suppress-hover]):not([disabled])) .label-play { display: inline; }
        :host(:not([playing]):hover:not([suppress-hover]):not([disabled])) custom-button {
            --fill: var(--cyan);
            --fill-color: var(--color);
        }

        /* playing, not hovered: green "Playing" confirmation */
        :host([playing]) .label-playing { display: inline; }
        :host([playing]) custom-button {
            --fill: var(--cyan);
            --fill-color: var(--color);
        }

        /* playing, hovered (but not right after a click): red "Stop" invitation */
        :host([playing]:hover:not([suppress-hover]):not([disabled])) .label-playing { display: none; }
        :host([playing]:hover:not([suppress-hover]):not([disabled])) .label-stop { display: inline; }
        :host([playing]:hover:not([suppress-hover]):not([disabled])) custom-button {
            --fill: var(--magenta);
            --fill-color: var(--background);
        }
    </style>
    <custom-button part="button">
        <span class="label-not-playing">Not playing</span>
        <span class="label-stopped">Stopped</span>
        <span class="label-play">Play</span>
        <span class="label-playing">
            Playing<span class="dots" aria-hidden="true">&nbsp;<span>.</span><span>.</span><span>.</span></span>
        </span>
        <span class="label-stop">Stop</span>
    </custom-button>
`;

export class PlayStopButton extends HTMLElement {
    static get observedAttributes() {
        return ['playing', 'disabled', 'size'];
    }

    button;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('custom-button');
        this.button.addEventListener('click', () => {
            if (this.hasAttribute('disabled')) return;
            this.playing = !this.playing;
            this.setAttribute('suppress-hover', '');
            this.dispatchEvent(
                new CustomEvent('change', {
                    detail: { playing: this.playing },
                    bubbles: true,
                    composed: true,
                }),
            );
        });
        this.addEventListener('pointerleave', () => {
            this.removeAttribute('suppress-hover');
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get playing() {
        return this.hasAttribute('playing');
    }

    set playing(v) {
        const next = Boolean(v);
        if (this.playing && !next) this.setAttribute('was-stopped', '');
        this.toggleAttribute('playing', next);
    }

    sync() {
        this.button.toggleAttribute('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('size')) this.button.setAttribute('size', this.getAttribute('size'));
        else this.button.removeAttribute('size');
    }
}

customElements.define('play-stop-button', PlayStopButton);

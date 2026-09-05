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

        .ellipsis {
            display: inline-block;
            vertical-align: -0.02em;
        }
        .ellipsis circle {
            fill: currentColor;
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
            --fill: var(--green);
            --fill-color: var(--color);
        }

        /* playing, not hovered: green "Playing" confirmation */
        :host([playing]) .label-playing { display: inline; }
        :host([playing]) custom-button {
            --fill: var(--green);
            --fill-color: var(--color);
        }

        /* playing, hovered (but not right after a click): red "Stop" invitation */
        :host([playing]:hover:not([suppress-hover]):not([disabled])) .label-playing { display: none; }
        :host([playing]:hover:not([suppress-hover]):not([disabled])) .label-stop { display: inline; }
        :host([playing]:hover:not([suppress-hover]):not([disabled])) custom-button {
            --fill: var(--red);
            --fill-color: var(--background);
        }
    </style>
    <custom-button part="button">
        <span class="label-not-playing">Not playing</span>
        <span class="label-stopped">Stopped</span>
        <span class="label-play">Play</span>
        <span class="label-playing">
            Playing
            <svg class="ellipsis" viewBox="0 0 16 5" width="16" height="5" aria-hidden="true">
                <circle cx="2.5" cy="2.5" r="1.25">
                    <animate attributeName="opacity" values="0.25;1;0.25" keyTimes="0;0.33;1"
                             dur="1.2s" begin="0s" repeatCount="indefinite"></animate>
                </circle>
                <circle cx="8" cy="2.5" r="1.25">
                    <animate attributeName="opacity" values="0.25;1;0.25" keyTimes="0;0.33;1"
                             dur="1.2s" begin="0.2s" repeatCount="indefinite"></animate>
                </circle>
                <circle cx="13.5" cy="2.5" r="1.25">
                    <animate attributeName="opacity" values="0.25;1;0.25" keyTimes="0;0.33;1"
                             dur="1.2s" begin="0.4s" repeatCount="indefinite"></animate>
                </circle>
            </svg>
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

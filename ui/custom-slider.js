const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; font-size: var(--font-size); }
        :host([direction="vertical"]) {
            display: inline-block;
            width: 0.5em;
            height: var(--slider-length, 8em);
        }
        input[type="range"] {
            appearance: none;
            width: 100%;
            height: 0.5em;
            border-radius: 0.125em;
            background: linear-gradient(
                to right,
                var(--fill, var(--primary)) 0%,
                var(--fill, var(--primary)) var(--slider-fill, 0%),
                #dcdcdc var(--slider-fill, 0%),
                #dcdcdc 100%
            );
            margin: 0;
            outline: none;
            cursor: pointer;
        }
        :host([direction="vertical"]) input[type="range"] {
            writing-mode: vertical-lr;
            direction: rtl;
            width: 0.5em;
            height: 100%;
            background: linear-gradient(
                to top,
                var(--fill, var(--primary)) 0%,
                var(--fill, var(--primary)) var(--slider-fill, 0%),
                #dcdcdc var(--slider-fill, 0%),
                #dcdcdc 100%
            );
        }
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 1.125em;
            height: 1.125em;
            border-radius: 50%;
            background: var(--fill, var(--primary));
            cursor: pointer;
        }
        input[type="range"]:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        input[type="range"]:focus-visible {
            outline: 2px solid var(--highlight);
            outline-offset: 3px;
        }
    </style>
    <input type="range" />
`;

const DEFAULT_DEBOUNCE = 100;

export class CustomSlider extends HTMLElement {
    static get observedAttributes() {
        return ['min', 'max', 'step', 'value', 'disabled', 'debounce'];
    }

    input;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input');
        this.input.addEventListener('input', (event) => {
            event.stopPropagation();
            this.updateFill();
            this.emitDebounced('input');
        });
        this.input.addEventListener('change', (event) => {
            event.stopPropagation();
            this.updateFill();
            this.emit('change');
        });
    }

    connectedCallback() {
        this.sync();
    }

    disconnectedCallback() {
        clearTimeout(this.debounceTimer);
    }

    attributeChangedCallback() {
        this.sync();
    }

    get value() {
        return Number(this.input.value);
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    sync() {
        this.input.min = this.getAttribute('min') ?? 0;
        this.input.max = this.getAttribute('max') ?? 100;
        this.input.step = this.getAttribute('step') ?? 1;
        if (this.hasAttribute('value')) this.input.value = this.getAttribute('value');
        this.input.disabled = this.hasAttribute('disabled');
        this.updateFill();
    }

    updateFill() {
        const min = Number(this.input.min);
        const max = Number(this.input.max);
        const value = Number(this.input.value);
        const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
        this.input.style.setProperty('--slider-fill', `${pct}%`);
    }

    emitDebounced(kind) {
        const wait = this.hasAttribute('debounce') ? Number(this.getAttribute('debounce')) : DEFAULT_DEBOUNCE;
        clearTimeout(this.debounceTimer);
        if (!wait) {
            this.emit(kind);
            return;
        }
        this.debounceTimer = setTimeout(() => this.emit(kind), wait);
    }

    emit(kind) {
        const valueEvent = new CustomEvent(kind, {
            detail: { value: this.value },
            bubbles: true,
            composed: true,
        });
        // `value` sits on the event itself too, so handlers can read `event.value`.
        valueEvent.value = this.value;
        this.dispatchEvent(valueEvent);
    }
}

customElements.define('custom-slider', CustomSlider);

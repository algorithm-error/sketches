const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-block; }
        :host([stretch]) { display: block; width: 100%; }
        input {
            width: 100%;
            box-sizing: border-box;
            height: 2rem;
            font-family: var(--monospace);
            font-size: var(--small-font-size);
            color: var(--color);
            background: var(--background);
            border: 1px solid color-mix(in srgb, var(--foreground) 50%, transparent);
            border-radius: 0.25rem;
            padding: 0.375rem 0.5rem;
        }
        :host([size="small"]) input {
            height: 1.5rem;
            font-size: var(--xsmall-font-size);
        }
        input:focus-visible {
            outline: 0.125rem solid var(--highlight);
            outline-offset: 1px;
        }
        input:disabled { opacity: 0.4; cursor: not-allowed; }
    </style>
    <input type="number" />
`;

const DEFAULT_DEBOUNCE = 100;

export class UINumberInput extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled', 'min', 'max', 'step', 'debounce', 'cols', 'wrap'];
    }

    input;
    pressing = false;
    pendingChange = false;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input');
        this.input.addEventListener('input', (event) => {
            event.stopPropagation();
            this.emitDebounced();
        });
        this.input.addEventListener('change', (event) => {
            event.stopPropagation();
            if (this.pressing) {
                this.pendingChange = true;
            } else {
                this.emit('change');
            }
        });
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.emit('change');
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                this.pressing = true;
                if (this.wrapStep(event.key === 'ArrowUp' ? 1 : -1)) {
                    // We moved the value ourselves, so the native step (which would have
                    // stopped at the bound) must not also run. Its input/change events are
                    // gone with it: stand in for both, change on key release as usual.
                    event.preventDefault();
                    this.pendingChange = true;
                    this.emitDebounced();
                }
            }
        });
        this.input.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') this.releasePress();
        });
        this.input.addEventListener('mousedown', () => {
            this.pressing = true;
        });
        window.addEventListener('mouseup', () => {
            if (this.pressing) this.releasePress();
        });
    }

    // A wrapping field has no ends: stepping past one bound continues from the
    // other, so an angle field goes 0 -> 359 on the way down. The range is
    // half-open — max is the same position as min one turn on — so a 0..360 field
    // steps through 359 and back to 0, never landing on 360.
    wrapStep(direction) {
        if (!this.hasAttribute('wrap') || !this.hasAttribute('min') || !this.hasAttribute('max')) return false;
        const min = Number(this.getAttribute('min'));
        const period = Number(this.getAttribute('max')) - min;
        const step = this.hasAttribute('step') ? Number(this.getAttribute('step')) : 1;
        if (!(period > 0) || !(step > 0)) return false;
        const next = Number(this.input.value) + direction * step;
        this.input.value = min + ((((next - min) % period) + period) % period);
        return true;
    }

    releasePress() {
        this.pressing = false;
        if (this.pendingChange) {
            this.pendingChange = false;
            this.emit('change');
        }
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
        if (this.hasAttribute('value')) this.input.value = this.getAttribute('value');
        ['min', 'max', 'step'].forEach((attr) => {
            if (this.hasAttribute(attr)) this.input.setAttribute(attr, this.getAttribute(attr));
        });
        this.input.disabled = this.hasAttribute('disabled');
        // Reserve room for padding, border, and the native spinner button, on top
        // of the digit area itself, so `cols` digits actually fit unclipped.
        this.input.style.width = this.hasAttribute('cols')
            ? `calc(${Number(this.getAttribute('cols'))}ch + 2.5rem)`
            : '';
    }

    emitDebounced() {
        const wait = this.hasAttribute('debounce') ? Number(this.getAttribute('debounce')) : DEFAULT_DEBOUNCE;
        clearTimeout(this.debounceTimer);
        if (!wait) {
            this.emit('input');
            return;
        }
        this.debounceTimer = setTimeout(() => this.emit('input'), wait);
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

customElements.define('numeric-input', UINumberInput);

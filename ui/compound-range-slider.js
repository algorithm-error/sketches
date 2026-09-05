import './numeric-input.js';
import './custom-range-slider.js';
import './help-text.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; font-size: var(--font-size); }
        .head {
            margin-bottom: 0.625em;
            width: 100%;
        }
        .label {
            color: var(--color);
        }
        help-text {
            --size: var(--font-size);
            --line-clamp: 1;
            width: 100%;
        }
        .row {
            display: flex;
            flex-direction: row;
            gap: 0.75em;
            align-items: center;
            width: 100%;
            justify-content: space-between;
        }
        .values {
            display: flex;
            align-items: center;
            gap: 0.25em;
            flex-shrink: 0;
        }
        numeric-input {
            width: 4em;
        }
        .dash {
            color: #767676;
        }
    </style>
    <div class="head">
        <div class="row">
            <label class="label" part="label"></label>
            <span class="values">
                <numeric-input size="small" class="from"></numeric-input>
                <span class="dash">–</span>
                <numeric-input size="small" class="to"></numeric-input>
            </span>
        </div>
        <help-text part="help"></help-text>
    </div>
    <custom-range-slider></custom-range-slider>
`;

// Label + help + a number field per handle, wrapped around custom-range-slider —
// the two-handle counterpart of compound-slider.
export class CompoundRangeSlider extends HTMLElement {
    static get observedAttributes() {
        return ['label', 'help', 'min', 'max', 'step', 'from', 'to', 'decimals', 'size', 'disabled', 'debounce'];
    }

    labelEl;
    helpEl;
    slider;
    fromInput;
    toInput;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
        this.helpEl = shadow.querySelector('help-text');
        this.slider = shadow.querySelector('custom-range-slider');
        this.fromInput = shadow.querySelector('numeric-input.from');
        this.toInput = shadow.querySelector('numeric-input.to');

        this.slider.addEventListener('input', (event) => {
            event.stopPropagation();
            this.setRange(event.detail.from, event.detail.to, { fromSlider: true, silent: true });
        });
        this.slider.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setRange(event.detail.from, event.detail.to, { fromSlider: true });
        });
        this.fromInput.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setRange(Math.min(event.detail.value, this.to), this.to);
        });
        this.toInput.addEventListener('change', (event) => {
            event.stopPropagation();
            this.setRange(this.from, Math.max(event.detail.value, this.from));
        });
    }

    connectedCallback() {
        this.syncAll();
    }

    attributeChangedCallback() {
        this.syncAll();
    }

    get from() {
        return Number(this.getAttribute('from') ?? this.getAttribute('min') ?? 0);
    }

    set from(v) {
        this.setAttribute('from', v);
    }

    get to() {
        return Number(this.getAttribute('to') ?? this.getAttribute('max') ?? 100);
    }

    set to(v) {
        this.setAttribute('to', v);
    }

    get value() {
        return { from: this.from, to: this.to };
    }

    decimals() {
        return Number(this.getAttribute('decimals') || 0);
    }

    syncAll() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        this.helpEl.textContent = this.getAttribute('help') || '';
        [this.fromInput, this.toInput, this.slider].forEach((el) => {
            ['min', 'max', 'step', 'debounce'].forEach((attr) => {
                if (this.hasAttribute(attr)) el.setAttribute(attr, this.getAttribute(attr));
            });
            el.toggleAttribute('disabled', this.hasAttribute('disabled'));
        });
        if (this.hasAttribute('size')) {
            [this.fromInput, this.toInput].forEach((el) => el.setAttribute('size', this.getAttribute('size')));
        }
        this.slider.setAttribute('from', this.from);
        this.slider.setAttribute('to', this.to);
        this.fromInput.setAttribute('value', this.from.toFixed(this.decimals()));
        this.toInput.setAttribute('value', this.to.toFixed(this.decimals()));
    }

    setRange(from, to, { fromSlider, silent } = {}) {
        const next = { from: Number(from), to: Number(to) };
        this.setAttribute('from', next.from);
        this.setAttribute('to', next.to);
        if (!fromSlider) {
            this.slider.setAttribute('from', next.from);
            this.slider.setAttribute('to', next.to);
        }
        this.fromInput.setAttribute('value', next.from.toFixed(this.decimals()));
        this.toInput.setAttribute('value', next.to.toFixed(this.decimals()));
        if (silent) return;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: next,
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('compound-range-slider', CompoundRangeSlider);

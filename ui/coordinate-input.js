import './numeric-input.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            font-size: var(--font-size);
            display: inline-flex;
            gap: 0.5em;
            flex-direction: var(--direction, row);
        }
        :host([stretch]) {
            display: flex;
            width: 100%;
        }
        :host([stretch]) .pair {
            flex: 1;
            width: 100%;
        }
        :host([stretch]) numeric-input {
            flex: 1;
        }
        .pair {
            display: flex;
            align-items: center;
            gap: 0.5em;
            flex-shrink: 0;
        }
        numeric-input {
            flex-shrink: 0;
            min-width: 5em;
        }
        .label {
            color: var(--color);
            font-size: var(--font-size);
            flex-shrink: 0;
            width: 0.5em;
        }
    </style>
    <span class="pair">
        <span class="label" id="label1"></span>
        <numeric-input part="x" id="input1"></numeric-input>
    </span>
    <span class="pair">
        <span class="label" id="label2"></span>
        <numeric-input part="y" id="input2"></numeric-input>
    </span>
`;

const LABELS = {
    cartesian: ['x', 'y'],
    polar: ['r', '∠'],
};

export class CoordinateInput extends HTMLElement {
    static get observedAttributes() {
        return ['x', 'y', 'min', 'max', 'step', 'cols', 'disabled', 'size', 'stretch', 'mode', 'decimals'];
    }

    label1;
    label2;
    input1;
    input2;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.label1 = shadow.querySelector('#label1');
        this.label2 = shadow.querySelector('#label2');
        this.input1 = shadow.querySelector('#input1');
        this.input2 = shadow.querySelector('#input2');

        this.input1.addEventListener('change', (event) => {
            event.stopPropagation();
            this.applyFieldChange(1, event.detail.value);
        });
        this.input2.addEventListener('change', (event) => {
            event.stopPropagation();
            this.applyFieldChange(2, event.detail.value);
        });
    }

    connectedCallback() {
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get x() {
        return Number(this.getAttribute('x') ?? 0);
    }

    set x(v) {
        this.setAttribute('x', v);
    }

    get y() {
        return Number(this.getAttribute('y') ?? 0);
    }

    set y(v) {
        this.setAttribute('y', v);
    }

    get length() {
        return Math.hypot(this.x, this.y);
    }

    get angle() {
        const deg = (Math.atan2(this.y, this.x) * 180) / Math.PI;
        return ((deg % 360) + 360) % 360;
    }

    get mode() {
        return this.getAttribute('mode') === 'polar' ? 'polar' : 'cartesian';
    }

    get value() {
        return `${this.x},${this.y}`;
    }

    // null means "no forced formatting" — grid-editor and other plain
    // integer/raw usages rely on the value passing through unrounded.
    decimals() {
        return this.hasAttribute('decimals') ? Number(this.getAttribute('decimals')) : null;
    }

    applyFieldChange(field, rawValue) {
        const value = Number(rawValue);
        let x;
        let y;
        if (this.mode === 'cartesian') {
            x = field === 1 ? value : this.x;
            y = field === 2 ? value : this.y;
        } else {
            const length = field === 1 ? value : this.length;
            const angle = field === 2 ? value : this.angle;
            const rad = (angle * Math.PI) / 180;
            x = length * Math.cos(rad);
            y = length * Math.sin(rad);
        }
        this.setAttribute('x', x);
        this.setAttribute('y', y);
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { x, y, value: `${x},${y}` },
                bubbles: true,
                composed: true,
            }),
        );
    }

    applyStep(input, step) {
        if (step === null) input.removeAttribute('step');
        else input.setAttribute('step', step);
    }

    sync() {
        const [label1, label2] = LABELS[this.mode];
        this.label1.textContent = label1;
        this.label2.textContent = label2;

        const decimals = this.decimals();
        if (this.mode === 'cartesian') {
            this.input1.setAttribute('value', decimals === null ? this.x : this.x.toFixed(decimals));
            this.input2.setAttribute('value', decimals === null ? this.y : this.y.toFixed(decimals));
            if (this.hasAttribute('min')) this.input1.setAttribute('min', this.getAttribute('min'));
            else this.input1.removeAttribute('min');
            if (this.hasAttribute('max')) this.input1.setAttribute('max', this.getAttribute('max'));
            else this.input1.removeAttribute('max');
            if (this.hasAttribute('min')) this.input2.setAttribute('min', this.getAttribute('min'));
            else this.input2.removeAttribute('min');
            if (this.hasAttribute('max')) this.input2.setAttribute('max', this.getAttribute('max'));
            else this.input2.removeAttribute('max');
            this.input2.toggleAttribute('wrap', false);
        } else {
            this.input1.setAttribute('value', this.length.toFixed(decimals === null ? 4 : decimals));
            this.input2.setAttribute('value', this.angle.toFixed(0));
            this.input1.setAttribute('min', 0);
            if (this.hasAttribute('max')) this.input1.setAttribute('max', this.getAttribute('max'));
            else this.input1.removeAttribute('max');
            this.input2.setAttribute('min', 0);
            this.input2.setAttribute('max', 360);
            // A direction has no ends, so the angle field steps 0 -> 359 rather
            // than stopping at zero. 360 is the same direction as 0, so the
            // field wraps through 359 and never lands on it.
            this.input2.toggleAttribute('wrap', true);
        }

        // In polar mode the second field is whole degrees, so it never takes the
        // value step: a 0.01 step would nudge the angle by less than the
        // toFixed(0) display can show and the field would snap back unchanged.
        this.applyStep(this.input1, this.getAttribute('step'));
        this.applyStep(this.input2, this.mode === 'polar' ? '1' : this.getAttribute('step'));

        [this.input1, this.input2].forEach((input) => {
            if (this.hasAttribute('cols')) input.setAttribute('cols', this.getAttribute('cols'));
            else input.removeAttribute('cols');
            input.toggleAttribute('disabled', this.hasAttribute('disabled'));
            if (this.hasAttribute('size')) input.setAttribute('size', this.getAttribute('size'));
            else input.removeAttribute('size');
            input.toggleAttribute('stretch', this.hasAttribute('stretch'));
        });
    }
}

customElements.define('coordinate-input', CoordinateInput);

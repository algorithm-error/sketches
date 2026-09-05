import './angle-pad.js';
import './numeric-input.js';
import './help-text.js';

const DEFAULT_DEBOUNCE = 100;

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: block; font-size: var(--font-size); }
        .label {
            color: var(--color);
            display: block;
            margin-bottom: 0.625em;
        }
        .body {
            display: flex;
            gap: 0.75em;
            align-items: flex-start;
        }
        .side {
            display: flex;
            flex-direction: column;
            gap: 0.5em;
            align-items: flex-end;
            flex: 1;
        }
        .fields {
            display: flex;
            flex-direction: column;
            gap: 0.5em;
            align-items: flex-end;
        }
        .pair {
            display: flex;
            align-items: center;
            gap: 0.5em;
        }
        .field-label {
            color: var(--color);
            font-size: var(--font-size);
            flex-shrink: 0;
        }
        numeric-input {
            width: 5em;
            flex-shrink: 0;
        }
        help-text {
            width: 100%;
            --line-clamp: 3;
        }
        angle-pad {
            flex-shrink: 0;
        }
    </style>
    <label class="label" part="label"></label>
    <div class="body">
        <angle-pad></angle-pad>
        <div class="side">
            <help-text part="help"></help-text>
            <div class="fields">
                <span class="pair">
                    <span class="field-label" id="field-label-1"></span>
                    <numeric-input part="angle1" id="input1" size="small"></numeric-input>
                </span>
                <span class="pair">
                    <span class="field-label" id="field-label-2"></span>
                    <numeric-input part="angle2" id="input2" size="small"></numeric-input>
                </span>
            </div>
        </div>
    </div>
`;

// The pad always reports every pointer move instantly (debounce forced to 0
// below) so the number fields never lag behind a dragged handle. The
// compound's own "input" event to outside listeners is what respects the
// debounce, kept separate from that sync.
export class CompoundAnglePad extends HTMLElement {
    static get observedAttributes() {
        return [
            'label',
            'help',
            'label1',
            'label2',
            'angle1',
            'angle2',
            'min',
            'max',
            'step',
            'decimals',
            'size',
            'disabled',
            'debounce',
        ];
    }

    labelEl;
    helpEl;
    pad;
    inputs;
    fieldLabels;
    debounceTimer = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.labelEl = shadow.querySelector('.label');
        this.helpEl = shadow.querySelector('help-text');
        this.pad = shadow.querySelector('angle-pad');
        this.pad.setAttribute('debounce', '0');
        this.inputs = [shadow.querySelector('#input1'), shadow.querySelector('#input2')];
        this.fieldLabels = [shadow.querySelector('#field-label-1'), shadow.querySelector('#field-label-2')];

        this.pad.addEventListener('input', (event) => {
            event.stopPropagation();
            this.applyValues(event.detail.angle1, event.detail.angle2, 'input');
        });
        this.pad.addEventListener('change', (event) => {
            event.stopPropagation();
            this.applyValues(event.detail.angle1, event.detail.angle2, 'change');
        });
        this.inputs.forEach((input, index) => {
            input.addEventListener('change', (event) => {
                event.stopPropagation();
                const value = Number(event.detail.value);
                this.applyValues(index === 0 ? value : this.angle1, index === 1 ? value : this.angle2, 'change');
            });
        });
    }

    connectedCallback() {
        this.syncAll();
    }

    disconnectedCallback() {
        clearTimeout(this.debounceTimer);
    }

    attributeChangedCallback() {
        this.syncAll();
    }

    get angle1() {
        return Number(this.getAttribute('angle1') ?? 0);
    }

    set angle1(v) {
        this.setAttribute('angle1', v);
    }

    get angle2() {
        return Number(this.getAttribute('angle2') ?? 0);
    }

    set angle2(v) {
        this.setAttribute('angle2', v);
    }

    decimals() {
        return Number(this.getAttribute('decimals') || 0);
    }

    syncAll() {
        this.labelEl.textContent = this.getAttribute('label') || '';
        this.helpEl.textContent = this.getAttribute('help') || '';
        this.fieldLabels[0].textContent = this.getAttribute('label1') || '∠1';
        this.fieldLabels[1].textContent = this.getAttribute('label2') || '∠2';

        this.pad.setAttribute('angle1', this.angle1);
        this.pad.setAttribute('angle2', this.angle2);
        ['min', 'max', 'step'].forEach((attr) => {
            if (this.hasAttribute(attr)) this.pad.setAttribute(attr, this.getAttribute(attr));
            else this.pad.removeAttribute(attr);
        });
        this.pad.toggleAttribute('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('size')) this.pad.setAttribute('size', this.getAttribute('size'));
        else this.pad.removeAttribute('size');

        // A dial covering a whole turn has no ends, so its fields step 0 -> 359
        // instead of stopping at the bound. The bounds have to reach the input
        // for that (they default to the pad's own 0..360) since the wrap is
        // measured against them.
        const min = this.hasAttribute('min') ? Number(this.getAttribute('min')) : 0;
        const max = this.hasAttribute('max') ? Number(this.getAttribute('max')) : 360;
        const wraps = max - min >= 360;

        const decimals = this.decimals();
        this.inputs.forEach((input, index) => {
            input.setAttribute('value', (index === 0 ? this.angle1 : this.angle2).toFixed(decimals));
            ['min', 'max', 'step'].forEach((attr) => {
                if (this.hasAttribute(attr)) input.setAttribute(attr, this.getAttribute(attr));
                else if (wraps && attr !== 'step') input.setAttribute(attr, attr === 'min' ? min : max);
                else input.removeAttribute(attr);
            });
            input.toggleAttribute('wrap', wraps);
            input.toggleAttribute('disabled', this.hasAttribute('disabled'));
        });
    }

    applyValues(angle1, angle2, kind) {
        this.setAttribute('angle1', angle1);
        this.setAttribute('angle2', angle2);
        if (kind === 'change') this.emit('change');
        else this.emitDebounced('input');
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
        this.dispatchEvent(
            new CustomEvent(kind, {
                detail: { angle1: this.angle1, angle2: this.angle2 },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('compound-angle-pad', CompoundAnglePad);

import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host { display: inline-flex; font-size: var(--font-size); }
        :host([stretch]) { display: flex; }
        :host([stretch]) .group { width: 100%; }
        .group {
            display: inline-flex;
        }
        :host([stretch]) custom-button {
            flex: 1;
        }
        custom-button:first-of-type::part(button) {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            border-right: none;
        }
        custom-button:last-of-type::part(button) {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    </style>
    <div class="group">
        <custom-button variant="accent"><slot name="a"></slot></custom-button>
        <custom-button variant="accent"><slot name="b"></slot></custom-button>
    </div>
`;

export class BinaryToggle extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled', 'stretch', 'size'];
    }

    buttonA;
    buttonB;
    slotA;
    slotB;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        [this.buttonA, this.buttonB] = shadow.querySelectorAll('custom-button');
        [this.slotA, this.slotB] = shadow.querySelectorAll('slot');
        this.buttonA.addEventListener('click', () => this.select(this.names[0]));
        this.buttonB.addEventListener('click', () => this.select(this.names[1]));
    }

    // The two values are the slot names of the light-DOM children, so a toggle can
    // carry the param's own words rather than a and b. Those stay the fallback.
    get names() {
        const slots = [...this.children].map((child) => child.getAttribute('slot')).filter(Boolean);
        return slots.length === 2 ? slots : ['a', 'b'];
    }

    connectedCallback() {
        const [a, b] = this.names;
        this.slotA.setAttribute('name', a);
        this.slotB.setAttribute('name', b);
        this.sync();
    }

    attributeChangedCallback() {
        this.sync();
    }

    get value() {
        const [a, b] = this.names;
        return this.getAttribute('value') === b ? b : a;
    }

    set value(v) {
        this.setAttribute('value', v);
    }

    select(value) {
        if (this.hasAttribute('disabled') || value === this.value) return;
        this.setAttribute('value', value);
        const valueEvent = new CustomEvent('change', {
            detail: { value },
            bubbles: true,
            composed: true,
        });
        // `value` sits on the event itself too, so handlers can read `event.value`.
        valueEvent.value = value;
        this.dispatchEvent(valueEvent);
    }

    sync() {
        const [a, b] = this.names;
        const value = this.value;
        this.buttonA.setAttribute('variant', value === a ? 'accent' : 'outline');
        this.buttonB.setAttribute('variant', value === b ? 'accent' : 'outline');
        [this.buttonA, this.buttonB].forEach((button) => {
            button.toggleAttribute('disabled', this.hasAttribute('disabled'));
            button.toggleAttribute('stretch', this.hasAttribute('stretch'));
            button.setAttribute('size', this.getAttribute('size') || 'regular');
        });
    }
}

customElements.define('binary-toggle', BinaryToggle);

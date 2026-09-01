const DEFAULT_RATIO = 0.5;
const DEFAULT_STEP = 0.01;

// Everything around a pane's content box, all of which sits outside the ratio.
function boxExtras(element) {
    const style = getComputedStyle(element);
    return [
        'padding-left',
        'padding-right',
        'border-left-width',
        'border-right-width',
        'margin-left',
        'margin-right',
    ].reduce((sum, property) => sum + (parseFloat(style.getPropertyValue(property)) || 0), 0);
}

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            position: relative;
            display: flex;
            width: 100%;
            gap: var(--gap, 0);
        }
        /* Flex, not grid: grid-template-columns can't take a calc()ed fr, but
           flex-grow is a plain number, so the ratio stays pure CSS. */
        ::slotted(*) {
            min-width: 0;
        }
        ::slotted(:first-child) {
            flex: var(--ratio, ${DEFAULT_RATIO}) 1 0;
        }
        ::slotted(:nth-child(n + 2)) {
            flex: calc(1 - var(--ratio, ${DEFAULT_RATIO})) 1 0;
        }
        ::slotted(img) {
            object-fit: cover;
        }
        /* Starting guess only: sync() measures the real seam and writes an
           exact left, which also covers panes carrying their own padding. */
        .divider {
            position: absolute;
            top: 0;
            bottom: 0;
            left: calc(var(--ratio, ${DEFAULT_RATIO}) * (100% - var(--gap, 0px)) + var(--gap, 0px) / 2);
            width: var(--handle-width, 0.75rem);
            transform: translateX(-50%);
            pointer-events: none;
        }
        .divider::before {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            border-left: var(--divider, none);
        }
        :host([resizable]) .divider {
            pointer-events: auto;
            cursor: col-resize;
            touch-action: none;
        }
        .divider:focus {
            outline: none;
        }
        .divider:focus-visible {
            outline: 0.125rem solid var(--highlight);
        }
        /* A drag that crosses an iframe or a canvas would otherwise be eaten by
           it, so the panes stop taking pointer events until the drag ends. */
        :host([dragging]) ::slotted(*) {
            pointer-events: none;
            user-select: none;
        }
    </style>
    <slot></slot>
    <div class="divider" role="separator" aria-orientation="vertical"></div>
`;

class VerticalSplit extends HTMLElement {
    static get observedAttributes() {
        return ['resizable', 'min', 'max'];
    }

    divider;
    slot;
    observer;
    dragging = false;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.divider = shadow.querySelector('.divider');
        this.slot = shadow.querySelector('slot');
        this.slot.addEventListener('slotchange', () => this.sync());
        this.divider.addEventListener('pointerdown', (event) => this.startDrag(event));
        this.divider.addEventListener('keydown', (event) => this.onKeydown(event));
    }

    connectedCallback() {
        // The seam is measured, so anything that relays the panes out — the
        // window, a flexing parent — has to trigger a fresh measurement.
        this.observer = new ResizeObserver(() => this.sync());
        this.observer.observe(this);
        this.sync();
    }

    disconnectedCallback() {
        this.observer?.disconnect();
        this.observer = null;
    }

    attributeChangedCallback() {
        this.sync();
    }

    get min() {
        return this.hasAttribute('min') ? Number(this.getAttribute('min')) : 0;
    }

    get max() {
        return this.hasAttribute('max') ? Number(this.getAttribute('max')) : 1;
    }

    get step() {
        return this.hasAttribute('step') ? Number(this.getAttribute('step')) : DEFAULT_STEP;
    }

    // The ratio lives in the CSS variable rather than an attribute, so a split
    // set up in a stylesheet and one dragged by hand read back the same way.
    get ratio() {
        const raw = getComputedStyle(this).getPropertyValue('--ratio').trim();
        const value = Number(raw);
        return raw === '' || !Number.isFinite(value) ? DEFAULT_RATIO : value;
    }

    set ratio(value) {
        this.style.setProperty('--ratio', this.clamp(value));
        this.sync();
    }

    startDrag(event) {
        if (!this.hasAttribute('resizable')) return;
        event.preventDefault();
        this.dragging = true;
        this.toggleAttribute('dragging', true);
        // Capture keeps a drag that leaves the split alive; not every pointer
        // can be captured, and failing to is no reason to drop the drag.
        try {
            this.divider.setPointerCapture(event.pointerId);
        } catch (error) {
            // ignored on purpose
        }

        const onMove = (e) => {
            if (this.dragging) this.updateFromPointer(e);
        };
        const onUp = (e) => {
            if (!this.dragging) return;
            this.dragging = false;
            this.removeAttribute('dragging');
            this.updateFromPointer(e);
            this.emit('change');
            this.divider.removeEventListener('pointermove', onMove);
            this.divider.removeEventListener('pointerup', onUp);
            this.divider.removeEventListener('pointercancel', onUp);
        };
        this.divider.addEventListener('pointermove', onMove);
        this.divider.addEventListener('pointerup', onUp);
        this.divider.addEventListener('pointercancel', onUp);
    }

    updateFromPointer(event) {
        const rect = this.getBoundingClientRect();
        const panes = this.panes();
        const gap = this.gap();
        // flex-basis is 0, so a pane's base size is only its own padding,
        // border and margins; the ratio divides what is left after those.
        const first = panes[0] ? boxExtras(panes[0]) : 0;
        const rest = panes.slice(1).reduce((sum, pane) => sum + boxExtras(pane), 0);
        const free = rect.width - gap - first - rest;
        if (free <= 0) return;
        this.ratio = (event.clientX - rect.left - gap / 2 - first) / free;
        this.emit('input');
    }

    onKeydown(event) {
        if (!this.hasAttribute('resizable')) return;
        if (event.key === 'ArrowRight') {
            this.ratio = this.ratio + this.step;
        } else if (event.key === 'ArrowLeft') {
            this.ratio = this.ratio - this.step;
        } else if (event.key === 'Home') {
            this.ratio = this.min;
        } else if (event.key === 'End') {
            this.ratio = this.max;
        } else {
            return;
        }
        event.preventDefault();
        this.emit('input');
        this.emit('change');
    }

    clamp(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return DEFAULT_RATIO;
        return Math.min(this.max, Math.max(this.min, number));
    }

    panes() {
        return this.slot.assignedElements();
    }

    gap() {
        return parseFloat(getComputedStyle(this).gap) || 0;
    }

    sync() {
        const panes = this.panes();
        if (panes.length > 1) {
            const seam = panes[0].getBoundingClientRect().right - this.getBoundingClientRect().left;
            this.divider.style.left = `${seam + this.gap() / 2}px`;
        } else {
            this.divider.style.left = '';
        }
        const resizable = this.hasAttribute('resizable');
        this.divider.tabIndex = resizable ? 0 : -1;
        this.divider.setAttribute('aria-valuenow', Math.round(this.ratio * 100));
        this.divider.setAttribute('aria-valuemin', Math.round(this.min * 100));
        this.divider.setAttribute('aria-valuemax', Math.round(this.max * 100));
    }

    emit(kind) {
        this.dispatchEvent(
            new CustomEvent(kind, {
                detail: { ratio: this.ratio },
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('vertical-split', VerticalSplit);

export { VerticalSplit };

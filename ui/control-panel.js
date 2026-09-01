import './custom-button.js';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            position: absolute;
            display: flex;
            flex-direction: column;
            --panel-bg-white: color-mix(in srgb, var(--background) 95%, transparent);
            --panel-bg-gray: rgba(230, 230, 230, 0.95);
            --emboss: false;
            /* Grip dot tones, top-left lit; see .grip below. */
            --dot-background: color-mix(in srgb, var(--black) 10%, transparent);
            --dot-top-left: color-mix(in srgb, var(--black) 10%, transparent);
            --dot-bottom-right: color-mix(in srgb, var(--black) 50%, transparent);
            background: var(--panel-bg-white);
            width: 19rem;
        }
        /* Raised the way a button is: a hairline and an offset shadow, not a bevel. */
        :host(.emboss) {
            box-sizing: border-box;
            border: 1px solid color-mix(in srgb, var(--foreground) 30%, transparent);
            border-radius: 1px;
            box-shadow: 2px 2px 0 color-mix(in srgb, var(--foreground) 25%, transparent);
        }
        .content {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            padding: 1rem;
            box-sizing: border-box;
        }
        :host([variant="gray"]) {
            background: var(--panel-bg-gray);
        }
        :host([narrow]) {
            width: 16rem;
        }
        /* A row of controls needs width a phone does not have, so the layout below is
           the wide one. The attribute stays either way; only the rendering answers to
           the medium. */
        @media (hover: hover) {
            :host([horizontal]) {
                width: auto;
            }
            :host([horizontal]) .content {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: flex-start;
                gap: 1.5rem;
            }
        }
        /* A vertical panel gives its controls exactly 17rem (19rem, less the 1rem
           of content padding on each side), so a horizontal column defaults to the
           same width — a control is laid out identically in either orientation.
           Override per child with an inline flex value where a group needs more or less. */
        :host([horizontal]) ::slotted(*) {
            flex: 0 0 17rem;
        }
        /* custom-fieldset bleeds 0.75rem into the panel's padding on each side,
           which only reads as intentional against a panel edge; in a row it just
           eats the gap. Pull the bleed back and widen the box by the same amount,
           so what sits inside the fieldset still measures 17rem. */
        :host([horizontal]) ::slotted(custom-fieldset) {
            flex: 0 0 18.5rem;
            margin-left: 0;
            margin-right: 0;
        }
        /* Centering for a panel the page doesn't give a width to: the two offsets
           fix both edges, so the auto margins share whatever the controls don't
           use and the panel lands in the middle. Once it no longer fits, the
           margins collapse to zero and it falls back to sitting at the left
           offset, spanning the gap and wrapping. Both offsets come from --offset;
           set left (or right) on the panel from the page to override one side. */
        :host([center]) {
            /* The emboss border sits outside the width, so the fallback would
               overhang the right offset by it without this. */
            box-sizing: border-box;
            left: var(--offset, 1rem);
            right: var(--offset, 1rem);
            max-width: calc(100% - var(--offset, 1rem) * 2);
            margin-inline: auto;
        }
        :host([horizontal][center]) {
            width: max-content;
        }
        /* Pinned to a top corner, --offset from the edges — the same offset [center]
           holds itself away from them. */
        :host([placement]) {
            box-sizing: border-box;
            position: fixed;
            top: var(--offset, 1rem);
            max-height: calc(100dvh - var(--offset, 1rem) * 2);
        }
        :host([placement="left"]) {
            left: var(--offset, 1rem);
        }
        :host([placement="right"]) {
            right: var(--offset, 1rem);
        }
        /* After the [placement] rule above, so it wins the top it sets. */
        :host([placement="bottom"]) {
            top: auto;
            bottom: var(--offset, 1rem);
        }
        /* On a phone the panel starts halfway down the sketch and runs as long as it
           needs. Absolute, not fixed, so the page scrolls to the rest of it instead of
           the panel scrolling inside itself. */
        @media (hover: none) {
            :host([placement]) {
                position: absolute;
                top: 50vh;
                bottom: auto;
                left: var(--offset, 1rem);
                right: var(--offset, 1rem);
                margin-inline: auto;
                max-width: calc(100% - var(--offset, 1rem) * 2);
                max-height: none;
            }
        }
        .header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            overflow: hidden;
            padding: 0 2rem;
            flex: 0 0 auto;
            height: 2rem;
            cursor: grab;
            user-select: none;
            touch-action: none;
            background: color-mix(in srgb, var(--black) 5%, transparent);
        }
        /* Drag grip: four pairs of embossed dots flanking the heading. One dot
           is the 6x6 pixel ring below: a disc in --dot-background, with its
           top-left pixels overpainted in --dot-top-left and its bottom-right ones
           in --dot-bottom-right, which lights it from the top left. Each tone is a
           separate layer masked by an SVG of whole-pixel rects, so the colours stay
           plain CSS vars and the dots stay crisp at any tone. Override the three
           vars on the panel to retune the emboss. */
        .grip {
            position: relative;
            flex: 0 0 auto;
            width: 24px;
            height: 12px;
            background-color: var(--dot-background);
            -webkit-mask: var(--dot-disc) 0 0 / 6px 6px repeat;
            mask: var(--dot-disc) 0 0 / 6px 6px repeat;
            --dot-disc: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='6'%20height='6'%20viewBox='0%200%206%206'%3E%3Cg%20fill='%23000'%3E%3Crect%20x='2'%20y='1'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='1'%20width='1'%20height='1'/%3E%3Crect%20x='1'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='2'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='4'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='1'%20y='3'%20width='1'%20height='1'/%3E%3Crect%20x='2'%20y='3'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='3'%20width='1'%20height='1'/%3E%3Crect%20x='4'%20y='3'%20width='1'%20height='1'/%3E%3Crect%20x='2'%20y='4'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='4'%20width='1'%20height='1'/%3E%3C/g%3E%3C/svg%3E");
        }
        .grip::before,
        .grip::after {
            content: "";
            position: absolute;
            inset: 0;
        }
        .grip::before {
            background-color: var(--dot-top-left);
            -webkit-mask: var(--dot-arc-top-left) 0 0 / 6px 6px repeat;
            mask: var(--dot-arc-top-left) 0 0 / 6px 6px repeat;
            --dot-arc-top-left: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='6'%20height='6'%20viewBox='0%200%206%206'%3E%3Cg%20fill='%23000'%3E%3Crect%20x='2'%20y='1'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='1'%20width='1'%20height='1'/%3E%3Crect%20x='1'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='1'%20y='3'%20width='1'%20height='1'/%3E%3C/g%3E%3C/svg%3E");
        }
        .grip::after {
            background-color: var(--dot-bottom-right);
            -webkit-mask: var(--dot-arc-bottom-right) 0 0 / 6px 6px repeat;
            mask: var(--dot-arc-bottom-right) 0 0 / 6px 6px repeat;
            --dot-arc-bottom-right: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='6'%20height='6'%20viewBox='0%200%206%206'%3E%3Cg%20fill='%23000'%3E%3Crect%20x='4'%20y='2'%20width='1'%20height='1'/%3E%3Crect%20x='4'%20y='3'%20width='1'%20height='1'/%3E%3Crect%20x='2'%20y='4'%20width='1'%20height='1'/%3E%3Crect%20x='3'%20y='4'%20width='1'%20height='1'/%3E%3C/g%3E%3C/svg%3E");
        }
        .header.dragging {
            cursor: grabbing;
        }
        :host([variant="gray"]) .header {
            background: color-mix(in srgb, var(--foreground) 20%, white);
        }
        .heading {
            font-family: var(--monospace);
            font-size: var(--small-font-size);
            line-height: var(--line-height);
            text-transform: uppercase;
            white-space: nowrap;
        }
        custom-button.toggle {
            display: none;
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
        }
        /* No header: nothing to grab, so the panel cannot be dragged or collapsed.
           Only where there is a pointer to grab with — on touch the header stays, or
           there would be no way to fold the panel away. */
        @media (hover: hover) {
            :host([fixed]) .header {
                display: none;
            }
        }
        :host([collapsed]) {
            width: auto;
            padding: 0;
            background: transparent;
        }
        :host([collapsed]) .header,
        :host([collapsed]) .content {
            display: none;
        }
        /* Collapsed, the panel is only this button, so the margins put it where the
           collapse button it replaces was: the same inset from the panel's anchored
           edge, and centred on the 2rem header it stands in for. */
        :host([collapsed]) custom-button.toggle {
            display: inline-block;
            position: static;
            margin: 0.25rem calc(0.2rem + 2px);
        }
        .collapse {
            position: absolute;
            top: -2px;
            bottom: 0;
            right: calc(0.2rem + 2px);
            margin: auto;
        }
        /* Outer side, as the window controls sit on a mac. */
        :host([placement="left"]) .collapse {
            right: auto;
            left: calc(0.2rem + 2px);
        }
        custom-fieldset {
            margin: 0.75rem -0.75rem 0 -0.75rem;
        }
    </style>
    <div class="header">
        <span class="grip"></span>
        <span class="heading"></span>
        <span class="grip"></span>
        <custom-button class="collapse" size="small" variant="white" icon title="Collapse control panel">
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-440v-80h560v80H200Z"/></svg>
        </custom-button>
    </div>
    <custom-button class="toggle" size="small" variant="accent" icon title="Show control panel">&hellip;</custom-button>
    <div class="content">
        <slot></slot>
    </div>
`;

class ControlPanel extends HTMLElement {
    static get observedAttributes() {
        return ['collapsed', 'title'];
    }

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        shadow.querySelector('custom-button.toggle').addEventListener('click', () => {
            this.collapsed = false;
        });
        shadow.querySelector('custom-button.collapse').addEventListener('click', () => {
            this.collapsed = true;
        });
        this.headingEl = shadow.querySelector('.heading');

        const header = shadow.querySelector('.header');
        let startX, startY, startLeft, startTop;

        header.addEventListener('pointerdown', (event) => {
            if (event.target.closest('custom-button')) return;
            header.setPointerCapture(event.pointerId);
            header.classList.add('dragging');
            startX = event.clientX;
            startY = event.clientY;
            const style = getComputedStyle(this);
            startLeft = parseFloat(style.left) || 0;
            startTop = parseFloat(style.top) || 0;
            this.style.right = 'auto';
            this.style.bottom = 'auto';
        });
        header.addEventListener('pointermove', (event) => {
            if (!header.hasPointerCapture(event.pointerId)) return;
            this.style.left = `${startLeft + event.clientX - startX}px`;
            this.style.top = `${startTop + event.clientY - startY}px`;
        });
        header.addEventListener('pointerup', (event) => {
            header.releasePointerCapture(event.pointerId);
            header.classList.remove('dragging');
        });
    }

    connectedCallback() {
        this.syncHeading();
        this.syncEmboss();
    }

    syncEmboss() {
        const raw = getComputedStyle(this).getPropertyValue('--emboss').trim();
        this.classList.toggle('emboss', raw === 'true');
    }

    attributeChangedCallback(name) {
        if (name === 'title') this.syncHeading();
    }

    syncHeading() {
        this.headingEl.textContent = this.title;
    }

    get collapsed() {
        return this.hasAttribute('collapsed');
    }

    set collapsed(value) {
        if (value) {
            const style = getComputedStyle(this);
            // Keep the collapsed button on the side the panel was pinned to.
            if (this.getAttribute('placement') === 'left') {
                this.style.left = `${parseFloat(style.left) || 0}px`;
                this.style.right = 'auto';
            } else {
                this.style.right = `${parseFloat(style.right) || 0}px`;
                this.style.left = 'auto';
            }
            this.setAttribute('collapsed', '');
        } else {
            this.removeAttribute('collapsed');
        }
    }

    get title() {
        return this.getAttribute('title') || 'Control panel';
    }

    set title(value) {
        if (value) this.setAttribute('title', value);
        else this.removeAttribute('title');
    }
}

customElements.define('control-panel', ControlPanel);

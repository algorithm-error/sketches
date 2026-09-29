// A sketch embedded in an article. Loads its iframe once, with the seed and panel already
// in the url, so nothing reloads it afterwards. loading="lazy" waits until it is near the screen.

const small = matchMedia('(max-width: 48rem)').matches;

const observer = new IntersectionObserver(
    (entries) => {
        for (const { isIntersecting, target } of entries) {
            if (!isIntersecting) continue;
            observer.unobserve(target);
            target.load();
        }
    },
    { rootMargin: '200px' },
);

class SketchFrame extends HTMLElement {
    static observedAttributes = ['src'];

    iframe = document.createElement('iframe');
    seed = Date.now();
    loaded = false;

    connectedCallback() {
        if (this.iframe.isConnected) return;
        // Moved to the iframe so the host does not show it as a tooltip.
        this.iframe.title = this.title;
        this.iframe.scrolling = 'no';
        this.removeAttribute('title');
        this.append(this.iframe);
        if (this.editable) this.addOpenButton();
        if (this.getAttribute('loading') === 'lazy') observer.observe(this);
        else this.load();
    }

    attributeChangedCallback() {
        if (this.loaded) this.load();
    }

    // Sketches with a panel get an "Open in new tab" button. There is no room for the
    // panel beside a figure on a small screen, so there the figure shows none and
    // gets Seed and Edit buttons instead.
    get editable() {
        return /panel=(true|fixed)/.test(this.getAttribute('src'));
    }

    url(panel) {
        const url = new URL(this.getAttribute('src'), document.baseURI);
        if (this.hasAttribute('random-seed')) url.searchParams.set('seed', this.seed);
        if (panel) url.searchParams.set('panel', panel);
        return url.href;
    }

    random() {
        this.seed = Date.now();
        this.setAttribute('random-seed', '');
        this.load();
    }

    load() {
        this.loaded = true;
        this.iframe.src = this.url(small && this.editable ? 'false' : undefined);
    }

    addOpenButton() {
        this.after(
            frameButtons(
                () => window.open(this.url('true'), '_blank', 'noopener'),
                () => this.random(),
            ),
        );
    }
}

const newTabIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.1429em" height="1.1429em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; position: relative; top: -0.0571em"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

function frameButtons(open, random) {
    const theme = document.createElement('control-theme');
    if (!small) {
        const button = document.createElement('control-button');
        button.setAttribute('variant', 'white');
        button.setAttribute('size', 'small');
        button.textContent = 'Open in new tab';
        button.addEventListener('click', open);
        theme.append(button);
        return theme;
    }
    const randomButton = document.createElement('random-seed-button');
    randomButton.setAttribute('variant', 'noise');
    randomButton.setAttribute('size', 'small');
    randomButton.textContent = 'Seed';
    randomButton.addEventListener('click', random);
    const editButton = document.createElement('control-button');
    editButton.setAttribute('size', 'small');
    editButton.innerHTML = `Edit ${newTabIcon}`;
    editButton.addEventListener('click', open);
    theme.append(randomButton, editButton);
    return theme;
}

customElements.define('sketch-frame', SketchFrame);

export { SketchFrame, frameButtons };

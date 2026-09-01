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
        // Pins to stable (but possibly inaccurate) height. This avoids runtime resize especially on phones.
        // svh and friends are unreliable: for example, Telegram in-app browser changes them in runtime.
        // TODO Add a test for height freezing
        if (this.offsetHeight) this.style.height = `${this.offsetHeight}px`;
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
    // panel beside a figure on a small screen, so there the figure shows none.
    get editable() {
        return /panel=(true|fixed)/.test(this.getAttribute('src'));
    }

    url(panel) {
        const url = new URL(this.getAttribute('src'), document.baseURI);
        if (this.hasAttribute('random-seed')) url.searchParams.set('seed', this.seed);
        if (panel) url.searchParams.set('panel', panel);
        return url.href;
    }

    load() {
        this.loaded = true;
        this.iframe.src = this.url(small && this.editable ? 'false' : undefined);
    }

    addOpenButton() {
        const button = document.createElement('control-button');
        button.setAttribute('variant', 'white');
        button.setAttribute('size', 'small');
        button.textContent = small ? 'Open in new tab to edit' : 'Open in new tab';
        button.addEventListener('click', () => window.open(this.url('true'), '_blank', 'noopener'));
        const theme = document.createElement('control-theme');
        theme.append(button);
        this.after(theme);
    }
}

customElements.define('sketch-frame', SketchFrame);

export { SketchFrame };

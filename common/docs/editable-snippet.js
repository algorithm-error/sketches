function dedent(text) {
    const lines = text.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
    const indent = indents.length ? Math.min(...indents) : 0;
    return lines.map((line) => line.slice(indent)).join('\n');
}

/** JSON.stringify, but small leaf objects such as {x, y} stay on one line */
export function serialize(value) {
    return JSON.stringify(value, null, 4).replace(/\{[^{}]*\}/g, (object) => {
        const inline = `{ ${object
            .slice(1, -1)
            .trim()
            .split(/\s*\n\s*/)
            .join(' ')} }`;
        return inline.length <= 48 ? inline : object;
    });
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--monospace);
      color: var(--color);
      background: var(--background);
      color-scheme: light;
      padding: 1rem;
      resize: vertical;
    }
    .error {
      font-family: var(--font-family);
      font-size: 0.875rem;
      color: #c0392b;
      min-height: 1.25em;
      margin-top: 0.25rem;
    }
  </style>
  <textarea spellcheck="false" autocomplete="off"></textarea>
  <div class="error"></div>
`;

/**
 * An editable JSON snippet. Set `element.value` to fill it, listen for `change` to get the
 * parsed value back. Invalid JSON shows an error and fires nothing, so the last good value stays.
 */
class EditableSnippet extends HTMLElement {
    static get observedAttributes() {
        return ['rows'];
    }

    connectedCallback() {
        if (this.shadowRoot) {
            return;
        }
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.textarea = shadow.querySelector('textarea');
        this.errorElement = shadow.querySelector('.error');
        this.delay = Number(this.getAttribute('delay')) || 400;

        const initial = this.pending !== undefined ? this.pending : this.parseText(this.textContent);
        if (initial !== undefined) {
            this.value = initial;
        }

        this.textarea.addEventListener('input', () => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.commit(), this.delay);
        });
        this.textarea.addEventListener('blur', () => {
            clearTimeout(this.timeout);
            this.commit();
        });
    }

    parseText(text) {
        if (!text || !text.trim()) {
            return undefined;
        }
        try {
            return JSON.parse(dedent(text));
        } catch (error) {
            return undefined;
        }
    }

    /** The parsed value currently held by the snippet */
    get value() {
        return this.current;
    }

    set value(value) {
        this.current = value;
        if (!this.textarea) {
            this.pending = value;
            return;
        }
        this.setText(serialize(value));
        this.errorElement.textContent = '';
    }

    setText(text) {
        this.textarea.value = text;
        const maximum = Number(this.getAttribute('rows')) || 18;
        this.textarea.rows = Math.min(maximum, text.split('\n').length);
    }

    commit() {
        let value;
        try {
            value = JSON.parse(this.textarea.value);
        } catch (error) {
            this.errorElement.textContent = error.message;
            return;
        }
        this.errorElement.textContent = '';
        this.current = value;
        this.dispatchEvent(new CustomEvent('change', { detail: value }));
    }
}

customElements.define('editable-snippet', EditableSnippet);

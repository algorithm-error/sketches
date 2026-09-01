function dedent(text) {
    const lines = text.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
    const indent = indents.length ? Math.min(...indents) : 0;
    return lines.map((line) => line.slice(indent)).join('\n');
}

const VOID_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

function formatAttributes(el) {
    return [...el.attributes].map((attr) => (attr.value === '' ? attr.name : `${attr.name}="${attr.value}"`)).join(' ');
}

function formatNode(node, depth) {
    const indent = '    '.repeat(depth);

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        return text ? `${indent}${text}` : '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toLowerCase();
    const attrs = formatAttributes(node);
    const attrSuffix = attrs ? ` ${attrs}` : '';

    if (VOID_ELEMENTS.has(tag)) {
        return `${indent}<${tag}${attrSuffix}/>`;
    }

    const openTag = `<${tag}${attrSuffix}>`;
    const closeTag = `</${tag}>`;

    const onlyChild = node.childNodes.length === 1 ? node.childNodes[0] : null;
    if (onlyChild && onlyChild.nodeType === Node.TEXT_NODE) {
        const text = onlyChild.textContent.trim();
        return `${indent}${openTag}${text}${closeTag}`;
    }

    const children = [...node.childNodes].map((child) => formatNode(child, depth + 1)).filter((line) => line !== '');

    if (children.length === 0) return `${indent}${openTag}${closeTag}`;

    return [`${indent}${openTag}`, ...children, `${indent}${closeTag}`].join('\n');
}

function markupOf(demo) {
    const target = demo.firstElementChild || demo;
    const clone = target.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    return formatNode(clone, 0);
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
    }
  </style>
  <textarea readonly></textarea>
`;

class CodeSnippet extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) return;
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        const demo = this.previousElementSibling;
        const code = demo ? markupOf(demo) : dedent(this.textContent);
        const textarea = shadow.querySelector('textarea');
        textarea.value = code;
        textarea.rows = code.split('\n').length;
    }
}

customElements.define('code-snippet', CodeSnippet);

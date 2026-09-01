const pages = [
    { slug: 'custom-button', title: 'Button' },
    { slug: 'binary-toggle', title: 'Binary toggle' },
    { slug: 'play-stop-button', title: 'Play/stop button' },
    { slug: 'apply-button', title: 'Apply button' },
    { slug: 'acknowledge-button', title: 'Acknowledge button' },
    { slug: 'random-seed-button', title: 'Random seed button' },
    { slug: 'numeric-input', title: 'Number input' },
    { slug: 'size-input', title: 'Size input' },
    { slug: 'coordinate-input', title: 'Coordinate input' },
    { slug: 'custom-select', title: 'Select' },
    { slug: 'custom-slider', title: 'Slider' },
    { slug: 'custom-range-slider', title: 'Range slider' },
    { slug: 'angle-slider', title: 'Angle slider' },
    { slug: 'angle-pad', title: 'Angle pad' },
    { slug: 'vector-pad', title: 'Vector pad' },
    { slug: 'vector-slider', title: 'Vector slider' },
    { slug: 'custom-toggle', title: 'Toggle' },
    { slug: 'labeled-radio', title: 'Labeled radio' },
    { slug: 'labeled-radio-group', title: 'Labeled radio group' },
    { slug: 'color-swatches', title: 'Color swatch group' },
    { slug: 'labeled-select', title: 'Labeled select' },
    { slug: 'labeled-input', title: 'Labeled input' },
    { slug: 'labeled-numeric-input', title: 'Labeled number input' },
    { slug: 'compound-slider', title: 'Compound slider' },
    { slug: 'compound-range-slider', title: 'Compound range slider' },
    { slug: 'compound-angle-pad', title: 'Compound angle pad' },
    { slug: 'compound-angle-slider', title: 'Compound angle slider' },
    { slug: 'custom-fieldset', title: 'Fieldset' },
    { slug: 'control-panel', title: 'Panel' },
    { slug: 'control-row', title: 'Control row' },
    { slug: 'control-column', title: 'Control column' },
    { slug: 'control-grid', title: 'Control grid' },
    { slug: 'custom-grid', title: 'Grid' },
    { slug: 'vertical-split', title: 'Vertical split' },
    { slug: 'custom-theme', title: 'Theme' },
];

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
    .brand {
      font-weight: 600;
      font-size: 1.125rem;
    }
    .subheader {
      color: #767676;
      margin-bottom: 1.5rem;
    }
    ul { list-style: none; margin: 0; padding: 0; }
    li + li { margin-top: 0.4rem; }
    a { color: inherit; }
    a[aria-current="page"] { font-weight: 600; text-decoration: none; }
  </style>
  <div class="brand">UI kit</div>
  <div class="subheader">Component docs</div>
  <nav><ul></ul></nav>
`;

class DocsSidebar extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        const list = shadow.querySelector('ul');
        const current = this.getAttribute('current');
        pages.forEach((page) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `${page.slug}.html`;
            a.textContent = page.title;
            if (page.slug === current) a.setAttribute('aria-current', 'page');
            li.appendChild(a);
            list.appendChild(li);
        });
    }
}

customElements.define('docs-sidebar', DocsSidebar);

# UI Kit

Guidance for components in this directory (see also the "UI Kit" section in the root CLAUDE.md).

## Attributes vs. CSS variables

- HTML attributes are for data: values, state, config that affects behavior (`value`, `min`, `max`, `disabled`, `label`).
- CSS custom properties (`--foo`) are for look/layout: sizing, columns, colors, spacing — anything that only changes appearance.
- Read CSS vars via `getComputedStyle(this).getPropertyValue('--foo')`, with a sensible default when unset.

Example: `control-row`'s `--columns` var controls layout (grid column count, or `none` for a plain flex row), not an HTML attribute.

# Working in this repo

## Dev server

Sketches are static files, served with `yarn serve` (http-server on 8123).

**This repo uses yarn, and dependency versions are pinned exact** — no `^` or `~` ranges
in package.json. Do not reintroduce them.

**Never stop a dev server you did not start.** If one is already running on the port
you need, use it. Only kill a server that you started yourself in this session, and
prefer leaving it running — the user usually has it open in a browser.

## Commits

**Commit as Anna, credit yourself as co-author.** Keep the default git identity as the
author and end the message with a `Co-Authored-By: Claude …` line; that line is the
provenance record for agent work. Vercel refuses to deploy a commit whose author email
is not a GitHub account with access to the project, so `--author="Claude <noreply@anthropic.com>"`
blocks every deploy until the next commit.

**Never mix hands in one commit.** The co-author line covers the whole commit, so a
commit holding both Anna's edits and yours credits you with her work too. If the
working tree has both, stage and commit them separately.

This is about authorship of identifiable work, not about every changed line. A number
Anna nudged in a css file, a renamed variable, a typo she fixed while reading — none of
that is hers in any way worth recording, so sweep it into your commit and move on. Split
the commit when her change is something a person could point at later and say she wrote
it: a rule she added, a function, a paragraph of prose, a decision the code now encodes.
When it is genuinely unclear, ask rather than stall.

## Comments

**Sketches don't carry a lot of comments.** `attractors/*.html` and the other sketch pages are
kept bare. Code in `common/` and `ui/` is library code and is commented normally.

**Keep comments to one or two lines.** A long comment block carries weight it has not
earned here. In a large codebase a five-line comment signals that something load-bearing
breaks if you get this wrong, and it is worth reading carefully — spending that attention
on a sketch is a waste, and writing one here is a false alarm.

Comment only what the code cannot say: a constant chosen by eye, a non-obvious physical
or visual reason, a workaround for a real quirk. Do not narrate structure, restate what
the next line does, or explain a design decision at length. If an explanation genuinely
needs paragraphs, it belongs in the answer to the person asking, not in the file.

Write them plainly. No metaphor, no personification, no rhetorical framing — say
what is true. "The toggle speaks in slot names, the sketch in source names" should
be "toggle value is a or b, param is grid or mesh".

## Vanilla

**This is a plain repo. Write the obvious version.** Static HTML, CSS and ES modules,
no build step and no framework. Prefer the boring solution that a person reading the
file can follow without stopping.

Do not reach across an iframe boundary, poll, or hook events to keep something in
sync. Set the value once and move on:

```js
// no
figure.addEventListener('pointerenter', () => {
    try {
        link.href = iframe.contentWindow.location.href;
    } catch {}
});

// yes
link.href = iframe.src;
```

**Do not add markup to hang styles on.** No wrapper `div.frame` around an iframe.
Style the elements already there — `figure`, `iframe`, `figcaption` — or give the
one element a class.

## Parameters

**A sketch with parameters is driven by `SketchDriver`.** Give it the defaults, the
controls and a render callback; it owns the url, the panel and the redraw. Writing
`driver.values.seed` is the only entry point — the address bar, the control, the
subscribers and the next draw all follow from it. Do not read `location.search`,
listen to controls, or push history by hand.

**`p5.draw` takes the values and is a function of them.** Same params in, same image
out, whatever ran before it. Seed from `values.seed`, clear the canvas, and rebuild
what you derive. State left over from the last call is a bug: a second draw with the
same params has to produce the same picture.

```js
// no
let g = 25;
slider.addEventListener('change', (event) => {
    g = event.value;
    p5.redraw();
});
p5.draw = () => {
    curves.push(trace(g));
};

// yes
p5.draw = (values = defaults) => {
    const { seed, g } = values;
    p5.randomSeed(seed);
    p5.background(255);
    curves = trace(g);
};
```

`p5.noLoop()` in setup: draw runs when the driver asks for it, not on a frame clock.

**A sketch returns an api, not a p5 instance.** `initialize` declares the api as
no-op stubs, the instance fills them in, and it is returned. `rerender` and `remove`
are always there, `save` wherever there is something to export, `stop` and `play` for
a sketch that animates, and whatever else the page needs — `copySVG`, a seed. The
stubs are what makes a control clicked before setup a no-op instead of a crash.

```js
const sketch = (function initialize(p5, root, defaults = {}) {
    const api = { remove: () => {}, rerender: () => {}, save: () => {} };
    new p5((p5) => {
        api.rerender = (next) => p5.draw(next);
        api.save = (name) => {
            /* ... */
        };
    }, root);
    return api;
})(P5, document.body, defaults);
```

That api is the whole surface between the driver and the sketch: the render callback
is `(values) => sketch.rerender(values)`, and a save button calls `sketch.save()`.

## UI kit

**Every component sizes in em off `--font-size`.** Set `font-size: var(--font-size)`
on `:host`, and `font-size: inherit` on any native `input`, `select` or `button`
inside it — browsers give those their own small font size, so em inside them
(a slider thumb, a radio) comes out smaller, and smaller still on iOS.

## CSS

**Style the minimum.** A few declarations that do the job, not a full treatment of
every state. Reach for `display: none` before `opacity`, `pointer-events` and a
`transition` that each need their own line.

**No comments in CSS** unless a rule is genuinely inexplicable without one.

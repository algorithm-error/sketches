# Working in this repo

## Dev server

Sketches are static files, served with `npx live-server --no-browser --port=8123`.

**Never stop a dev server you did not start.** If one is already running on the port
you need, use it. Only kill a server that you started yourself in this session, and
prefer leaving it running — the user usually has it open in a browser.

## Commits

**Commit as yourself, not as Anna.** Blame is the provenance record here, and it shows
the commit author, so an agent commit is authored by Claude and committed by whoever
ran it:

```sh
git commit --author="Claude <noreply@anthropic.com>"
```

**Never mix hands in one commit.** A commit has one author, so a commit holding both
Anna's edits and yours attributes all of it to one of you. If the working tree has both,
stage and commit them separately.

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

## CSS

**Style the minimum.** A few declarations that do the job, not a full treatment of
every state. Reach for `display: none` before `opacity`, `pointer-events` and a
`transition` that each need their own line.

**No comments in CSS** unless a rule is genuinely inexplicable without one.

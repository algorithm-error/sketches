/**
 * Keeps the panel and url parameters in sync, and re-renders on update
 */
export function SketchDriver(defaults, controls, render) {
    const urlParams = SketchDriver.getFromUrl(window.location.search, defaults);
    /* dictionary with keys as keys and callback arrays as values */
    const subscriptions = {};
    // One signal for every listener the instance adds, so `destroy` drops them together.
    const listeners = new AbortController();
    let flushRequest = null;
    // The state a page loads with is the one it is already on, so the first write
    // replaces it rather than leaving an entry to step back to.
    let flushed = false;

    // Writing a param is the only entry point; the URL, the control, the
    // subscribers and the redraw all follow from it.
    this.values = new Proxy(urlParams, {
        set(target, key, value) {
            // Compared as text, so a composite value counts as unchanged when its
            // parts are, rather than every time a fresh object is written.
            if (listeners.signal.aborted || JSON.stringify(target[key]) === JSON.stringify(value)) {
                return true;
            }
            target[key] = value;
            SketchDriver.writeControl(controls[key], value);
            subscriptions[key]?.forEach((callback) => callback(value));
            // A burst of writes — a preset filling nine values, or the several keys
            // Back restores at once — is one state, so it gets one history entry and
            // one draw on the next frame rather than one of each per key.
            if (!flushRequest) {
                flushRequest = requestAnimationFrame(() => {
                    flushRequest = null;
                    const diff = Object.fromEntries(
                        Object.entries(target).filter(
                            ([key, value]) => JSON.stringify(value) !== JSON.stringify(defaults[key]),
                        ),
                    );
                    const query = new URLSearchParams(SketchDriver.flatten(diff));
                    const search = query.size ? `?${query}` : '';
                    // A query that already matches the address bar came from Back or
                    // forward: that state is the one we are on, so it needs no entry.
                    if (search !== window.location.search) {
                        const url = search || window.location.pathname;
                        if (flushed) {
                            history.pushState(null, '', url);
                        } else {
                            history.replaceState(null, '', url);
                        }
                    }
                    flushed = true;
                    render({ ...target });
                });
            }
            return true;
        },
    });

    this.subscribe = (key, callback) => {
        subscriptions[key] = [...(subscriptions[key] ?? []), callback];
    };

    // Picking a preset is swapping the defaults: the new ones are adopted whole,
    // and whatever is left matching them drops out of the URL.
    this.setDefaults = (next) => {
        defaults = { ...defaults, ...next };
        Object.assign(this.values, next);
    };

    this.destroy = () => {
        listeners.abort();
        cancelAnimationFrame(flushRequest);
    };

    window.addEventListener(
        'popstate',
        () => {
            Object.assign(this.values, SketchDriver.getFromUrl(window.location.search, defaults));
            // A subscriber may have swapped the defaults on the way through — a preset
            // selector does — so the URL's own keys go on last: the address bar wins,
            // and the keys it leaves out come from the defaults it just chose.
            Object.assign(this.values, SketchDriver.getFromUrl(window.location.search, defaults));
        },
        { signal: listeners.signal },
    );

    // Only params with a value-carrying control sync: a param can have no
    // control, and a control can be a button, which has nothing to sync.
    Object.entries(urlParams).forEach(([key, value]) => {
        const control = controls[key];
        if (!SketchDriver.isInput(control, value)) {
            return;
        }
        SketchDriver.writeControl(control, value);
        control.addEventListener(
            'change',
            (event) => {
                // A composite control has one property per part — `control.x`,
                // `control.y` — where a plain one carries the whole value on the event.
                if (!SketchDriver.isComposite(defaults[key])) {
                    this.values[key] = event.value;
                    return;
                }
                // Rule 4, checked: the part names live in the defaults here and in the
                // control's properties over there, and only agreement makes it work.
                const missing = Object.keys(defaults[key]).filter((part) => control[part] === undefined);
                if (missing.length) {
                    console.warn(
                        `SketchDriver: <${control.localName}> for "${key}" has no ` +
                            `${missing.map((part) => `\`${part}\``).join(', ')} — the defaults name ` +
                            `${Object.keys(defaults[key]).join(', ')}. Those parts will be undefined in the url.`,
                    );
                }
                this.values[key] = Object.fromEntries(Object.keys(defaults[key]).map((part) => [part, control[part]]));
            },
            { signal: listeners.signal },
        );
    });
}

// The default's shape is the shape read back: an object or array default is
// read from dotted keys part by part, and a number default reads back as a
// number. Anything else is the string the URL carries, which is what a preset
// name or a hex colour wants.
SketchDriver.getFromUrl = function (search, fallbacks, prefix = '') {
    const query = new URLSearchParams(search);
    return Object.fromEntries(
        Object.entries(fallbacks).map(([key, fallback]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            if (SketchDriver.isComposite(fallback)) {
                const parts = SketchDriver.getFromUrl(search, fallback, path);
                return [key, Array.isArray(fallback) ? Object.values(parts) : parts];
            }
            if (!query.has(path)) {
                return [key, fallback];
            }
            return [key, typeof fallback === 'number' ? Number(query.get(path)) : query.get(path)];
        }),
    );
};

// The way back out: `{position1: {x: 1, y: 2}}` becomes the `position1.x` and
// `position1.y` pairs the query string carries.
SketchDriver.flatten = function (values, prefix = '') {
    return Object.entries(values).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return SketchDriver.isComposite(value) ? SketchDriver.flatten(value, path) : [[path, value]];
    });
};

// A value made of parts: one URL key and one control attribute per part.
SketchDriver.isComposite = function (value) {
    return Boolean(value) && typeof value === 'object';
};

// Buttons are controls too, they just carry no value. What counts as a value is
// the param's business: a composite one is carried as parts, `x` and `y`, and a
// control for it need not have a `value` of its own — `vector-slider` has none.
SketchDriver.isInput = function (control, value) {
    if (!control) {
        return false;
    }
    return SketchDriver.isComposite(value) ? Object.keys(value).every((part) => part in control) : 'value' in control;
};

// Only write what differs: a control that re-emits `change` when its value is
// set would otherwise bounce the update back.
SketchDriver.writeControl = function (control, value) {
    if (!SketchDriver.isInput(control, value)) {
        return;
    }
    const parts = SketchDriver.isComposite(value) ? Object.entries(value) : [['value', value]];
    parts.forEach(([name, part]) => {
        if (control.getAttribute(name) === String(part)) {
            return;
        }
        control.setAttribute(name, part);
        // Rule 3, checked: the guard above is the only thing stopping a write from
        // bouncing back as a `change`, and it works by comparison, so a control that
        // clamps or rounds what it is given never matches and drifts from the url.
        if (control.getAttribute(name) !== String(part)) {
            console.warn(
                `SketchDriver: <${control.localName}> did not take "${name}" verbatim — ` +
                    `wrote ${JSON.stringify(String(part))}, read back ` +
                    `${JSON.stringify(control.getAttribute(name))}. It will disagree with the url.`,
            );
        }
    });
};

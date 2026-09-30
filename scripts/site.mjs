// Where each file of this project is served on algorithmerror.tech, and the rewrites
// that let a page's relative references resolve from that url.
//
// Paths here are paths under /sketches/, the same as in dist/. build.mjs uses this to
// write dist/; the website's dev server uses it to serve the sources directly.

import { statSync } from 'node:fs';
import { join } from 'node:path';

// node_modules is never uploaded, so the three libraries are served from vendor/.
export const vendor = {
    'vendor/p5.min.js': 'node_modules/p5/lib/p5.min.js',
    'vendor/p5.svg.js': 'node_modules/p5.js-svg/dist/p5.svg.js',
    'vendor/p5.collide2d.js': 'node_modules/p5.collide2d/p5.collide2d.js',
};

// The source file behind a served path. The UI kit is served flat at /ui, so its
// component modules and its docs pages sit side by side instead of in ui/ and ui/docs/.
export function sourceFor(path, root) {
    if (vendor[path]) return vendor[path];
    if (path.startsWith('ui/')) {
        const name = path.slice('ui/'.length);
        return isFile(join(root, 'ui', name)) ? `ui/${name}` : `ui/docs/${name}`;
    }
    return path;
}

// Pages are served from paths that do not match their place in this repo, such as the
// UI kit docs at /ui, and node_modules is not served at all, so their relative
// references are rewritten.
export function rewrite(source, html) {
    if (source.startsWith('ui/docs/')) {
        return html.replaceAll('../../mesh/', '/sketches/mesh/').replaceAll('../', './');
    }
    if (!/^(attractors|mesh)\//.test(source)) return html;
    return html
        .replaceAll('../node_modules/p5/lib/p5.js', '/sketches/vendor/p5.min.js')
        .replaceAll('../node_modules/p5.js-svg/dist/p5.svg.js', '/sketches/vendor/p5.svg.js')
        .replaceAll('../node_modules/p5.collide2d/p5.collide2d.js', '/sketches/vendor/p5.collide2d.js')
        .replaceAll('../', '/sketches/');
}

function isFile(path) {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

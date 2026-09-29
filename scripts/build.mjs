// Builds the static site into dist/ for Vercel. site.mjs decides where each file goes
// and how pages are rewritten.

import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { rewrite, sourceFor, vendor } from './site.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'dist');

const paths = ['LICENSE', 'base.css', 'text.css', ...Object.keys(vendor)];
for (const dir of ['articles', 'attractors', 'common', 'libraries', 'mesh']) {
    for (const entry of readdirSync(join(root, dir), { recursive: true, withFileTypes: true })) {
        if (entry.isFile()) paths.push(join(entry.parentPath, entry.name).slice(root.length));
    }
}
for (const name of readdirSync(join(root, 'ui'))) {
    if (name.endsWith('.js')) paths.push(`ui/${name}`);
}
for (const name of readdirSync(join(root, 'ui/docs'))) paths.push(`ui/${name}`);

rmSync(out, { recursive: true, force: true });
for (const path of paths) {
    const source = sourceFor(path, root);
    mkdirSync(dirname(join(out, path)), { recursive: true });
    if (!source.endsWith('.html')) {
        copyFileSync(join(root, source), join(out, path));
        continue;
    }
    const html = rewrite(source, readFileSync(join(root, source), 'utf8'));
    if (html.includes('node_modules')) throw new Error(`Unrewritten node_modules reference in ${source}`);
    writeFileSync(join(out, path), html);
}

console.log(`Built ${paths.length} files into dist/`);

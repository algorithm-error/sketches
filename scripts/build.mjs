// Builds the files the website serves under /sketches into dist/, or into the
// directory given as the first argument. site.mjs decides where each file goes and
// how pages are rewritten. The website's build runs this; see its
// scripts/copy-sketches.mjs.

import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { rewrite, sourceFor, vendor } from './site.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = process.argv[2] ? resolve(process.argv[2]) : join(root, 'dist');

// Working notes, kept in the repo but not published.
const unpublished = ['attractors/texts/'];

const paths = ['LICENSE', 'text.css', ...Object.keys(vendor)];
for (const dir of ['attractors', 'common', 'libraries', 'mesh']) {
    for (const entry of readdirSync(join(root, dir), { recursive: true, withFileTypes: true })) {
        const path = join(entry.parentPath, entry.name).slice(root.length);
        if (entry.isFile() && entry.name !== '.DS_Store' && !unpublished.some((prefix) => path.startsWith(prefix))) {
            paths.push(path);
        }
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

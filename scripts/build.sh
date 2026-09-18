#!/usr/bin/env bash
# Builds the static site into dist/ for Vercel.
#
# The site is served under algorithmerror.tech, not on its own domain, via
# rewrites in the website project:
#
#   /articles                         -> dist/articles/index.html
#   /articles/letters-from-attractors -> dist/attractors/letters-from-attractors.html
#   /ui, /ui/*                        -> dist/ui/*
#   /sketches/*                       -> dist/*
#
# Because the articles are served from paths that do not match their location in
# dist/, every relative reference in the HTML is rewritten to an absolute
# /sketches/... URL. The sketches load p5 from node_modules, which is never
# uploaded, so the three libraries are vendored into dist/vendor/ as well.
#
# Builds are serialized with a lock and land in a temporary directory that
# replaces dist/ only at the end, so a build that starts while another is in
# progress (the website dev server starts one on every save) cannot leave dist/
# half-written or nested.
set -euo pipefail

cd "$(dirname "$0")/.."

until mkdir .build.lock 2>/dev/null; do sleep 0.2; done
out=$(mktemp -d "$PWD/.dist.XXXXXX")
trap 'rm -rf "$out" .build.lock' EXIT

mkdir -p "$out/vendor" "$out/ui"

cp LICENSE base.css text.css "$out/"
cp -R articles attractors common libraries mesh "$out/"

# The UI kit is served at /ui, so the component modules and their docs pages
# live side by side in one flat directory instead of ui/ and ui/docs/.
cp ui/*.js "$out/ui/"
cp ui/docs/* "$out/ui/"

cp node_modules/p5/lib/p5.js "$out/vendor/p5.js"
cp node_modules/p5.js-svg/dist/p5.svg.js "$out/vendor/p5.svg.js"
cp node_modules/p5.collide2d/p5.collide2d.js "$out/vendor/p5.collide2d.js"

find "$out/attractors" "$out/articles" "$out/mesh" -name '*.html' -print0 | xargs -0 perl -pi -e '
  s{\.\./node_modules/p5/lib/p5\.js}{/sketches/vendor/p5.js}g;
  s{\.\./node_modules/p5\.js-svg/dist/p5\.svg\.js}{/sketches/vendor/p5.svg.js}g;
  s{\.\./node_modules/p5\.collide2d/p5\.collide2d\.js}{/sketches/vendor/p5.collide2d.js}g;
  s{\.\./}{/sketches/}g;
'

# Sketch pages reference their siblings with ./; the ../ rule above must run
# first so it cannot chew on the tail of a ../ that has not been handled yet.
find "$out/attractors" -name '*.html' -print0 | xargs -0 perl -pi -e 's{\./}{/sketches/attractors/}g;'

# Docs pages reach the components through ../ in the source tree; flattened they
# are siblings.
find "$out/ui" -name '*.html' -print0 | xargs -0 perl -pi -e '
  s{\.\./\.\./base\.css}{/sketches/base.css}g;
  s{\.\./\.\./mesh/}{/sketches/mesh/}g;
  s{\.\./}{./}g;
'

# The kit's index is served at /ui, with no trailing slash, so its own relative
# references would resolve one directory too high.
perl -pi -e 's{<head>}{<head>\n        <base href="/ui/" />}' "$out/ui/index.html"

remaining=$(grep -rl 'node_modules' "$out" --include='*.html' || true)
if [ -n "$remaining" ]; then
  echo "Unrewritten node_modules references in: $remaining" >&2
  exit 1
fi

rm -rf dist
mv "$out" dist

echo "Built $(find dist -type f | wc -l | tr -d ' ') files into dist/"

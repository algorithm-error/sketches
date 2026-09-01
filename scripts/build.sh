#!/usr/bin/env bash
# Builds the static site into dist/ for Vercel.
# The sketches load p5 from node_modules, which is never uploaded, so the three
# libraries are vendored into dist/vendor/ and the script paths rewritten.
set -euo pipefail

cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist/vendor

cp index.html LICENSE dist/
cp -R attractors common libraries ui dist/

cp node_modules/p5/lib/p5.js dist/vendor/p5.js
cp node_modules/p5.js-svg/dist/p5.svg.js dist/vendor/p5.svg.js
cp node_modules/p5.collide2d/p5.collide2d.js dist/vendor/p5.collide2d.js

find dist -name '*.html' -print0 | xargs -0 perl -pi -e '
  s{(\.\./)+node_modules/p5/lib/p5\.js}{/vendor/p5.js}g;
  s{(\.\./)+node_modules/p5\.js-svg/dist/p5\.svg\.js}{/vendor/p5.svg.js}g;
  s{(\.\./)+node_modules/p5\.collide2d/p5\.collide2d\.js}{/vendor/p5.collide2d.js}g;
'

remaining=$(grep -rl 'node_modules' dist --include='*.html' || true)
if [ -n "$remaining" ]; then
  echo "Unrewritten node_modules references in: $remaining" >&2
  exit 1
fi

echo "Built $(find dist -type f | wc -l | tr -d ' ') files into dist/"

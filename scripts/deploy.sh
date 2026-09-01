#!/usr/bin/env bash
# Deploys this project and then the website, in that order.
#
# The site is two deployments: /articles, /ui and /sketches on the website are
# rewritten here (see its vercel.json), and its pages import the UI kit from
# src/sketches, a submodule pointing at this repo. So this project goes first
# and the submodule is bumped in between — the other order puts the website
# live against files that are not there yet.
#
# Pass `production` to deploy both to production; anything else, or nothing,
# makes two previews and aliases the website one to algorithmerror-preview.
# A second argument of `only` stops after this project. WEBSITE_DIR overrides
# where the website checkout is.
set -euo pipefail

target=${1:-preview}
website=${WEBSITE_DIR:-../website}
sketches=$(cd "$(dirname "$0")/.." && pwd)

if [ "$target" = "production" ] || [ "$target" = "prod" ]; then
    flags="--prod"
else
    flags=""
fi

echo "==> sketches"
yarn --silent vercel deploy $flags

if [ "${2:-}" = "only" ]; then
    exit 0
fi

if [ ! -d "$website" ]; then
    echo "No website checkout at $website — set WEBSITE_DIR." >&2
    exit 1
fi

echo "==> src/sketches"
(cd "$website" && SKETCHES_DIR="$sketches" bash scripts/bump-ui-kit.sh)

echo "==> website"
cd "$website"

if [ -n "$flags" ]; then
    yarn --silent vercel deploy $flags
else
    yarn --silent vercel deploy > .vercel-url
    yarn --silent vercel alias "$(grep -o 'https://[^ ]*' .vercel-url)" algorithmerror-preview
fi

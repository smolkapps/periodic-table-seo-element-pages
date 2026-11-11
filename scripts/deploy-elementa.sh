#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

git diff --quiet
git diff --cached --quiet
npm run check
npm run build
npm test
npm run verify
npm test --prefix companion
npm run lint --prefix companion
npm run typecheck --prefix companion

revision=$(git rev-parse HEAD)
node scripts/release-manifest.mjs create dist "$revision" manual
node scripts/publish-elementa.mjs dist "$revision" manual

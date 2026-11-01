#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

npm run check
npm run build
npm test
npm run verify
npm test --prefix companion
npm run lint --prefix companion
npm run typecheck --prefix companion

# Preserve old hashed assets for visitors who already opened the previous page.
# rsync writes temporary files and renames completed updates into place.
release_stamp=$(date -u +%Y%m%dT%H%M%SZ)
ssh ctdsu.com "mkdir -p /var/backups/elementa-${release_stamp} && cp -a /var/www/elementalearn.com/html /var/backups/elementa-${release_stamp}/html"
rsync -az --delay-updates dist/ ctdsu.com:/var/www/elementalearn.com/html/
ssh ctdsu.com 'chown -R caddy:caddy /var/www/elementalearn.com/html && find /var/www/elementalearn.com/html -type d -exec chmod 755 {} + && find /var/www/elementalearn.com/html -type f -exec chmod 644 {} +'
curl --fail --silent --show-error -A 'Mozilla/5.0' https://elementalearn.com/study/ >/dev/null
printf 'Deployed Elementa; backup /var/backups/elementa-%s/html\n' "$release_stamp"

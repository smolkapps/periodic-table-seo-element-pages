# Public entry fixes

The homepage's quick quiz now uses `/study/#/practice?focus=trends&count=5`.
Practice already recognizes `focus=trends`, which starts practice without a
saved deck. About, Privacy and Terms are real Astro pages linked by the shared
footer and included in the normal sitemap.

`spelling-redirects.caddy` is the **server-only** addition applied November 11, 2026 to the existing
`elementalearn.com` block. A static Astro redirect would return HTML with a 200,
so it cannot provide the required permanent HTTP redirect. These two exact
matches produce 308 and retain query strings, without changing canonical URLs,
adding duplicate element pages or affecting unrelated routes.

Reference behavior:
- [Caddy rewrite](https://caddyserver.com/docs/caddyfile/directives/rewrite)
  preserves the existing query when only the path is specified.
- [Caddy redir](https://caddyserver.com/docs/caddyfile/directives/redir)
  uses its target as the Location header and supports status 308.

For a future change, the release owner must read the actual Caddy config, preserve
its CDN origin guards and other site blocks, take a backup, validate a candidate,
reload without restarting, and read the responses back for both slash forms
with and without a query. Expected examples:

| Request | Status | Location |
|---|---|---|
| `/element/aluminum/` | 308 | `/element/aluminium/` |
| `/element/cesium?utm_source=qa` | 308 | `/element/caesium/?utm_source=qa` |

Lead applied the aliases with current-config hash guards, a validated candidate and timestamped backup, then gracefully reloaded Caddy with its MainPID unchanged. All eight public slash/query combinations returned the expected 308 and Location. Other vhosts and CDN origin guards were preserved. See WORKLOG.md and WORKLOG-CARBON.md for checks.

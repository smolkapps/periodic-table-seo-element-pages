# Public entry and information pages — November 11, 2026

Goal: make the homepage's quick-quiz action useful on a first visit; expose About,
Privacy and Terms as crawlable static pages; prepare real HTTP spelling aliases.

Base: canonical origin/main 01a295c. Isolated worktree
`elementa-entry-20261111`, branch `codex/elementa-entry-20261111`.

- Read the shared layout, homepage, static output checks and existing study policies.
  Verified Practice derives its mode from `focus`; the bare route selects an empty
  local deck for a new visitor. The homepage action now specifies trends and five
  questions in the hash route.
- Added three static information pages with the existing shared head/icons,
  canonical URLs and footer navigation. The small information layout is shared
  by all three pages.
- Privacy distinguishes local study records from the existing Umami events,
  Cloudflare delivery/performance and optional X video. Removed no-analytics and
  school-certification implications from this new root policy. The companion's
  separate policy remains for its owner to reconcile.
- Terms retains educational/model/backup limitations and the existing MIT source
  license, avoiding the companion's conflicting no-resale language. No new
  paid/account/contract-acceptance flow was introduced.
- Regression checks inspect the built homepage link's actual route parameters
  and require real canonical information-page output with home-screen head links.

Verification: Astro check 47 files, 0 errors/warnings/hints; reference build
125 pages; all 143 root tests pass, 0 failures/skips. The new static-page check
initially assumed an attribute-free h1 and failed on Astro's scoped style
attribute; the assertion now accepts a real heading with attributes. No
application defect was hidden by a baseline update.

Actual owned Camoufox browser checked all three pages at 1365×900 and 390px wide
(actual mobile-sized inner height was 758, not the requested 844). All six
responses were 200, expected headings/canonicals/footer links appeared, and
there was no horizontal overflow or page error. Full-page screenshots for all
six views were inspected; readable text and no clipping/overlap. Analytics was
blocked only in this local QA context. This is responsive-browser evidence,
not physical-device or live-production evidence. Private browser receipts and
captures: `/Users/michael/.config/elementa-entry-20261111/`.

The isolated reference-only build doesn't contain the companion; combined
build/dead-link verification and actual end-to-end homepage-to-quiz replay
remain for the lead's integrated release. The server alias snippet and Caddy
reference behavior are documented, but no server mutation or deployment has
been performed by this worker.

# Worklog

## 2026-10-16 — Studio CI migration

Goal: run CI on the local Mac Studio with a simple hosted rollback.
Changed only runner selection; original triggers, job names and test/build steps remain.
Same-repository revisions use the dedicated serial Studio runner; public fork PRs retain free hosted Ubuntu validation.
Set repository variable `STUDIO_CI_UBUNTU_LATEST` to the JSON string `"ubuntu-latest"` to restore hosted execution.
Structural YAML comparison passed. Actual migration run is queued for local validation; final receipts and controller instructions are in `smolkapps/new-app-publisher-agent/tools/studio-ci/`.
Next: inspect the actual CI result; retain existing failures separately from runtime setup failures.


# Elementa dedicated-domain launch — October 30, 2026

Goal: launch the existing chemistry reference on its own domain while preserving the separate experimental learning companion.

Source: based on canonical main 800162f. Reapplied crawlable element links without losing keyboard navigation, filter feedback or social cards. New origin is https://elementalearn.com/ with a root base. Brand, manifest, opaque Apple/Android icons and social card match Elementa. Reference links and 2025 Smolk Apps credit are present. Existing Umami property is preserved, with an element-open learning activation.

Observed/fixed regression: automatic analytics attributes on anchors navigated away after opening the drawer. Activation now uses the optional tracker API directly, and the regression test checks both normal drawer clicks and preserved new-tab gestures.

Verified: type check 0 errors/warnings/hints; static build 122 pages; finishing guard 2,289 internal links; 134 tests passed, 0 failed, 0 skipped. Desktop 1365×900 and narrow browser 390×844 inspected. Public search → drawer → full element article → compare selection and shareable URL pass. Narrow browser testing is not physical-device compatibility. Native sharing, full accessibility audit, Search Console ownership and revenue are not claimed. Existing locked dependencies report 20 audit advisories; no broad dependency upgrade is included.

Delivery: new domain registered for one year, auto-renew off. Provider nameserver API automatically retired its old DNSSEC DS; removal and Cloudflare delegation verified directly at the registry before publishing. Cloudflare Free proxy/strict TLS and existing CDN-only origin guard are active. Both apex and www have valid HTTPS; www redirects to apex. Both working legacy app aliases redirect301 with their paths/queries preserved. The existing smolkapps.com Elementa card now links directly to the new domain. Other apps and the Caddy process were preserved. Deployment records/backups remain private.

The separate Base44 prototype has not replaced this static SEO surface. Its additional scientific data, quizzes, saved study progress and monetization hypotheses need review before integration or public release. No app-store submission, paid feature activation, or revenue claim was made.

Next: verify Search Console/indexing, improve selected articles with useful source-backed explanations, measure actual learning activation and demand, and review the companion before merging its features. Avoid thin bulk SEO content.


# Elementa completion

## Requested outcome — October 31, 2026

Verify Elementa's smolkapps.com listing; add deterministic portfolio registration guidance and tooling; merge the launch; retain complete local source, including Base44's companion; complete iOS/Android and Chrome deliverables with direct verification. Public store release remains subject to the standing final-release approval; prepare and test artifacts first.

## Verified starting state

- elementalearn.com is live; smolkapps.com features Elementa at that URL.
- Release commit 1d7a740 is pushed on codex/elementa-domain-launch-20261030, not merged. Checkout clean. Previous verification: 134 tests, 122 static pages, 2289 internal links.
- Base44 project 6ae50b61c2c546db2966fa6a is private/unpublished. Companion generation exists, but no verified local export or store/Chrome builds were completed.
- Original source/audit checkout is preserved at ../2026/periodic-table-seo-element-pages. Private Base44 records stay out of this public repository.
- Studio: 18 cores / 36 GiB, 70% free memory; existing browsers and other workers preserved. One bounded worker owns registration skill/AGENTS changes; lead owns Elementa source and platform work.

## Next

Check CI and merge the verified launch; authenticate the official Base44 CLI using the existing approved account, export and inspect the companion; verify complete study journeys and platform packaging. Record exact artifacts, checks, merges and any concrete remaining store gates.

# Elementa launch marketing

Elementa’s combined reference and study website is deployed at [elementalearn.com](https://elementalearn.com/), with the companion at [/study/](https://elementalearn.com/study/). The release source reported by the deployment owner is `45281f6`. Public checks on November 1 at 01:45:59 UTC returned HTTP 200 for the homepage, study page, robots, both sitemap files and the published IndexNow key. The sitemap contains 122 unique canonical HTTPS URLs, including the new study route. Root and study canonical tags match their public locations. These are delivery checks; the deployment owner records the separate browser journeys.

One updated IndexNow request submitted all 122 changed canonical URLs at 01:46:10 UTC. The provider returned **HTTP 403, `SiteVerificationNotCompleted`**, with instructions to wait for verification to complete. This request was **not accepted**. The existing October 30 request had returned 202 for the older 121 URLs, which did not establish completed verification or indexing. No automatic retry or replacement key was used. The exact new response is in the local ignored `indexnow-release-receipt.json`.

The key returns HTTP 200 and matching bytes through curl using ordinary, Bingbot and Googlebot User-Agent strings. Those probes are not authentic crawler-IP checks. A default Python client receives Cloudflare error 1010; that is a client-specific access issue, and it does not by itself establish why IndexNow’s verification is incomplete. No CDN security setting was changed.

The fixed pre-companion baseline is 31 tracked pageviews and 22 sessions between October 30, 22:12:17 UTC and November 1, 01:20 UTC. Three element-open events came from two sessions. Owner QA is included and cannot be reliably removed, so these counts do not establish 22 people or any customer/revenue result. Exact aggregates and caveats are in local ignored `umami-baseline.json`; raw paths/referrers remain private.

Search Console ownership, indexed URL counts, impressions and queries remain unverified. Root owns the approved Google sign-in/property workflow. A public search tool returned no site results; that is not a Google URL Inspection result.

[Launch copy and three unsent social drafts](launch-copy.md) target students revising introductory chemistry and teachers comparing elements. Companion-specific copy is ready for review against the deployment owner’s accepted public journeys. The first distribution test should use one approved relevant placement with tagged URLs and a 72-hour/7-day readout of actual activation. No social post or directory listing has been sent.

Primary references: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [IndexNow documentation](https://www.indexnow.org/documentation). Sitemap availability/submission is a discovery hint; accepted IndexNow responses are receipts rather than indexing or ranking proof. No new mass-produced articles, paid ads or automated outreach were submitted by this work.


## Verification completed after the first refusal

The first122URLsubmission returned403 SiteVerificationNotCompleted and was not accepted. Root then verified that Cloudflare Browser Integrity Check blocked a normal verification client (1010), added a reversible exception for only the public IndexNow key file, and verified that this same client could retrieve the exact key with200. General Browser Integrity Check remains enabled. A bounded second submission after that correction returnedHTTP200 at2026-11-01T02:01:43Z, accepting all122URLs. Receipt: indexnow-after-key-fix.json (ignored). This establishes submission acceptance, not crawling, indexing or rank.

The featured smolkapps.com card now describes the actual quizzes, shell/orbital views and device-local study features. Its destination remains elementalearn.com. The public GitHub repository now has the canonical homepage, a useful product description and eight relevant discovery topics. These are completed organic discovery changes, not evidence of customer acquisition. The requested public X launch post remains unsent pending the explicit final approval required by AGENTS.md; current owned browser sign-in is @TweetLensApp, not @MichaelSmolkin, and was preserved.

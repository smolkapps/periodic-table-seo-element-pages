# Elementa marketing and indexing

## Scope

Support the resumed website launch: public crawl/index checks, a dated usage baseline, search-engine setup through existing approved access, and useful launch copy/drafts. Root owns app source, deployment and catalog reconciliation. Native/store work remains paused. No new spend, unsolicited email, public social post or directory submission.

## Verified — October 31, 2026

- Read canonical operations status, project registry, publishing guide and Elementa catalog row. Existing record has the dedicated-domain reference site live and Google indexing unverified.
- Public curl/browser-UA checks return HTTP200 for root, robots, sitemap index, 121-URL sitemap, current IndexNow key, Oxygen article and comparison. Sample canonicals use elementalearn.com; no sampled noindex directive. Default Python fetch returned403, which is a client-specific access limit, not a site outage.
- robots.txt advertises the root sitemap index. Existing IndexNow submission receipt already reports121URLs accepted202 on October30; unchanged URLs were not redundantly submitted. A new post-launch submission will use only actually deployed additions/changes.
- Public search for site:elementalearn.com returned no results in this tool. That does not prove that Google has indexed zero URLs. Actual Search Console ownership, URL Inspection and query data remain unverified.
- Search Console remains unverified. This worker's in-app browser inventory is empty. An existing approved account-access route was located and passed privately to root; a native-browser attempt stopped before sign-in because the current profile did not match the recorded owned profile and the UI controls timed out. No credential value, new owner grant, DNS verification or OAuth scope was read/created by this worker. Root owns further account/property work.
- Umami hostname-specific fixed baseline completed for2026-10-30T22:12:17Z through2026-11-01T01:20:00Z:31pageviews,22trackedvisitors/22sessions and3element-open events across2sessions. Owner launch QA is included and cannot be separated reliably from this aggregate; no independent-human/customer/revenue claim. Existing shared property retained.

## Next

Use the existing owner route if it becomes available. After root verifies the public companion release, submit its actual changed URLs once to IndexNow and record the receipt. Search Console sitemap submission requires a verified owned property; do not claim one from robots/sitemap availability. Social copy stays draft until explicitly approved for posting.

- Prepared on-site headline, study-entry copy and three specific audience/URL social drafts in launch-copy.md. Existing reference-site claims are ready; companion claims are explicitly contingent on root public-journey acceptance. Comparison deep link was checked against the current source and uses ?ids=oxygen,iron,gold. All social drafts remain unsent.


## Combined release discovery — November 1, 2026 UTC

- Root reported the October 31, 21:44 Eastern deployment of source `45281f6`: complete main companion under `/study/`, with all 118 existing element articles retained and their global navigation/study entry points updated. Tutor remains separate. Native work remains paused.
- At 01:45:59 UTC public homepage, `/study/`, robots, sitemap index, sitemap content and existing IndexNow key all returned HTTP 200. Both sampled canonical tags match their public routes. Sitemap has 122 unique URLs, all HTTPS on elementalearn.com, with no fragment URLs and the study route included. Exact preflight is in ignored `release-discovery-preflight.json`.
- At 01:46:10 UTC submitted one 122-URL JSON request to api.indexnow.org/indexnow, using the unchanged published key. All submitted routes changed in this release. HTTP 403 / SiteVerificationNotCompleted returned; **not accepted**. No blind retry, new key or alternate-endpoint submission. Ignored `indexnow-release-receipt.json` contains the exact status, response and payload/list hashes.
- Subsequent read-only key probes through curl with ordinary, Bingbot and Googlebot User-Agent strings all returned 200 and the same expected 33 bytes. These do not prove authentic crawler-IP access. The default Python client returns Cloudflare error 1010. IndexNow’s actual verification cause remains unproven; root informed. No DNS/WAF/browser-integrity setting changed.
- README now distinguishes the actual deployed companion, old 202 receipt, new failed verification request and the frozen pre-launch baseline. Three social drafts remain unsent. No shared-branch commit/push was performed while root’s PR is active.

Remaining: root’s public journey acceptance and Google account/property workflow; investigate IndexNow’s verification before one justified later retry. Do not call indexing, traffic growth or marketing conversions complete from this receipt.

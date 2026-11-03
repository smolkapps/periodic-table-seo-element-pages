# Elementa question-page marketing improvement

November 3, 2026. Goal: apply the existing GTM and SEO/AEO playbooks with one useful, source-backed explanation, preserving the public study app and unrelated pages.

- Freshly fetched origin/main `8d6bc5cd36405cb93f498fe5ed4e7b9d1c832e06`; the existing launch checkout was clean. Created isolated branch `codex/elementa-oxygen-sulfur-20261103` and worktree `elementa-seo-20261103`.
- Read project/global guidance, GTM Elementa section, SEO/AEO guide, site-finishing-checklist and humanizer. Preserved Astro and the existing layout, icons, metadata and share helper.
- Checked the Royal Society of Chemistry's [oxygen](https://periodic-table.rsc.org/element/8/oxygen) and [sulfur](https://periodic-table.rsc.org/element/16/sulfur) fact boxes, group glossary and oxidation-state tables on November 3. Configurations support the electron/shell arithmetic. No efficacy, classroom-use or curriculum claim.
- Added `/oxygen-and-sulfur/`, answering why the two elements have similar properties, with neutral ground-state configurations, a comparison table, model limits, direct source links and a practice task. One FAQ entry exactly matches the visible answer. Added incoming links only on oxygen and sulfur reference pages.
- Built a clean baseline before editing and compared final reference outputs by SHA256. Only five output files differ: new explanation HTML/share script, oxygen HTML, sulfur HTML and the child sitemap. All other reference output bytes are identical. Exact hashes are in `build-diff.json`. No shared stylesheet, icon, manifest, homepage or study-source change.
- Verification: Astro check 0 errors/0 warnings/0 hints; reference build 123 pages; 141 root tests pass, 0 failures/0 skips; finishing/dead-link guard passes 124 HTML pages and 2797 links. The existing launch checkout's study build was copied into the test output only so links to unchanged study routes could be checked; this task didn't rebuild or test the companion. New canonical, one h1, parsed FAQ JSON-LD and visible answer were checked directly. `git diff --check` passes.

Current state: local preparation only. Parent owns browser inspection, source publication and guarded deployment of the five changed files. No push, deployment, IndexNow submission, social post, account change or outreach by this worker. No traffic or acquisition result is claimed. Browser/native share-sheet acceptance remains for the parent; the existing share behavior is reused.

## Parent publication and live acceptance

Source branch pushed and PR13 opened. Both Node CI runs passed (51s/44s). Guarded publication at2026-11-03T20:45:59Z installed exactly the five output files after every existing target matched its frozen baseline SHA256. Backup:/var/backups/elementa-seo-20261103T204559Z on the existing host. All275nontarget files remained byte-identical; no homepage, app, icon, manifest or server configuration change.

Parent independently checked RSC facts and inspected preview/live screenshots. Browser journeys passed at1365×900 and390pxwide (preview390×844;live reported innerHeight758). No horizontal overflow or page errors. Real comparison selected oxygen/sulfur, study deep link opened Oxygen, and share produced clipboard-copy feedback. QA blocked the analytics endpoint. No physical device/native-share sheet or new analytics-ingestion proof. Existing companion was not rebuilt/retested.

Live article, two incoming links, sitemap, robots and existing branding assets return200. Manifest MIME and exact deployed PNG bytes/dimensions pass; mobile icons are opaqueRGB180/192/512, OG1200×630. Sitemap now contains123canonicalURLs. IndexNow accepted the three changed page URLs withHTTP200; no repeated unchanged Google sitemap submission. Acceptance is not indexing, reach or revenue.

The current OER Commons AI guidance supersedes the historical blanket submission recommendation: disclosure and meaningful verifiable human educational authorship are expected, with wholesaleAItools potentially rejected. OER submission is parked; no account created or listing claimed. MERLOT signed-out registration requires a password and AUP acceptance, so it was not completed. Existing ChemEdX editorial thread and Oct31Xpost were not duplicated. The X72hourwindow ends2026-11-04T03:02:32Z; this work does not claim that readout.

# Automatic Elementa website releases

Michael authorized automatic publication of fixed website updates on November 11, 2026. The public source remains `smolkapps/periodic-table-seo-element-pages`; Base44 is the builder, while the independent Astro reference and React study app are published together at `elementalearn.com`. The tutor branch stays separate.

## What publishes

CI runs the reference type check, both builds, finishing/internal-link guard, root tests, study tests, study lint and type check. Only a successful **push to main** uploads `elementa-site-<full revision>`, with a per-file SHA-256 inventory, source revision and CI run ID. PRs, other branches, failed checks and incomplete builds produce no release artifact. There is no new deployment credential in GitHub Actions.

The installed Mac Studio LaunchAgent checks every three minutes using the existing `gh` authentication and private-mesh `ctdsu.com` SSH route. It downloads only the successful current-main artifact, verifies every file and its identity, and rechecks main after upload. It does not invoke an AI model or build on the small web server. A sleeping/offline Studio delays publication until it resumes.

The server serializes promotion with a lock, validates received checksums, preserves old hashed JS/CSS for already-open pages, and atomically exchanges the complete website directory. It checks the public revision, key HTML pages, compiled assets, manifests and home-screen icon bytes/MIMEs. A failed public check restores the previous directory automatically. The newest three `elementa-auto-<timestamp>-<revision>` backups are retained; historical operator backups and other sites are untouched. Less than 500 MiB free stops promotion before changing the live site.

Source reviews and actual desktop/mobile learner journeys happen before merging a builder change. Automated checks do not certify scientific correctness, physical-device behavior or every possible journey. Main's ordinary merge remains the release boundary; the separate tutor must not be merged by this workflow.

## Install or update the local release worker

From a reviewed checkout containing this pipeline:

```sh
bash scripts/install-elementa-auto-release.sh
```

Stable control files are copied to `~/.local/share/elementa-auto-release/` (private directory). Website artifacts are static data and never supply executable release code. To update the release worker itself, rerun the installer from reviewed source. The worker needs `/opt/homebrew/bin/node`, `/opt/homebrew/bin/gh`, existing GitHub authentication, and the existing `ctdsu.com` SSH configuration. It opens no inbound port and changes no shared Caddy, DNS, billing or credentials.

Inspect actual operation:

```sh
launchctl print gui/$(id -u)/org.smolkapps.elementa-auto-release
cat ~/.local/share/elementa-auto-release/state.json
tail -n 30 ~/.local/share/elementa-auto-release/release.log
curl -A 'Mozilla/5.0' https://elementalearn.com/release.json
```

An unchanged or not-yet-successful main is quiet. A failed worker exits nonzero and records its concrete error in `release.log`. `state.json` is written only after publication checks succeed. The public `release.json` reports the actual promoted source; sitemap submission or a Base44 preview is not publication proof.

Stop the worker without changing the live site:

```sh
launchctl bootout gui/$(id -u)/org.smolkapps.elementa-auto-release
```

The existing `bash scripts/deploy-elementa.sh` remains the manual recovery route and now uses the same atomic publisher after its full checks. No website-publication approval is requested again for fixes within the current authorized scope; new spending, social posts, tutor release and public app stores remain distinct actions.

## Verification

`test/auto-release.test.ts` covers failed/pending/foreign/branch runs, missing/expired/ambiguous artifacts, stale main and damaged/incomplete/symlinked downloads. `python3 test/promote-elementa.test.py` exercises disposable directories for success, public-check rollback, checksum failure, rollback preservation, low disk and narrowly scoped backup retention. On Linux it uses the actual `renameat2` directory exchange; macOS uses a portable fixture swap only for behavior tests. The full public auto-release path must additionally be observed on a real successful main CI run.

First actual acceptance, November 11: PR15 merged at `2aeab66f47ed6c90c0675a8dbdc797a09e186d29`; [main CI43119927646](https://github.com/smolkapps/periodic-table-seo-element-pages/actions/runs/43119927646) produced artifact13900042849, 7,826,218bytes, SHA256 `a3d008da6c7c6f5bf55e6c01c2ec9cc091309b24f7cec7254c885fbf0715b8c3`. The ordinary second LaunchAgent invocation published it at23:30:22UTC with exit0 and no warnings. No manual publisher/kickstart was used. Public `/release.json` matched that revision/run, and seven root/study home-screen PNG readbacks independently matched the release hashes, required dimensions and opaqueRGB format. Private detailed receipt: `~/.local/share/elementa-auto-release/first-automatic-release-20261111.json`. This proves the release path with the existing app; subsequent builder improvements still need their own source/journey review before merging.

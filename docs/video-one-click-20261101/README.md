# One-click inline video repair — November 1, 2026

The 88-second control now starts a native inline video in the same click. It does not load a tweet card or require another Play action. Google DeepMind / Gemini 4 Argon / Antigravity / Tom Lehrer attribution and the exact original-post link remain adjacent.

The previous check proved eventual playback after loading X's post and clicking its player. It missed the first-click requirement. `scripts/verify-argon-video.py` now performs exactly one visible click from an uninitialized player and requires an advancing native media clock, paused=false, no iframe and no navigation. It failed against the former implementation before the repair.

## Source and request policy

The MP4 URL was observed in the original post's primary X syndication metadata, captured by X's official player at 2026-11-01 01:22 UTC. It is a public 1280×720 variant with no query, private credential, signed expiry or cookie requirement:

`https://video.twimg.com/amplify_video/2112556446218862593/vid/avc1/1280x720/Jg_oHGtDOkoBttrU.mp4`

The primary metadata binds post `2112557925264752930`, author Google DeepMind, available video and duration88,495ms to that exact URL. Metadata SHA256: `40e205d1964fdb2f5fd593d4e297cb7450f9d16e3b86b040f4ccbf1b24bcb46d`. The original is https://x.com/GoogleDeepMind/status/2112557925264752930 . Fresh X oEmbed still returned that author/post; a current public range request returned206 / video/mp4 / 11,370,104 total bytes. No media file is rehosted.

The provider rejects this site's Referer header, but serves the public media without one. `BaseLayout` therefore has an optional `referrerPolicy` prop; only the homepage passes `no-referrer`. This suppresses **all outbound Referer headers from the homepage**, so destination websites do not receive homepage referral attribution. Other pages retain their existing policy. Existing analytics code/property/events are unchanged. No referrer is forged and no authentication is bypassed.

If a future CSP restricts media, allow `media-src https://video.twimg.com`; this player needs no Twitter frame or widget-script allowance. Root confirmed the current public homepage has no blocking CSP/referrer response header. Root owns deployment and public readback.

## Checks and evidence

The frozen reference build emitted122 pages. `npm run check`:42 files,0errors/0warnings/0hints. `npm test`:141passed,0failed,0skipped across11files, including four focused regressions for same-gesture play, truthful status, rejected playback and failed-resource retry. Companion source was not modified or rebuilt.

Actual production-build playback in fresh logged-out task-owned Camoufox contexts:

| Check | Desktop1365×900 | Narrow390×844 |
|---|---|---|
| Initial player | empty currentSrc, time0, paused | empty currentSrc, time0, paused |
| Actions before successful playback | exactly1 visible click | exactly1 visible click |
| Clock / state |2.030s / paused=false |2.035s / paused=false |
| Media |88.555s / readyState4 / noerror |88.555s / readyState4 / noerror |
| Presentation |0iframes, no navigation/overflow |0iframes, no navigation/overflow |
| Requests / errors |noCookie/Referer,0media/page errors |noCookie/Referer,0media/page errors |

Screenshots at both widths were visually inspected. Native controls and playsinline are present. The Play button starts disabled until its handler is ready, avoiding a dead first click during deferred initialization. Status says Starting until media time actually advances. A blocked-media fixture showed time0 with a truthful failure, enabled Retry, native controls and the original link; removing the injected failure and clicking Retry once resumed real playback at1.038s. A fresh Enter activation started at1.034s; native Space paused, ArrowRight moved the clock from1.034s to6.034s, and Space unpaused it.

This is responsive browser evidence, not physical iOS/Android or audible-output verification. The full88seconds was not watched; no offline playback guarantee is made for externally hosted media.

Reproduce against a local preview or the deployed homepage using the installed Camoufox Python:

```sh
/Users/michael/.local/share/uv/tools/camoufox/bin/python3 scripts/verify-argon-video.py \
  --url http://127.0.0.1:18471/ --out /absolute/evidence-directory
```

Ignored local receipts: `baseline/one-click-1365.json` (former implementation fails), `production-final/one-click-{1365,390}.json`, `production-final/playing-{1365,390}.jpg`, `recovery-keyboard.json`, `injected-failure-390.jpg`, `source-binding.json`, and `build-reference.log`. See WORKLOG.md for the intermediate dev-fixture failures and scope.

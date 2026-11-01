# Elementa — mobile & store readiness scan

Status of what this repository can generate on its own, and what only the account
owner can do in the store dashboards. Nothing here publishes, signs, or uploads.

## 1. What is device-local (privacy posture)

| Concern | Status |
| --- | --- |
| Accounts / sign-up | None. The app renders without authentication; no login is required to study. |
| Progress storage | `localStorage` on the device only — 4 keys (`elementa_saved_slugs_v3`, `elementa_mastery_v3`, `elementa_notes_v3`, `elementa_quiz_history_v3`). |
| Server record | Removed. `src/lib/studyStore.js` no longer imports the Base44 SDK, and the `StudyProgress` entity schema was deleted so there is no shared learner table to read or write. |
| Network on first load | No app-settings or auth round trip when there is no session (`AuthContext` skips `getPublicSettings()` without a token). Data + code ship in the bundle. |
| Analytics / ads / pixels | None added. |
| Export / import | User-controlled JSON file; imports are validated before replacing local progress. |

Migration note: progress keys moved to `_v3`. The older `_v2` keys are not read,
because they could contain the sample mastery/notes/quizzes the prototype seeded;
a device therefore upgrades to an honest empty (or user-set) state rather than
inheriting fabricated progress.

## 2. Generated in this repository (verified locally)

Run and confirm:

```bash
npm run build:standalone # or npm run build — relative ./assets/ + hash routing for /study/
npm test                 # 28 node:test assertions — dataset, articles, share URLs, /study/ SW & progress
npm run lint             # eslint, clean
npm run icons            # regenerates every PNG icon from the atom mark
```

### Deploying to `https://elementalearn.com/study/` (Caddy + Astro static root)

1. Build the standalone study bundle:
   ```bash
   npm ci
   npm run build:standalone
   ```
2. Copy `dist/` into the Astro site's static output under `/study/` (for example `astro-dist/study/` or `/var/www/elementalearn.com/study/`):
   ```bash
   mkdir -p /var/www/elementalearn.com/study
   rsync -a --delete dist/ /var/www/elementalearn.com/study/
   ```
3. Because `dist/index.html`, `dist/manifest.json`, and `dist/sw.js` use relative `./` URLs and `HashRouter` (`#/element/iron`, `#/compare?ids=iron,gold,oxygen`, `#/practice`, `#/saved`), Caddy needs no SPA rewrite rule for `/study/` — standard static file serving at `/study/` serves the complete app and preserves all crawlable Astro pages at `/`, `/elements/`, `/element/<slug>/`, and `/compare/`.

Files produced:

- `public/favicon.svg`, `public/icons/favicon-32.png`
- `public/icons/apple-touch-icon-180.png`
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`
- `public/icons/icon-48.png`, `icon-128.png` (extension/store icon)
- `public/manifest.json` (relative `./` scope/start_url/icons/shortcuts for `/study/`)
- `public/sw.js` + registration in `src/main.jsx` (precaches `index.html` + compiled JS/CSS bundles under `elementa-study-shell-v2`; never deletes other apps' caches on the same origin)
- `capacitor.config.json` (`com.smolkapps.elementa`, `webDir: dist`)
- `packaging/chrome-extension/manifest.json` + `README.md`
- `/privacy` and `/terms` routes with the device-local data explanation, © 2025 Smolk Apps

`npm run typecheck` now reports **0 errors across all used Elementa study files** (`elementsData`, `TrendExplorerCard`, `AtomVisualizer`, `AllElements`, `Home`, `ElementDetail`, `Compare`, `Practice`, `SavedProgress`, `Privacy`, `Terms`, `Navbar`, `Footer`, `StorageNotice`, `progressStore`, `studyStore`). The **57 remaining errors** are confined to unused platform template files not routed by the app:

- 41 in unrouted auth template pages (`Register`, `ResetPassword`, `Login`, `ForgotPassword`, `OAuthConsent`)
- 13 in untyped shadcn UI primitives (`input-otp`, `button`, `input`, `label`) imported by those auth pages
- 3 in `src/lib/app-params.js` (`import.meta.env` without `vite/client` ambient types)

## 3. iOS (owner actions)

Bundling is configured; **signing and submission are owner-only**.

Prerequisites (owner): macOS + Xcode 15+, Apple Developer Program membership
(US$99/year), App Store Connect app record.

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/ios
npx cap add ios
npm run build:packaged
npx cap sync ios
npx cap open ios        # set team, bundle id, icons, then archive in Xcode
```

Checklist:

- [ ] Bundle identifier `com.smolkapps.elementa` in Xcode matches App Store Connect.
- [ ] App icons: export `icon-512.png` (or a 1024×1024 render) into
      `ios/App/App/Assets.xcassets/AppIcon.appiconset` with Xcode's single-size
      asset; iOS masks corners itself, so use the full-bleed square.
- [ ] Launch screen: match `#0b0e14` (already set as `backgroundColor`).
- [ ] `PrivacyInfo.xcprivacy`: declare no tracking, no collected data; do not add
      required-reason APIs unless the shell starts using file timestamps or
      user defaults directly (the WebView's storage does not).
- [ ] App Privacy answers in App Store Connect: **Data Not Collected** — matches
      the device-local design.
- [ ] Guideline 4.2 (minimum functionality): the review notes should describe the
      offline element reference, trend charts, comparison builder and quizzes as
      the app's function, not a website wrapper. A store listing claim of
      "nothing is uploaded" must stay true.
- [ ] Age rating 4+ is possible: no user-generated content, no accounts, no ads.
- [ ] Screenshots for 6.7" and 6.1" devices — owner action.

## 4. Android (owner actions)

Prerequisites (owner): Android Studio + JDK 17, Google Play Console account
(one-time US$25), Play App Signing.

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap add android
npm run build:packaged
npx cap sync android
npx cap open android    # build AAB, then upload
```

Checklist:

- [ ] `applicationId` `com.smolkapps.elementa`.
- [ ] Adaptive icon: foreground from `icon-512-maskable.png`, background colour
      `#0b0e14`. Mipmap densities 48/72/96/144/192 are covered by the generated
      set scaled in Android Studio.
- [ ] Target SDK must satisfy the current Play requirement (API 35 for new apps
      and updates — re-check before each release).
- [ ] Data safety form: **No data collected, no data shared**; nothing transmitted.
      Because progress is only in WebView `localStorage`, do not claim "app
      activity" collection.
- [ ] Decide backup behaviour: WebView storage is not part of Android Auto Backup
      by default. Either leave it off and tell users to use Export JSON, or add
      `android:allowBackup="true"` and test restore. Export is the documented path.
- [ ] Closed testing: newer personal developer accounts need a closed test with
      the required number of testers (currently 12) for 14 continuous days before
      production access — owner action, verify current Play policy.
- [ ] Content rating questionnaire, screenshots, feature graphic — owner action.

## 5. Installable PWA (works today, no store)

- [ ] Serve over HTTPS on the canonical origin (`elementalearn.com`) — owner action.
- [ ] Ensure the host rewrites unknown paths to `/index.html` (BrowserRouter deep
      links). Without rewrites, use the packaged hash-routing build instead.
- [ ] Lighthouse → Installability + offline: manifest, 192/512 icons, maskable
      icon, registered service worker all present in this repo.
- [ ] Verify iOS A2HS uses `apple-touch-icon-180.png` (full-bleed, opaque).
- [ ] Android WebAPK generation uses `manifest.json`; `start_url` is `/`.

## 6. Explicitly not done here

- No publish, deploy, store upload, signing, certificate, provisioning profile,
  keystore, or screenshot capture.
- No spending, no plan change, no GitHub access or repository connection.
- No Base44 app-settings change; the project remains private and unpublished.
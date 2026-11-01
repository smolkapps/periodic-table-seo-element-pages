# Original DeepMind video embed — November 1, 2026 UTC

`src/components/ArgonVideo.astro` embeds the original Google DeepMind X player on an explicit **Load video** action. The nearby credit identifies Google DeepMind, Gemini 4 Argon / Antigravity and Tom Lehrer's “The Elements,” with an always-visible link to the exact original post. No video/poster file is rehosted and no X widget script is loaded in the parent document.

## Source verification

- Original: https://x.com/GoogleDeepMind/status/2112557925264752930
- Primary X oEmbed returned author Google DeepMind and the October 20, 2026 post describing its 3D periodic-table demonstration.
- Primary public syndication metadata, fetched by the official player in a fresh logged-out browser, binds this post to its available 16:9 video, duration 88,495 ms. The actual media player reports 88.483 seconds.
- X's official embedding guidance: https://help.x.com/en/using-x/how-to-embed-a-post . Its generated player uses `https://platform.twitter.com/embed/Tweet.html`.

## Integration

Import and render the component in the chosen Astro page:

```astro
---
import ArgonVideo from '../components/ArgonVideo.astro';
---
<ArgonVideo />
```

The only additional parent CSP allowance, if the deployed policy restricts frames, is `frame-src https://platform.twitter.com`. The existing Astro script bundle remains same-origin. X handles its own player scripts, images and media inside that frame; the parent needs no Twitter CDN media or script allowance. No CSP changes were made in this subtask.

The component accepts resize messages only from the exact player window at `https://platform.twitter.com`, with bounded numeric heights. This avoids clipping and the blank white gap that a fixed iframe height produced. It remains a full original-post player, including X's attribution, rather than stripping X's surrounding interface.

## Actual browser verification

A separate Astro fixture outside the real `src/pages/` served the actual component at localhost:18467. Fresh task-owned headless Camoufox contexts were used; personal browsers were not controlled. Both actual viewport sizes were read back before interpreting screenshots. No heavyweight production build was started by this subtask.

| Check | Desktop 1365 × 900 | Narrow 390 × 844 |
|---|---|---|
| Before Load video | 0 iframes; 0 third-party requests | 0 iframes; 0 third-party requests |
| Original player after click | Correct post/credit; height 624px | Correct post/credit; height 495px |
| Visible Play control | Clicked | Clicked |
| Advancing playback | currentTime 3.001s, paused=false | currentTime 3.022s, paused=false |
| Media status | duration 88.483s; readyState 4; no media error | duration 88.483s; readyState 4; no media error |
| Layout / JS | No horizontal overflow or page error | No horizontal overflow or page error |

`npm run check` passed across 42 Astro files with 0 errors, 0 warnings and 0 hints. No production build or public deployment was performed by this subtask.

Playback was paused after verification and task-owned browsers closed. Desktop and narrow captures were visually inspected. The fixture's Astro development toolbar appears in some captures; it is not component UI or a production asset. Initial test-fixture character encoding was corrected with UTF-8 metadata before the final checks; the real shared BaseLayout already declares UTF-8.

This proves responsive browser playback, not physical iOS/Android compatibility or audible sound output. No claim that the full 88 seconds was watched is made. Root still owns integration, final build/checks and public deployment/readback.

Ignored local receipts: `component-1365.json`, `component-390.json`, `tweet-result.json`, `component-before-*.jpg`, `component-loaded-*.jpg`. The isolated fixture and inspection helpers are also ignored so they cannot become public routes or source metadata. Original primary source information is public; no account cookies or authenticated preview tokens were used.

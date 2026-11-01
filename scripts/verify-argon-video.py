#!/usr/bin/env python3
"""Real-media regression: one activation must start the inline video.

Run with the installed Camoufox Python against an existing local preview server.
No synthetic play() call, second Play action, authenticated browser, or media mock.
"""
import argparse
import asyncio
import json
from pathlib import Path

from camoufox.async_api import AsyncCamoufox


async def verify(url, out, width, height, timeout_ms):
    result = {"requested_viewport": {"width": width, "height": height}, "actions": [], "page_errors": [], "media_requests": [], "media_failures": []}
    async with AsyncCamoufox(headless=True, window=(width, height), config={"window.innerWidth": width, "window.innerHeight": height}, i_know_what_im_doing=True) as browser:
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()
        page.on("pageerror", lambda error: result["page_errors"].append(str(error)))
        page.on("console", lambda message: result["page_errors"].append(message.text) if message.type == "error" else None)
        def request_seen(request):
            if "video.twimg.com" in request.url:
                result["media_requests"].append({"url": request.url, "cookie_header_present": "cookie" in request.headers, "referer_header_present": "referer" in request.headers})
        page.on("request", request_seen)
        page.on("requestfailed", lambda request: result["media_failures"].append({"url": request.url, "error": request.failure}) if "video.twimg.com" in request.url else None)
        page.on("response", lambda response: result["media_failures"].append({"url": response.url, "status": response.status}) if "video.twimg.com" in response.url and response.status >= 400 else None)
        try:
            await page.set_viewport_size({"width": width, "height": height})
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            result["actual_viewport"] = await page.evaluate("({width:innerWidth,height:innerHeight})")
            assert result["actual_viewport"] == result["requested_viewport"], "viewport mismatch"
            control = page.locator("[data-load-video]")
            await control.scroll_into_view_if_needed()
            result["before"] = await page.locator("[data-argon-video]").evaluate("section=>({iframes:section.querySelectorAll('iframe').length,video:section.querySelector('video')?{currentSrc:section.querySelector('video').currentSrc,currentTime:section.querySelector('video').currentTime,paused:section.querySelector('video').paused}:null})")
            assert not result["media_requests"], "media requested before activation"
            assert not result["before"]["video"] or result["before"]["video"]["currentSrc"] == "", "player was initialized before the first click"
            before_url = page.url
            await control.click()
            result["actions"].append({"type": "visible_click", "target": "[data-load-video]"})
            await page.wait_for_function("(()=>{const v=document.querySelector('[data-argon-video] video');return v&&v.currentTime>2&&!v.paused&&v.readyState>=2})()", timeout=timeout_ms)
            result["playback"] = await page.locator("[data-argon-video] video").evaluate("v=>({currentTime:v.currentTime,paused:v.paused,duration:v.duration,readyState:v.readyState,error:v.error?.message??null,controls:v.controls,playsInline:v.hasAttribute('playsinline'),currentSrc:v.currentSrc})")
            result["iframes_after"] = await page.locator("[data-argon-video] iframe").count()
            result["navigated"] = page.url != before_url or len(context.pages) != 1
            result["horizontal_overflow"] = await page.evaluate("document.documentElement.scrollWidth>innerWidth")
            assert len(result["actions"]) == 1 and result["iframes_after"] == 0, "first action produced an embed rather than inline playback"
            assert not result["navigated"], "playback navigated or opened a tab"
            assert not result["horizontal_overflow"], "responsive layout overflowed"
            assert result["playback"]["controls"] and result["playback"]["playsInline"], "native controls/inline behavior missing"
            assert not result["media_failures"] and not result["page_errors"], "media or page errors"
            await page.locator("[data-argon-video]").screenshot(path=str(out / f"playing-{width}.jpg"))
            result["passed"] = True
        except Exception as error:
            result["passed"] = False
            result["failure"] = str(error)
            result["failure_state"] = await page.locator("[data-argon-video]").evaluate("s=>({button:{hidden:s.querySelector('[data-load-video]').hidden,disabled:s.querySelector('[data-load-video]').disabled},status:s.querySelector('[data-video-status]').textContent,video:s.querySelector('video')?{src:s.querySelector('video').getAttribute('src'),currentTime:s.querySelector('video').currentTime,paused:s.querySelector('video').paused,error:s.querySelector('video').error?.message??null}:null})")
            await page.locator("[data-argon-video]").screenshot(path=str(out / f"failure-{width}.jpg"))
        finally:
            (out / f"one-click-{width}.json").write_text(json.dumps(result, indent=2) + "\n")
            await context.close()
    print(json.dumps(result, indent=2))
    return result["passed"]


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:18471/")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--desktop-only", action="store_true")
    parser.add_argument("--timeout-ms", type=int, default=20000)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    outcomes = [await verify(args.url, args.out, 1365, 900, args.timeout_ms)]
    if not args.desktop_only:
        outcomes.append(await verify(args.url, args.out, 390, 844, args.timeout_ms))
    raise SystemExit(0 if all(outcomes) else 1)


if __name__ == "__main__":
    asyncio.run(main())

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initArgonVideos } from "../src/scripts/argon-video";

let button: HTMLButtonElement;
let player: HTMLVideoElement;
let status: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = `<section data-argon-video>
    <div data-video-host>
      <button data-load-video disabled><span data-video-label>Play video</span></button>
      <video data-video-player data-video-source="https://video.twimg.com/public.mp4" controls playsinline hidden></video>
    </div>
    <p data-video-status>Play the video here.</p>
    <a href="https://x.com/GoogleDeepMind/status/2112557925264752930">Watch original</a>
  </section>`;
  button = document.querySelector("button")!;
  player = document.querySelector("video")!;
  status = document.querySelector("[data-video-status]")!;
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("one-activation video journey", () => {
  it("calls native play within the first click, before the browser's user activation expires", () => {
    let inUserActivation = false;
    const play = vi.spyOn(player, "play").mockImplementation(() => {
      expect(inUserActivation).toBe(true);
      expect(player.hidden).toBe(false);
      expect(player.src).toBe("https://video.twimg.com/public.mp4");
      return Promise.resolve();
    });
    initArgonVideos();
    expect(button.disabled).toBe(false);
    expect(player.hasAttribute("src")).toBe(false);
    expect(play).not.toHaveBeenCalled();

    inUserActivation = true;
    button.click();
    inUserActivation = false;

    expect(play).toHaveBeenCalledTimes(1);
    expect(document.querySelector("iframe")).toBeNull();
    expect(button.hidden).toBe(true);
    expect(player.controls).toBe(true);
  });

  it("does not report playback until the media clock has actually advanced", async () => {
    vi.spyOn(player, "play").mockResolvedValue(undefined);
    initArgonVideos();
    button.click();
    await Promise.resolve();
    expect(status.textContent).toBe("Starting the video…");
    player.dispatchEvent(new Event("timeupdate"));
    expect(status.textContent).toBe("Starting the video…");

    Object.defineProperties(player, { currentTime: { value: 1.1, configurable: true }, paused: { value: false, configurable: true } });
    player.dispatchEvent(new Event("timeupdate"));
    expect(status.textContent).toBe("Playing video.");
  });

  it("keeps retry, native controls and the original link reachable after playback is rejected", async () => {
    vi.spyOn(player, "play").mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));
    initArgonVideos();
    button.click();
    await Promise.resolve();
    expect(status.textContent).toContain("couldn’t start");
    expect(button.disabled).toBe(false);
    expect(button.hidden).toBe(false);
    expect(player.hidden).toBe(false);
    expect(player.controls).toBe(true);
    expect(document.querySelector("a")?.href).toBe("https://x.com/GoogleDeepMind/status/2112557925264752930");
  });

  it("reloads a failed media resource on an explicit retry so a temporary network failure can recover", async () => {
    const play = vi.spyOn(player, "play").mockResolvedValue(undefined);
    const load = vi.spyOn(player, "load").mockImplementation(() => {});
    initArgonVideos();
    button.click();
    Object.defineProperty(player, "error", { value: { code: 2 }, configurable: true });
    player.dispatchEvent(new Event("error"));
    expect(button.hidden).toBe(false);
    button.click();
    expect(load).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledTimes(2);
    expect(status.textContent).toBe("Starting the video…");
  });
});

/** The first activation must reach native play() before user activation expires. */
export function initArgonVideos(root: ParentNode = document): void {
  for (const section of root.querySelectorAll<HTMLElement>("[data-argon-video]")) {
    const button = section.querySelector<HTMLButtonElement>("[data-load-video]");
    const player = section.querySelector<HTMLVideoElement>("[data-video-player]");
    const host = section.querySelector<HTMLElement>("[data-video-host]");
    const status = section.querySelector<HTMLElement>("[data-video-status]");
    const label = section.querySelector<HTMLElement>("[data-video-label]");
    if (!button || !player || !host || !status || !label) continue;

    const showFailure = () => {
      host.setAttribute("aria-busy", "false");
      status.textContent = "The video couldn’t start. Try again, use its controls, or watch the original on X.";
      button.disabled = false;
      button.hidden = false;
      button.classList.add("retry-video");
      label.textContent = "Try again";
    };

    button.addEventListener("click", () => {
      button.disabled = true;
      button.hidden = true;
      player.hidden = false;
      host.setAttribute("aria-busy", "true");
      status.textContent = "Starting the video…";
      // Assign no source until the user asks, then play in this same event.
      // The hosting page uses no-referrer for this public CDN's media requests.
      if (!player.getAttribute("src")) player.src = player.dataset.videoSource!;
      else if (player.error) player.load();
      player.focus({ preventScroll: true });
      void player.play().catch(showFailure);
    });

    player.addEventListener("timeupdate", () => {
      if (player.currentTime > 0 && !player.paused) {
        host.setAttribute("aria-busy", "false");
        button.disabled = false;
        button.hidden = true;
        status.textContent = "Playing video.";
      }
    });
    player.addEventListener("pause", () => {
      if (player.currentTime > 0 && !player.ended) status.textContent = "Paused. Use the video controls to resume.";
    });
    player.addEventListener("ended", () => { status.textContent = "Video finished."; });
    player.addEventListener("error", showFailure);
    // Do not offer a dead first click while the deferred module initializes.
    button.disabled = false;
  }
}

/**
 * Client-side glue for the interactive periodic table on the home page.
 *
 * Behaviour:
 *  - Filter cells live by name/symbol/number.
 *  - Click a cell -> open the slide-in "more info" panel and embed THAT
 *    element's article by fetching its own static page (/element/<slug>) and
 *    lifting its <article> markup. The dedicated page is the single source of
 *    truth, so the panel never drifts from the indexable content.
 *  - Panel header controls (right-aligned): Share (Web Share API + clipboard
 *    fallback) and "Show more →" (link to the full element page).
 *  - Escape / backdrop / close button dismiss the panel; focus is restored.
 *
 * All element-specific logic that can be pure lives in ../lib/share.ts, which is
 * unit-tested. This file is the thin DOM layer.
 */

import { shareOrCopy, shareFeedback, type SharePayload } from "../lib/share";

interface PanelState {
  slug: string;
  symbol: string;
  name: string;
  number: string;
}

const articleCache = new Map<string, string>();

export function initInteractiveTable(): void {
  const search = document.querySelector<HTMLInputElement>("#pt-search");
  const cells = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".js-cell"),
  );
  const backdrop = document.querySelector<HTMLElement>(".js-backdrop");
  const panel = document.querySelector<HTMLElement>(".js-panel");
  const panelTitle = document.querySelector<HTMLElement>(".js-panel-title");
  const panelSub = document.querySelector<HTMLElement>(".js-panel-sub");
  const panelBody = document.querySelector<HTMLElement>(".js-panel-body");
  const panelShare = document.querySelector<HTMLButtonElement>(".js-panel-share");
  const panelMore = document.querySelector<HTMLAnchorElement>(".js-panel-more");
  const panelClose = document.querySelector<HTMLButtonElement>(".js-panel-close");
  const toast = document.querySelector<HTMLElement>(".js-toast");

  if (!panel || !backdrop || !panelBody) return;

  let lastFocused: HTMLElement | null = null;
  let current: PanelState | null = null;

  // ---- Live filter ----
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const cell of cells) {
      const hay = cell.dataset.search ?? "";
      cell.hidden = q.length > 0 && !hay.includes(q);
    }
  });

  // ---- Toast helper ----
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function showToast(msg: string): void {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---- Panel open/close ----
  function openPanel(state: PanelState, trigger: HTMLElement): void {
    current = state;
    lastFocused = trigger;
    if (panelTitle) panelTitle.textContent = `${state.name} (${state.symbol})`;
    if (panelSub) panelSub.textContent = `Element ${state.number}`;
    if (panelMore) panelMore.href = `/element/${state.slug}/`;

    backdrop!.classList.add("open");
    panel!.classList.add("open");
    panel!.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    panelClose?.focus();

    void loadArticle(state.slug);
  }

  function closePanel(): void {
    backdrop!.classList.remove("open");
    panel!.classList.remove("open");
    panel!.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    current = null;
    lastFocused?.focus();
  }

  // ---- Embed the element's article by fetching its dedicated page ----
  async function loadArticle(slug: string): Promise<void> {
    if (!panelBody) return;
    const cached = articleCache.get(slug);
    if (cached) {
      panelBody.innerHTML = cached;
      return;
    }
    panelBody.innerHTML = '<p class="loading">Loading article…</p>';
    try {
      const res = await fetch(`/element/${slug}/`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const article = doc.querySelector(".article");
      const markup = article
        ? article.outerHTML
        : "<p>Article unavailable. Open the full page instead.</p>";
      articleCache.set(slug, markup);
      // Only write if the user hasn't navigated to a different element.
      if (current?.slug === slug) panelBody.innerHTML = markup;
    } catch {
      if (current?.slug === slug) {
        panelBody.innerHTML =
          '<p>Could not load the article here. Use “Show more →” to open the full page.</p>';
      }
    }
  }

  // ---- Wire cells ----
  for (const cell of cells) {
    cell.addEventListener("click", () => {
      openPanel(
        {
          slug: cell.dataset.slug ?? "",
          symbol: cell.dataset.symbol ?? "",
          name: cell.dataset.name ?? "",
          number: cell.dataset.number ?? "",
        },
        cell,
      );
    });
  }

  // ---- Share from panel ----
  panelShare?.addEventListener("click", async () => {
    if (!current) return;
    const payload: SharePayload = {
      title: `${current.name} (${current.symbol}) — Periodic Table`,
      text: `${current.name}: element ${current.number} on the periodic table.`,
      url: new URL(`/element/${current.slug}/`, window.location.origin).href,
    };
    const outcome = await shareOrCopy(navigator, payload);
    showToast(shareFeedback(outcome));
  });

  // ---- Dismiss ----
  panelClose?.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
  });

  // ---- Standalone share buttons elsewhere on the page (element pages reuse this) ----
  wireStandaloneShareButtons(showToast);
}

/**
 * Wire any `.js-share` buttons (used on element detail pages). Reads the share
 * payload from data-* attributes. Exposed so element pages can call it too.
 */
export function wireStandaloneShareButtons(
  showToast: (msg: string) => void,
): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".js-share");
  for (const btn of buttons) {
    btn.addEventListener("click", async () => {
      const payload: SharePayload = {
        title: btn.dataset.shareTitle ?? document.title,
        text: btn.dataset.shareText ?? "",
        url: btn.dataset.shareUrl ?? window.location.href,
      };
      const outcome = await shareOrCopy(navigator, payload);
      showToast(shareFeedback(outcome));
    });
  }
}

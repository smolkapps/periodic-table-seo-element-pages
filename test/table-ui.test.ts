// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { initInteractiveTable } from "../src/scripts/table-ui";

afterEach(() => {
  delete window.umami;
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

it("records a learning activation without navigating away from the drawer, while keeping new-tab gestures", () => {
  document.body.innerHTML = `
    <input id="pt-search">
    <div class="js-periodic-table">
      <a class="js-cell" href="/element/oxygen/" data-slug="oxygen"
         data-symbol="O" data-name="Oxygen" data-number="8" data-x="16" data-y="2">O</a>
    </div>
    <div class="js-backdrop"></div>
    <aside class="js-panel" inert>
      <h2 class="js-panel-title"></h2>
      <button class="js-panel-close">Close</button>
      <div class="js-panel-body"></div>
    </aside>`;
  const track = vi.fn();
  window.umami = { track };
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    text: async () => '<article class="article">Oxygen reference</article>',
  })));
  initInteractiveTable();
  const link = document.querySelector<HTMLAnchorElement>(".js-cell")!;
  const panel = document.querySelector<HTMLElement>(".js-panel")!;

  // Observe the app's decision before stopping JSDOM's unsupported navigation.
  let interceptedNewTab = true;
  link.addEventListener("click", (event) => {
    if (event.metaKey) {
      interceptedNewTab = event.defaultPrevented;
      event.preventDefault();
    }
  });
  const newTab = new MouseEvent("click", { button: 0, metaKey: true, cancelable: true, bubbles: true });
  link.dispatchEvent(newTab);
  expect(interceptedNewTab).toBe(false);
  expect(panel.classList.contains("open")).toBe(false);
  expect(track).not.toHaveBeenCalled();

  const open = new MouseEvent("click", { button: 0, cancelable: true, bubbles: true });
  link.dispatchEvent(open);
  expect(open.defaultPrevented).toBe(true);
  expect(panel.classList.contains("open")).toBe(true);
  expect(document.querySelector(".js-panel-title")?.textContent).toBe("Oxygen (O)");
  expect(track).toHaveBeenCalledTimes(1);
  expect(track).toHaveBeenCalledWith("element-open", { element: "oxygen" });
});

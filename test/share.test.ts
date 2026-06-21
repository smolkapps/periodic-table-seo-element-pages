import { describe, it, expect, vi } from "vitest";
import {
  shareOrCopy,
  shareFeedback,
  type ShareCapableNavigator,
  type SharePayload,
} from "../src/lib/share";

const payload: SharePayload = {
  title: "Iron (Fe) — Periodic Table",
  text: "Iron: element 26 on the periodic table.",
  url: "https://elements.example.com/element/iron/",
};

describe("shareOrCopy", () => {
  it("uses the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav: ShareCapableNavigator = { share };
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith(payload);
  });

  it("treats a user-cancelled share (AbortError) as shared, not a failure", async () => {
    const abort = new DOMException("cancelled", "AbortError");
    const share = vi.fn().mockRejectedValue(abort);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav: ShareCapableNavigator = { share, clipboard: { writeText } };
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("shared");
    // Must NOT fall back to clipboard when the user simply dismissed the sheet.
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to clipboard when share throws a non-abort error", async () => {
    const share = vi.fn().mockRejectedValue(new Error("not allowed"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav: ShareCapableNavigator = { share, clipboard: { writeText } };
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(payload.url);
  });

  it("copies to clipboard when the Web Share API is absent", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav: ShareCapableNavigator = { clipboard: { writeText } };
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(payload.url);
  });

  it("reports unavailable when neither share nor clipboard exist", async () => {
    const nav: ShareCapableNavigator = {};
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("unavailable");
  });

  it("reports unavailable when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const nav: ShareCapableNavigator = { clipboard: { writeText } };
    const outcome = await shareOrCopy(nav, payload);
    expect(outcome).toBe("unavailable");
  });
});

describe("shareFeedback", () => {
  it("returns a message for each outcome", () => {
    expect(shareFeedback("shared")).toMatch(/shared/i);
    expect(shareFeedback("copied")).toMatch(/copied/i);
    expect(shareFeedback("unavailable")).toMatch(/copy/i);
  });
});

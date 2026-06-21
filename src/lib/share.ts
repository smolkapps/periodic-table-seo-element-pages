/**
 * Share helpers — pure logic separated from the DOM so it can be unit-tested.
 * The DOM glue in scripts/table-ui.ts calls these.
 */

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/** Minimal shape of the bits of `navigator` we rely on (for testing). */
export interface ShareCapableNavigator {
  share?: (data: SharePayload) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export type ShareOutcome = "shared" | "copied" | "unavailable";

/**
 * Attempt to share a payload using the Web Share API; fall back to copying the
 * URL to the clipboard; otherwise report it's unavailable. Returns which path
 * was taken so the UI can show the right feedback. Never throws — a user
 * cancelling the native share sheet (AbortError) is treated as a successful
 * "shared" (they saw the sheet), not an error.
 */
export async function shareOrCopy(
  nav: ShareCapableNavigator,
  payload: SharePayload,
): Promise<ShareOutcome> {
  if (typeof nav.share === "function") {
    try {
      await nav.share(payload);
      return "shared";
    } catch (err) {
      // User dismissed the sheet — not a failure worth falling back for.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
      // Otherwise fall through to clipboard.
    }
  }
  if (nav.clipboard && typeof nav.clipboard.writeText === "function") {
    try {
      await nav.clipboard.writeText(payload.url);
      return "copied";
    } catch {
      return "unavailable";
    }
  }
  return "unavailable";
}

/** Human feedback string for a share outcome. */
export function shareFeedback(outcome: ShareOutcome): string {
  switch (outcome) {
    case "shared":
      return "Shared!";
    case "copied":
      return "Link copied to clipboard";
    case "unavailable":
      return "Couldn't share — copy the URL from the address bar";
  }
}

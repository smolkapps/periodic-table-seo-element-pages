/**
 * Central tunables — the "go-live" file. Edit these constants to rebrand or
 * deploy; everything else reads from here.
 */
export const SITE = {
  url: "https://elements.smolkin.org",
  name: "Periodic Table",
  shortName: "Elements",
  title: "Interactive Periodic Table — Every Element, Its Own Page",
  description:
    "An interactive periodic table of the 118 elements. Click any element for an embedded article, or open its own dedicated, fully indexable page with structured data, electron configuration, discovery, and uses.",
  author: "Michael Smolkin",
  authorUrl: "https://www.smolkin.org",
  /** Leave blank to omit the analytics beacon. */
  analyticsId: "",
  themeColor: "#0e1116",
  locale: "en",
} as const;

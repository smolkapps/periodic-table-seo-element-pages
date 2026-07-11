#!/usr/bin/env node
/**
 * Post-build site-finishing gate. Run after `astro build`:
 *   node scripts/verify-build.mjs
 *
 * Fails (non-zero exit) if:
 *  - any required finishing asset is missing (favicon, OG image, manifest,
 *    apple-touch-icon, the PNG PWA icons, robots, sitemap, RSS, 404)
 *  - any internal href in the built HTML points at a path that wasn't emitted
 *    (dead internal link)
 *  - any <img> lacks alt text
 *
 * This is the automated half of the site-finishing-checklist, wired into the
 * build so the site can't ship with the classic "missing favicon / dead link"
 * defects.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = join(process.cwd(), "dist");
if (!existsSync(DIST)) {
  console.error("dist/ not found — run `npm run build` first.");
  process.exit(1);
}

const errors = [];

// 1. Required finishing assets.
const required = [
  "favicon.svg",
  "og-default.png",
  "site.webmanifest",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "robots.txt",
  "sitemap-index.xml",
  "rss.xml",
  "404.html",
];
for (const f of required) {
  if (!existsSync(join(DIST, f))) errors.push(`Missing required asset: ${f}`);
}

// 2. Walk all built HTML files.
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}
const htmlFiles = walk(DIST);

// Build the set of resolvable paths: every directory with an index.html, plus
// every emitted file, both with and without trailing slash.
const resolvable = new Set();
function addResolvable(absPath) {
  let rel = "/" + relative(DIST, absPath).split("\\").join("/");
  resolvable.add(rel);
  if (rel.endsWith("/index.html")) {
    const dir = rel.slice(0, -"index.html".length); // ".../"
    resolvable.add(dir); // with trailing slash
    resolvable.add(dir.replace(/\/$/, "")); // without
    if (dir === "/") resolvable.add("/");
  }
}
function addAllFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) addAllFiles(p);
    else addResolvable(p);
  }
}
addAllFiles(DIST);

// 3. Check internal links + image alts.
const hrefRe = /(?:href|src)="([^"]+)"/g;
const imgRe = /<img\b[^>]*>/g;
const ogImageRe =
  /(?:property="og:image"|name="twitter:image") content="([^"]+)"/g;

let linkCount = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const where = "/" + relative(DIST, file).split("\\").join("/");

  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    // Skip external, anchors, mailto, data URIs, and known dynamic schemes.
    if (
      /^(https?:)?\/\//.test(href) ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("data:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }
    // Only audit internal absolute paths.
    if (!href.startsWith("/")) continue;
    const clean = href.split("#")[0].split("?")[0];
    if (clean === "") continue;
    linkCount++;
    const candidates = [
      clean,
      clean.endsWith("/") ? clean.slice(0, -1) : clean + "/",
      join(clean, "index.html").split("\\").join("/").replace(/^(?!\/)/, "/"),
    ];
    const ok = candidates.some((c) => resolvable.has(c));
    if (!ok) errors.push(`Dead internal link in ${where}: ${href}`);
  }

  // Image alt text.
  let im;
  while ((im = imgRe.exec(html))) {
    if (!/\balt=/.test(im[0])) {
      errors.push(`<img> without alt in ${where}: ${im[0].slice(0, 80)}`);
    }
  }

  // Social-card images: every og:image / twitter:image URL must resolve to an
  // emitted file (crawlers fetch these; a 404 means broken link previews).
  let og;
  while ((og = ogImageRe.exec(html))) {
    let path;
    try {
      path = new URL(og[1]).pathname;
    } catch {
      errors.push(`Unparseable og:image URL in ${where}: ${og[1]}`);
      continue;
    }
    if (!resolvable.has(path)) {
      errors.push(`og:image points at a missing file in ${where}: ${path}`);
    }
    if (path.endsWith(".svg")) {
      errors.push(
        `og:image is an SVG in ${where} (social crawlers reject SVG): ${path}`,
      );
    }
  }
}

if (errors.length) {
  console.error(`\nverify-build: ${errors.length} problem(s) found:\n`);
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}

console.log(
  `verify-build: OK — ${htmlFiles.length} HTML pages, ${linkCount} internal links checked, all finishing assets present.`,
);

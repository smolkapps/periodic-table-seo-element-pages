#!/usr/bin/env node
/**
 * Rasterize the SVG finishing assets into the PNGs the site actually serves.
 * Run before build: `node scripts/gen-icons.mjs`.
 *  - favicon.svg   -> apple-touch-icon.png (180), icon-192.png, icon-512.png
 *  - og-default.svg -> og-default.png (1200×630; social crawlers reject SVG
 *    og:images, so the default card must ship as a PNG)
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC = join(process.cwd(), "public");
const svg = readFileSync(join(PUBLIC, "favicon.svg"));

const targets = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: "#0e1116" })
    .png()
    .toFile(join(PUBLIC, name));
  console.log(`wrote public/${name} (${size}x${size})`);
}

const ogSvg = readFileSync(join(PUBLIC, "og-default.svg"));
await sharp(ogSvg, { density: 96 })
  .resize(1200, 630, { fit: "contain", background: "#0e1116" })
  .png()
  .toFile(join(PUBLIC, "og-default.png"));
console.log("wrote public/og-default.png (1200x630)");

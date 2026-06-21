#!/usr/bin/env node
/**
 * Rasterize the SVG favicon into the PNG icon set the manifest + apple-touch
 * link reference. Run before build: `node scripts/gen-icons.mjs`.
 * Writes apple-touch-icon.png (180), icon-192.png, icon-512.png into public/.
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

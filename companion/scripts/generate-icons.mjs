/**
 * Renders Elementa's PNG app icons (PWA, Apple touch icon, Android/PWA maskable)
 * from the same atom mark as public/favicon.svg, with no image dependencies.
 *
 * Run: npm run icons
 * Output: public/icons/{favicon-32,apple-touch-icon-180,icon-192,icon-512,icon-512-maskable}.png
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/icons");

const COLORS = {
  bgCenter: [24, 36, 55],
  bgEdge: [11, 14, 20],
  rings: [
    [79, 157, 255],
    [105, 166, 255],
    [143, 194, 255],
  ],
  nucleus: [233, 237, 242],
  nucleusCore: [79, 157, 255],
};

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ellipseRingDistance(x, y, a, b, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const u = x * cos + y * sin;
  const v = -x * sin + y * cos;
  const norm = Math.hypot(u / a, v / b);
  if (norm === 0) return Infinity;
  const gradient = Math.hypot(u / (a * a), v / (b * b));
  if (gradient === 0) return Infinity;
  return Math.abs((norm - 1) / gradient);
}

function blend(target, color, alpha) {
  if (alpha <= 0) return;
  const a = Math.min(1, alpha);
  target[0] = target[0] * (1 - a) + color[0] * a;
  target[1] = target[1] * (1 - a) + color[1] * a;
  target[2] = target[2] * (1 - a) + color[2] * a;
}

function renderIcon(size, { rounded, markScale }) {
  const samples = 3;
  const rgba = Buffer.alloc(size * size * 4);
  const radius = 0.22; // rounded-corner radius in normalized units
  const ringA = 0.62 * markScale;
  const ringB = 0.26 * markScale;
  const ringWidth = 0.068 * markScale;
  const nucleusRadius = 0.118 * markScale;
  const coreRadius = 0.055 * markScale;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const accumulator = [0, 0, 0];
      let coverage = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const nx = ((px + (sx + 0.5) / samples) / size) * 2 - 1;
          const ny = ((py + (sy + 0.5) / samples) / size) * 2 - 1;

          // Rounded-square background mask.
          const ax = Math.abs(nx);
          const ay = Math.abs(ny);
          const inner = 1 - radius;
          const inside =
            rounded &&
            (ax > inner || ay > inner
              ? Math.hypot(Math.max(0, ax - inner), Math.max(0, ay - inner)) <= radius
              : true);
          if (rounded && !inside) continue;

          const radial = Math.min(1, Math.hypot(nx, ny) / 1.15);
          const pixel = [
            COLORS.bgCenter[0] + (COLORS.bgEdge[0] - COLORS.bgCenter[0]) * radial,
            COLORS.bgCenter[1] + (COLORS.bgEdge[1] - COLORS.bgCenter[1]) * radial,
            COLORS.bgCenter[2] + (COLORS.bgEdge[2] - COLORS.bgCenter[2]) * radial,
          ];

          const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
          for (let ring = 0; ring < angles.length; ring++) {
            const distance = ellipseRingDistance(nx, ny, ringA, ringB, angles[ring]);
            if (distance <= ringWidth / 2) {
              const edgeFalloff = Math.min(1, (ringWidth / 2 - distance) / (ringWidth / 6));
              blend(pixel, COLORS.rings[ring], 0.92 * edgeFalloff);
            }
          }

          const centerDistance = Math.hypot(nx, ny);
          if (centerDistance <= nucleusRadius) blend(pixel, COLORS.nucleus, 1);
          if (centerDistance <= coreRadius) blend(pixel, COLORS.nucleusCore, 1);

          accumulator[0] += pixel[0];
          accumulator[1] += pixel[1];
          accumulator[2] += pixel[2];
          coverage += 1;
        }
      }

      const offset = (py * size + px) * 4;
      if (coverage === 0) {
        rgba[offset + 3] = 0;
        continue;
      }
      rgba[offset] = Math.round(accumulator[0] / coverage);
      rgba[offset + 1] = Math.round(accumulator[1] / coverage);
      rgba[offset + 2] = Math.round(accumulator[2] / coverage);
      rgba[offset + 3] = Math.round((coverage / (samples * samples)) * 255);
    }
  }

  return encodePng(size, size, rgba);
}

const TARGETS = [
  { file: "favicon-32.png", size: 32, rounded: true, markScale: 1.0 },
  // Apple masks the icon itself and requires an opaque square.
  { file: "apple-touch-icon-180.png", size: 180, rounded: false, markScale: 0.86 },
  { file: "icon-192.png", size: 192, rounded: true, markScale: 0.98 },
  { file: "icon-128.png", size: 128, rounded: true, markScale: 0.98 },
  { file: "icon-48.png", size: 48, rounded: true, markScale: 1.0 },
  { file: "icon-512.png", size: 512, rounded: true, markScale: 0.98 },
  // Maskable: full bleed, mark kept inside the safe zone.
  { file: "icon-512-maskable.png", size: 512, rounded: false, markScale: 0.72 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const target of TARGETS) {
  const png = renderIcon(target.size, target);
  writeFileSync(resolve(OUT_DIR, target.file), png);
  console.log(`wrote public/icons/${target.file} (${target.size}×${target.size}, ${png.length} bytes)`);
}
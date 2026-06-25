/**
 * Generates the extension's PNG icons (16/48/128) with no external deps.
 *
 * Draws a rounded gradient tile with a white four-point "spark" ✦ — matching
 * the in-product logo — and encodes it as a PNG via a minimal RGBA encoder.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(root, "public/icons");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Signed distance from point to a four-point star (spark) centered at (cx,cy).
function sparkAlpha(x, y, cx, cy, r) {
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  // Astroid-like spark: |dx|^p + |dy|^p <= r^p with small p makes pinched arms.
  const p = 0.62;
  const v = Math.pow(dx / r, p) + Math.pow(dy / r, p);
  // soft edge
  return Math.max(0, Math.min(1, (1.0 - v) * 6));
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.22; // rounded corners
  const cx = size / 2;
  const cy = size / 2;
  const sparkR = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // rounded-rect mask
      const rx = Math.max(radius - x, x - (size - 1 - radius), 0);
      const ry = Math.max(radius - y, y - (size - 1 - radius), 0);
      const cornerDist = Math.sqrt(rx * rx + ry * ry);
      const inside = cornerDist <= radius ? 1 : Math.max(0, 1 - (cornerDist - radius));

      // diagonal gradient #7c8cff -> #5a6bff
      const t = (x + y) / (2 * size);
      let r = lerp(0x7c, 0x5a, t);
      let g = lerp(0x8c, 0x6b, t);
      let b = lerp(0xff, 0xff, t);

      // composite white spark on top
      const sa = sparkAlpha(x, y, cx, cy, sparkR);
      r = lerp(r, 255, sa);
      g = lerp(g, 255, sa);
      b = lerp(b, 255, sa);

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = Math.round(255 * inside);
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = renderIcon(size);
  writeFileSync(resolve(outDir, `icon${size}.png`), png);
  console.log(`icon${size}.png (${png.length} bytes)`);
}

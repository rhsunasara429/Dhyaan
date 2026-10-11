/* Dhyaan PWA icon generator.
 *
 * Renders the app mark (the concentric rings used in the header) into every
 * icon asset the manifest and index.html reference.
 *
 * Zero dependencies on purpose (see AGENTS.md): the mark is nothing but
 * circles, so it rasterizes as a signed-distance test with 4x4 supersampling,
 * and PNG is encoded by hand on top of node:zlib.
 *
 * Run with `npm run icons` after changing MARK, the palette, or the scales.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/* The mark: a stylized lotus/meditation symbol representing mindfulness.
 * Design: Three lotus petals arranged in a mandala pattern with a centered
 * meditation circle, all within a 100x100 viewBox. The design is geometric,
 * modern, and recognizable at small sizes. */
const MARK = {
  // Center meditation dot
  centerDot: 8,
  // Three petal arcs (top, bottom-left, bottom-right)
  petals: [
    { cx: 50, cy: 28, r: 20 },  // top petal
    { cx: 32, cy: 62, r: 20 },  // bottom-left petal
    { cx: 68, cy: 62, r: 20 },  // bottom-right petal
  ],
  // Outer ring for cohesion
  outerRing: { r: 44, stroke: 3 },
};

/* Light/dark accents, mirrored from --color-accent in src/styles.css.
 * Using the warm saffron/turmeric palette for a mindful, calm aesthetic.
 * The dark variant is for the dark-mode browser tab. */
const LIGHT = '#b45309';  // Deep turmeric/saffron
const DARK = '#f59e0b';   // Brighter amber for dark mode

/* Mark scale as a fraction of the canvas. The outer ring's edge sits at
 * 2*(42+2.5)/100 = 89% of the canvas width, so these are really just a
 * choice of how much padding to leave:
 *   - `any` icons fill the tile more boldly.
 *   - Android's maskable safe zone guarantees a centred circle of 80%
 *     diameter across every mask shape, so 0.86 -> 76.5% stays inside it. */
const SCALE_ANY = 0.92;
const SCALE_MASKABLE = 0.86;

const WHITE = '#ffffff';
const BLACK = '#000000';
const SUPERSAMPLE = 4;

/* ---------- rasteriser ---------- */

function insideMark(x, y, centerX, centerY) {
  const dx = x - centerX;
  const dy = y - centerY;
  const distFromCenter = Math.hypot(dx, dy);
  
  // Center meditation dot
  if (distFromCenter <= MARK.centerDot) {
    return true;
  }
  
  // Outer ring
  const ringDist = Math.abs(distFromCenter - MARK.outerRing.r);
  if (ringDist <= MARK.outerRing.stroke / 2) {
    return true;
  }
  
  // Three lotus petals (filled circles)
  for (const petal of MARK.petals) {
    const petalDist = Math.hypot(x - petal.cx, y - petal.cy);
    if (petalDist <= petal.r) {
      return true;
    }
  }
  
  return false;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function render(size, { scale, color, background }) {
  const unit = (size / 100) * scale; // pixels per view unit
  const mid = size / 2;
  const [mr, mg, mb] = hexToRgb(color);
  const bg = background ? hexToRgb(background) : null;
  const out = Buffer.alloc(size * size * 4);
  const step = 1 / SUPERSAMPLE;
  const total = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const fx = x + (sx + 0.5) * step;
          const fy = y + (sy + 0.5) * step;
          // Convert pixel coordinates to viewBox coordinates (0-100)
          const vx = ((fx - mid) / unit) + 50;
          const vy = ((fy - mid) / unit) + 50;
          if (insideMark(vx, vy, 50, 50)) hits++;
        }
      }
      const cov = hits / total;
      const i = (y * size + x) * 4;
      if (bg) {
        // Opaque tile: blend mark over background so edges stay smooth.
        out[i] = Math.round(bg[0] + (mr - bg[0]) * cov);
        out[i + 1] = Math.round(bg[1] + (mg - bg[1]) * cov);
        out[i + 2] = Math.round(bg[2] + (mb - bg[2]) * cov);
        out[i + 3] = 255;
      } else {
        out[i] = mr;
        out[i + 1] = mg;
        out[i + 2] = mb;
        out[i + 3] = Math.round(cov * 255);
      }
    }
  }
  return out;
}

/* ---------- minimal PNG encoder ---------- */

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- svg ---------- */

function faviconSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Outer ring -->
  <circle cx="50" cy="50" r="${MARK.outerRing.r}" fill="none" stroke="${color}" stroke-width="${MARK.outerRing.stroke}"/>
  <!-- Three lotus petals -->
  <circle cx="${MARK.petals[0].cx}" cy="${MARK.petals[0].cy}" r="${MARK.petals[0].r}" fill="${color}"/>
  <circle cx="${MARK.petals[1].cx}" cy="${MARK.petals[1].cy}" r="${MARK.petals[1].r}" fill="${color}"/>
  <circle cx="${MARK.petals[2].cx}" cy="${MARK.petals[2].cy}" r="${MARK.petals[2].r}" fill="${color}"/>
  <!-- Center meditation dot -->
  <circle cx="50" cy="50" r="${MARK.centerDot}" fill="${color}"/>
</svg>
`;
}

/* ---------- output ---------- */

const written = [];

function png(name, size, opts) {
  writeFileSync(resolve(OUT, name), encodePng(size, render(size, opts)));
  written.push(`${name} (${size}x${size})`);
}

function svg(name, color) {
  writeFileSync(resolve(OUT, name), faviconSvg(color));
  written.push(name);
}

svg('favicon.svg', LIGHT);
svg('favicon-dark.svg', DARK);

png('icon-192.png', 192, { scale: SCALE_ANY, color: LIGHT, background: WHITE });
png('icon-512.png', 512, { scale: SCALE_ANY, color: LIGHT, background: WHITE });

png('icon-maskable-192.png', 192, {
  scale: SCALE_MASKABLE,
  color: LIGHT,
  background: WHITE,
});
png('icon-maskable-512.png', 512, {
  scale: SCALE_MASKABLE,
  color: LIGHT,
  background: WHITE,
});

// Android 13+ themed icons: flat silhouette, tinted by the system.
png('icon-mono-512.png', 512, {
  scale: SCALE_MASKABLE,
  color: BLACK,
  background: null,
});

// iOS applies its own squircle mask, so keep the mark off the corners.
png('apple-touch-icon.png', 180, {
  scale: SCALE_MASKABLE,
  color: LIGHT,
  background: WHITE,
});

for (const name of written) console.log(`  public/${name}`);
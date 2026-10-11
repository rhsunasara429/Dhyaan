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

/* The mark: "Bindu + Open Ring" — the single point of focus.
 *
 * A solid centre bindu (the one point the mind returns to in dhyana) held in
 * a calm ring that is left OPEN at the top. The opening is an ensō: a circle
 * drawn in one breath, never perfectly closed — the present moment, openness,
 * not rigidity. Together they are Dhyaan's whole thesis, "scattered attention
 * becoming a single point of focus", in one glyph.
 *
 * Everything is a circle or an arc, so it rasterizes as a signed-distance test
 * with no anti-aliasing library. The 100x100 viewBox keeps the ring centred. */
const MARK = {
  // Solid centre bindu — the focal point.
  bindu: 11,
  // The ring: radius 40, ~7.2 thick, cut by a gap centred on "up".
  ring: { r: 40, stroke: 7.2 },
  // Half-angle of the opening, in radians (~24deg -> ~48deg total gap).
  gapHalfAngle: 0.42,
};

/* Light/dark accents, mirrored from --color-accent in src/styles.css.
 * Using the warm saffron/turmeric palette for a mindful, calm aesthetic.
 * The dark variant is for the dark-mode browser tab. */
const LIGHT = '#b45309';  // Deep turmeric/saffron
const DARK = '#f59e0b';   // Brighter amber for dark mode

/* The installed home-screen tile: a deep-turmeric -> warmer gradient with a
 * white mark, so the icon is bold and unmistakable on any wallpaper. Mirrors
 * the "calm & mindful" palette rather than introducing new hues. */
const TILE_TOP = '#92440e';    // deep turmeric (top of gradient)
const TILE_BOTTOM = '#bf6010'; // warmer turmeric (bottom of gradient)

/* Mark scale as a fraction of the canvas. The ring's outer edge sits at
 * 2*(40+3.6)/100 = 87.2% of the canvas width, so these are really just a
 * choice of how much padding to leave:
 *   - `any` icons fill the tile more boldly.
 *   - Android's maskable safe zone guarantees a centred circle of 80%
 *     diameter across every mask shape, so 0.86 -> 75% stays inside it. */
const SCALE_ANY = 0.92;
const SCALE_MASKABLE = 0.86;

const WHITE = '#ffffff';
const BLACK = '#000000';
const SUPERSAMPLE = 4;

const TAU = Math.PI * 2;

/* ---------- rasteriser ---------- */

function insideMark(x, y, centerX, centerY) {
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.hypot(dx, dy);

  // Solid centre bindu.
  if (dist <= MARK.bindu) return true;

  // Open ring: present everywhere except within the gap centred on "up".
  if (Math.abs(dist - MARK.ring.r) <= MARK.ring.stroke / 2) {
    let angle = Math.atan2(dy, dx); // -PI..PI ; up = -PI/2
    if (angle < 0) angle += TAU;    // 0..TAU ; up = 3PI/2
    const gapCenter = 1.5 * Math.PI;
    let diff = Math.abs(angle - gapCenter);
    if (diff > Math.PI) diff = TAU - diff;
    if (diff > MARK.gapHalfAngle) return true;
  }

  return false;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function render(size, { scale, color, background, gradient }) {
  const unit = (size / 100) * scale; // pixels per view unit
  const mid = size / 2;
  const [mr, mg, mb] = hexToRgb(color);
  const bg = background ? hexToRgb(background) : null;
  // Two-stop vertical gradient (top -> bottom), used for the home-screen tile.
  const grad = gradient
    ? [hexToRgb(gradient.top), hexToRgb(gradient.bottom)]
    : null;
  const out = Buffer.alloc(size * size * 4);
  const step = 1 / SUPERSAMPLE;
  const total = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < size; y++) {
    // Background colour for this row: gradient stop, or a flat fill, or none.
    let rowBg = bg;
    if (grad) {
      const t = size > 1 ? y / (size - 1) : 0;
      rowBg = [
        Math.round(grad[0][0] + (grad[1][0] - grad[0][0]) * t),
        Math.round(grad[0][1] + (grad[1][1] - grad[0][1]) * t),
        Math.round(grad[0][2] + (grad[1][2] - grad[0][2]) * t),
      ];
    }
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
      if (rowBg) {
        // Opaque tile: blend mark over background so edges stay smooth.
        out[i] = Math.round(rowBg[0] + (mr - rowBg[0]) * cov);
        out[i + 1] = Math.round(rowBg[1] + (mg - rowBg[1]) * cov);
        out[i + 2] = Math.round(rowBg[2] + (mb - rowBg[2]) * cov);
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

/* The open ring as an SVG arc path. SVG arcs can't express a gap directly, so
 * we draw a near-full circle as a stroked path that starts and ends inside the
 * gap, leaving the opening at the top. Angles are measured in SVG space where
 * 0deg points right and positive is clockwise; "up" is -90deg (270deg). */
function faviconSvg(color) {
  const r = MARK.ring.r;
  const half = MARK.gapHalfAngle;
  // Start/end just past the gap, on either side of the top (270deg).
  const startDeg = 270 + (half * 180) / Math.PI; // a little clockwise of up
  const endDeg = 270 - (half * 180) / Math.PI;   // a little counter-clockwise
  const rad = (deg) => (deg * Math.PI) / 180;
  const sx = 50 + r * Math.cos(rad(startDeg));
  const sy = 50 + r * Math.sin(rad(startDeg));
  const ex = 50 + r * Math.cos(rad(endDeg));
  const ey = 50 + r * Math.sin(rad(endDeg));
  // large-arc=1 (the long way around), sweep=1 (clockwise) -> gap stays at top.
  const arc = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Open ring (enso): stroked arc that leaves a gap at the top -->
  <path d="${arc}" fill="none" stroke="${color}" stroke-width="${MARK.ring.stroke}" stroke-linecap="round"/>
  <!-- Centre bindu: the single point of focus -->
  <circle cx="50" cy="50" r="${MARK.bindu}" fill="${color}"/>
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

// Installed home-screen icons: white mark on the deep-turmeric gradient tile,
// so the app is bold and unmistakable on any wallpaper.
const TILE = { gradient: { top: TILE_TOP, bottom: TILE_BOTTOM } };
const TILE_OPTS = { color: WHITE, ...TILE };

png('icon-192.png', 192, { scale: SCALE_ANY, ...TILE_OPTS });
png('icon-512.png', 512, { scale: SCALE_ANY, ...TILE_OPTS });

png('icon-maskable-192.png', 192, { scale: SCALE_MASKABLE, ...TILE_OPTS });
png('icon-maskable-512.png', 512, { scale: SCALE_MASKABLE, ...TILE_OPTS });

// Android 13+ themed icons: flat silhouette, tinted by the system.
png('icon-mono-512.png', 512, {
  scale: SCALE_MASKABLE,
  color: BLACK,
  background: null,
});

// iOS applies its own squircle mask, so keep the mark off the corners.
png('apple-touch-icon.png', 180, { scale: SCALE_MASKABLE, ...TILE_OPTS });

for (const name of written) console.log(`  public/${name}`);
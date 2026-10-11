/* Dhyaan logo concept previews (throwaway — not shipped).
 *
 * Renders THREE candidate app-icon concepts to PNG and embeds them into a
 * single self-contained preview/concepts.html so a human can compare them as
 * home-screen tiles, at favicon sizes, and on light backgrounds before picking
 * one to promote into scripts/generate-icons.mjs.
 *
 * Zero dependencies (see AGENTS.md): the marks are circles/arcs/vesicas, so
 * each rasterizes as a signed-distance / coverage test with 4x4 supersampling,
 * and PNG is encoded by hand on node:zlib.
 *
 *   node scripts/preview-concepts.mjs   ->  writes preview/concepts.html
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'preview');

/* ---- palette (mirrors src/styles.css) ---- */
const SAFFRON = [180, 83, 9];      // #b45309  --color-accent (light)
const TILE_TOP = [146, 68, 14];    // deep turmeric, gradient start
const TILE_BOTTOM = [191, 96, 16]; // warmer turmeric, gradient end
const WHITE = [255, 255, 255];
const SUPERSAMPLE = 4;
const TAU = Math.PI * 2;

/* ============================================================
   Concept 1 - Bindu + Open Ring  ("the single point of focus")
   A solid centre bindu held in a calm ring left OPEN at the top
   (an enso - drawn in one breath, never perfectly closed).
   ============================================================ */
function concept1(x, y) {
  const dx = x - 50, dy = y - 50;
  const dist = Math.hypot(dx, dy);
  if (dist <= 11) return 1; // solid centre bindu
  const ringMid = 40, halfStroke = 3.6;
  if (Math.abs(dist - ringMid) <= halfStroke) {
    let angle = Math.atan2(dy, dx); // -PI..PI ; up = -PI/2
    if (angle < 0) angle += TAU;    // 0..TAU ; up = 3PI/2
    const gapCenter = 1.5 * Math.PI;
    let diff = Math.abs(angle - gapCenter);
    if (diff > Math.PI) diff = TAU - diff;
    if (diff > 0.42) return 1; // ring present except a ~24 degree opening
  }
  return 0;
}

/* ============================================================
   Concept 2 - Settling Ripples  ("Inbox becomes Today")
   A solid core with concentric rings that thin and fade outward.
   ============================================================ */
function concept2(x, y) {
  const dist = Math.hypot(x - 50, y - 50);
  if (dist <= 10) return 1;
  if (Math.abs(dist - 24) <= 2.4) return 0.9;
  if (Math.abs(dist - 36) <= 1.9) return 0.5;
  if (Math.abs(dist - 47) <= 1.4) return 0.24;
  return 0;
}

/* ============================================================
   Concept 3 - Lotus, refined  ("mindful growth")
   Three vesica (lens) petals around a bindu - the intersection of
   two circles - cleaner than the old overlapping discs.
   ============================================================ */
function inVesica(px, py, cx, cy, ux, uy, d, pr) {
  const perpX = -uy, perpY = ux;
  const a = Math.hypot(px - (cx + perpX * d), py - (cy + perpY * d));
  const b = Math.hypot(px - (cx - perpX * d), py - (cy - perpY * d));
  return a <= pr && b <= pr;
}
function concept3(x, y) {
  const dist = Math.hypot(x - 50, y - 50);
  if (dist <= 9) return 1; // bindu
  const R = 25, d = 15, pr = 27;
  for (const a of [1.5 * Math.PI, Math.PI / 6, (5 * Math.PI) / 6]) {
    const cx = 50 + R * Math.cos(a);
    const cy = 50 + R * Math.sin(a);
    if (inVesica(x, y, cx, cy, Math.cos(a), Math.sin(a), d, pr)) return 1;
  }
  if (Math.abs(dist - 44) <= 1.8) return 1; // thin cohesion ring
  return 0;
}

const CONCEPTS = [concept1, concept2, concept3];

/* ---- rasteriser: returns RGBA buffer ---- */
function render(size, markFn, mode) {
  const out = Buffer.alloc(size * size * 4);
  const step = 1 / SUPERSAMPLE;
  const total = SUPERSAMPLE * SUPERSAMPLE;
  const scale = size / 100;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let cov = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const x = (px + (sx + 0.5) * step) / scale;
          const y = (py + (sy + 0.5) * step) / scale;
          cov += markFn(x, y);
        }
      }
      cov /= total;

      const i = (py * size + px) * 4;
      if (mode === 'favicon') {
        out[i] = SAFFRON[0];
        out[i + 1] = SAFFRON[1];
        out[i + 2] = SAFFRON[2];
        out[i + 3] = Math.round(cov * 255);
      } else {
        let bg;
        if (mode === 'tile') {
          const t = py / size;
          bg = [
            Math.round(TILE_TOP[0] + (TILE_BOTTOM[0] - TILE_TOP[0]) * t),
            Math.round(TILE_TOP[1] + (TILE_BOTTOM[1] - TILE_TOP[1]) * t),
            Math.round(TILE_TOP[2] + (TILE_BOTTOM[2] - TILE_TOP[2]) * t),
          ];
        } else {
          bg = WHITE;
        }
        const mc = mode === 'tile' ? WHITE : SAFFRON;
        out[i] = Math.round(mc[0] * cov + bg[0] * (1 - cov));
        out[i + 1] = Math.round(mc[1] * cov + bg[1] * (1 - cov));
        out[i + 2] = Math.round(mc[2] * cov + bg[2] * (1 - cov));
        out[i + 3] = 255;
      }
    }
  }
  return out;
}

/* ---- minimal PNG encoder ---- */
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
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---- build the preview ---- */
mkdirSync(OUT, { recursive: true });

const META = [
  {
    name: '① Bindu + Open Ring',
    tag: 'The single point of focus',
    meaning:
      'A solid bindu — the one point the mind returns to — held in a calm ring ' +
      'left open at the top: an ensō drawn in one breath, never perfectly closed. ' +
      'Dhyaan’s whole thesis in one glyph.',
  },
  {
    name: '② Settling Ripples',
    tag: 'Inbox becomes Today',
    meaning:
      'A dropped thought ripples outward, then settles to one clear point — ' +
      'the exact journey from a scattered Inbox to a focused Today.',
  },
  {
    name: '③ Lotus, refined',
    tag: 'Mindful growth',
    meaning:
      'Three clean vesica petals around a bindu — the lotus rising whole from ' +
      'muddy water. Culturally resonant, fixed for small sizes.',
  },
];

const dataUri = (buf) => 'data:image/png;base64,' + buf.toString('base64');

const cards = META.map((meta, idx) => {
  const mark = CONCEPTS[idx];
  const tile = dataUri(encodePng(512, render(512, mark, 'tile')));
  const light = dataUri(encodePng(512, render(512, mark, 'light')));
  const fav16 = dataUri(encodePng(16, render(16, mark, 'favicon')));
  const fav32 = dataUri(encodePng(32, render(32, mark, 'favicon')));
  const fav48 = dataUri(encodePng(48, render(48, mark, 'favicon')));
  return `
  <section class="card">
    <h2>${meta.name}</h2>
    <p class="tag">${meta.tag}</p>
    <div class="tile-row">
      <div class="tile"><img src="${tile}" alt=""><span>512 · home screen</span></div>
      <div class="tile small"><img src="${light}" alt=""><span>512 · light bg</span></div>
    </div>
    <div class="fav-row">
      <img class="fav" src="${fav48}" alt="">
      <img class="fav" src="${fav32}" alt="">
      <img class="fav" src="${fav16}" alt="">
      <span class="fav-cap">browser tab</span>
    </div>
    <p class="meaning">${meta.meaning}</p>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Dhyaan — logo concepts</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; padding:32px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background:#f7f3ec; color:#1f1a14; }
  h1 { font-size:20px; margin:0 0 4px; }
  .lede { margin:0 0 28px; color:#5c554a; font-size:14px; max-width:70ch; }
  .grid { display:grid; gap:24px; grid-template-columns: repeat(auto-fit, minmax(300px,1fr)); max-width:1100px; }
  .card { background:#fffefa; border:1px solid #e4ddcf; border-radius:20px; padding:24px; box-shadow:0 6px 24px rgba(31,26,20,.06); }
  .card h2 { margin:0; font-size:17px; }
  .tag { margin:2px 0 18px; color:#b45309; font-weight:600; font-size:13px; }
  .tile-row { display:flex; gap:16px; align-items:flex-end; margin-bottom:16px; }
  .tile img { display:block; width:160px; height:160px; border-radius:36px; box-shadow:0 10px 30px rgba(31,26,20,.18); }
  .tile.small img { width:96px; height:96px; border-radius:22px; }
  .tile span, .fav-cap { display:block; margin-top:8px; font-size:11px; color:#a39a8b; }
  .fav-row { display:flex; align-items:center; gap:12px; padding:14px; background:#f1ece1; border-radius:14px; }
  .fav { display:block; }
  .meaning { margin:16px 0 0; font-size:13px; line-height:1.55; color:#5c554a; }
  footer { margin-top:28px; font-size:12px; color:#a39a8b; }
</style></head>
<body>
  <h1>Dhyaan — install-icon concepts</h1>
  <p class="lede">Three directions for the icon that appears when the app is installed to a
  home screen. Left tile = recommended filled-tile treatment; below = how it reads as a
  browser-tab favicon. Pick the one whose meaning fits — I’ll promote it into the real
  generator next.</p>
  <div class="grid">${cards}
  </div>
  <footer>Generated by scripts/preview-concepts.mjs · zero dependencies · not shipped</footer>
</body></html>
`;

writeFileSync(resolve(OUT, 'concepts.html'), html);
console.log(`  preview/concepts.html  (${META.length} concepts embedded)`);

/* Also drop standalone PNGs so each concept can be opened directly (e.g. in
   the VS Code image preview) without unpacking the HTML. */
CONCEPTS.forEach((mark, idx) => {
  const n = idx + 1;
  writeFileSync(
    resolve(OUT, `concept-${n}-tile.png`),
    encodePng(512, render(512, mark, 'tile')),
  );
  writeFileSync(
    resolve(OUT, `concept-${n}-light.png`),
    encodePng(512, render(512, mark, 'light')),
  );
});
console.log('  preview/concept-{1,2,3}-{tile,light}.png');



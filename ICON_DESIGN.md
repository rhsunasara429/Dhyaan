# Dhyaan Icon Design

## Design Philosophy

The icon is a **"Bindu + Open Ring"** — the single point of focus. It distills
the app's whole thesis, *"scattered attention becoming a single point of
focus,"* into one glyph, and it stays true to the name **"Dhyaan" (ध्यान)** —
meditation, attention, holding the mind on one thing.

## The Mark

```
      ╭─  ─╮
     │   ●  │     A solid centre bindu held in a calm ring
      ╰─  ─╯      left OPEN at the top.
```

### Components

1. **Centre bindu** (r: 11)
   - The one point the mind returns to in dhyana — the focal point.
   - Filled solid; the visual anchor at every size.

2. **Open ring** (r: 40, stroke: 7.2, gap ≈ 48° at the top)
   - An **ensō** (円相): a circle drawn in one breath, never perfectly closed.
   - The opening = openness and the present moment, not rigidity.
   - The ring = a calm boundary that protects the single focus.

### Why this mark
- **Ownable:** distinct from both the earlier "generic rings" and the lotus.
- **Meaningful:** tied to the *word* (focus/attention) and the *product* (Today).
- **Legible:** reads as "a dot in a near-circle" even at 16px; clean at 512px.
- **Trivial to render:** one filled circle + one arc — no AA library needed.

## Color & Treatment

- **Home-screen tile:** a **deep-turmeric → warmer gradient** (`#92440e` →
  `#bf6010`) with a **white** mark, so the installed icon is bold on any
  wallpaper. Mirrors the app's warm "calm & mindful" palette.
- **Browser favicon:** saffron `#b45309` (light) / amber `#f59e0b` (dark) on
  transparency.
- **Monochrome (Android 13+ themed):** flat black silhouette.

## Technical Details

### Scales
- **Standard icons** (`icon-192/512.png`): `0.92` — bold presence.
- **Maskable icons** (`icon-maskable-*.png`): `0.86` — stays inside Android's
  80% safe circle.
- **Apple touch icon** (`apple-touch-icon.png`, 180px): `0.86` — iOS squircle.
- The ring's outer edge sits at `2*(40+3.6)/100 = 87.2%` of the canvas.

### Generated Assets (via `npm run icons`)
- `favicon.svg` / `favicon-dark.svg` (browser tabs)
- `icon-192.png` / `icon-512.png` (standard PWA)
- `icon-maskable-192.png` / `icon-maskable-512.png` (adaptive Android)
- `icon-mono-512.png` (Android 13+ themed)
- `apple-touch-icon.png` (iOS home screen)

All from `scripts/generate-icons.mjs` — **zero dependencies**, a signed-distance
rasteriser with 4×4 supersampling and a hand-rolled PNG encoder.

## In-app brand

The header logo (`src/App.tsx`) and the landing-page `Mark`
(`src/LandingPage.tsx`) use the **same** open-ring + bindu geometry as an inline
SVG, so the brand is one system across the app, the marketing site, and the
installed icon.

## Updating the Icon

Edit `MARK`, `TILE_TOP`/`TILE_BOTTOM`, or `LIGHT`/`DARK` in
`scripts/generate-icons.mjs`, then:

```bash
npm run icons
```

## Testing on Device

After regenerating icons:

1. **Uninstall** the existing PWA from your home screen.
2. **Hard reload** the browser (Ctrl+Shift+R / Cmd+Shift+R).
3. **Clear site data** if necessary.
4. **Reinstall** the PWA.

The OS caches icons at install time, so changes won't appear until reinstallation.

## Accessibility

- High-contrast white-on-turmeric tile (well above 4.5:1).
- Simple, bold shapes remain recognizable at all sizes.
- No reliance on fine details or text; works in monochrome.


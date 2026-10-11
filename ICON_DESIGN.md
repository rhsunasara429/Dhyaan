# Dhyaan Icon Design

## Design Philosophy

The new icon represents **mindfulness and meditation** through a stylized lotus mandala, perfectly aligned with the app's name "Dhyaan" (meaning meditation/focus in Sanskrit/Hindi).

## Visual Elements

### Structure
```
┌─────────────────────────────────────┐
│    Outer Ring (containment)         │
│                                     │
│         ●  Top Petal                │
│                                     │
│    ●          ◉          ●         │
│  Left Petal   Center   Right Petal │
│            (Focus)                  │
└─────────────────────────────────────┘
```

### Components

1. **Outer Ring** (r: 44, stroke: 3)
   - Represents containment and mindful boundaries
   - Creates visual cohesion and balance

2. **Three Lotus Petals** (r: 20 each)
   - **Top petal** (cx: 50, cy: 28): Aspiration/awakening
   - **Bottom-left petal** (cx: 32, cy: 62): Body/grounding
   - **Bottom-right petal** (cx: 68, cy: 62): Mind/awareness
   - Arranged in a triangular mandala pattern

3. **Center Meditation Dot** (r: 8)
   - The focal point of practice
   - Uses the app's accent color (saffron)
   - Represents centered awareness

## Color Palette

- **Primary**: `#b45309` (Deep turmeric/saffron)
  - Warm, calming, culturally resonant
  - Matches the app's `--color-accent`
  
- **Dark mode variant**: `#f59e0b` (Brighter amber)
  - Used for dark-mode browser favicon only

- **Background**: White (`#ffffff`)
  - Clean, paper-like surface
  - Matches the app's warm aesthetic

## Technical Details

### Scales
- **Standard icons** (`icon-192.png`, `icon-512.png`): 92% scale
  - Bold, prominent appearance
  
- **Maskable icons** (`icon-maskable-*.png`): 86% scale
  - Ensures Android's 80% safe circle doesn't clip the design
  
- **Apple touch icon**: 86% scale
  - iOS applies its own squircle mask

### Generated Assets
All icons are generated from `scripts/generate-icons.mjs`:
- `favicon.svg` / `favicon-dark.svg` (browser tabs)
- `icon-192.png` / `icon-512.png` (standard PWA)
- `icon-maskable-192.png` / `icon-maskable-512.png` (adaptive Android)
- `icon-mono-512.png` (Android 13+ themed icon)
- `apple-touch-icon.png` (iOS home screen)

## Design Rationale

### Why Lotus?
- Universal symbol of mindfulness and meditation
- Culturally appropriate for "Dhyaan"
- Simple, recognizable geometry
- Works well at small sizes (16x16 to 512x512)

### Why Three Petals?
- Minimal yet complete
- Forms stable triangular composition
- Avoids visual clutter
- Represents mind-body-spirit or past-present-future

### Why This Color?
- Saffron/turmeric has deep cultural significance in meditation practices
- Warm and inviting, not clinical or cold
- High contrast with white background for legibility
- Matches the app's existing "calm & mindful" aesthetic (M8)

## Updating the Icon

To regenerate all icons after design changes:

```bash
npm run icons
```

Edit `MARK`, `LIGHT`, or `DARK` constants in `scripts/generate-icons.mjs`.

## Testing on Device

After regenerating icons:

1. **Uninstall** the existing PWA from your home screen
2. **Hard reload** the browser (Ctrl+Shift+R / Cmd+Shift+R)
3. **Clear site data** if necessary
4. **Reinstall** the PWA

The OS caches icons at install time, so changes won't appear until reinstallation.

## Accessibility

- High contrast ratio (4.5:1+) ensures visibility
- Simple, bold shapes remain recognizable at all sizes
- No reliance on fine details or text
- Works in monochrome (Android themed icons)

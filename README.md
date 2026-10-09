# Dhyaan

Capture college tasks quickly and work through them today.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | Typecheck only |
| `npm run test` | Vitest |
| `npm run lint` | Oxlint |
| `npm run icons` | Regenerate every icon in `public/` |

## PWA icons

Icons are **generated, not hand-edited**. `scripts/generate-icons.mjs` renders the
app mark (the concentric rings from `src/App.tsx`) into the PNG and SVG assets
referenced by `public/manifest.webmanifest` and `index.html`. It has no
dependencies — edit `MARK` or the palette at the top of that file and re-run
`npm run icons`.

The mark sits at 92% scale on standard icons and 86% on `maskable` ones, which
keeps it inside Android's guaranteed 80%-diameter safe circle so adaptive icon
masks cannot clip it.

### Seeing icon changes on a device

The OS copies the app icon onto the home screen **at install time**, so an
already-installed PWA will keep the old icon. To pick up a new one:

1. Uninstall the app from the home screen.
2. Reinstall it from the browser.
3. If it still looks stale, hard-reload or clear site data first — `public/sw.js`
   serves assets stale-while-revalidate, so a cached icon can survive one visit.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

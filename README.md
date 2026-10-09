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

## Motion & motivation (M6)

Completing a task **destroys its row** — in Inbox the task moves to a different
list, in Today it disappears entirely — so a completion animation cannot live on
the row itself. `App.tsx` measures the tapped checkbox's `getBoundingClientRect()`
*before* the state change, then renders a detached `position: fixed` overlay that
outlives the row. `TaskRow` stays stateless.

| Tier | Fires when | Feedback |
| --- | --- | --- |
| tap | every completion | checkbox overshoot + ring pulse + 10ms haptic |
| milestone | completes 3 / 5 / 10 / 20 / 50 today | particle burst + message + double haptic |
| clear | the last remaining Today task | larger green burst, 16 particles |

Bursts are rationed on purpose. One on every tap is visual noise by the fifth
task, which is why the frequent case gets the quiet version.

Tier rules live in `src/celebration.ts` as pure functions and are unit-tested;
the counts they need are read *before* the toggle so the result is deterministic.
`src/feedback.ts` holds the Web Animations API and `navigator.vibrate` calls —
both native, no dependencies.

### Data: `doneAt`

Daily counts need a completion timestamp, so `Task` gained `doneAt`. **This is a
forward-compatible migration:** `isTask` accepts the field as *absent*, and
`loadTasks` normalises it to `null`. Tightening the validator to require it would
make `loadTasks`'s `filter(isTask)` silently drop every task stored before M6.
`STORAGE_KEY` is deliberately unchanged for the same reason. The regression tests
for this are in `storage.test.ts` — do not remove them without a replacement.

### Accessibility

`prefers-reduced-motion` is honoured in two places: `feedback.ts` skips spawning
particles and the pulse ring, and a backstop block in `styles.css` neutralises
every animation and transition in the app. Under reduced motion the milestone
message and haptics still fire — only the movement is dropped, so the reward
does not vanish entirely.

### Not yet built

M6c (progress ring + streak counter), M6d (row enter, sheet exit, tab direction)
and M6e (deletion collapse, the most complex piece) are planned but unimplemented.

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

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
the row itself. The celebration renders as a detached `position: fixed` overlay
that outlives the row. `TaskRow` stays stateless.

The overlay is **centred in the viewport**, not anchored to the checkbox: the
checkbox sits in the left gutter, and a reward that fires out at the screen edge
is easy to miss. Only the small anchored feedback (checkbox pop, ring pulse)
follows the tapped element.

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

---

## End-of-day reminder (M7)

From 8 PM local time, if any task due today or earlier is still open, the app
shows a banner and plays a chime. **Once per day.**

### The platform limit, stated plainly

**This does not ring at 8 PM if the app is closed.** Nothing runs when a web app
is closed, and the web has no alarm API. What it does instead is *catch up*: if
they open the app at 9:40 PM and have not seen it today, it shows then. A
guaranteed 8 PM alarm on a locked phone would need a backend to push from, which
`AGENTS.md` rules out. Do not describe this feature to users as an alarm.

Three triggers run, because no single one is reliable:

| Trigger | Covers |
| --- | --- |
| on mount | app opened after the hour |
| `visibilitychange` | returning to an already-open tab |
| a re-armed timeout | app left open until 8 PM |

A timeout alone drifts when the device sleeps; visibility alone misses a tab
left open all evening.

### Trigger rule

All three must hold: local time ≥ 20:00, at least one open task due today or
overdue, and not already shown today. The open count is
`selectOverdue(...).length + selectDueToday(...).length` — deliberately the same
count the "Today is clear" celebration uses, so the two cannot disagree. When
that count reaches zero the banner retracts.

Logic lives in `src/reminders.ts` as pure functions with `now` injected, so tests
can pin 7:59 PM against 8:00 PM exactly.

### Sound

A two-tone chime **synthesised with the Web Audio API** — no audio asset, no
dependency. Browsers keep an `AudioContext` suspended until a real gesture, so
`App.tsx` unlocks it on the first `pointerdown`/`keydown`. On a cold load with no
gesture yet the chime is silently skipped rather than throwing; the banner still
appears, so the message is never lost.

### Accessibility

`role="status"` (polite) rather than `role="alert"`, because an unprompted
assertive announcement interrupts a screen-reader user mid-task. The banner is
visual, so sound is never the sole signal, and its entrance respects
reduced motion.

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

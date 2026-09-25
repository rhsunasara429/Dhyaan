# AGENTS.md — Dhyaan MVP engineering rules

## Stack

* Vite + React + TypeScript. Package manager: npm.
* Styling: plain CSS / CSS variables only (`src/styles.css`).

## Commands

* `npm install`, `npm run dev`, `npm run typecheck`, `npm run build`.
* Run `npm run typecheck` and `npm run build` after relevant changes.

## Architecture

* Keep it simple. No router (tab state: `'inbox' | 'today'`), no Context/useReducer without demonstrated need.
* No state-management, UI, date, animation, or E2E libraries.
* Persistence is `localStorage` only (from M1). No IndexedDB, backend, auth, sync, or API without explicit product-owner approval.
* PWA shell is hand-written (`public/sw.js` + `public/manifest.webmanifest`); SW registers in production builds only, standard lifecycle (no skipWaiting).

## Milestones

* Implement one milestone at a time. M0 = shell only. Do not pull M1+ work (capture, tasks, storage, completion, edit, delete, areas, dates, Today logic, Upcoming, PWA) into earlier milestones.
* Do not add dependencies without justification in the final report.

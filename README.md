# Smart Tasks AI

A modern, AI-assisted task management and productivity app — inspired by the
best parts of Todoist, Things 3, and Apple Reminders, with its own visual
identity. Not a basic to-do list: projects, goals, calendar integrations,
smart scheduling, and an AI assistant are all part of the plan (see
[`PROJECT_STATE.md`](./PROJECT_STATE.md) for the phased roadmap).

## Stack

- **Vite + React 18 + TypeScript (strict)** — chosen over React Native/Expo
  because this environment has no macOS/Xcode to build or test an iOS app;
  a PWA can be fully built, run, and verified here today, and still
  installs to a phone home screen and works offline.
- **Dexie (IndexedDB)** — local-first storage. All core task operations work
  fully offline; a remote sync layer plugs into the same `TaskRepository`
  interface in a later phase without touching UI code.
- **Zustand** — small, dependency-light state store wrapping the repository.
- **@dnd-kit** — drag-and-drop reordering.
- **Vitest + Testing Library** — unit/integration tests, IndexedDB faked via
  `fake-indexeddb`.
- **vite-plugin-pwa** — installable, offline-capable app shell.

Apple Calendar will be integrated via iCloud **CalDAV** rather than native
EventKit — EventKit requires a native iOS build (Xcode/macOS), which this
environment cannot produce or test. CalDAV is a real, documented protocol
Apple supports for exactly this purpose, and it works from a web backend.
Native-only features (Home Screen/Lock Screen widgets, Siri Shortcuts,
Spotlight, Apple Watch) are architected for but require a native companion
app to actually ship — see `PROJECT_STATE.md`.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # tsc + vite build
npm run lint
```

## Architecture

```
src/
  core/        domain types + pure logic (task model, selectors) — no React, no I/O
  data/        Dexie database + repository implementations (offline-first)
  store/       Zustand store: the only thing UI talks to for task state
  i18n/        translations (en/he) + RTL-aware language context
  theme/       light/dark/system theme context
  ui/
    components/  small reusable pieces (TaskRow, TaskList, QuickAddBar, ...)
    screens/     Today, Inbox, and phase-gated placeholders
```

`core/task.repository.ts` defines the storage contract; `data/` is the only
place that knows about Dexie. This is what lets Phase 6 add cloud sync
without rewriting the store or any screen.

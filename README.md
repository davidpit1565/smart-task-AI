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
- **A Vercel serverless function** (`api/caldav.ts`) — a thin, stateless
  CalDAV proxy (see Calendar section below).

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
  core/          domain types + pure logic (task model, selectors, calendar, recurrence) — no React, no I/O
  data/          Dexie database + repository implementations (offline-first)
  store/         Zustand stores: the only thing UI talks to for state
  integrations/  concrete provider implementations (Apple CalDAV today)
  i18n/          translations (en/he) + RTL-aware language context
  theme/         light/dark/system theme context
  ui/
    components/  small reusable pieces (TaskRow, TaskList, ScheduleSection, ...)
    screens/     Today, Inbox, Projects, Calendar, More, ...
api/
  caldav.ts      Vercel serverless function: proxies CalDAV requests (see below)
```

`core/task.repository.ts` defines the storage contract; `data/` is the only
place that knows about Dexie. This is what lets Phase 6 add cloud sync
without rewriting the store or any screen. `core/calendar/calendarProvider.ts`
defines the same kind of contract for calendar integrations.

## Calendar integration

Apple Calendar connects via iCloud **CalDAV** (RFC 4791) rather than native
EventKit — EventKit requires a native iOS build (Xcode/macOS), which this
environment cannot produce or test. CalDAV is a real, documented protocol
Apple supports for exactly this purpose, and it works from a web backend.

**Why the `/api/caldav` proxy exists:** `caldav.icloud.com` doesn't send CORS
headers, so the browser can't call it directly. The proxy is a stateless
passthrough — it never stores credentials, just relays a single request's
Basic Auth header to Apple and returns the response.

**Local dev limitation:** `npm run dev` (plain Vite) does **not** serve
`/api/*` routes — that's a Vercel-only convention. Connecting to Apple
Calendar will fail with a clear "request failed" error under `npm run dev`;
to test the full flow locally, run `vercel dev` instead (requires the Vercel
CLI and `vercel link`). The connect form still degrades gracefully either
way — every network failure surfaces a real error message instead of hanging
or crashing (see `tests/` — this is unit-tested, and the graceful-failure
path was verified in-browser under plain `npm run dev`).

**What's verified vs. not:** the CalDAV XML parsing (`caldavXml.ts`) and
iCalendar parsing/serialization (`ics.ts`) are unit-tested against realistic
fixture responses modeled on Apple's documented format. The provider has
**not** been exercised against a live iCloud account in this environment (no
real Apple ID + app-specific password available here) — verify with your own
account before relying on it.

Native-only features (Home Screen/Lock Screen widgets, Siri Shortcuts,
Spotlight, Apple Watch) are architected for but require a native companion
app to actually ship — see `PROJECT_STATE.md`.

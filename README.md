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

Google Calendar and Outlook Calendar are the two active integrations. Both
are real, both need a one-time OAuth app registration (a public Client ID,
never a secret) before "Sign in" actually works — until then the app shows
a clear setup error instead of faking a connection.

### Google Calendar

1. In [Google Cloud Console](https://console.cloud.google.com), create (or
   reuse) a project, then **APIs & Services → Credentials → Create
   Credentials → OAuth client ID**, application type **Web application**.
2. Under **Authorized JavaScript origins**, add the exact origin you're
   serving the app from (e.g. `http://localhost:5173` for `npm run dev`, or
   your Vercel preview/production URL). No redirect URI is needed — this
   uses Google Identity Services' token flow via a popup, not a redirect.
3. Enable the **Google Calendar API** for the project.
4. Set `VITE_GOOGLE_CLIENT_ID` (in `.env.local` or your host's env vars) to
   the client ID.

Implementation: `src/integrations/calendar/googleCalendarProvider.ts` +
`googleIdentityLoader.ts`. No backend involved — Google's Calendar API v3
sends CORS headers and GIS's token flow is designed for public
(browser-only) clients.

### Outlook Calendar

1. In the [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID →
   App registrations → New registration**. Choose "Accounts in any
   organizational directory and personal Microsoft accounts" unless you
   specifically want to restrict it.
2. Under **Authentication → Add a platform → Single-page application**, add
   the redirect URI `<your-origin>/outlook-auth-callback.html` (e.g.
   `http://localhost:5173/outlook-auth-callback.html`). This must be an SPA
   platform entry, not "Web" — SPA is what allows the implicit token flow
   without a client secret.
3. Under **API permissions**, add the delegated Microsoft Graph permission
   `Calendars.ReadWrite`.
4. Set `VITE_MICROSOFT_CLIENT_ID` to the Application (client) ID.

Implementation: `src/integrations/calendar/outlookCalendarProvider.ts`
(Microsoft Graph) + `outlookAuth.ts` (a hand-rolled popup + the static
`public/outlook-auth-callback.html` redirect page — no MSAL dependency,
mirroring Google's "no secret ever leaves the browser" approach).

### Apple Calendar (implemented, not wired into the UI)

Apple Calendar connects via iCloud **CalDAV** (RFC 4791) rather than native
EventKit — EventKit requires a native iOS build (Xcode/macOS), which this
environment cannot produce or test. The code (`appleCalDavProvider.ts`,
`caldavClient.ts`, `ics.ts`, the `/api/caldav` Vercel proxy) is kept in the
repo and unit-tested against realistic fixtures, but it's no longer imported
from the active app (tree-shaken out of the production bundle) after it
failed against a real iCloud account in practice — see `PROJECT_STATE.md`
for the full story. Revisit only if there's a specific reason to.

Native-only features (Home Screen/Lock Screen widgets, Siri Shortcuts,
Spotlight, Apple Watch) are architected for but require a native companion
app to actually ship — see `docs/NATIVE_SHELL_CONTRACT.md` for exactly what
that companion app would need to add, and note that deep links, install
shortcuts, and a real Web Share Target (Android/ChromeOS) already work
today without any native shell — see `src/core/deepLink.ts`.

## AI features

Task breakdown ("Break down with AI" in the task detail panel) calls a
Vercel serverless function (`api/ai/breakdown.ts`) that asks Claude for a
short list of subtasks. The API key never reaches the browser — only the
function calls Anthropic directly — and suggestions are always shown as a
preview with per-item checkboxes before anything is added; nothing is ever
applied automatically.

Setup: get an API key from the
[Anthropic Console](https://console.anthropic.com), then set
`ANTHROPIC_API_KEY` (in `.env.local` or your host's env vars — **not**
prefixed with `VITE_`, since this one must stay server-side only). Without
it, the button shows a clear "AI features aren't configured yet" error
instead of pretending to work — same pattern as the calendar integrations
above. Like `/api/caldav`, this endpoint only responds under `vercel dev`
or in a real Vercel deployment, not plain `npm run dev`.

# PROJECT_STATE

See [`docs/PRODUCT_VISION.md`](./docs/PRODUCT_VISION.md) for the full
product spec, non-negotiable design rules, and the reconciled phase
roadmap (extends this file, doesn't replace it) — read that first when
picking up work, then this file for what's actually shipped so far.

## Stack decision (locked for Phase 1, revisit only with a measured reason)

Web PWA — Vite + React + TypeScript, offline-first via IndexedDB (Dexie).
Chosen over React Native/Expo because this dev environment has no
macOS/Xcode: a PWA is the only option that can be actually built, run, and
verified end-to-end here. See `README.md` for the reasoning on Apple
Calendar (CalDAV, not EventKit) and native-only features (widgets, Siri,
Watch — need a native companion app later; architecture below leaves room
for that without a rewrite).

## Visual identity: "Field Notes" (locked — this is the brand now, not a placeholder theme)

Chosen by David from four fully-built concept directions (Instrument,
Undergrowth, Afterhours, Field Notes — presented as an interactive board
with a live app mockup per concept, not just color swatches). The
identity is: a well-loved notebook, not a dashboard.

- Palette: ink-blue `#1F3245` (text/primary), marigold `#B8842E` light /
  `#E8B563` dark (the one accent — used sparingly), warm paper `#FBF7EE`
  (light bg) / deep ink-navy `#141E29` (dark bg, not a generic near-black).
  Full token set in `src/styles/global.css`.
- Type: system serif (`--font-serif`, Georgia/ui-serif stack) for all
  headings (h1–h3) via one global rule, clean sans for body/UI, tabular
  monospace reserved for numbers/timestamps. Small uppercase labels
  (`SectionHeader`) explicitly opt back into sans — serif is for
  headlines, not micro-UI. Hebrew text automatically falls back to the
  system's Hebrew-capable font since Georgia has no Hebrew glyphs —
  expected, not a bug.
- Texture: a very faint ruled-paper line pattern on the page background
  (`--color-rule-line`), visible in empty space and behind card gaps,
  invisible under opaque cards — reinforces "notebook" without hurting
  legibility.
- Radii pulled in (16/10/7px, was 20/12/8) and shadows re-tinted warm
  (ink-blue-based rgba instead of neutral grey) — reads as "paper cards
  with a soft ink shadow," not a generic bubbly app-shell.
- Real app icon (`public/favicon.svg` + `icon-192/512.svg`): a solid
  ink-blue folded-corner card with a marigold fold and a paper-white
  checkmark stroke through it. Verified legible down to 16px.
- `PROJECT_COLORS` (user-pickable project dot colors) and the Apple
  Calendar default color fallback were retuned to the same muted family
  so a user-picked color never looks like it wandered in from a
  different app.
- **Any future screen/component must pull colors and heading fonts from
  these tokens — never hardcode a hex or skip the serif heading rule.**
  If a new "brand" moment is needed (e.g. onboarding, marketing site),
  extend this identity; don't invent a second one.
- **Icon completeness, not just a favicon.** The initial icon shipped as
  SVG only. Real gap: iOS Safari does not reliably use SVG for
  "Add to Home Screen" — it needs a PNG `apple-touch-icon`, and the web
  manifest icons are safer as PNG too (broadest Android/Chrome install
  support). Rasterized a full-bleed (no pre-rounded corners — the OS
  applies its own mask/shape) square master via a Playwright screenshot
  at exact pixel sizes (no library dependency needed): `apple-touch-icon.png`
  (180×180), `icon-192.png`, `icon-512.png`, `favicon-32.png`. Wired into
  `index.html` (`apple-touch-icon` link + `apple-mobile-web-app-*` meta
  tags for real standalone install) and the VitePWA manifest (PNG entries
  alongside the existing SVG ones, PNG first). Any future icon change
  must regenerate all four PNGs the same way, not just edit the SVG.

## Apple Calendar auth: real-world fix after live testing (David's iCloud account)

The first live attempt against a real iCloud account failed with a 401
("Apple rejected the iCloud email/app-specific password") — this is the
first time the CalDAV path was exercised against a real account, since it
had only been unit-tested against fixtures until now. Cross-checked the
request shape against Apple's documented flow (matches the standard
`PROPFIND / -u email:app-password -H "Depth: 0"` approach exactly — this
part was already correct) and against known real-world iCloud CalDAV
gotchas. Two real gaps found and fixed in `api/caldav.ts` +
`src/integrations/calendar/caldavClient.ts`:

1. **No User-Agent** — Apple's CalDAV service has been observed treating
   requests with a missing/generic User-Agent as bot traffic. Added a
   descriptive one, standard CalDAV client practice.
2. **Redirects silently broken** — Apple shards CalDAV across per-account
   hosts (`pNN-caldav.icloud.com`) via a 301/302 redirect. `fetch` does
   not safely auto-follow a redirect for PROPFIND/REPORT (it downgrades
   the method to GET and drops the XML body per the HTTP redirect spec),
   so a real account landing on a redirect would have silently broken.
   The proxy now returns `redirectedTo` (validated to an `*.icloud.com`
   host only — this is deliberately not a generic URL passthrough, to
   avoid the proxy becoming an open SSRF relay) and the client follows it
   once, retrying with the full original request.
3. **401 diagnostics** — the proxy now returns the `WWW-Authenticate`
   header and a body snippet on a 401 instead of a bare generic message.
   Real-world precedent (home-assistant/core#91711) shows iCloud
   sometimes challenges with a legacy `X-MobileMe-AuthToken` scheme
   instead of Basic in some cases — surfacing this distinguishes "wrong
   credentials" from "Apple wants a different auth flow here" instead of
   guessing blind.

5 new unit tests mock `fetch` to cover the redirect-follow loop and the
richer error messages (`tests/caldavClient.test.ts`). **Still not
confirmed working end-to-end against a live account** — these are the
fixes for the concrete failure that was hit; if it still 401s after this,
the new error message (which now includes the WWW-Authenticate hint) is
the next diagnostic signal, not a guess.

## Phase 1 — Core task management (DONE)

- Extensible `Task` domain model (`src/core/task.types.ts`) with every field
  from the spec: priority, dates (due date/time, deadline), tags,
  recurrence rule *type* (engine comes Phase 2), reminders, attachments,
  estimated/actual duration, order, source, calendar/AI provenance,
  metadata.
- `TaskRepository` interface + Dexie (IndexedDB) implementation — fully
  offline. Attachment blob storage table exists; UI for attaching files is
  not built yet (tracked for Phase 2/5, whichever lands with subtasks/UI
  polish).
- Zustand `taskStore`: add/update/complete/uncomplete, soft-delete with
  undo, archive/restore, undo (single-step snapshot), drag-and-drop reorder
  (persisted via `order`).
- Today screen: greeting, progress bar, overdue section, today section.
- Inbox screen: quick-add, drag-to-reorder, tap to open detail.
- Task detail panel: title, description, notes, due date/time, deadline,
  priority, delete.
- i18n (English + Hebrew) with RTL verified in-browser (Playwright
  screenshot, `dir="rtl"` confirmed). No user-facing strings are hardwired
  outside `src/i18n/translations.ts`.
- Light/dark/system theme via CSS variables + `prefers-color-scheme`.
- Bottom nav: Today / Inbox / Calendar / Projects / More — the latter three
  are explicit "coming soon" placeholders, not fake functionality.
- 22 unit tests (domain logic, selectors, store — including undo and
  reorder persistence). `tsc --noEmit`, `vitest run`, `vite build`, and
  `eslint .` all pass clean. Manually verified in a real browser via
  Playwright: add → complete → undo → edit-detail → RTL, all working.

**Not yet implemented** (by design, deferred to their phase): projects,
tags, subtasks, categories, recurrence engine, archive/completed views,
search/filter/sort, attachments UI, calendar integrations, notifications,
NL task creation, AI assistant, auth/sync, analytics, focus mode.

## Phase 2 — Projects, tags, subtasks, recurrence, archive/completed (DONE)

- Projects: `Project` model + Dexie repository + Zustand store (CRUD,
  archive/restore). Projects list screen with a per-project progress bar;
  project detail screen (description/notes/deadline, its own task list +
  quick-add). Task → project assignment via a picker in the task detail
  sheet.
- Tags: chip editor in the task detail sheet (add via Enter, remove with a
  tap); tag chips shown on task rows. Still free-form strings, no separate
  Tag entity — matches what the Phase 2 brief actually asked for
  ("projects, tags, subtasks and recurrence"); a full Category CRUD system
  was explicitly *not* built since it wasn't in this phase's scope and the
  `categoryId` field already reserves the spot for later.
- Subtasks: add/complete inline in the task detail sheet;
  `src/core/progress.ts` computes `x/y` rollups shown on the parent's row
  and folded into project totals (top-level tasks only, so a subtask's
  completion isn't double-counted against its parent's).
- Recurrence engine (`src/core/recurrence.ts`): real date arithmetic —
  daily/weekly/monthly (incl. "every 15th" and month-end clamping, e.g.
  Jan 31 + 1 month → Feb 28, not Mar 3)/yearly/every-weekday/custom
  weekdays, with an optional end date and an occurrence-count limit.
  Completing a recurring task spawns the next occurrence; undo removes
  that spawned occurrence too (tracked via `lastUndo.spawnedTaskId`).
- More tab: real Completed and Archived views replace the "coming soon"
  placeholder, with restore actions.
- 42 total unit tests (20 new this phase). `tsc --noEmit`, `vitest run`,
  `vite build`, `eslint .` all clean. Verified in-browser via Playwright:
  create project → add tasks → complete one → edit tags/subtasks/
  recurrence/project on a task → browse Completed/Archived.

**Not yet implemented** (deferred): a separate Category entity/UI (see
above), overdue/completed *filters* as a first-class filter system (Today
already surfaces all overdue tasks globally, which covers the immediate
need), search, sort, analytics, calendar, notifications, AI, auth/sync.

## Phase 3 — Calendar architecture + Apple Calendar (DONE)

- `CalendarProvider` interface (`src/core/calendar/calendarProvider.ts`):
  authenticate/listCalendars/listEvents/createEvent/updateEvent/deleteEvent/
  sync/disconnect. The UI and `calendarStore` only ever talk to this
  interface — Google/Outlook (Phases 8/9) are additive, not a rewrite.
- Apple Calendar via iCloud CalDAV: `AppleCalDavProvider` implements the
  interface using the real CalDAV protocol (PROPFIND for discovery, REPORT
  for event queries, PUT/DELETE for writes) against `caldav.icloud.com`,
  through a stateless Vercel serverless proxy (`api/caldav.ts`) since Apple
  doesn't send CORS headers. A hand-rolled iCalendar reader/writer
  (`src/integrations/calendar/ics.ts`) and CalDAV multistatus XML parser
  (`caldavXml.ts`, via `fast-xml-parser` with namespace-prefix stripping)
  back it. **Verified against realistic fixture XML/ICS in unit tests, not
  against a live iCloud account** (no real Apple ID + app-specific password
  available in this environment) — see README's Calendar section for what
  that means in practice and how to test it for real (`vercel dev`).
- Credentials handling: the iCloud app-specific password lives in memory
  for the session only, never written to IndexedDB — only the non-secret
  account label + connected-calendar metadata persist (`CalendarConnection`
  in `data/db.ts`).
- Calendar screen: connect/disconnect Apple Calendar, per-calendar
  enable/disable toggles, a synced upcoming-events agenda grouped by day,
  "Convert to task" per event. Google/Outlook show as explicit "coming in a
  later phase" rows, not fake connect buttons.
- Task ↔ event: a "Schedule" section in the task detail sheet (date/time/
  duration → check availability → confirm), and "Convert to task" from any
  calendar event.
- Conflict detection + smart scheduling (`src/core/calendar/scheduling.ts`):
  `findConflicts` flags overlaps with existing events; `findAvailableSlots`
  suggests free windows within working hours (default 9–18) sized to the
  task's duration. Never books anything automatically — surfaces conflicts
  and suggestions, the user always confirms (including "schedule anyway").
- A real bug was caught and fixed via the Playwright smoke test itself: an
  unhandled rejection when the CalDAV proxy is unreachable (e.g. `npm run
  dev` without `/api` support) — `caldavRequest` now degrades to a clear
  error message instead of throwing an unparsed-JSON exception, and
  `calendarStore.connectApple` catches and surfaces it via `error` state.
- 63 total unit tests (21 new this phase: ICS parse/serialize round-trips,
  CalDAV XML fixtures, conflict/slot-finding incl. the brief's own "15:00
  Meeting, 16:00 Meeting" example). `tsc --noEmit`, `vitest run`, `vite
  build`, `eslint .` all clean. Verified in-browser via Playwright: connect
  form renders, a failed connection shows a graceful error (not a crash),
  Schedule section correctly gates on "connect a calendar first" when
  nothing is connected.

**Not yet implemented** (deferred): Google/Outlook Calendar (Phases 8/9),
notifications for calendar events, recurring calendar events (RRULE is
parsed and passed through opaquely, not expanded into individual
occurrences), attachments on calendar events.

## Phase roadmap (as scoped by the product brief)

4. Notifications: Web Push for reminders, snooze/reschedule/complete
   actions. (Native push requires a companion native app — documented, not
   faked.)
5. Global search, filters, sort, productivity analytics dashboard.
6. Auth (email + architecture for Apple/Google sign-in) and a real sync
   engine (local queue, retry, conflict resolution) behind the existing
   `TaskRepository` interface.
7. AI assistant: natural-language task creation with a confirmation
   preview, "what should I do today," bulk-action previews before any
   destructive/multi-task change, AI task breakdown with accept/reject per
   suggestion.
8. Google Calendar (OAuth, real Calendar API).
9. Microsoft Outlook / Graph Calendar.
10. Widgets, Siri Shortcuts, Share Sheet — needs a native iOS shell; this
    phase produces the integration contract and documents exactly what a
    native wrapper would call.
11. Polish, accessibility audit, performance (virtualization at 1k–10k+
    tasks), App Store readiness (moot for a pure PWA, revisit if/when a
    native shell is added).

## Working agreements for future phases

- Smallest correct diff; don't touch code outside the phase's scope.
- Every phase ends with: `npm run typecheck`, `npm test`, `npm run build`
  all green, plus a real Playwright smoke check of the new UI — before
  moving on.
- No fake integrations: if something needs credentials/native code it
  doesn't have yet, it's a documented placeholder, never a fabricated
  success path.

## Overnight autonomous batch (search, dependencies, goals, planner, focus, a11y)

Built while the user was asleep, in the same branch as the Google Calendar/
mobile-fix/notifications batch (`claude/google-calendar-mobile-fixes`), in
highest-value order from the `docs/PRODUCT_VISION.md` backlog:

- **Search & filters** (`src/core/search.ts`, `SearchScreen.tsx`, under
  More): title/description/notes/tag text search plus priority/project/
  overdue filters, AND-combined. No query + no filter = an intentional empty
  state ("type to search"), not a full unfiltered dump.
- **Task dependencies** (`src/core/dependencies.ts`): `Task.dependsOn:
  string[]`, cycle detection (`wouldCreateCycle`, direct + transitive),
  `isBlocked`/`getBlockingTasks`. Blocked tasks show a small "Blocked" badge
  on the row and a "Waiting on: …" banner in the detail panel — completion
  isn't hard-blocked, this is a soft signal, not a gate.
- **Goals / Life Areas** (`goal.types.ts`, `goal.repository.ts`,
  `goalStore.ts`, `GoalsScreen`/`GoalDetailScreen`, under More): one level
  above Project. `Project.goalId` and `Task.goalId` both roll up into
  `selectGoalProgress`, so a goal can group whole projects or standalone
  tasks. Dexie bumped to version 4 (`goals` table); old Task/Project records
  without `goalId`/`dependsOn` are backfilled via `normalizeTask`/
  `normalizeProject` on load, no destructive migration needed.
- **Smart Daily Planner** (`src/core/dailyPlanner.ts`): a "What should I do
  now?" card on the Today screen. Deliberately a heuristic, not AI —
  overdue > due-today > high/urgent-priority > everything else, tie-broken
  by priority then due time then manual order — and says so in its own
  subtitle copy, honoring "never fake platform capability" for the AI
  backlog item specifically (a real LLM-backed assistant is still Phase 7,
  unbuilt, needs a provider/key decision).
- **Focus Mode** (`src/core/focusSession.ts`, `FocusModeScreen.tsx`): a
  full-screen timer per task (start/pause/resume/finish) that accumulates
  into the already-modeled-but-previously-unused `Task.actualDuration`
  field. Elapsed time is tracked via tick count while running (not wall-
  clock start/end diff), so pausing can't overcount. Exiting always saves —
  no silent discard of tracked time.
- **Accessibility pass**: raised `--color-text-faint` contrast in both
  themes to meet WCAG AA for normal text (was ~2.8:1 light / ~3.1:1 dark,
  now ~4.6:1 / ~4.8:1); localized four aria-labels that were hardcoded
  English (checkbox toggle, drag handle, nav landmark — a Hebrew
  VoiceOver/TalkBack user was hearing English mid-sentence); added
  `aria-label`s to three unlabeled inline "heading" inputs (task title,
  project name, goal name); added an always-present screen-reader-only
  priority label in `PriorityFlag` (previously the priority was
  color/icon-only when `showLabel` was false, which is the only way it's
  actually used today).
- 114 total unit tests (up from 87), `tsc --noEmit` / `vitest run` / `vite
  build` / `eslint .` all clean, each feature verified end-to-end with a
  real Playwright run (not just unit tests) before moving to the next.

Two more shipped in the same overnight window, same branch:

- **Outlook Calendar** (`outlookCalendarProvider.ts`, `outlookAuth.ts`,
  `public/outlook-auth-callback.html`): Microsoft Graph + a hand-rolled
  popup OAuth flow (no MSAL dependency, no backend) — same "no secret ever
  leaves the browser" shape as Google's GIS flow. Honest gate on missing
  `VITE_MICROSOFT_CLIENT_ID`. README's Calendar section was also rewritten
  — it had gone stale after the earlier Apple→Google swap (still described
  Apple as the active integration and never mentioned Google at all).
- **Insights** (`src/core/insights.ts`, `InsightsScreen`, under More):
  streak, completion rate, active/completed/overdue counts, completed-by-
  project breakdown — all pure computation over existing task/project data,
  no new storage or backend.
- 133 total unit tests (up from 114), full gate green, both verified
  end-to-end with Playwright.

## Focus trap, deep links, and the native-shell contract (PR #9)

- **Focus trap + Escape-to-close** (`src/ui/hooks/useModalA11y.ts`): the
  accessibility item explicitly left open above. Wired into
  `TaskDetailPanel` and `FocusModeScreen` — Tab/Shift+Tab now stays inside
  the modal, Escape closes it, and focus returns to whatever triggered it.
  Also moved `TaskDetailPanel`'s `role="dialog"` from the decorative
  backdrop div onto the actual sheet content, where it belongs.
- **Deep links, install shortcuts, and a real Web Share Target**
  (`src/core/deepLink.ts`, `manifest.shortcuts`/`manifest.share_target` in
  `vite.config.ts`): `?screen=`/`?task=` query params open a specific
  tab/task; long-pressing the installed icon (Android) jumps straight to
  Today/Inbox; sharing a link or text to the installed app from any other
  app's share sheet creates a task from it. All three are genuinely
  implemented and Playwright-verified today — none of this is native-only.
- **`docs/NATIVE_SHELL_CONTRACT.md`** (new): the Capacitor phase from the
  roadmap below, done as architecture-only per the "don't fake native
  capability" rule — documents exactly what a native wrapper would still
  need to add (widgets, Siri Shortcuts/App Intents, iOS's native Share
  Extension) and the precise data contract each would read from or write
  to, all built on the same deep-link shape above so nothing in `core/` or
  `store/` needs to change when that phase actually starts.
- 150 total unit tests (up from 133), full gate green, all three pieces
  verified end-to-end with Playwright, not just unit-tested.

**Still open from `docs/PRODUCT_VISION.md`** (not started this batch):
AI assistant (task breakdown, cleanup, meeting-notes-to-tasks — needs an
LLM provider/key decision, deliberately not faked), auth + real sync engine,
full design-token/component-library pass, the native-shell build-out
`docs/NATIVE_SHELL_CONTRACT.md` documents but doesn't implement, Apple
Calendar revival (code preserved, not wired in), a systematic accessibility
audit beyond the specific bugs fixed so far.

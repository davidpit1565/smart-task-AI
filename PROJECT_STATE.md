# PROJECT_STATE

## Stack decision (locked for Phase 1, revisit only with a measured reason)

Web PWA — Vite + React + TypeScript, offline-first via IndexedDB (Dexie).
Chosen over React Native/Expo because this dev environment has no
macOS/Xcode: a PWA is the only option that can be actually built, run, and
verified end-to-end here. See `README.md` for the reasoning on Apple
Calendar (CalDAV, not EventKit) and native-only features (widgets, Siri,
Watch — need a native companion app later; architecture below leaves room
for that without a rewrite).

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

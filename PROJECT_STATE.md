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

## Phase roadmap (as scoped by the product brief)

2. Projects, tags, subtasks (with progress rollup), recurrence engine,
   archive + restore + completed/overdue views, categories.
3. Calendar provider abstraction (`CalendarProvider` interface: authenticate,
   listCalendars, listEvents, createEvent, updateEvent, deleteEvent, sync,
   disconnect) + Apple Calendar via iCloud CalDAV. Task↔event conversion,
   conflict detection, smart scheduling suggestions.
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

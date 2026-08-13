# PRODUCT VISION — Personal Productivity Operating System

This is the durable product spec. It supersedes and extends the original
Phase 1-11 roadmap in `PROJECT_STATE.md` — not a rewrite, an extension.
**Do not start over, do not delete working functionality, do not
rearchitect without a measured reason.**

## Standing instruction (from David, keep honoring this)

Whenever a work session ends — even if David redirects to a different
task instead of the "next" item below — say what's still open from this
backlog before signing off. Don't let it go silent.

## North star

Not "another to-do list." A **Personal Productivity Operating System**:
powerful underneath, simple on the surface. The user should open it for
the first time and understand it immediately; power users should
discover depth as they need it (progressive disclosure, not a feature
dump).

## Non-negotiable design rules

- **Quality over feature count.** Every feature must solve a real
  problem, live somewhere obvious, and not force the user to learn the
  app. If in doubt: don't add it, or hide it behind progressive
  disclosure (task detail / More / context menus), never a new nav item.
- **Home screen (Today) answers 4 questions only**: what do I need to do,
  what's important, what happens next, what time do I have. Everything
  else lives elsewhere — no 15-widget dashboard.
- **Main nav stays exactly 5 items**: Today, Inbox, Calendar, Projects,
  More. More absorbs Search, Analytics, Goals, Integrations, Settings, AI
  Assistant — never a 6th nav icon.
- **One visual hierarchy per screen**: primary/secondary/tertiary action,
  not equal visual weight everywhere. Muted priority colors, not
  half-a-screen-red for one high-priority task.
- **No childish gamification.** Streaks/consistency/personal records —
  yes. Coins, cartoon characters, confetti, candy colors — no.
- **Premium ≠ complicated.** No glass-everywhere, no huge gradients, no
  excessive shadows/rounding/color/icons/animation. Hierarchy +
  whitespace + typography + subtle surfaces + clear actions.
- **Never silently automate anything destructive or multi-task.** AI
  suggestions, bulk moves, rescheduling — always a preview + confirm.
- **Don't fake platform capability.** If something needs native
  code/credentials/backend infra that doesn't exist yet, build the real
  architecture and say plainly what's missing — never a button that
  pretends to work.

## Reconciled phase roadmap

Phases 1-3 below are DONE (see `PROJECT_STATE.md` for what shipped in
each). Everything after is reordered from the original spec's 16 phases,
merged with what's already built, and re-prioritized by what David has
asked for directly.

1. ✅ Core task management
2. ✅ Projects / tags / subtasks / recurrence / archive+completed
3. ✅ Calendar architecture + Apple Calendar (Apple Calendar since removed
   from active UI per David's explicit request — see below — but the
   `CalendarProvider` interface and CalDAV code stay in the repo)
4. **Google Calendar (real OAuth) — IN PROGRESS.** Google Identity
   Services token flow (client-side, no backend secret needed — Google's
   Calendar API sends CORS headers, unlike Apple's), full CRUD, this
   becomes the one working calendar provider for now.
5. **Mobile correctness pass — IN PROGRESS.** Real bug found: every form
   input had `font-size` under 16px, which forces iOS Safari to zoom on
   focus and not reliably zoom back out — this is what "doesn't stay the
   right size on mobile" was. Fixing globally.
6. **Notifications — IN PROGRESS, honest scope.** Local due-task
   reminders (Notification API, works while the app/tab is running) now.
   True server-initiated push (fires even with the app fully closed)
   needs backend infrastructure — VAPID keys + persistent subscription
   storage + a trigger mechanism — which this project doesn't have yet.
   That's a distinct follow-up phase, not bundled into "if possible" as
   if it's the same amount of work.
7. Search, filters, analytics dashboard (separate from Today, not pushed
   onto the home screen).
8. Smart Daily Planner + "What should I do now?" (uses the scheduling
   engine already built in `src/core/calendar/scheduling.ts`).
9. AI assistant: task breakdown, task cleanup, meeting notes → action
   items — all with a preview/confirm step, never silent bulk changes.
10. Task dependencies, Goals (a layer over Projects), Life Areas
    (optional grouping, never forced).
11. Focus Mode, Time blocking (drag task onto calendar).
12. Full design-token pass: typography scale (Display/H1/H2/H3/Body/
    Small/Caption), spacing tokens, and the full reusable component set
    (Button/IconButton/Badge/Toast/Skeleton/etc.) — right now colors and
    radii are tokenized but type scale and spacing are still ad hoc
    per-component.
13. Auth (email/password + Apple/Google Sign In architecture), real sync
    engine, offline queue/retry/conflict resolution.
14. Outlook Calendar, Apple Calendar revival (if David ever gets a working
    app-specific password and wants it back — the code is still there).
15. Widgets/Capacitor-readiness architecture, Siri Shortcuts / deep links
    architecture (documented, not faked — a plain web app cannot ship a
    real iOS widget without a native wrapper).
16. Accessibility + performance audit, final polish pass against the
    "Design Review Rule" checklist at the bottom of this doc.

## Apple Calendar: removed from active UI (2026-08-13)

David tested the Apple Calendar connect flow against his real iCloud
account twice (after two rounds of real fixes — redirect-following,
User-Agent, 401 diagnostics) and it still didn't work. Per his direct
instruction, it's removed from the Calendar screen and no longer
registered in `calendarStore`. **The code is not deleted** —
`AppleCalDavProvider`, `caldavClient`, `caldavXml`, `ics.ts`, and
`api/caldav.ts` all stay in the repo, since they're real working
CalDAV-protocol code (unit-tested against fixtures) that took genuine
effort and might be worth revisiting later. If David wants the files
actually deleted rather than just hidden, say so explicitly and that's a
five-minute follow-up.

## Design Review Rule (apply before adding anything from here on)

Before adding any feature, ask: does this improve the core experience?
Where does the user expect to find it? Can it live inside an existing
area instead of a new screen? Will it visually overload the interface?
Can it stay hidden until needed (progressive disclosure)?

Before calling a phase "done," ask: would a first-time user understand
this without a tutorial? Does the home screen feel overloaded? Does every
feature have an obvious home? Does this feel like one coherent product?
If any answer is no, fix that before moving on.

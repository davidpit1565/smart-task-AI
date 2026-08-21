# Native shell contract

What's real today, what a native wrapper (Capacitor) would still need to
add, and the exact contract it would call into — so a future native phase
is additive, not a rewrite. Nothing here is faked: every "real today" item
is implemented and Playwright-verified; every "needs a native shell" item
names the missing OS-level piece honestly.

## Capacitor scaffold — added, genuinely usable, still blocked on a Mac

`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
are installed; `capacitor.config.ts` points `webDir` at `dist`; `npm run
cap:sync` (build the web app, then `npx cap sync`) regenerates both the
`android/` and `ios/` native projects from the current build and works
end-to-end in this Linux container — verified by actually running it.

**What that scaffold is, honestly:**

- `android/` is a real Gradle project. It cannot be *built* here (no
  Android SDK/JDK toolchain installed in this container), but the project
  structure itself is genuine, not a mockup.
- `ios/` is a real Xcode project (`ios/App/App.xcodeproj`, plus a
  `Package.swift` for Capacitor's Swift-Package-Manager plugin
  integration). It **cannot be opened, built, signed, or run from here** —
  that needs an actual Mac with Xcode installed, which this environment
  does not have and cannot have. This was true before Capacitor was added
  and is still true now; the scaffold doesn't change it.
- Both `android/` and `ios/` are committed (native project files, not
  build output — see `.gitignore` for what's excluded: `android/app/build`,
  `ios/App/Pods`, `ios/App/build`, copied web assets, etc.). Re-run `npm
  run cap:sync` after pulling to refresh the copied web bundle before
  opening either project.
- Deep links, install shortcuts, and Web Share Target below are unaffected
  by any of this — they're pure web-platform features that work in the PWA
  today, independent of whether a native shell ever ships.

**What still needs a native step someone with a Mac has to do** (none of
this is code Claude Code can write and verify without a device/Xcode):
add the plugins for push notifications (`@capacitor/push-notifications`),
biometric unlock, and a native Share Extension target; register app icons
and splash screens; open each project once in its native IDE to confirm it
actually builds; enroll in the Apple Developer Program and configure
signing. See `docs/PRODUCT_GOAL.md` §6 for the full target scope and
`docs/STRATEGY.md` §5 for why a thin wrapper alone would fail App Review
(Guideline 4.2).

## Real today — no native shell needed

These work in any installed PWA right now (Chrome/Android/ChromeOS; iOS
Safari support is noted per item where it lags).

- **Deep links** (`src/core/deepLink.ts`, wired in `App.tsx`): a URL into
  the app can carry `?screen=today|inbox|calendar|projects|more` to open a
  specific tab, or `?task=<id>` to open a specific task's detail panel. The
  URL is cleaned via `history.replaceState` once handled, so a refresh
  doesn't re-trigger it.
- **Install shortcuts** (`vite.config.ts` → `manifest.shortcuts`): long-press
  the installed app icon → "Today" / "Inbox" jump straight to that deep
  link. Supported on Android; iOS doesn't expose install shortcuts.
- **Web Share Target** (`manifest.share_target`, method `GET`): sharing a
  link or text to the installed app from any other app's share sheet opens
  Smart Tasks with `?title=&text=&url=` populated, which `deepLink.ts`
  turns into a new task (via `shareTargetToTaskInput`) and opens its detail
  panel immediately. **Android/ChromeOS only today** — iOS Safari has not
  shipped `share_target` support as of this writing; on iOS this needs the
  native Share Extension described below.

## Needs a native shell (Capacitor) — the contract it would call

Each of these needs OS-level surface area a browser tab cannot register.
The shape below is what a thin Capacitor plugin would read from or write
to; the app-side logic it calls already exists in `src/core/` and needs no
changes.

### Home Screen / Lock Screen widgets

A native widget (WidgetKit on iOS, App Widgets on Android) can't run the
web app's JS — it needs a small, pre-computed snapshot written somewhere
the native widget process can read without launching the app. Contract:

```ts
// Written by the web app (a Capacitor plugin call) whenever task state
// changes meaningfully — e.g. on complete/add/reorder in the Today list.
interface WidgetSnapshot {
  updatedAt: string; // ISO timestamp, so the widget can show "as of Xm ago"
  todayCount: number;
  overdueCount: number;
  topTasks: { id: string; title: string; dueTime: string | null }[]; // from suggestTasks(), capped at 3
}
```

Storage: iOS App Group shared container (`UserDefaults(suiteName:)`);
Android `SharedPreferences` via a plugin. The web side already has the
exact data — `suggestTasks()` in `src/core/dailyPlanner.ts` and
`selectTodayTasks()`/`selectOverdueTasks()` in `src/core/todaySelectors.ts`
— a plugin call just needs to serialize their output on change.

### Siri Shortcuts / App Intents

Voice/Shortcuts-app entry points ("Hey Siri, what should I do now") need
native `INIntent` (iOS) / App Actions (Android) registrations. Each intent
is a thin wrapper that either (a) opens the app via one of the deep links
above, or (b) for a truly voice-only round trip (Siri speaks the answer
without opening the app), calls a small native bridge that runs
`suggestTasks()`/`addTask()` against the same Dexie-backed store and
returns text — this is the one case that needs the store logic reachable
from native code directly, not just via a URL.

### Receiving shares on iOS

Android/ChromeOS get share-target support for free via the manifest (see
above). iOS needs a native Share Extension target that forwards whatever
it receives into the same deep link shape the web share target already
consumes: launch the main app with `unknot://?title=&text=&url=` (a
custom URL scheme, registered in the native shell's `Info.plist`) instead
of the `https://` GET request Android uses — `parseDeepLink()` doesn't
care which scheme carried the query string, so no app-side change is
needed once that scheme is registered.

## Why this order

Deep links first because every other item — shortcuts, share targets, Siri
intents — is *built on* the same URL contract; get that right once and
everything else is "point a new OS surface at a URL." Widgets and Siri
intents both reduce to "read `core/` output through a narrow native
bridge," which is why neither needed touching `core/` or `store/` today.

# Design identity: "Glass" (Liquid Glass–inspired)

Replaces the "Field Notes" identity documented in `PROJECT_STATE.md`. Chosen
by David from reference screenshots of Apple's own Reminders app — this
document is the spec: what changed, why, and the accessibility guardrails
that keep it from repeating Apple's own well-documented Liquid Glass
contrast complaints (see sources at the end).

## What this is

Apple's **Liquid Glass** — the design language introduced at WWDC 2025 for
iOS 26/iPadOS 26/macOS Tahoe, required for all apps by September 2026: glass
materials that reflect and refract the content behind them, vibrant
solid-gradient category tiles, larger corner radii, and SF Pro Rounded
typography. This app adapts the *material language*, not Apple's trademarked
Reminders app itself — different tile colors, our own icon set, our own name.

## The rule that governs everything else

**Glass (blur/translucency) is for chrome that floats over scrolling
content — nav bar, tab bar, sheets. Never for a surface sitting directly
behind readable text.** This is the exact thing critics flagged in Liquid
Glass betas (contrast ratios reported as low as 1.5:1 against a 4.5:1 WCAG
requirement). Content cards, list rows, and inputs in this app stay fully
opaque. `.glass` (in `src/styles/global.css`) is the only class allowed to
set `backdrop-filter`, and `@media (prefers-reduced-transparency: reduce)`
forces it opaque automatically.

## Tokens (`src/styles/global.css`)

- **Color** — cool near-black dark mode (`#0A0E14` bg, not a tinted brand
  color), cool light grey light mode (`#F5F6F8`); one electric blue-violet
  accent (`#3457E6` light / `#6D90FF` dark) replacing the old marigold.
  Every text/background pairing re-verified at ≥4.5:1 (normal text) — see
  the git history of this file for the exact contrast pass; a few initial
  picks (warning, success, priority-low, text-faint) were manually darkened/
  lightened per theme to clear that bar.
- **Category-tile gradients** — `--tile-{today,inbox,calendar,projects,more}-{1,2}`:
  one saturated two-stop gradient per home-grid tile, high enough contrast
  for bold white labels directly on top (this is a solid gradient card, not
  glass-over-photo, so it doesn't carry Liquid Glass's contrast risk).
- **Radii** — bumped from 7/10/16 to 12/16/22, plus a new `--radius-xl: 28`
  for tiles. Bigger, closer to Apple's "squircle" tiles.
- **Typography** — `--font-rounded` uses the real `ui-rounded` CSS4 generic
  (resolves to SF Pro Rounded on Safari/macOS/iOS, falls back to
  `-apple-system`/`system-ui` elsewhere — a real, standard CSS feature, not
  a webfont link). Headings moved off the old serif entirely.
- **Removed**: the ruled-paper `background-image` texture and the serif
  heading font — both were the Field Notes identity specifically.

## Home grid (Today screen)

The old "Good morning" card + progress bar is replaced by a 2-column grid of
gradient tiles — the exact pattern from the reference screenshots — mapped
to this app's five nav destinations plus Overdue:
**Today · Overdue · Inbox · Calendar · Projects · More**. Each tile: icon
top-start, large tabular-nums count bottom-start, label bottom. Tapping a
tile navigates like the bottom nav does.

## Bottom nav

Becomes a floating `.glass` pill bar (blur+saturate, 1px hairline border)
rather than an opaque bar flush with the screen edge — this is exactly the
kind of chrome-over-content glass is for for.

## What did NOT change

Every accessibility fix from the previous pass carries over unmodified:
focus trap + Escape-to-close on modals, the WCAG contrast fixes (extended to
the new palette, not undone), localized aria-labels, the screen-reader-only
priority label. The glass identity is built *on top of* that work.

## Sources consulted

- [SpotMe — New iOS 26 & Liquid Glass design](https://support.spotme.com/hc/en-us/articles/49966586899475-New-iOS-26-Liquid-Glass-design)
- [Superdesign — Apple Design System Breakdown, With a Copyable DESIGN.md (2026)](https://superdesign.dev/blog/apple-design-system)
- [Medium — Liquid Glass UI 2026: Apple's New Design Language Explained](https://medium.com/@expertappdevs/liquid-glass-2026-apples-new-design-language-6a709e49ca8b)
- [Kamushken — To design a Liquid Glass UI that survives real screens](https://kamushken.medium.com/to-design-a-liquid-glass-ui-that-survives-real-screens-a-short-guide-90e79c48c585)
- [Infinum — Apple's iOS 26 Liquid Glass: Sleek, Shiny, and Questionably Accessible](https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible/)

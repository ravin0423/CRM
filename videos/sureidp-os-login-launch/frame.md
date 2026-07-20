---
version: alpha
name: SureIdP OS Login — Frame
description: >
  Adapted from the shipped Blue Professional preset (tinted cards, pill chrome,
  no shadows, slide-header rhythm) but re-grounded in the REAL product's own
  sampled colors from the source screenshots — this is a real feature, not an
  invented brand. Consulting-grade restraint, one accent, enterprise-credible.
unit: the frame — 1920x1080 primary (16:9, matches confirmed destination)
principle: real product colors, not an invented palette · one primary accent · no shadows

colors:
  bg: "#F5F8FB" # sampled from real login-screen page background (#EEF4F8), cooled slightly
  surface: "#FFFFFF" # real card background, sampled exactly off the SureIdP login card
  ink: "#1B2530" # sampled off the SureMDM console top-bar (#25303B), darkened for contrast
  primary: "#0077FF" # sampled exactly off the SureIdP "Sign In" button / brand mark
  secondary: "#1FA8A3" # console "Save/Configure" teal, sampled #47C1BF, deepened for AA contrast on white
  text: "#12161C"
  text-muted: "#5B6675"
  text-light: "#8B95A3"
  accent-light: "rgba(0,119,255,0.06)"
  accent-medium: "rgba(0,119,255,0.14)"
  border: "rgba(0,119,255,0.18)"
  card-bg: "rgba(0,119,255,0.045)"
  denied: "#DC2626" # only for the Conditional Access "Access Denied" beat — never elsewhere

radii:
  pill: "100px"
  card-lg: "16px"
  card-md: "12px"
  card-sm: "10px"
  bar: "6px"

typography:
  # Two voices, deliberately crossing the sans/mono boundary: Montserrat carries
  # institutional authority (headlines, the hook, the close); IBM Plex Mono carries
  # technical precision (settings labels, data callouts, UI-echo chrome) — the
  # tension is the real one in this product: policy authority vs. engineering config.
  h1: { fontFamily: "Montserrat", px: 108, weight: 800, lineHeight: 1.05, tracking: "-0.02em", color: "text" }
  h2: { fontFamily: "Montserrat", px: 64, weight: 700, lineHeight: 1.1, tracking: "-0.01em", color: "text" }
  h3: { fontFamily: "Montserrat", px: 40, weight: 600, lineHeight: 1.2, color: "text" }
  body: { fontFamily: "Montserrat", px: 26, weight: 400, lineHeight: 1.55, color: "text-muted" }
  eyebrow: { fontFamily: "IBM Plex Mono", px: 20, weight: 600, tracking: "0.12em", upper: true, color: "primary" }
  data-label: { fontFamily: "IBM Plex Mono", px: 18, weight: 500, tracking: "0.04em", color: "text-muted" }
  data-value: { fontFamily: "IBM Plex Mono", px: 30, weight: 700, color: "primary" }
  tag: { fontFamily: "IBM Plex Mono", px: 16, weight: 500, color: "primary" }

spacing:
  pad-x: "120px"
  pad-y: "100px"
  gap-cards: "28px"

components:
  card-tinted:
    backgroundColor: "{colors.card-bg}"
    border: "1.5px solid {colors.border}"
    rounded: "{radii.card-lg}"
    shadow: "none"
  screenshot-frame:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "{radii.card-md}"
    shadow: "0 24px 64px rgba(27,37,48,0.14)" # the ONE permitted shadow: real UI screenshots read as lifted glass, not flat paint
    description: "Wrapper for embedded real product screenshots — the single exception to the no-shadow rule, since these are photographic UI captures, not drawn cards."
  tag-pill:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.primary}"
    rounded: "{radii.pill}"
    typography: "{typography.tag}"
  cta-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{radii.pill}"
    typography: "Montserrat 700"
  accent-line:
    backgroundColor: "{colors.primary}"
    size: "72x4, 2px radius"
  step-circle:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "50%"
    size: "64px"
  cursor:
    description: "Oversized custom macOS-style cursor (per cursor-ui-demo blueprint) for every config-walkthrough beat — white fill, dark 2px outline, soft drop shadow, ~1.6x native size."
---

# SureIdP OS Login — Frame

## Overview

Enterprise B2B SaaS, consulting-grade restraint (one primary accent, tinted
cards, no shadows on drawn UI) adapted from the shipped Blue Professional
preset — but the palette is NOT invented. `primary` (#0077FF), `surface`
(#FFFFFF), and `ink` (#1B2530) are sampled directly off the real product
screenshots in `assets/screenshots/` (the SureIdP login button/mark and the
SureMDM console top bar), verified with a pixel probe, not eyeballed.
`secondary` teal is the console's own "Configure/Save" action color, used
sparingly to distinguish "you're in the admin console" beats from "this is
the SureIdP identity brand" beats.

**Ground stays the same across every scene** (`bg` #F5F8FB) per house-style —
no per-scene color-hopping. Real screenshots sit inside `screenshot-frame`
wrappers, the one place a soft shadow is allowed (they're photographic
captures, not drawn cards, and need to read as lifted glass over the page).

## Typography

Montserrat (institutional headline voice) + IBM Plex Mono (technical/data
voice) — crosses the sans/mono boundary deliberately: this product IS the
tension between policy authority (an admin sets a rule) and engineering
precision (the rule is a config field with a real default). Both are on the
renderer's pre-bundled, not-banned list — deterministic, no network fetch.

- Legibility floor: body ≥26px, data labels ≥18px (full-screen/website
  destination, not in-feed).
- Headlines near-black `text`; eyebrows/data/tags carry `primary` in mono.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every data-value.

## Depth & Surface

Tinted cards only (4.5% fill / 18% border / 12-16px radius, no shadow) for
every drawn UI element — settings cards, feature tiles, the conditional-access
rule table. The **one exception**: `screenshot-frame`, which wraps a real
captured PNG and gets a soft ambient shadow so it reads as an embedded
photograph, not a flat drawn card. Never shadow a drawn element; never leave
a screenshot flat on the page background.

## Background Layer (per scene)

2-4 slow ambient decoratives, accent-tinted, never competing with foreground
content: a faint primary-tinted radial glow behind hero moments; a hairline
72x4 accent-line above titles; on the Conditional Access beat only, a barely-
visible dot grid (echoes the "location/grid" theme) at ≤6% opacity.

## Motion voice

- **Cursor-led config beats** (console + settings scenes): the oversized
  custom cursor component drives every state change — never an instant cut
  to the "after" state.
- **Entrances**: `spring-pop-entrance` for hero numerals/cards; staggered
  cascade ≤500ms cap for card grids.
- **Transitions**: CSS crossfade/velocity-matched cuts for connective scenes;
  reserve shader transitions (`sdf-iris` into the product reveal, `glitch`
  into the Access-Denied payoff) for the two centerpiece "wow" moments only.

## Don't

- No second accent hue beyond primary/secondary; no invented brand colors.
- No shadows on drawn cards (screenshots are the sole exception).
- No fabricated stats, customer logos, or pricing — none exist in the source
  doc; every on-screen figure traces back to `BRIEF.md` / the source PDF.
- No square corners except the progress/bar chrome.

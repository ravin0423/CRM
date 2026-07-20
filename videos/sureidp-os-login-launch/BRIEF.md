---
workflow: general-video
flow: automation
storyboard: no
message: "SureMDM's OS Login with SureIdP unifies and secures device login across Windows, macOS, and Linux under one console — configure once, enforce everywhere."
destination: website / sales-enablement
aspect: 1920x1080
language: en
length: 3-5min (uncapped, scaled to cover the full feature set)
angle: "One Console, Every OS" — problem→solution feature reveal
audience: enterprise IT administrators / device-fleet managers
---

## Intent

A product launch / feature-reveal video for **SureMDM's "OS Login with SureIdP
Authentication"** — an OS Login payload that lets IT admins enforce secure,
centrally managed login via SureIdP (42Gears' built-in identity provider) on
Windows, macOS, and Linux devices enrolled with the SureMDM Agent.

Tone: confident, enterprise B2B SaaS — clean, security-forward, credible to an
IT admin audience. Not playful; precise and reassuring. The video should walk
through the real product: configuring the profile in the SureMDM console, then
what the end user sees at the login screen (branded SureIdP tile → login form →
optional MFA → conditional-access enforcement → desktop access), covering the
full breadth of the feature: SureIdP config, offline credential expiry, existing
user account takeover, device-to-user binding, branding (logo/wallpaper/message),
login screen controls (power/Wi-Fi), login restrictions (max users, hide local
accounts), custom hostname configuration, and conditional access (location /
Wi-Fi SSID / IP range / time / overall compliance) with its 60-second auto-logout
enforcement.

Source: `docs.42gears.com` page could not be crawled live (this environment's
network policy blocks external site access) — content and screenshots were
extracted from a user-supplied PDF export of the same documentation page
(17 pages, verified complete against the page's own "17/17" footer).

## Assets

- `assets/screenshots/01-console-os-login-menu.png` — SureMDM console, Profiles > Windows > OS Login menu entry point.
- `assets/screenshots/02-config-sureidp-section.png` — OS Login config accordion: SureIdP Configuration (enable toggle, offline password expiry, existing user takeover, device-to-user binding).
- `assets/screenshots/03-config-branding-section.png` — Branding accordion (logo, wallpaper, login screen message).
- `assets/screenshots/04-config-login-controls-section.png` — Login Screen Controls accordion (shutdown/restart/sleep, Wi-Fi toggle).
- `assets/screenshots/05-config-login-restrictions-section.png` — Login Restrictions accordion (max SureIdP users, hide local users).
- `assets/screenshots/06-config-custom-hostname-section.png` — Custom Hostname/Device Name Configuration accordion.
- `assets/screenshots/07-config-conditional-access-section.png` — Conditional Access accordion (location/SSID/IP/time/compliance rules table).
- `assets/screenshots/08-lockscreen-add-sureidp-user-tile.png` — real Windows lock screen showing the "Add SureIdP User" tile and welcome message. Note: the visible existing-account tiles (AdminQA, Core Test, panda test, SureMDMJITAcct) are internal QA test data — crop/frame to keep focus on the SureIdP tile and welcome copy, not the test account names.
- `assets/screenshots/09-sureidp-login-form.png` — the branded SureIdP login card (logo, Username/Password, Sign In). This is the clearest brand-mark + palette reference: blue accent (~#1E88E5/#1976F0 range), white card, rounded corners.
- `assets/screenshots/10-mfa-otp-prompt.png` — Two-Factor Authentication / OTP prompt card.
- `assets/screenshots/11-access-denied-conditional-access.png` — the real "Access Denied: your current location is not authorized for login" conditional-access enforcement screen.

## Customizations

- Cover every documented settings group as its own beat/scene rather than a curated subset (explicit user ask: comprehensive, length not capped to fit a shorter promo format).
- Use the real extracted product screenshots above as literal on-screen footage/UI reference wherever a scene shows the console or the login experience, instead of inventing generic mockups.
- No live brand/token capture was possible (network-blocked); derive the design system by eye from the screenshots' visible palette (blue accent + white/light-gray UI + SureIdP shield-key mark) rather than asking the user to pick a preset.

## Notes

- Do not fabricate UI, copy, or behavior beyond what the source doc/screenshots show — the settings tables, the note about the 60-second conditional-access logout, and the "Windows devices with SureMDM Agent versions >= 6.03.0" support note are the ground truth.
- `storyboard: no` — building straight to a finished render per user's explicit choice ("skip straight to render"); still subject to the standard final-preview render-approval gate before rendering.
- `flow: automation` — inferred from the user's "end to end" phrasing; pipeline executes the confirmed brief without a companion co-build session.

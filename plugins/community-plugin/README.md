# 42Gears Community — SureMDM Plugin

Embeds the 42Gears Community forum (`community.42gears.com`) inside the
SureMDM console as a real SPDK plugin, so users don't have to open a
separate browser tab to reach it.

This was built and verified against the actual **SureMDM Plugin Development
Kit (SPDK)** CLI (`npm install spdk -g`) — `spdk validate` and `spdk pack`
both pass against the `SureMDM-Plugins/apps/CommunityPlugin/` folder here.
The one thing not verifiable from this environment is how it renders inside
a *real* SureMDM console (no live account was available) — see "Open
questions" below.

## Current phase: direct embed, manual login

`script.js` currently just points an iframe at `https://community.42gears.com/`
and lets the user log in normally inside it — **no SSO auto-login yet**. This
is intentional for the first round of manual testing on a real account.
`sso-bridge-service/` (Discourse SSO handoff, so users land already logged
in) is built and working standalone, but the shipped plugin doesn't call it
yet — see "Phase 2" below for wiring it back in.

## Layout

```
plugins/community-plugin/
├── SureMDM-Plugins/apps/CommunityPlugin/   ← the actual plugin (what spdk validates/packs)
│   ├── manifest.json                        {name, description, version} — SPDK's full schema
│   ├── index.html
│   ├── style.css
│   └── script.js                            embeds community.42gears.com directly, no SSO yet
├── sso-bridge-service/                      Phase 2: SSO auto-login backend — not currently called by script.js
│   ├── src/server.js                        POST /api/plugin/sso-url
│   ├── src/verifyAccount.js                 verifies the account server-to-server before minting SSO
│   └── src/ssoProvider.js                   Discourse-protocol adapter (confirmed correct platform)
└── local-preview/                           test harness for the Phase 2 SSO flow only
```

## How it actually works (per the SPDK docs + CLI source)

1. A plugin is just `index.html` + `script.js` + `style.css` + `manifest.json`
   (+ optional `logo.png`) under `SureMDM-Plugins/apps/<PluginName>/`.
   `manifest.json` only needs `name`, `description`, `version` — nothing else
   is validated (confirmed by reading `spdk`'s own `validation.js`).
2. For local dev, `spdk host [port]` starts a server that reads your plugin
   folder and serves its raw file contents as JSON
   (confirmed by reading `spdk`'s `server.js`) — you point SureMDM's
   **Settings → Account Settings → Plugins → Developer Settings → Local
   Plugin Url** at it, then open it from **More → Apps Plugin** in the
   console.
3. The official sample plugin's `script.js` calls `../api/Account` with a
   plain relative URL and it works — meaning the console must render a
   plugin's HTML/JS inside its own document/origin (not as a foreign-origin
   iframe pointed at your dev server), so relative API calls hit the real
   SureMDM backend using the browser's existing session.
4. `spdk validate <name>` / `spdk pack <name>` check/zip the plugin folder
   for submission to `techsupport@42gears.com`.

## Prerequisite: Community must allow being framed

Embedding only works if `community.42gears.com` sends response headers
that permit it to load inside the SureMDM console's origin, e.g.:

```
Content-Security-Policy: frame-ancestors https://<your-suremdm-console-domain>
```

No amount of plugin code can override a `frame-ancestors` refusal — that's a
change 42Gears' Community platform (Discourse) admins have to make. If it
can't be arranged, this plugin still degrades to a pre-authenticated "open
in a new tab" link rather than failing outright (see below). **This is the
main thing to check first in your manual test** — if the iframe stays blank
or shows a refusal, this is almost certainly why.

Also: **a blocked/refused iframe navigation still fires the browser's
`load` event** — JS cannot reliably tell "Community loaded" apart from
"Community refused to load here." Because of that, `script.js` always keeps
a small persistent "Not seeing Community load above? Open in a new tab"
banner visible once the iframe attempt starts, rather than trying to
silently detect success/failure. Verified in local testing: with the iframe
target unreachable, the fallback banner correctly appears.

## Open questions (need a real SureMDM account/console to confirm)

- Whether the console literally injects returned html/js/css into its own
  DOM, uses a sandboxed `srcdoc` iframe same-origin trick, or something
  else — affects which console origin(s) Discourse needs to allow-list in
  `frame-ancestors`.
- Whether Discourse's default CSP already blocks framing (likely, by
  default) and what admin setting relaxes it for this specific origin.

## Setup — testing this build

```bash
npm install -g spdk
cd plugins/community-plugin
spdk validate CommunityPlugin
spdk pack CommunityPlugin        # → SureMDM-packed-Plugins/CommunityPlugin.zip
```

Per the SPDK docs, the documented test path is `spdk host [port]` +
**Settings → Account Settings → Plugins → Developer Settings → Local Plugin
Url** pointed at that host, then open it from **More → Apps Plugin**. The
docs describe emailing the packed zip to `techsupport@42gears.com` for
store review, not a self-serve console upload — if your console does offer
a direct upload option, that's new information worth feeding back into this
README.

## Phase 2: re-enabling SSO auto-login

Once manual embedding is confirmed working:

1. Deploy `sso-bridge-service/` somewhere reachable from the console origin
   and set its `.env` (`COMMUNITY_BASE_URL`, `DISCOURSE_SSO_SECRET` from
   Discourse's admin SSO settings, `ALLOWED_HOST_ORIGINS`).
2. In `script.js`, replace the direct `COMMUNITY_URL` assignment with a call
   to `POST {bridge-url}/api/plugin/sso-url` (this code already exists in
   git history from the previous iteration — reintroduce the `getAccount()`
   / `getCommunitySsoUrl()` pair calling `../api/Account` first) and use the
   returned `url` for the iframe.
3. Re-run `spdk validate` / `spdk pack`.

`local-preview/` mocks `../api/Account` at the right relative path
specifically for testing this phase without a live SureMDM account.

## Security notes (apply once Phase 2 is wired back in)

- The bridge never trusts identity the client claims — it independently
  re-verifies `{apiKey, customerId}` against SureMDM's own API before
  minting a Community SSO login (`verifySureMdmAccount`).
- `ALLOWED_HOST_ORIGINS` should be the real console origin(s) in production.
- The SSO endpoint is rate-limited per IP since it mints authenticated
  redirects.

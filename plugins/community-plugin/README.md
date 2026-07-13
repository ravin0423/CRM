# 42Gears Community — SureMDM Plugin

Embeds the 42Gears Community forum (`community.42gears.com`) inside the
SureMDM console as a real SPDK plugin, so users don't have to open a
separate browser tab and log in again to ask questions or read discussions.

This was built and verified against the actual **SureMDM Plugin Development
Kit (SPDK)** CLI (`npm install spdk -g`) — `spdk validate` and `spdk pack`
both pass against the `SureMDM-Plugins/apps/CommunityPlugin/` folder here.
The one thing not verifiable from this environment is how it renders inside
a *real* SureMDM console (no live account was available) — see "Open
questions" below.

## Layout

```
plugins/community-plugin/
├── SureMDM-Plugins/apps/CommunityPlugin/   ← the actual plugin (what spdk validates/packs)
│   ├── manifest.json                        {name, description, version} — SPDK's full schema
│   ├── index.html
│   ├── style.css
│   └── script.js
├── sso-bridge-service/                      companion backend, deployed separately — NOT part of the spdk package
│   ├── src/server.js                        POST /api/plugin/sso-url
│   ├── src/verifyAccount.js                 verifies the account server-to-server before minting SSO
│   └── src/ssoProvider.js                   Discourse-protocol adapter (default) + JWT alternative
└── local-preview/                           stands in for the SureMDM console for local testing only
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
   SureMDM backend using the browser's existing session. That response
   includes `Name`, `ApiKey`, and `CustomerID` for the logged-in account.
4. `spdk validate <name>` / `spdk pack <name>` check/zip the plugin folder
   for submission to `techsupport@42gears.com`.

This plugin's `script.js` follows the same convention: it calls
`../api/Account`, then hands `{name, apiKey, customerId}` to the companion
`sso-bridge-service` to get a signed, pre-authenticated redirect into
Community, then points an iframe at it.

## Prerequisite: Community must allow being framed

Embedding only works if `community.42gears.com` sends response headers
that permit it to load inside the SureMDM console's origin, e.g.:

```
Content-Security-Policy: frame-ancestors https://<your-suremdm-console-domain>
```

No amount of plugin code can override a `frame-ancestors` refusal — that's a
change 42Gears' Community platform admins have to make. If it can't be
arranged, this plugin still degrades to a pre-authenticated "open in a new
tab" link rather than failing outright (see below).

Also: **a blocked/refused iframe navigation still fires the browser's
`load` event** — JS cannot reliably tell "Community loaded" apart from
"Community refused to load here." Because of that, `script.js` always keeps
a small persistent "Not seeing Community load above? Open in a new tab"
banner visible once the iframe attempt starts, rather than trying to
silently detect success/failure. Verified in local testing: with the iframe
target unreachable, the fallback banner correctly appears with the same
pre-authenticated SSO URL.

## Open questions (need a real SureMDM account/console to confirm)

- Whether the console literally injects returned html/js/css into its own
  DOM, uses a sandboxed `srcdoc` iframe same-origin trick, or something
  else — this changes nothing about `script.js` itself, but affects exactly
  which console origin(s) to allow-list on both `ALLOWED_HOST_ORIGINS` here
  and Community's `frame-ancestors`.
- Whether `../api/Account` includes an email field (used here as
  `data.Email` via the bridge's own server-to-server call, not from the
  client response directly).
- Which platform `community.42gears.com` actually runs — `ssoProvider.js`
  defaults to Discourse's DiscourseConnect protocol as the most common
  standards-based guess; swap in the real one if different.
- The exact SureMDM public REST API contract for server-to-server account
  verification (`verifyAccount.js`'s `SUREMDM_ACCOUNT_VERIFY_PATH`).

## Setup

### 1. Companion SSO-bridge service

```bash
cd sso-bridge-service
npm install
cp .env.example .env   # fill in real values
npm start
```

| Var | Purpose |
|---|---|
| `ALLOWED_HOST_ORIGINS` | The real SureMDM console origin(s) |
| `SUREMDM_API_BASE` / `SUREMDM_ACCOUNT_VERIFY_PATH` | Where to verify an ApiKey/CustomerID pair |
| `COMMUNITY_BASE_URL` | `https://community.42gears.com` |
| `SSO_PROVIDER` | `discourse` (default) or `jwt` — see `src/ssoProvider.js` |
| `DISCOURSE_SSO_SECRET` | Shared secret from the Community platform's SSO settings |
| `DEV_MOCK_ACCOUNT` | `true` only for local dev |

Edit `SureMDM-Plugins/apps/CommunityPlugin/script.js`'s `SSO_BRIDGE_URL`
constant to point at wherever this service is actually deployed.

### 2. Package and submit the plugin

```bash
npm install -g spdk
cd plugins/community-plugin
spdk validate CommunityPlugin
spdk pack CommunityPlugin        # → SureMDM-packed-Plugins/CommunityPlugin.zip
```

Email the zip to `techsupport@42gears.com` for review/approval, per the SPDK
docs, then it becomes installable from the SureMDM Plugin Store.

## Local development / demo

No real SureMDM account needed to exercise the SSO-bridge + fallback logic:

```bash
# terminal 1 — SSO bridge
cd sso-bridge-service && cp .env.example .env
sed -i 's/DEV_MOCK_ACCOUNT=false/DEV_MOCK_ACCOUNT=true/' .env
npm install && npm start

# terminal 2 — stand-in for the console (mocks ../api/Account)
cd local-preview && npm install && npm start
```

Then open `http://localhost:8788/preview/CommunityPlugin/index.html`.

To test against a *real* SureMDM account instead:

```bash
cd plugins/community-plugin
spdk host 3000
```

...then in SureMDM: Settings → Account Settings → Plugins → Developer
Settings → enable Developer Tool → Local Plugin Url →
`http://localhost:3000` → Save → More → Apps Plugin.

## Security notes

- The bridge never trusts identity the client claims — it independently
  re-verifies `{apiKey, customerId}` against SureMDM's own API before
  minting a Community SSO login (`verifySureMdmAccount`).
- `ALLOWED_HOST_ORIGINS` should be the real console origin(s) in production.
- The SSO endpoint is rate-limited per IP since it mints authenticated
  redirects.

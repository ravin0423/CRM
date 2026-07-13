# 42Gears Community — SureMDM Plugin

Embeds the 42Gears Community forum (`community.42gears.com`) inside the
SureMDM console as a plugin, so users don't have to open a separate browser
tab and log in again to ask questions or read discussions.

## ⚠️ Scope and assumptions (read first)

`developer.42gears.com` and `community.42gears.com` were unreachable from the
environment this was built in (blocked by network egress policy), so the
manifest shape, plugin-host message contract, and session-verification
endpoint below are **best-effort, based on common plugin-framework
conventions** — not confirmed against the real SPDK reference. Everything
marked "confirm against SPDK" below must be checked before this goes to the
plugin catalog:

- The manifest schema (`manifest.json`) — field names, required keys, how a
  plugin's icon/entry point are declared, how `sso`/permissions are modeled.
- The host↔plugin handshake — this implementation uses
  `postMessage({type: "spdk:ready"})` / `postMessage({type: "spdk:context"})`
  as a stand-in for whatever the real SPDK bridge calls itself.
- The SureMDM session-verification endpoint the backend calls to turn a
  console-supplied token into a trusted user identity
  (`server/src/verifySession.js`).
- **Which platform `community.42gears.com` actually runs.** The default SSO
  adapter implements Discourse's DiscourseConnect protocol as the most
  common standards-based guess (`server/src/ssoProvider.js`); swap in the
  real one (SAML, a custom JWT callback, etc.) if it's different.

## Architecture

```
SureMDM console
  └─ iframe → public/index.html  (this plugin's entry page, per manifest.json)
       1. postMessage handshake → gets { sessionToken, user, theme } from the console
       2. POST sessionToken to its own backend: POST /api/plugin/sso-url
       3. backend verifies the token against SureMDM, then mints a signed
          SSO redirect URL for community.42gears.com
       4. plugin page points an iframe at that URL — the user lands already
          logged in, no separate tab/login
```

Two pieces ship together:

- **`public/`** — the static plugin frontend (what `manifest.json` points
  `entry` at). Vanilla HTML/CSS/JS, no build step.
- **`server/`** — a small Node/Express backend that does the SSO token
  exchange. It must be reachable from the plugin frontend's origin
  (`config.js` → `apiBase`).

## Prerequisite: the community platform must allow being framed

Embedding only works if `community.42gears.com` sends response headers that
permit it to be loaded inside the SureMDM console's iframe, e.g.:

```
Content-Security-Policy: frame-ancestors https://<your-suremdm-console-domain>
```

(and no blocking `X-Frame-Options` header). This is a change the Community
platform's admins have to make — no amount of code in this plugin can work
around a `frame-ancestors` refusal. If that can't be arranged, this plugin
still degrades gracefully to a pre-authenticated "open in a new tab" link
(see below) rather than failing outright.

Note also that **a blocked/refused iframe navigation still fires the
browser's `load` event** — JS in the parent page cannot reliably tell "the
community page loaded" apart from "the community page refused to load
here." Because of that, this plugin always keeps a small persistent "Not
seeing Community load above? Open in a new tab" link visible once the frame
attempt starts, instead of trying to silently detect success/failure.

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in real values
npm start
```

Key env vars (see `.env.example` for the full list):

| Var | Purpose |
|---|---|
| `ALLOWED_HOST_ORIGINS` | Origins allowed to call this API (the real console origin) |
| `SUREMDM_API_BASE` / `SUREMDM_SESSION_VERIFY_PATH` | Where to verify a console-issued session token |
| `COMMUNITY_BASE_URL` | `https://community.42gears.com` |
| `SSO_PROVIDER` | `discourse` (default) or `jwt` — see `src/ssoProvider.js` |
| `DISCOURSE_SSO_SECRET` | Shared secret from the Community platform's SSO settings |
| `DEV_MOCK_SESSION` | `true` only for local dev — skips real session verification |

### 2. Frontend config

Edit `public/config.js` to point `apiBase` at the deployed backend and list
the real console origin(s) in `allowedHostOrigins` (never ship `["*"]`).

### 3. Register the plugin in SureMDM

Package `manifest.json` + `public/` per the SPDK packaging steps and submit/
install through the SureMDM console's plugin management screen so it shows
up alongside other plugins in the console UI. (Exact packaging/upload steps
are in the SPDK docs — confirm once reachable.)

## Local development / demo

No real SureMDM instance needed to exercise the flow end-to-end:

```bash
# terminal 1
cd server && cp .env.example .env && sed -i 's/DEV_MOCK_SESSION=false/DEV_MOCK_SESSION=true/' .env && npm install && npm start

# terminal 2, from plugins/community-plugin/
python3 -m http.server 8788
```

Then open `http://localhost:8788/mock-console/host.html` — it stands in for
the SureMDM console, embeds `public/index.html` in an iframe, and answers
the handshake with a fake session so you can see the full flow (handshake →
backend call → signed SSO URL → iframe load attempt → fallback banner).

## Security notes

- The backend never trusts an identity the plugin frontend claims — it
  independently verifies `sessionToken` against SureMDM before minting an
  SSO login (`verifySureMdmSession`), so a compromised frontend can't forge
  a login as another user.
- `postMessage` payloads are only accepted from origins listed in
  `allowedHostOrigins` — set this to the real console origin(s) in
  production, not `"*"`.
- The SSO endpoint is rate-limited per IP since it mints authenticated
  redirects.

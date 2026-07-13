import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifySureMdmSession } from "./verifySession.js";
import { getSsoProvider } from "./ssoProvider.js";

const config = {
  port: process.env.PORT || 8787,
  allowedHostOrigins: (process.env.ALLOWED_HOST_ORIGINS || "").split(",").filter(Boolean),
  suremdmApiBase: process.env.SUREMDM_API_BASE,
  sessionVerifyPath: process.env.SUREMDM_SESSION_VERIFY_PATH || "/api/session/whoami",
  communityBaseUrl: process.env.COMMUNITY_BASE_URL || "https://community.42gears.com",
  ssoProviderName: process.env.SSO_PROVIDER || "discourse",
  discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET,
  devMockSession: process.env.DEV_MOCK_SESSION === "true",
};

const ssoProvider = getSsoProvider(config.ssoProviderName, {
  communityBaseUrl: config.communityBaseUrl,
  secret: config.discourseSsoSecret,
});

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: config.allowedHostOrigins.length ? config.allowedHostOrigins : false,
  })
);

// Minimal in-memory rate limit: this endpoint mints authenticated SSO
// redirects, so it shouldn't be hammered. A production deploy behind
// multiple instances should use a shared store (Redis) instead.
const rateLimitWindowMs = 60_000;
const rateLimitMax = 20;
const hits = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const bucket = hits.get(key) || [];
  const recent = bucket.filter((t) => now - t < rateLimitWindowMs);
  recent.push(now);
  hits.set(key, recent);

  if (recent.length > rateLimitMax) {
    return res.status(429).json({ error: "Too many requests" });
  }
  next();
}

app.post("/api/plugin/sso-url", rateLimit, async (req, res) => {
  const { sessionToken } = req.body || {};
  if (!sessionToken) {
    return res.status(400).json({ error: "sessionToken is required" });
  }

  try {
    const user = await verifySureMdmSession(sessionToken, config);
    const url = ssoProvider.buildRedirectUrl(user);
    res.json({ url, expiresInSeconds: 120 });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`Community plugin backend listening on :${config.port}`);
});

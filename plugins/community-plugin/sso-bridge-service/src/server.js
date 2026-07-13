import "dotenv/config";
import express from "express";
import cors from "cors";
import { verifySureMdmAccount } from "./verifyAccount.js";
import { getSsoProvider } from "./ssoProvider.js";

const config = {
  port: process.env.PORT || 8787,
  // The console injects the plugin's script.js into its own document, so
  // requests to this service come from the console's own origin — not a
  // separate "plugin frontend" origin.
  allowedHostOrigins: (process.env.ALLOWED_HOST_ORIGINS || "").split(",").filter(Boolean),
  suremdmApiBase: process.env.SUREMDM_API_BASE,
  accountVerifyPath: process.env.SUREMDM_ACCOUNT_VERIFY_PATH || "/api/Account",
  communityBaseUrl: process.env.COMMUNITY_BASE_URL || "https://community.42gears.com",
  ssoProviderName: process.env.SSO_PROVIDER || "discourse",
  discourseSsoSecret: process.env.DISCOURSE_SSO_SECRET,
  devMockAccount: process.env.DEV_MOCK_ACCOUNT === "true",
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
  const { apiKey, customerId } = req.body || {};
  if (!apiKey || !customerId) {
    return res.status(400).json({ error: "apiKey and customerId are required" });
  }

  try {
    const user = await verifySureMdmAccount({ apiKey, customerId }, config);
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

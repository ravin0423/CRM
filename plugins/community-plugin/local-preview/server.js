import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Approximates how the real SureMDM console renders a plugin: the plugin's
// files live one directory below wherever `../api/` resolves. This is NOT
// the actual console (we don't have access to one) — it exists only so
// script.js's real fetch('../api/Account') call has something to hit
// locally, for exercising the SSO-bridge + iframe-fallback logic.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.join(__dirname, "..", "SureMDM-Plugins", "apps", "CommunityPlugin");

const app = express();

app.use("/preview/CommunityPlugin", express.static(pluginDir));

app.get("/preview/api/Account", (_req, res) => {
  res.json({ Name: "Demo User", ApiKey: "demo-api-key", CustomerID: "demo-customer-1" });
});

const port = process.env.PORT || 8788;
app.listen(port, () => {
  console.log(`Local preview: http://localhost:${port}/preview/CommunityPlugin/index.html`);
});

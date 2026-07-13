(function () {
  "use strict";

  // Same-origin backend that ships with this plugin (see server/). The
  // manifest's entry page and this API must be deployed together.
  const API_BASE = window.__COMMUNITY_PLUGIN_CONFIG__?.apiBase || "/api/plugin";

  // Console origins allowed to hand this plugin a session — must match the
  // real SPDK host origin(s) once confirmed; wildcard is a placeholder only.
  const ALLOWED_HOST_ORIGINS =
    window.__COMMUNITY_PLUGIN_CONFIG__?.allowedHostOrigins || ["*"];

  const IFRAME_LOAD_TIMEOUT_MS = 6000;

  const app = document.getElementById("app");
  const loadingPanel = app.querySelector(".loading-panel");
  const errorPanel = app.querySelector(".error-panel");
  const errorMessage = errorPanel.querySelector(".error-message");
  const frameContainer = app.querySelector(".frame-container");
  const frame = app.querySelector(".community-frame");
  const fallbackBanner = app.querySelector(".fallback-banner");

  function isAllowedOrigin(origin) {
    return ALLOWED_HOST_ORIGINS.includes("*") || ALLOWED_HOST_ORIGINS.includes(origin);
  }

  function showError(message) {
    loadingPanel.hidden = true;
    frameContainer.hidden = true;
    errorMessage.textContent = message;
    errorPanel.hidden = false;
  }

  function showFrame(url) {
    // A cross-origin iframe's `load` event fires whether the navigation
    // actually succeeded or the destination refused via X-Frame-Options /
    // frame-ancestors — JS has no reliable way to tell those apart. So this
    // timeout only catches a frame that never resolves at all; a persistent
    // "open in a new tab" banner (below) covers the case where it loads but
    // is silently blocked/blank. Confirming a frame-ancestors allowlist with
    // the community platform is what actually removes the need for this.
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        showError(
          "The community page didn't load in time. It may not allow being " +
            "embedded yet — open it in a new tab instead."
        );
      }
    }, IFRAME_LOAD_TIMEOUT_MS);

    frame.addEventListener(
      "load",
      () => {
        settled = true;
        clearTimeout(timer);
        loadingPanel.hidden = true;
        frameContainer.hidden = false;
      },
      { once: true }
    );

    fallbackBanner.href = url;
    frame.src = url;
  }

  function requestHostContext() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timed out waiting for the SureMDM console session.")),
        8000
      );

      function onMessage(event) {
        if (!isAllowedOrigin(event.origin)) return;
        const data = event.data;
        if (!data || data.type !== "spdk:context") return;

        clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
        resolve(data.payload);
      }

      window.addEventListener("message", onMessage);

      // Handshake per common plugin-SDK convention: announce readiness so
      // the host replies with session/user/theme context. Confirm the exact
      // message names against the real SPDK contract.
      window.parent.postMessage(
        { type: "spdk:ready", pluginId: "com.42gears.suremdm.plugin.community" },
        "*"
      );
    });
  }

  async function fetchCommunitySsoUrl(sessionToken) {
    const res = await fetch(`${API_BASE}/sso-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Backend returned ${res.status}`);
    }

    return res.json();
  }

  function reportSizeToHost() {
    const observer = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: "spdk:resize", height: document.documentElement.scrollHeight },
        "*"
      );
    });
    observer.observe(document.documentElement);
  }

  async function init() {
    try {
      const context = await requestHostContext();
      if (!context?.sessionToken) {
        throw new Error("No session token was provided by the console.");
      }

      const { url } = await fetchCommunitySsoUrl(context.sessionToken);
      reportSizeToHost();
      showFrame(url);
    } catch (err) {
      showError(err.message || "Something went wrong while connecting to Community.");
    }
  }

  init();
})();

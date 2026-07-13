(function () {
  "use strict";

  // Companion SSO-bridge service (see ../../../sso-bridge-service). It is
  // deployed separately — spdk pack only ships this plugin folder — so this
  // must point at wherever that service is actually hosted.
  var SSO_BRIDGE_URL = "http://localhost:8787";

  var API_URL = "../api/";
  var IFRAME_LOAD_TIMEOUT_MS = 6000;

  var app = document.getElementById("app");
  var loadingPanel = app.querySelector(".loading-panel");
  var errorPanel = app.querySelector(".error-panel");
  var errorMessage = errorPanel.querySelector(".error-message");
  var frameContainer = app.querySelector(".frame-container");
  var frame = frameContainer.querySelector(".community-frame");
  var fallbackBanner = frameContainer.querySelector(".fallback-banner");

  function showError(message) {
    loadingPanel.hidden = true;
    frameContainer.hidden = true;
    errorMessage.textContent = message;
    errorPanel.hidden = false;
  }

  function showFrame(url) {
    // A cross-origin iframe's `load` event fires whether the navigation
    // actually succeeded or community.42gears.com refused via
    // X-Frame-Options/frame-ancestors — JS can't tell those apart. This
    // timeout only catches a frame that never resolves at all; the
    // persistent fallback banner covers the "loaded but blank/blocked"
    // case. Getting the community platform to allow-list the SureMDM
    // console's origin in frame-ancestors is what actually removes the
    // need for this fallback.
    var settled = false;
    var timer = setTimeout(function () {
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
      function () {
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

  function getAccount() {
    return fetch(API_URL + "Account")
      .then(function (res) {
        if (!res.ok) throw new Error("Could not read the current SureMDM account.");
        return res.json();
      });
  }

  function getCommunitySsoUrl(account) {
    return fetch(SSO_BRIDGE_URL + "/api/plugin/sso-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: account.Name,
        apiKey: account.ApiKey,
        customerId: account.CustomerID,
      }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          throw new Error(body.error || "Backend returned " + res.status);
        });
      }
      return res.json();
    });
  }

  getAccount()
    .then(function (account) {
      return getCommunitySsoUrl(account);
    })
    .then(function (result) {
      showFrame(result.url);
    })
    .catch(function (err) {
      showError(err.message || "Something went wrong while connecting to Community.");
    });
})();

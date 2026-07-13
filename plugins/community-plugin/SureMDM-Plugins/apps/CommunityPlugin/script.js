(function () {
  "use strict";

  // Phase 1: embed Community directly and let the user log in inside the
  // frame themselves. SSO auto-login (via ../../../sso-bridge-service) is a
  // later enhancement, deferred for now.
  var COMMUNITY_URL = "https://community.42gears.com/";
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

  showFrame(COMMUNITY_URL);
})();

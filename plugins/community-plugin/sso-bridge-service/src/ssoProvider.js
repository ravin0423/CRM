import crypto from "node:crypto";

/**
 * Discourse's documented SSO ("DiscourseConnect") protocol. Used as the
 * default adapter because it's the most common standards-based scheme among
 * community platforms — confirm whether community.42gears.com actually runs
 * on it before relying on this in production.
 */
function discourseProvider({ communityBaseUrl, secret }) {
  return {
    buildRedirectUrl({ email, name, externalId }) {
      const nonce = crypto.randomBytes(16).toString("hex");
      const params = new URLSearchParams({
        nonce,
        email,
        external_id: externalId,
        name,
      });

      const payload = Buffer.from(params.toString()).toString("base64");
      const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      const url = new URL("/session/sso_login", communityBaseUrl);
      url.searchParams.set("sso", payload);
      url.searchParams.set("sig", sig);
      return url.toString();
    },
  };
}

/**
 * Generic short-lived JWT handoff, for platforms that accept a signed token
 * on a callback route instead of Discourse's scheme. The callback path is a
 * placeholder — replace with whatever community.42gears.com documents.
 */
function jwtProvider({ communityBaseUrl, secret }) {
  function base64url(input) {
    return Buffer.from(input).toString("base64url");
  }

  return {
    buildRedirectUrl({ email, name, externalId }) {
      const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const now = Math.floor(Date.now() / 1000);
      const body = base64url(
        JSON.stringify({
          sub: externalId,
          email,
          name,
          iat: now,
          exp: now + 120,
        })
      );
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${header}.${body}`)
        .digest("base64url");

      const token = `${header}.${body}.${signature}`;
      const url = new URL("/auth/sso-callback", communityBaseUrl);
      url.searchParams.set("token", token);
      return url.toString();
    },
  };
}

export function getSsoProvider(name, config) {
  switch (name) {
    case "discourse":
      return discourseProvider(config);
    case "jwt":
      return jwtProvider(config);
    default:
      throw new Error(`Unknown SSO_PROVIDER "${name}"`);
  }
}

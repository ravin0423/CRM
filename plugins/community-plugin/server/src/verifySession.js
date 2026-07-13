/**
 * Verifies a session token the console handed the plugin, by asking the
 * SureMDM server itself who it belongs to — the plugin backend must never
 * trust client-supplied identity directly, since that would let anyone
 * mint an SSO login as an arbitrary community user.
 *
 * The endpoint path/response shape are placeholders pending the real SPDK
 * session-verification contract.
 */
export async function verifySureMdmSession(sessionToken, config) {
  if (config.devMockSession) {
    return { email: "demo.user@example.com", name: "Demo User", externalId: "demo-user-1" };
  }

  const url = new URL(config.sessionVerifyPath, config.suremdmApiBase);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  if (!res.ok) {
    throw new Error("Invalid or expired SureMDM session");
  }

  const data = await res.json();
  return {
    email: data.email,
    name: data.name || data.displayName,
    externalId: data.userId || data.id,
  };
}

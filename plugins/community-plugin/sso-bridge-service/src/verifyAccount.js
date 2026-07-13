/**
 * Independently confirms the account the plugin's script.js claims to be
 * acting for, by calling SureMDM's own API server-to-server with the
 * ApiKey/CustomerID pair it read from `../api/Account` — the bridge must
 * not mint a community SSO login purely on the client's say-so, since a
 * user could otherwise open dev tools and call this service directly with
 * an arbitrary identity.
 *
 * The exact verification endpoint/header names are placeholders pending
 * confirmation against SureMDM's public REST API contract; the ApiKey +
 * CustomerID pairing itself is real — the SPDK sample plugin's own
 * `../api/Account` response surfaces both fields.
 */
export async function verifySureMdmAccount({ apiKey, customerId }, config) {
  if (config.devMockAccount) {
    return { email: "demo.user@example.com", name: "Demo User", externalId: customerId || "demo-user-1" };
  }

  if (!apiKey || !customerId) {
    throw new Error("apiKey and customerId are required");
  }

  const url = new URL(config.accountVerifyPath, config.suremdmApiBase);
  url.searchParams.set("customerId", customerId);

  const res = await fetch(url, {
    headers: { ApiKey: apiKey },
  });

  if (!res.ok) {
    throw new Error("Could not verify this SureMDM account");
  }

  const data = await res.json();
  return {
    email: data.Email,
    name: data.Name,
    externalId: data.CustomerID || customerId,
  };
}

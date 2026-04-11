/**
 * Runtime config loader.
 *
 * We deliberately avoid Vite's `import.meta.env` for values the operator can
 * change in the Admin Panel. Instead, `/config.json` is fetched at app boot —
 * the backend keeps that file in sync with admin_settings.json.
 */

export interface RuntimeConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
}

let current: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (current) return current;
  const res = await fetch("/config.json", { cache: "no-store" });
  current = (await res.json()) as RuntimeConfig;
  return current;
}

export function runtimeConfig(): RuntimeConfig {
  if (!current) {
    throw new Error("runtimeConfig() called before loadRuntimeConfig()");
  }
  return current;
}

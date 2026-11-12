/**
 * Runtime configuration, read from environment variables.
 *
 * Secrets (the API token) are only ever read from the environment and are never
 * echoed back in tool output or logs.
 */
import { fileURLToPath } from "node:url";

export interface Config {
  /** REST API host, e.g. https://live-mt-server.wati.io (no tenant ID, no /api suffix). */
  apiHost: string;
  /** Wati API token (sent as `Authorization: Bearer <token>`). */
  apiToken: string;
  /** When true, every tool that changes state in Wati is disabled. */
  readOnly: boolean;
  /** When true, customer-facing sends and blocking require an explicit `confirm: true`. */
  requireConfirm: boolean;
  /** Optional text appended to every free-form reply (e.g. "\n— Ana, Support team"). */
  replySignature: string;
  /** Optional path to a JSON file with canned replies. */
  cannedRepliesFile: string | undefined;
  /** Optional default channel (name or phone number) for template sends. */
  defaultChannel: string | undefined;
  /** Directory with the Markdown knowledge base. */
  knowledgeDir: string;
  /** HTTP timeout per request in milliseconds. */
  timeoutMs: number;
}

const REGION_HOSTS: Record<string, string> = {
  global: "https://live-mt-server.wati.io",
  eu: "https://eu-api.wati.io",
  ksa: "https://ksa-api.wati.io",
};

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function normalizeHost(raw: string): string {
  let host = raw.trim();
  if (!/^https?:\/\//i.test(host)) host = `https://${host}`;
  host = host.replace(/\/+$/, "");
  // People often paste the full legacy endpoint (".../{tenantId}" or ".../api/...").
  // V3 routes have no tenant ID, so keep only the origin.
  try {
    return new URL(host).origin;
  } catch {
    throw new Error(`WATI_API_HOST is not a valid URL: ${raw}`);
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = (env.WATI_API_TOKEN ?? "").trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error(
      "WATI_API_TOKEN is not set. Create a token in Wati (API → API Tokens) and pass it via the environment.",
    );
  }

  let hostRaw = env.WATI_API_HOST?.trim();
  if (!hostRaw && env.WATI_REGION) {
    hostRaw = REGION_HOSTS[env.WATI_REGION.trim().toLowerCase()];
    if (!hostRaw) {
      throw new Error(`WATI_REGION must be one of: ${Object.keys(REGION_HOSTS).join(", ")}`);
    }
  }
  if (!hostRaw) {
    throw new Error(
      "WATI_API_HOST is not set. Use the API endpoint shown in Wati (API → API Docs), e.g. https://live-mt-server.wati.io, or set WATI_REGION=global|eu|ksa.",
    );
  }

  const timeout = Number(env.WATI_TIMEOUT_MS ?? "30000");

  return {
    apiHost: normalizeHost(hostRaw),
    apiToken: token,
    readOnly: bool(env.WATI_READ_ONLY, false),
    requireConfirm: bool(env.WATI_REQUIRE_CONFIRM, true),
    replySignature: env.WATI_REPLY_SIGNATURE ?? "",
    cannedRepliesFile: env.WATI_CANNED_REPLIES_FILE?.trim() || undefined,
    defaultChannel: env.WATI_DEFAULT_CHANNEL?.trim() || undefined,
    knowledgeDir: env.WATI_KNOWLEDGE_DIR?.trim() || fileURLToPath(new URL("../knowledge", import.meta.url)),
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 30000,
  };
}

/**
 * Helpers that turn raw Wati payloads into compact, model-friendly text, and
 * estimate the WhatsApp 24-hour customer-service window.
 */
import type { ConversationEvent, QueryItem, QueryMessage, Template } from "./wati-client.js";

export const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Parses ISO strings and Unix timestamps (seconds or milliseconds). */
export function parseTime(value: string | number | null | undefined): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(value)) {
    const n = Number(value);
    const d = new Date(n > 1e12 ? n : n * 1000);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function eventTime(e: ConversationEvent): Date | undefined {
  return parseTime(e.timestamp ?? undefined) ?? parseTime(e.created);
}

export function isMessage(e: ConversationEvent): boolean {
  return (e.event_type ?? "message").toLowerCase() === "message";
}

/** owner === false means the customer sent it; owner === true means the business (agent/bot/broadcast). */
export function isFromCustomer(e: ConversationEvent): boolean {
  return isMessage(e) && e.owner === false;
}

export interface WindowState {
  /** "open" | "expired" | "unknown" */
  state: "open" | "expired" | "unknown";
  last_customer_message_at?: string;
  expires_at?: string;
  basis: string;
}

/**
 * Estimates the 24h window from a page of message history. Only the provided events
 * are considered, so "unknown" means no customer message was found in that page.
 */
export function windowFromEvents(events: ConversationEvent[], now: Date = new Date()): WindowState {
  let latest: Date | undefined;
  for (const e of events) {
    if (!isFromCustomer(e)) continue;
    const t = eventTime(e);
    if (t && (!latest || t > latest)) latest = t;
  }
  if (!latest) {
    return { state: "unknown", basis: "No customer message found in the most recent page of history." };
  }
  const expires = new Date(latest.getTime() + SESSION_WINDOW_MS);
  return {
    state: expires > now ? "open" : "expired",
    last_customer_message_at: latest.toISOString(),
    expires_at: expires.toISOString(),
    basis: "Estimated from the latest customer message in the conversation history.",
  };
}

function fmtTime(d: Date | undefined): string {
  return d ? d.toISOString().replace("T", " ").slice(0, 16) + "Z" : "unknown time";
}

function senderLabel(e: ConversationEvent): string {
  if (e.owner === false) return "Customer";
  if (e.operator_name) return `Agent (${e.operator_name})`;
  if (e.bot_type) return `Bot (${e.bot_type})`;
  return "Business";
}

function oneLine(text: string | null | undefined, max = 2000): string {
  const t = (text ?? "").replace(/\s+\n/g, "\n").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** Renders events oldest → newest as a readable transcript. */
export function formatTranscript(events: ConversationEvent[]): string {
  const sorted = [...events].sort((a, b) => (eventTime(a)?.getTime() ?? 0) - (eventTime(b)?.getTime() ?? 0));
  const lines: string[] = [];
  for (const e of sorted) {
    const when = fmtTime(eventTime(e));
    if (!isMessage(e)) {
      const extra = oneLine(e.text) || "";
      lines.push(`[${when}] · ${e.event_type ?? "event"}${extra ? `: ${extra}` : ""}`);
      continue;
    }
    const kind = (e.type ?? "text").toLowerCase();
    const body = oneLine(e.text);
    const media = kind !== "text" ? `[${kind}] ` : "";
    const status = e.owner && e.status ? ` (${e.status.toLowerCase()})` : "";
    const failed = e.failed_detail ? ` [FAILED: ${oneLine(e.failed_detail, 200)}]` : "";
    lines.push(`[${when}] ${senderLabel(e)}${status}: ${media}${body || "(no text)"}${failed}`);
  }
  return lines.join("\n");
}

function humanDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds)) return "?";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function previewMessages(msgs: QueryMessage[] | undefined, max = 3): string[] {
  if (!msgs?.length) return [];
  return [...msgs]
    .sort((a, b) => (parseTime(a.sent_at)?.getTime() ?? 0) - (parseTime(b.sent_at)?.getTime() ?? 0))
    .slice(-max)
    .map((m) => {
      const who = (m.direction ?? "").toLowerCase().startsWith("in") ? "Customer" : "Business";
      const media = m.type && m.type.toLowerCase() !== "text" ? `[${m.type}] ` : "";
      return `    ${who}: ${media}${oneLine(m.text, 280)}${m.content_truncated ? "…" : ""}`;
    });
}

/** Renders one inbox item from the conversation query API. */
export function formatQueueItem(item: QueryItem, index: number): string {
  const tags = item.tags?.map((t) => t.name ?? t.id).filter(Boolean).join(", ");
  const lines = [
    `${index}. conversation_id=${item.conversation_id ?? "?"}  contact_id=${item.contact_id ?? "?"}`,
    `   status=${item.status ?? "?"}  assignment=${item.assignment ?? "?"}${item.assignee_id ? ` (assignee ${item.assignee_id})` : ""}  unread=${item.unread ?? "?"}`,
    `   reply_state=${item.reply_state ?? "?"}  waiting=${humanDuration(item.waiting_seconds)}  last_customer_message=${item.last_customer_message_at ?? "?"}`,
    `   24h_window=${item.session_state ?? "?"}${item.reply_window_expires_at ? ` (expires ${item.reply_window_expires_at})` : ""}  channel=${item.channel?.type ?? "?"}${item.channel?.business_number ? `:${item.channel.business_number}` : ""}`,
  ];
  if (tags) lines.push(`   tags=${tags}`);
  const preview = previewMessages(item.context?.messages ?? item.matched_messages);
  if (preview.length) lines.push("   recent:", ...preview);
  return lines.join("\n");
}

/** Extracts {{1}}, {{name}} style placeholders from a template body. */
export function templatePlaceholders(body: string | undefined): string[] {
  if (!body) return [];
  const found = new Set<string>();
  for (const m of body.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)) found.add(m[1]!);
  return [...found];
}

export function formatTemplate(t: Template): string {
  const lang = t.language_option?.value ?? t.language_option?.key ?? t.language_option?.text;
  const body = t.body_original ?? t.body ?? "";
  const params = templatePlaceholders(body);
  const paramNames = t.custom_params?.map((p) => p.name).filter(Boolean) ?? [];
  const allParams = [...new Set([...params, ...paramNames])];
  return [
    `- ${t.name ?? "?"}  [${t.status ?? "?"}]  category=${t.category ?? "?"}${lang ? `  language=${lang}` : ""}`,
    `  params: ${allParams.length ? allParams.join(", ") : "(none)"}`,
    `  body: ${oneLine(body, 600)}`,
  ].join("\n");
}

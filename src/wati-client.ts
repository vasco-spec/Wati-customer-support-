/**
 * Minimal client for the Wati REST API (V3 routes: {host}/api/ext/v3/...).
 *
 * Reference: https://docs.wati.io/reference/introduction
 *
 * Retry policy follows Wati's guidance: GET requests are retried on 429/5xx with
 * bounded backoff (honouring Retry-After). Writes are NEVER retried automatically,
 * because a timed-out or failed write may already have been accepted.
 */
import type { Config } from "./config.js";

export class WatiApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly body: string,
  ) {
    super(message);
    this.name = "WatiApiError";
  }
}

// ---------- Response types (only the fields this server uses; all optional) ----------

export interface ConversationSummary {
  id?: string;
  contact_id?: string;
  contact_name?: string;
  channel_type?: string;
  started_date?: string;
  last_updated?: string;
}

export interface ConversationEvent {
  id?: string;
  created?: string;
  conversation_id?: string;
  ticket_id?: string;
  event_type?: string;
  // Present on message events:
  text?: string | null;
  type?: string | null;
  timestamp?: string | null;
  owner?: boolean | null;
  status?: string | null;
  operator_name?: string | null;
  failed_detail?: string | null;
  bot_type?: string | null;
  local_message_id?: string | null;
  [key: string]: unknown;
}

export interface MessagesPage {
  message_list?: ConversationEvent[] | null;
  page_number?: number;
  page_size?: number;
  channel_id?: string | null;
}

export interface Contact {
  id?: string;
  wa_id?: string;
  name?: string;
  phone?: string;
  created?: string;
  last_updated?: string;
  contact_status?: string;
  source?: string;
  channel_id?: string;
  opted_in?: boolean;
  allow_broadcast?: boolean;
  teams?: string[] | null;
  segments?: string[] | null;
  custom_params?: { name: string; value: string }[] | null;
  channel_type?: string;
  display_name?: string;
  [key: string]: unknown;
}

export interface QueryMessage {
  message_id?: string;
  sent_at?: string;
  direction?: string;
  type?: string;
  text?: string;
  content_truncated?: boolean;
}

export interface QueryItem {
  conversation_id?: string;
  contact_id?: string;
  channel?: { id?: string; type?: string; business_number?: string; platform_id?: string };
  status?: string;
  assignee_id?: string | null;
  team_ids?: string[];
  tags?: { id?: string; name?: string }[];
  assignment?: string;
  unread?: boolean;
  last_customer_message_at?: string;
  seconds_since_last_customer_message?: number;
  reply_state?: string;
  last_effective_reply_at?: string;
  waiting_seconds?: number;
  inbox_expired?: boolean;
  session_state?: string;
  reply_window_expires_at?: string;
  matched_messages?: QueryMessage[];
  context?: { status?: string; messages?: QueryMessage[]; has_more?: boolean };
}

export interface QueryResult {
  items?: QueryItem[];
  page?: { returned_count?: number; has_more?: boolean; next_cursor?: string | null };
  count?: { status?: string; conversation_count?: number; exact?: boolean };
  meta?: { limitations?: string[]; [key: string]: unknown };
}

export interface ConversationQuery {
  time_range: { from: string; to: string };
  filters?: {
    statuses?: string[];
    assignee_ids?: string[];
    team_ids?: string[];
    assignment?: "assigned" | "unassigned";
    channel_types?: string[];
    unread?: boolean;
    reply_state?: "awaiting_business" | "replied" | "unknown";
    min_wait_seconds?: number;
    tags?: { any_of: string[] };
    session_state?: "open" | "expired" | "not_applicable" | "unknown";
    message_query?: { text: string };
  };
  page?: { size: number; cursor?: string };
  context?: { messages_per_conversation?: number };
  count?: { mode: "none" | "exact" };
}

export interface Template {
  id?: string;
  name?: string;
  category?: string;
  status?: string;
  body?: string;
  body_original?: string;
  footer?: string;
  header?: unknown;
  buttons?: unknown[];
  custom_params?: { name?: string; value?: string }[];
  language_option?: { key?: string; value?: string; text?: string } | null;
  [key: string]: unknown;
}

export interface SendMessageResult {
  message?: ConversationEvent;
}

export interface TemplateSendResult {
  success?: boolean;
  broadcast_id?: string;
  error?: string | null;
  recipients?: { local_message_id?: string; phone_number?: string; errors?: string[]; target?: string }[];
}

export interface InteractiveMessage {
  target: string;
  type: "buttons" | "list";
  button_message?: {
    header?: { type?: string; text?: string };
    body: string;
    footer?: string;
    buttons: { text: string }[];
  };
  list_message?: {
    header?: string;
    body: string;
    footer?: string;
    button_text: string;
    sections: { title?: string; rows: { title: string; description?: string }[] }[];
  };
}

type FetchLike = typeof fetch;

const V3 = "/api/ext/v3";
const MAX_GET_ATTEMPTS = 3;

function seg(value: string): string {
  return encodeURIComponent(value.trim());
}

export class WatiClient {
  constructor(
    private readonly config: Pick<Config, "apiHost" | "apiToken" | "timeoutMs">,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  // ---------------- Conversations ----------------

  listConversations(params: { page_number: number; page_size: number; channel_type?: string; channel_id?: string }) {
    return this.request<{ conversation_list?: ConversationSummary[]; page_number?: number; page_size?: number }>(
      "GET",
      `${V3}/conversations`,
      { query: params },
    );
  }

  queryConversations(body: ConversationQuery) {
    // The query endpoint is read-only, so it is safe to retry like a GET.
    return this.request<QueryResult>("POST", `${V3}/conversations/query`, { body, retryable: true });
  }

  getMessages(target: string, page_number = 1, page_size = 30) {
    return this.request<MessagesPage>("GET", `${V3}/conversations/${seg(target)}/messages`, {
      query: { page_number, page_size },
    });
  }

  sendText(target: string, text: string) {
    return this.request<SendMessageResult>("POST", `${V3}/conversations/messages/text`, { body: { target, text } });
  }

  sendFileViaUrl(target: string, file_url: string, caption?: string) {
    return this.request<SendMessageResult>("POST", `${V3}/conversations/messages/fileViaUrl`, {
      body: { target, file_url, ...(caption ? { caption } : {}) },
    });
  }

  sendInteractive(message: InteractiveMessage) {
    return this.request<SendMessageResult>("POST", `${V3}/conversations/messages/interactive`, { body: message });
  }

  sendTypingIndicator(target: string) {
    return this.request<{ success?: boolean }>("POST", `${V3}/conversations/typingIndicator`, { body: { target } });
  }

  /** Pass `null` to hand the conversation back to the bot. */
  assignOperator(target: string, assignee_email: string | null) {
    return this.request<{ result?: boolean }>("PUT", `${V3}/conversations/${seg(target)}/operator`, {
      body: { assignee_email },
    });
  }

  updateStatus(target: string, new_status: "open" | "solved" | "pending" | "block") {
    return this.request<{ result?: boolean }>("PUT", `${V3}/conversations/${seg(target)}/status`, {
      body: { new_status },
    });
  }

  addTag(target: string, tagName: string) {
    return this.request<{ conversationId?: string; tagName?: string; added?: boolean }>(
      "POST",
      `${V3}/conversations/${seg(target)}/tags`,
      { body: { tagName } },
    );
  }

  removeTag(target: string, tagName: string) {
    return this.request<{ conversationId?: string; tagName?: string; removed?: boolean }>(
      "DELETE",
      `${V3}/conversations/${seg(target)}/tags/${seg(tagName)}`,
    );
  }

  // ---------------- Contacts ----------------

  getContact(target: string) {
    return this.request<Contact>("GET", `${V3}/contacts/${seg(target)}`);
  }

  // ---------------- Templates ----------------

  listTemplates(page_number = 1, page_size = 100, channel?: string) {
    return this.request<{ templates?: Template[]; page_number?: number; page_size?: number; total?: number }>(
      "GET",
      `${V3}/messageTemplates`,
      { query: { page_number, page_size, channel } },
    );
  }

  sendTemplate(body: {
    template_name: string;
    broadcast_name: string;
    channel?: string;
    recipients: { target: string; custom_params?: { name: string; value: string }[]; local_message_id?: string }[];
  }) {
    return this.request<TemplateSendResult>("POST", `${V3}/messageTemplates/send`, { body });
  }

  // ---------------- Transport ----------------

  async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    opts: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; retryable?: boolean } = {},
  ): Promise<T> {
    const url = new URL(this.config.apiHost + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }

    const retryable = opts.retryable ?? method === "GET";
    const maxAttempts = retryable ? MAX_GET_ATTEMPTS : 1;

    for (let attempt = 1; ; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            Accept: "application/json",
            ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : String(err);
        if (attempt < maxAttempts) {
          await this.sleep(500 * 2 ** (attempt - 1));
          continue;
        }
        const hint = retryable
          ? ""
          : " The request may still have been accepted by Wati; check the conversation before retrying.";
        throw new WatiApiError(`${method} ${path} ${reason}.${hint}`, 0, method, path, "");
      }
      clearTimeout(timer);

      const text = await res.text();
      if (res.ok) {
        if (!text) return {} as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          return { raw: text } as T;
        }
      }

      if (attempt < maxAttempts && (res.status === 429 || res.status >= 500)) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 1000 * 2 ** (attempt - 1);
        await this.sleep(delay);
        continue;
      }

      throw new WatiApiError(describeError(method, path, res.status, text, retryable), res.status, method, path, text);
    }
  }
}

function describeError(method: string, path: string, status: number, body: string, retryable: boolean): string {
  let detail = body.trim();
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string; title?: string };
    detail = parsed.message ?? parsed.error ?? parsed.title ?? detail;
  } catch {
    /* plain-text or empty body */
  }
  if (detail.length > 500) detail = `${detail.slice(0, 500)}…`;

  const hints: Record<number, string> = {
    400: "Wati rejected the request as invalid.",
    401: "Authentication failed: check WATI_API_TOKEN (expired/revoked?) and that WATI_API_HOST matches the token's workspace region.",
    403: "Forbidden: the token is missing a required scope, or the role/plan/channel does not allow this operation.",
    404: "Not found: check the target (conversation ID vs contact ID vs phone number) and WATI_API_HOST.",
    429: "Rate or usage limit reached. Wait before retrying.",
  };
  let hint = hints[status] ?? (status >= 500 ? "Wati server error." : "");
  if (status >= 500 && !retryable) {
    hint += " The write may still have been accepted; check the conversation before retrying.";
  }
  return `Wati API ${method} ${path} failed with HTTP ${status}. ${hint}${detail ? ` Details: ${detail}` : ""}`.trim();
}

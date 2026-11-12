import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadCannedReplies, renderCannedReply } from "./canned.js";
import { loadKnowledge, searchKnowledge } from "./knowledge.js";
import type { Config } from "./config.js";
import {
  formatQueueItem,
  formatTemplate,
  formatTranscript,
  templatePlaceholders,
  windowFromEvents,
  type WindowState,
} from "./format.js";
import { WatiApiError, type ConversationQuery, type Template, type WatiClient } from "./wati-client.js";

// ---------------------------------------------------------------------------
// Shared schema pieces
// ---------------------------------------------------------------------------

const conversationTarget = z
  .string()
  .min(1)
  .describe(
    "Conversation to act on: a conversation ID (from support_inbox / support_list_conversations), " +
      "the customer's phone number with country code and no '+' (e.g. 5511999999999), or 'Channel:PhoneNumber'. " +
      "Note: a contact ID is NOT a conversation ID.",
  );

const confirmField = z
  .boolean()
  .optional()
  .describe(
    "Must be true to actually perform this action. Without it you get a preview of exactly what would happen. " +
      "Show the preview to the user and only confirm once they approve.",
  );

const skipWindowCheckField = z
  .boolean()
  .optional()
  .describe(
    "Skip the 24-hour customer-service window pre-check. Only use when you know the window is open " +
      "(e.g. the customer just wrote) but the history lookup could not tell.",
  );

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

function ok(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

function fail(text: string): CallToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function errorText(err: unknown): string {
  if (err instanceof WatiApiError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

function safe<A>(handler: (args: A) => Promise<CallToolResult>): (args: A) => Promise<CallToolResult> {
  return async (args: A) => {
    try {
      return await handler(args);
    } catch (err) {
      return fail(errorText(err));
    }
  };
}

function looksLikePhone(target: string): boolean {
  return /^\+?\d[\d\s-]{6,}$/.test(target.trim());
}

function preview(action: string, details: Record<string, unknown>, extra = ""): CallToolResult {
  const lines = Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  return ok(
    [
      `PREVIEW — nothing has been sent or changed yet.`,
      `Action: ${action}`,
      ...lines,
      extra,
      ``,
      `To proceed, call this tool again with the same arguments and confirm: true (after the user approves).`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  );
}

function windowLine(w: WindowState): string {
  if (w.state === "unknown") return `24h window: unknown (${w.basis})`;
  return `24h window: ${w.state} — last customer message ${w.last_customer_message_at}, ${
    w.state === "open" ? "expires" : "expired"
  } ${w.expires_at}`;
}

const ALL_STATUSES = ["new", "open", "pending", "solved", "expired", "broadcast", "awaiting_response"] as const;
const UNSOLVED_STATUSES = ALL_STATUSES.filter((s) => s !== "solved");

const WINDOW_CLOSED_HELP =
  "WhatsApp only allows free-form, media and interactive messages within 24 hours of the customer's last message. " +
  "Use support_list_templates to pick an approved template and send it with support_send_template instead.";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerTools(server: McpServer, client: WatiClient, config: Config): void {
  const needsConfirm = (confirm: boolean | undefined) => config.requireConfirm && confirm !== true;

  async function checkWindow(target: string): Promise<WindowState> {
    const page = await client.getMessages(target, 1, 50);
    return windowFromEvents(page.message_list ?? []);
  }

  /** Returns an error result when the window is known to be closed (or unknown and not skipped). */
  async function guardWindow(target: string, skip: boolean | undefined): Promise<{ window?: WindowState; error?: CallToolResult }> {
    if (skip) return {};
    const w = await checkWindow(target);
    if (w.state === "expired") {
      return { window: w, error: fail(`Not sent: the 24-hour window is closed. ${windowLine(w)}\n${WINDOW_CLOSED_HELP}`) };
    }
    if (w.state === "unknown") {
      return {
        window: w,
        error: fail(
          `Not sent: could not find a recent customer message, so the 24-hour window is probably closed. ${WINDOW_CLOSED_HELP} ` +
            "If you are sure the customer wrote in the last 24 hours, retry with skip_window_check: true.",
        ),
      };
    }
    return { window: w };
  }

  function withSignature(text: string): string {
    return config.replySignature ? `${text}${config.replySignature.replace(/\\n/g, "\n")}` : text;
  }

  function sentSummary(what: string, target: string, result: { message?: { id?: string; status?: string | null; conversation_id?: string; local_message_id?: string | null } }) {
    const m = result.message ?? {};
    return ok(
      [
        `${what} accepted by Wati for ${target}.`,
        m.id ? `message_id: ${m.id}` : "",
        m.conversation_id ? `conversation_id: ${m.conversation_id}` : "",
        m.status ? `status: ${m.status}` : "",
        "Accepted is not the same as delivered; check the conversation later if delivery matters. Do not resend just because delivery is not yet shown.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  // =========================== READ TOOLS ===========================

  server.registerTool(
    "support_inbox",
    {
      title: "Support inbox (triage queue)",
      description:
        "List conversations that need attention, longest-waiting first. By default shows conversations where the " +
        "customer is waiting for a reply from us in the last 7 days (solved conversations hidden), with the latest " +
        "messages, 24h-window state, assignment and tags. Uses Wati's conversation query API (Growth, Pro or Business plan).",
      inputSchema: {
        waiting_on: z
          .enum(["us", "customer", "any"])
          .default("us")
          .describe("'us' = customer is awaiting our reply; 'customer' = we replied last; 'any' = no filter."),
        assignment: z.enum(["unassigned", "assigned", "any"]).default("any"),
        statuses: z
          .array(z.enum(ALL_STATUSES))
          .optional()
          .describe("Filter by conversation status. Omit for every status except solved (see include_solved)."),
        include_solved: z
          .boolean()
          .default(false)
          .describe("Also show solved conversations (e.g. a customer saying 'thanks' after it was closed). Ignored when statuses is set."),
        since_hours: z
          .number()
          .int()
          .min(1)
          .max(24 * 90)
          .default(168)
          .describe("Only conversations whose last customer message is within this many hours (default 168 = 7 days)."),
        min_wait_minutes: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Only conversations waiting at least this long for our reply (requires waiting_on='us')."),
        unread_only: z.boolean().optional(),
        window: z
          .enum(["open", "expired", "any"])
          .default("any")
          .describe("'open' = we can still reply freely; 'expired' = template required."),
        text: z.string().min(1).max(512).optional().describe("Only conversations with messages containing this text."),
        tag_ids: z.array(z.string()).optional().describe("Only conversations with any of these tag IDs."),
        messages_per_conversation: z.number().int().min(0).max(10).default(3),
        page_size: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional().describe("next_cursor from a previous call (keep all other arguments the same)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      if (a.min_wait_minutes !== undefined && a.waiting_on !== "us") {
        return fail("min_wait_minutes can only be used with waiting_on='us'.");
      }
      const now = Date.now();
      const query: ConversationQuery = {
        time_range: {
          from: new Date(now - a.since_hours * 3600_000).toISOString(),
          to: new Date(now + 60_000).toISOString(),
        },
        filters: {
          ...(a.statuses?.length
            ? { statuses: a.statuses }
            : a.include_solved
              ? {}
              : { statuses: [...UNSOLVED_STATUSES] }),
          ...(a.assignment !== "any" ? { assignment: a.assignment } : {}),
          ...(a.waiting_on === "us" ? { reply_state: "awaiting_business" as const } : {}),
          ...(a.waiting_on === "customer" ? { reply_state: "replied" as const } : {}),
          ...(a.min_wait_minutes !== undefined ? { min_wait_seconds: a.min_wait_minutes * 60 } : {}),
          ...(a.unread_only ? { unread: true } : {}),
          ...(a.window !== "any" ? { session_state: a.window } : {}),
          ...(a.text ? { message_query: { text: a.text } } : {}),
          ...(a.tag_ids?.length ? { tags: { any_of: a.tag_ids } } : {}),
        },
        page: { size: a.page_size, ...(a.cursor ? { cursor: a.cursor } : {}) },
        context: { messages_per_conversation: a.messages_per_conversation },
      };
      const res = await client.queryConversations(query);
      const items = [...(res.items ?? [])].sort((x, y) => (y.waiting_seconds ?? 0) - (x.waiting_seconds ?? 0));
      if (!items.length) {
        return ok("No conversations match these filters." + (res.page?.has_more ? " (More pages exist: use cursor.)" : ""));
      }
      const out = [
        `${items.length} conversation(s) on this page, longest waiting first:`,
        "",
        ...items.map((it, i) => formatQueueItem(it, i + 1)),
        "",
        res.page?.has_more && res.page.next_cursor
          ? `More results: call again with cursor="${res.page.next_cursor}".`
          : "No more pages.",
      ];
      if (res.meta?.limitations?.length) out.push(`Notes from Wati: ${res.meta.limitations.join("; ")}`);
      return ok(out.join("\n"));
    }),
  );

  server.registerTool(
    "support_list_conversations",
    {
      title: "List recent conversations",
      description:
        "Simple paged list of conversations, newest first (ID, contact, channel, dates). Works on all plans; " +
        "use support_inbox for filtered triage.",
      inputSchema: {
        page: z.number().int().min(1).default(1),
        page_size: z.number().int().min(1).max(100).default(20),
        channel_type: z
          .enum(["whatsapp", "whatsapp_group", "instagram", "messenger", "tiktok", "webchat", "rcs"])
          .optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      const res = await client.listConversations({
        page_number: a.page,
        page_size: a.page_size,
        channel_type: a.channel_type,
      });
      const list = res.conversation_list ?? [];
      if (!list.length) return ok(`No conversations on page ${a.page}.`);
      const rows = list.map(
        (c, i) =>
          `${(a.page - 1) * a.page_size + i + 1}. ${c.contact_name || "(no name)"} — conversation_id=${c.id} contact_id=${c.contact_id} channel=${c.channel_type} last_updated=${c.last_updated}`,
      );
      return ok(
        [...rows, "", list.length === a.page_size ? `Next page: page=${a.page + 1}` : "End of list."].join("\n"),
      );
    }),
  );

  server.registerTool(
    "support_get_conversation",
    {
      title: "Read a conversation",
      description:
        "Read the message history of a conversation as a transcript (oldest → newest), plus the estimated 24-hour " +
        "reply window and, when the target is a phone number, the contact's profile. Read this before replying.",
      inputSchema: {
        target: conversationTarget,
        page: z.number().int().min(1).default(1).describe("1 = most recent messages; increase for older history."),
        page_size: z.number().int().min(1).max(100).default(30),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      const page = await client.getMessages(a.target, a.page, a.page_size);
      const events = page.message_list ?? [];
      const parts: string[] = [];

      if (looksLikePhone(a.target)) {
        try {
          const c = await client.getContact(a.target.replace(/[\s+-]/g, ""));
          const attrs = (c.custom_params ?? []).map((p) => `${p.name}=${p.value}`).join(", ");
          parts.push(
            `Contact: ${c.name || c.display_name || "(no name)"}  phone=${c.phone ?? "?"}  contact_id=${c.id ?? "?"}  opted_in=${c.opted_in ?? "?"}`,
            c.teams?.length ? `Teams: ${c.teams.join(", ")}` : "",
            attrs ? `Attributes: ${attrs}` : "",
          );
        } catch {
          // Contact lookup is best-effort; the transcript is the main output.
        }
      }

      const conversationId = events.find((e) => e.conversation_id)?.conversation_id;
      if (conversationId) parts.push(`conversation_id: ${conversationId}`);
      if (a.page === 1) parts.push(windowLine(windowFromEvents(events)));
      parts.push("", events.length ? formatTranscript(events) : "No messages on this page.");
      if (events.length === a.page_size) parts.push("", `Older messages: call again with page=${a.page + 1}.`);
      return ok(parts.filter((p, i) => p !== "" || i > 0).join("\n"));
    }),
  );

  server.registerTool(
    "support_get_contact",
    {
      title: "Get contact",
      description: "Look up a customer's contact record (name, phone, opt-in, teams, segments, custom attributes).",
      inputSchema: {
        target: z.string().min(1).describe("Contact ID or phone number with country code (no '+')."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      const c = await client.getContact(a.target.replace(/^\+/, ""));
      return ok(JSON.stringify(c, null, 2));
    }),
  );

  async function fetchTemplates(channel?: string): Promise<Template[]> {
    const all: Template[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await client.listTemplates(page, 100, channel);
      const batch = res.templates ?? [];
      all.push(...batch);
      if (batch.length < 100 || (res.total !== undefined && all.length >= res.total)) break;
    }
    return all;
  }

  server.registerTool(
    "support_list_templates",
    {
      title: "List message templates",
      description:
        "List WhatsApp message templates with their status, category, language, body and parameters. " +
        "Only APPROVED templates can be sent; templates are required when the 24-hour window is closed.",
      inputSchema: {
        search: z.string().optional().describe("Case-insensitive filter on template name or body."),
        approved_only: z.boolean().default(true),
        channel: z.string().optional().describe("Channel name or phone number (default channel when omitted)."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      const q = a.search?.toLowerCase();
      const templates = (await fetchTemplates(a.channel ?? config.defaultChannel)).filter(
        (t) =>
          (!a.approved_only || (t.status ?? "").toUpperCase() === "APPROVED") &&
          (!q || `${t.name} ${t.body ?? ""}`.toLowerCase().includes(q)),
      );
      if (!templates.length) return ok("No templates match.");
      return ok([`${templates.length} template(s):`, ...templates.map(formatTemplate)].join("\n"));
    }),
  );

  server.registerTool(
    "support_list_canned_replies",
    {
      title: "List canned replies",
      description:
        "List the team's approved canned replies (from WATI_CANNED_REPLIES_FILE), with the variables each one needs.",
      inputSchema: { search: z.string().optional() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    safe(async (a) => {
      if (!config.cannedRepliesFile) {
        return ok("No canned replies configured. Set WATI_CANNED_REPLIES_FILE to a JSON file (see examples/canned-replies.json).");
      }
      const q = a.search?.toLowerCase();
      const replies = (await loadCannedReplies(config.cannedRepliesFile)).filter(
        (r) => !q || `${r.id} ${r.title} ${r.text} ${r.tags.join(" ")}`.toLowerCase().includes(q),
      );
      if (!replies.length) return ok("No canned replies match.");
      return ok(
        replies
          .map(
            (r) =>
              `- ${r.id}: ${r.title}${r.tags.length ? ` [${r.tags.join(", ")}]` : ""}\n  variables: ${
                r.variables.join(", ") || "(none)"
              }\n  text: ${r.text}`,
          )
          .join("\n"),
      );
    }),
  );

  server.registerTool(
    "support_search_knowledge",
    {
      title: "Search the product knowledge base",
      description:
        "Search the team's knowledge base (product overview, FAQ with approved answers, known issues, Loom video " +
        "library, escalation rules). ALWAYS search before answering a product question, and prefer the documented " +
        "answer and video links. If nothing relevant is found, do not guess: escalate to the team.",
      inputSchema: {
        query: z.string().min(1).describe("Keywords in Portuguese or English, e.g. 'motorista duplicado', 'via verde', 'código sms uber'."),
        file: z
          .string()
          .optional()
          .describe("Instead of searching, return a whole file, e.g. 'escalation.md' or 'known-issues.md'."),
        limit: z.number().int().min(1).max(10).default(4),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    safe(async (a) => {
      const sections = await loadKnowledge(config.knowledgeDir);
      if (a.file) {
        const wanted = a.file.endsWith(".md") ? a.file : `${a.file}.md`;
        const parts = sections.filter((s) => s.file === wanted);
        if (!parts.length) {
          return fail(`No knowledge file "${wanted}". Files: ${[...new Set(sections.map((s) => s.file))].join(", ")}`);
        }
        return ok(parts.map((s) => s.text).join("\n\n"));
      }
      const hits = searchKnowledge(sections, a.query, a.limit);
      if (!hits.length) {
        return ok("Nothing in the knowledge base matches. Do not guess: tell the customer the team will check, and escalate.");
      }
      return ok(hits.map((h) => `=== ${h.file} › ${h.heading}\n${h.text}`).join("\n\n"));
    }),
  );

  if (config.readOnly) return;

  // =========================== WRITE TOOLS ===========================

  server.registerTool(
    "support_reply",
    {
      title: "Reply to a customer",
      description:
        "Send a free-form text reply in a conversation. Checks the 24-hour window first and refuses if it is closed " +
        "(use support_send_template then). Requires confirm: true to actually send.",
      inputSchema: {
        target: conversationTarget,
        text: z.string().min(1).max(4000).describe("The reply text (WhatsApp formatting like *bold* is supported)."),
        skip_window_check: skipWindowCheckField,
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    safe(async (a) => {
      const { window, error } = await guardWindow(a.target, a.skip_window_check);
      if (error) return error;
      const text = withSignature(a.text);
      if (needsConfirm(a.confirm)) {
        return preview("send text reply", { to: a.target, text }, window ? windowLine(window) : "");
      }
      return sentSummary("Reply", a.target, await client.sendText(a.target, text));
    }),
  );

  server.registerTool(
    "support_send_canned_reply",
    {
      title: "Send a canned reply",
      description:
        "Fill in one of the team's canned replies (see support_list_canned_replies) and send it as a text reply. " +
        "Same 24h-window check and confirmation as support_reply.",
      inputSchema: {
        target: conversationTarget,
        reply_id: z.string().min(1),
        variables: z.record(z.string(), z.string()).optional().describe('Values for the reply\'s placeholders, e.g. {"name": "Ana"}.'),
        skip_window_check: skipWindowCheckField,
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    safe(async (a) => {
      const replies = await loadCannedReplies(config.cannedRepliesFile);
      const reply = replies.find((r) => r.id === a.reply_id);
      if (!reply) {
        return fail(`Unknown canned reply "${a.reply_id}". Available: ${replies.map((r) => r.id).join(", ") || "(none)"}`);
      }
      const text = withSignature(renderCannedReply(reply, a.variables));
      const { window, error } = await guardWindow(a.target, a.skip_window_check);
      if (error) return error;
      if (needsConfirm(a.confirm)) {
        return preview(`send canned reply "${reply.id}"`, { to: a.target, text }, window ? windowLine(window) : "");
      }
      return sentSummary(`Canned reply "${reply.id}"`, a.target, await client.sendText(a.target, text));
    }),
  );

  server.registerTool(
    "support_send_file",
    {
      title: "Send a file / image",
      description:
        "Send media (image, PDF, video, document) from a public URL, with an optional caption. Requires an open " +
        "24-hour window and confirm: true.",
      inputSchema: {
        target: conversationTarget,
        file_url: z.url().describe("Publicly reachable URL of the file."),
        caption: z.string().max(1024).optional(),
        skip_window_check: skipWindowCheckField,
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    safe(async (a) => {
      const { window, error } = await guardWindow(a.target, a.skip_window_check);
      if (error) return error;
      if (needsConfirm(a.confirm)) {
        return preview("send file", { to: a.target, file_url: a.file_url, caption: a.caption }, window ? windowLine(window) : "");
      }
      return sentSummary("File", a.target, await client.sendFileViaUrl(a.target, a.file_url, a.caption));
    }),
  );

  server.registerTool(
    "support_send_interactive",
    {
      title: "Send buttons or a list",
      description:
        "Send an interactive WhatsApp message: up to 3 quick-reply buttons, or a list menu (up to 10 rows). " +
        "Useful for 'Did this solve your issue? Yes / No' or choosing a topic. Requires an open 24-hour window and confirm: true.",
      inputSchema: {
        target: conversationTarget,
        body: z.string().min(1).max(1024),
        header: z.string().max(60).optional(),
        footer: z.string().max(60).optional(),
        buttons: z
          .array(z.string().min(1).max(20))
          .min(1)
          .max(3)
          .optional()
          .describe("Quick-reply button labels (max 20 chars each). Use this OR list_rows."),
        list_button_text: z.string().min(1).max(20).optional().describe("Label of the button that opens the list."),
        list_rows: z
          .array(
            z.object({
              title: z.string().min(1).max(24),
              description: z.string().max(72).optional(),
              section: z.string().max(24).optional().describe("Section title to group the row under."),
            }),
          )
          .min(1)
          .max(10)
          .optional(),
        skip_window_check: skipWindowCheckField,
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    safe(async (a) => {
      if (!!a.buttons === !!a.list_rows) return fail("Provide exactly one of buttons or list_rows.");
      if (a.list_rows && !a.list_button_text) return fail("list_button_text is required with list_rows.");

      let message: Parameters<WatiClient["sendInteractive"]>[0];
      if (a.buttons) {
        message = {
          target: a.target,
          type: "buttons",
          button_message: {
            ...(a.header ? { header: { type: "Text", text: a.header } } : {}),
            body: a.body,
            ...(a.footer ? { footer: a.footer } : {}),
            buttons: a.buttons.map((text) => ({ text })),
          },
        };
      } else {
        const sections = new Map<string, { title: string; description?: string }[]>();
        for (const row of a.list_rows!) {
          const key = row.section ?? "Options";
          if (!sections.has(key)) sections.set(key, []);
          sections.get(key)!.push({ title: row.title, ...(row.description ? { description: row.description } : {}) });
        }
        message = {
          target: a.target,
          type: "list",
          list_message: {
            ...(a.header ? { header: a.header } : {}),
            body: a.body,
            ...(a.footer ? { footer: a.footer } : {}),
            button_text: a.list_button_text!,
            sections: [...sections].map(([title, rows]) => ({ title, rows })),
          },
        };
      }

      const { window, error } = await guardWindow(a.target, a.skip_window_check);
      if (error) return error;
      if (needsConfirm(a.confirm)) {
        return preview(`send interactive ${message.type} message`, { ...message }, window ? windowLine(window) : "");
      }
      return sentSummary("Interactive message", a.target, await client.sendInteractive(message));
    }),
  );

  server.registerTool(
    "support_send_template",
    {
      title: "Send a template message",
      description:
        "Send an approved WhatsApp template to one customer. Works even when the 24-hour window is closed (it reopens " +
        "the conversation when the customer replies). Validates the template name, approval status and parameters. " +
        "Requires confirm: true. Templates may be charged by Meta/Wati.",
      inputSchema: {
        target: z.string().min(1).describe("Customer phone number with country code (no '+'), or contact ID."),
        template_name: z.string().min(1),
        params: z
          .record(z.string(), z.string())
          .optional()
          .describe('Template parameter values by name, e.g. {"name": "Ana", "order_id": "1234"}.'),
        channel: z.string().optional().describe("Sending channel name or number (default channel when omitted)."),
        broadcast_name: z.string().optional().describe("Label for this send in Wati (defaults to support-<template>-<date>)."),
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    safe(async (a) => {
      const target = a.target.replace(/^\+/, "").trim();
      const channel = a.channel ?? config.defaultChannel;
      const templates = await fetchTemplates(channel);
      const matches = templates.filter((t) => t.name === a.template_name);
      if (!matches.length) {
        const similar = templates
          .filter((t) => t.name?.toLowerCase().includes(a.template_name.toLowerCase()))
          .map((t) => t.name)
          .slice(0, 10);
        return fail(
          `Template "${a.template_name}" not found.${similar.length ? ` Similar: ${similar.join(", ")}` : " Use support_list_templates."}`,
        );
      }
      const template = matches.find((t) => (t.status ?? "").toUpperCase() === "APPROVED");
      if (!template) {
        return fail(`Template "${a.template_name}" is not approved (status: ${matches.map((t) => t.status).join(", ")}).`);
      }
      const needed = templatePlaceholders(template.body_original ?? template.body);
      const params = a.params ?? {};
      const missing = needed.filter((p) => params[p] === undefined || params[p] === "");
      if (missing.length) {
        return fail(`Missing values for template parameter(s): ${missing.join(", ")}.\nTemplate body: ${template.body_original ?? template.body}`);
      }
      const custom_params = Object.entries(params).map(([name, value]) => ({ name, value }));
      const broadcast_name = a.broadcast_name ?? `support-${a.template_name}-${new Date().toISOString().slice(0, 16)}`;

      if (needsConfirm(a.confirm)) {
        let rendered = template.body_original ?? template.body ?? "";
        for (const [k, v] of Object.entries(params)) rendered = rendered.replaceAll(`{{${k}}}`, v);
        return preview("send template message", {
          to: target,
          template: a.template_name,
          channel: channel ?? "(default)",
          rendered_body: rendered,
          broadcast_name,
        });
      }

      const res = await client.sendTemplate({
        template_name: a.template_name,
        broadcast_name,
        ...(channel ? { channel } : {}),
        recipients: [{ target, ...(custom_params.length ? { custom_params } : {}) }],
      });
      const recipientErrors = (res.recipients ?? []).flatMap((r) => r.errors ?? []);
      if (res.success === false || recipientErrors.length) {
        return fail(
          `Template not sent. ${res.error ?? ""} ${recipientErrors.join("; ")}`.trim() +
            "\nDo not resend blindly; fix the problem first.",
        );
      }
      if (!res.recipients?.length) {
        return fail(
          "Wati accepted the request but returned no recipient result, so the recipient may have been rejected. " +
            `Check the conversation before resending. broadcast_id: ${res.broadcast_id ?? "?"}`,
        );
      }
      return ok(
        `Template "${a.template_name}" accepted for ${target}. broadcast_id: ${res.broadcast_id ?? "?"}\n` +
          "Accepted is not the same as delivered. Do not resend just because delivery is not yet shown.",
      );
    }),
  );

  server.registerTool(
    "support_assign",
    {
      title: "Assign conversation",
      description: "Assign a conversation to an operator by email, or hand it back to the bot (omit assignee_email).",
      inputSchema: {
        target: conversationTarget,
        assignee_email: z.email().optional().describe("Operator email. Omit to assign to the bot."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      const res = await client.assignOperator(a.target, a.assignee_email ?? null);
      if (res.result === false) return fail("Wati did not assign the conversation (result: false). Check the operator email.");
      return ok(`Conversation ${a.target} assigned to ${a.assignee_email ?? "the bot"}.`);
    }),
  );

  server.registerTool(
    "support_set_status",
    {
      title: "Set conversation status",
      description:
        "Change a conversation's status: open, pending (waiting on customer/internal), solved (resolved), or block " +
        "(blocks the contact — requires confirm: true).",
      inputSchema: {
        target: conversationTarget,
        status: z.enum(["open", "pending", "solved", "block"]),
        confirm: confirmField,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      if (a.status === "block" && needsConfirm(a.confirm)) {
        return preview("BLOCK this contact (they will no longer be able to reach you)", { target: a.target });
      }
      const res = await client.updateStatus(a.target, a.status);
      if (res.result === false) return fail(`Wati did not update the status (result: false).`);
      return ok(`Conversation ${a.target} status set to ${a.status}.`);
    }),
  );

  server.registerTool(
    "support_tag",
    {
      title: "Tag / untag conversation",
      description:
        "Add or remove tags on a conversation (e.g. 'refund', 'bug', 'vip'). Tags must already exist in Wati; " +
        "this does not create new tag definitions.",
      inputSchema: {
        target: conversationTarget,
        add: z.array(z.string().min(1)).optional(),
        remove: z.array(z.string().min(1)).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    safe(async (a) => {
      if (!a.add?.length && !a.remove?.length) return fail("Nothing to do: pass add and/or remove.");
      const lines: string[] = [];
      let failed = false;
      for (const tag of a.add ?? []) {
        try {
          const r = await client.addTag(a.target, tag);
          lines.push(`+ ${tag}: ${r.added === false ? "not added" : "added"}`);
        } catch (err) {
          failed = true;
          lines.push(`+ ${tag}: FAILED — ${errorText(err)}`);
        }
      }
      for (const tag of a.remove ?? []) {
        try {
          const r = await client.removeTag(a.target, tag);
          lines.push(`- ${tag}: ${r.removed === false ? "not removed (was it set?)" : "removed"}`);
        } catch (err) {
          failed = true;
          lines.push(`- ${tag}: FAILED — ${errorText(err)}`);
        }
      }
      return failed ? fail(lines.join("\n")) : ok(lines.join("\n"));
    }),
  );
}

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { agentMessage, connect, customerMessage, minutesAgo } from "./helpers.js";

const MESSAGES = "GET /api/ext/v3/conversations/*/messages";
const openWindow = () => ({
  body: { message_list: [agentMessage("Hello", minutesAgo(30)), customerMessage("Where is my order?", minutesAgo(60))] },
});
const closedWindow = () => ({ body: { message_list: [customerMessage("hi", minutesAgo(60 * 30))] } });

describe("tool registration", () => {
  it("exposes read and write tools, and prompts", async () => {
    const { client } = await connect({});
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(
      [
        "support_assign",
        "support_get_contact",
        "support_get_conversation",
        "support_inbox",
        "support_list_canned_replies",
        "support_list_conversations",
        "support_list_templates",
        "support_search_knowledge",
        "support_reply",
        "support_send_canned_reply",
        "support_send_file",
        "support_send_interactive",
        "support_send_template",
        "support_set_status",
        "support_tag",
      ].sort(),
    );
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name).sort();
    expect(prompts).toEqual(["handle_conversation", "triage_inbox"]);
  });

  it("hides all write tools in read-only mode", async () => {
    const { client } = await connect({}, { readOnly: true });
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).not.toContain("support_reply");
    expect(tools).not.toContain("support_set_status");
    expect(tools).toContain("support_inbox");
  });
});

describe("support_reply", () => {
  it("returns a preview and sends nothing without confirm", async () => {
    const { call, calls } = await connect({ [MESSAGES]: openWindow });
    const res = await call("support_reply", { target: "5511999999999", text: "Your order ships today." });
    expect(res.isError).toBe(false);
    expect(res.text).toContain("PREVIEW");
    expect(res.text).toContain("24h window: open");
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("sends with confirm, adding the signature and bearer token", async () => {
    const { call, calls } = await connect(
      {
        [MESSAGES]: openWindow,
        "POST /api/ext/v3/conversations/messages/text": () => ({
          body: { message: { id: "msg-1", status: "Sent", conversation_id: "conv1" } },
        }),
      },
      { replySignature: "\\n— Support team" },
    );
    const res = await call("support_reply", { target: "5511999999999", text: "Ships today.", confirm: true });
    expect(res.isError).toBe(false);
    expect(res.text).toContain("message_id: msg-1");
    const send = calls.find((c) => c.method === "POST")!;
    expect(send.body).toEqual({ target: "5511999999999", text: "Ships today.\n— Support team" });
    expect(send.headers.Authorization).toBe("Bearer secret-token");
  });

  it("refuses when the 24h window is closed", async () => {
    const { call, calls } = await connect({ [MESSAGES]: closedWindow });
    const res = await call("support_reply", { target: "conv1", text: "Hi", confirm: true });
    expect(res.isError).toBe(true);
    expect(res.text).toContain("window is closed");
    expect(res.text).toContain("support_send_template");
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("refuses when no customer message is found unless skip_window_check", async () => {
    const routes = {
      [MESSAGES]: () => ({ body: { message_list: [agentMessage("promo", minutesAgo(5))] } }),
      "POST /api/ext/v3/conversations/messages/text": () => ({ body: { message: { id: "x" } } }),
    };
    const blocked = await connect(routes);
    expect((await blocked.call("support_reply", { target: "conv1", text: "Hi", confirm: true })).isError).toBe(true);

    const allowed = await connect(routes);
    const res = await allowed.call("support_reply", { target: "conv1", text: "Hi", confirm: true, skip_window_check: true });
    expect(res.isError).toBe(false);
    expect(allowed.calls.filter((c) => c.method === "GET")).toHaveLength(0);
  });

  it("sends immediately when confirmation is disabled", async () => {
    const { call, calls } = await connect(
      {
        [MESSAGES]: openWindow,
        "POST /api/ext/v3/conversations/messages/text": () => ({ body: { message: { id: "m" } } }),
      },
      { requireConfirm: false },
    );
    await call("support_reply", { target: "conv1", text: "Hi" });
    expect(calls.some((c) => c.method === "POST")).toBe(true);
  });

  it("does not retry a failed send and warns it may have been accepted", async () => {
    let posts = 0;
    const { call } = await connect({
      [MESSAGES]: openWindow,
      "POST /api/ext/v3/conversations/messages/text": () => {
        posts++;
        return { status: 502, body: "bad gateway" };
      },
    });
    const res = await call("support_reply", { target: "conv1", text: "Hi", confirm: true });
    expect(res.isError).toBe(true);
    expect(posts).toBe(1);
    expect(res.text).toContain("may still have been accepted");
  });
});

describe("support_get_conversation", () => {
  it("renders an oldest-first transcript with window state and contact", async () => {
    const { call, calls } = await connect({
      [MESSAGES]: openWindow,
      "GET /api/ext/v3/contacts/*": () => ({
        body: { id: "c1", name: "Maria", phone: "5511999999999", opted_in: true, custom_params: [{ name: "plan", value: "pro" }] },
      }),
    });
    const res = await call("support_get_conversation", { target: "+55 11999999999" });
    expect(res.isError).toBe(false);
    expect(res.text).toContain("Contact: Maria");
    expect(res.text).toContain("Attributes: plan=pro");
    expect(res.text).toContain("conversation_id: conv1");
    expect(res.text).toContain("24h window: open");
    expect(res.text.indexOf("Customer: Where is my order?")).toBeLessThan(res.text.indexOf("Agent (Ana) (read): Hello"));
    expect(calls[0]!.query).toEqual({ page_number: "1", page_size: "30" });
    expect(calls[0]!.path).toBe("/api/ext/v3/conversations/+55 11999999999/messages");
  });
});

describe("support_inbox", () => {
  it("builds the query and sorts by waiting time", async () => {
    const { call, calls } = await connect({
      "POST /api/ext/v3/conversations/query": () => ({
        body: {
          items: [
            { conversation_id: "a", status: "open", waiting_seconds: 120, session_state: "open" },
            {
              conversation_id: "b",
              status: "open",
              waiting_seconds: 7200,
              session_state: "open",
              tags: [{ id: "t1", name: "refund" }],
              context: { messages: [{ direction: "inbound", text: "I want a refund", sent_at: minutesAgo(120) }] },
              matched_messages: [{ direction: "outbound", text: "Refunds take 5 days", sent_at: minutesAgo(500) }],
            },
          ],
          page: { has_more: true, next_cursor: "CUR" },
        },
      }),
    });
    const res = await call("support_inbox", { assignment: "unassigned", min_wait_minutes: 1, window: "open" });
    expect(res.isError).toBe(false);
    expect(res.text.indexOf("conversation_id=b")).toBeLessThan(res.text.indexOf("conversation_id=a"));
    expect(res.text).toContain("Customer: I want a refund");
    expect(res.text).toContain("matching messages:\n    Business: Refunds take 5 days");
    expect(res.text).toContain("tags=refund");
    expect(res.text).toContain('cursor="CUR"');
    const body = calls[0]!.body as Record<string, any>;
    expect(body.filters).toEqual({
      statuses: ["new", "open", "pending", "expired", "broadcast", "awaiting_response"],
      assignment: "unassigned",
      reply_state: "awaiting_business",
      min_wait_seconds: 60,
      session_state: "open",
    });
    expect(body.page).toEqual({ size: 20 });
    expect(body.context).toEqual({ messages_per_conversation: 3 });
  });

  it("includes solved only when asked, and respects explicit statuses", async () => {
    const { call, calls } = await connect({ "POST /api/ext/v3/conversations/query": () => ({ body: { items: [] } }) });
    await call("support_inbox", { include_solved: true });
    await call("support_inbox", { statuses: ["solved"] });
    expect((calls[0]!.body as any).filters.statuses).toBeUndefined();
    expect((calls[1]!.body as any).filters.statuses).toEqual(["solved"]);
  });

  it("retries the read-only query on 429", async () => {
    let n = 0;
    const { call } = await connect({
      "POST /api/ext/v3/conversations/query": () =>
        ++n === 1 ? { status: 429, headers: { "retry-after": "1" } } : { body: { items: [] } },
    });
    const res = await call("support_inbox", {});
    expect(res.isError).toBe(false);
    expect(n).toBe(2);
  });
});

describe("support_send_template", () => {
  const templates = () => ({
    body: {
      templates: [
        { name: "order_update", status: "APPROVED", category: "UTILITY", body: "Hi {{name}}, order {{order_id}} is on its way." },
        { name: "draft_one", status: "PENDING", body: "x" },
      ],
      total: 2,
    },
  });

  it("validates missing parameters", async () => {
    const { call } = await connect({ "GET /api/ext/v3/messageTemplates": templates });
    const res = await call("support_send_template", { target: "5511", template_name: "order_update", params: { name: "Ana" } });
    expect(res.isError).toBe(true);
    expect(res.text).toContain("order_id");
  });

  it("rejects unapproved and unknown templates", async () => {
    const { call } = await connect({ "GET /api/ext/v3/messageTemplates": templates });
    expect((await call("support_send_template", { target: "1", template_name: "draft_one" })).text).toContain("not approved");
    expect((await call("support_send_template", { target: "1", template_name: "order" })).text).toContain("Similar: order_update");
  });

  it("previews the rendered body, then sends", async () => {
    const { call, calls } = await connect({
      "GET /api/ext/v3/messageTemplates": templates,
      "POST /api/ext/v3/messageTemplates/send": () => ({
        body: { success: true, broadcast_id: "b1", recipients: [{ target: "5511999", errors: [] }] },
      }),
    });
    const args = { target: "+5511999", template_name: "order_update", params: { name: "Ana", order_id: "42" } };
    const pre = await call("support_send_template", args);
    expect(pre.text).toContain("Hi Ana, order 42 is on its way.");
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    const sent = await call("support_send_template", { ...args, confirm: true, broadcast_name: "bn" });
    expect(sent.isError).toBe(false);
    expect(sent.text).toContain("broadcast_id: b1");
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({
      template_name: "order_update",
      broadcast_name: "bn",
      recipients: [
        {
          target: "5511999",
          custom_params: [
            { name: "name", value: "Ana" },
            { name: "order_id", value: "42" },
          ],
        },
      ],
    });
  });

  it("surfaces business failures in a 200 response", async () => {
    const { call } = await connect({
      "GET /api/ext/v3/messageTemplates": templates,
      "POST /api/ext/v3/messageTemplates/send": () => ({
        body: { success: true, recipients: [{ target: "1", errors: ["Invalid WhatsApp number"] }] },
      }),
    });
    const res = await call("support_send_template", {
      target: "1",
      template_name: "order_update",
      params: { name: "a", order_id: "b" },
      confirm: true,
    });
    expect(res.isError).toBe(true);
    expect(res.text).toContain("Invalid WhatsApp number");
  });
});

describe("conversation management", () => {
  it("assigns to bot when no email is given", async () => {
    const { call, calls } = await connect({ "PUT /api/ext/v3/conversations/*/operator": () => ({ body: { result: true } }) });
    const res = await call("support_assign", { target: "conv1" });
    expect(res.text).toContain("the bot");
    expect(calls[0]!.body).toEqual({ assignee_email: null });
  });

  it("requires confirm to block but not to solve", async () => {
    const { call, calls } = await connect({ "PUT /api/ext/v3/conversations/*/status": () => ({ body: { result: true } }) });
    expect((await call("support_set_status", { target: "conv1", status: "block" })).text).toContain("PREVIEW");
    expect(calls).toHaveLength(0);
    await call("support_set_status", { target: "conv1", status: "solved" });
    expect(calls[0]!.body).toEqual({ new_status: "solved" });
  });

  it("adds and removes tags, reporting per-tag failures", async () => {
    const { call, calls } = await connect({
      "POST /api/ext/v3/conversations/*/tags": (c) =>
        (c.body as { tagName: string }).tagName === "nope" ? { status: 400, body: { message: "Tag not found" } } : { body: { added: true } },
      "DELETE /api/ext/v3/conversations/*/tags/*": () => ({ body: { removed: true } }),
    });
    const res = await call("support_tag", { target: "conv1", add: ["refund", "nope"], remove: ["new"] });
    expect(res.isError).toBe(true);
    expect(res.text).toContain("+ refund: added");
    expect(res.text).toContain("Tag not found");
    expect(res.text).toContain("- new: removed");
    expect(calls.map((c) => `${c.method} ${c.path}`)).toContain("DELETE /api/ext/v3/conversations/conv1/tags/new");
  });
});

describe("interactive and canned replies", () => {
  it("builds a buttons message", async () => {
    const { call, calls } = await connect({
      [MESSAGES]: openWindow,
      "POST /api/ext/v3/conversations/messages/interactive": () => ({ body: { message: { id: "i1" } } }),
    });
    const res = await call("support_send_interactive", {
      target: "conv1",
      body: "Did this solve your issue?",
      buttons: ["Yes", "No"],
      confirm: true,
    });
    expect(res.isError).toBe(false);
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({
      target: "conv1",
      type: "buttons",
      button_message: { body: "Did this solve your issue?", buttons: [{ text: "Yes" }, { text: "No" }] },
    });
  });

  it("groups list rows into sections", async () => {
    const { call, calls } = await connect({
      [MESSAGES]: openWindow,
      "POST /api/ext/v3/conversations/messages/interactive": () => ({ body: { message: { id: "i1" } } }),
    });
    await call("support_send_interactive", {
      target: "conv1",
      body: "Pick a topic",
      list_button_text: "Topics",
      list_rows: [
        { title: "Refund", section: "Billing" },
        { title: "Invoice", section: "Billing" },
        { title: "Bug" },
      ],
      confirm: true,
    });
    const body = calls.find((c) => c.method === "POST")!.body as any;
    expect(body.list_message.sections).toEqual([
      { title: "Billing", rows: [{ title: "Refund" }, { title: "Invoice" }] },
      { title: "Options", rows: [{ title: "Bug" }] },
    ]);
  });

  it("renders and sends a canned reply", async () => {
    const dir = await mkdtemp(join(tmpdir(), "canned-"));
    const file = join(dir, "canned.json");
    await writeFile(file, JSON.stringify({ greet: { title: "Greeting", text: "Hi {{name}}!" } }));
    const { call, calls } = await connect(
      {
        [MESSAGES]: openWindow,
        "POST /api/ext/v3/conversations/messages/text": () => ({ body: { message: { id: "c1" } } }),
      },
      { cannedRepliesFile: file },
    );
    expect((await call("support_list_canned_replies")).text).toContain("variables: name");
    expect((await call("support_send_canned_reply", { target: "conv1", reply_id: "greet" })).text).toContain("needs values for: name");
    const res = await call("support_send_canned_reply", { target: "conv1", reply_id: "greet", variables: { name: "Ana" }, confirm: true });
    expect(res.isError).toBe(false);
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({ target: "conv1", text: "Hi Ana!" });
  });
});

describe("errors", () => {
  it("explains auth failures without leaking the token", async () => {
    const { call } = await connect({ "GET /api/ext/v3/contacts/*": () => ({ status: 401, body: "" }) });
    const res = await call("support_get_contact", { target: "123" });
    expect(res.isError).toBe(true);
    expect(res.text).toContain("HTTP 401");
    expect(res.text).toContain("WATI_API_TOKEN");
    expect(res.text).not.toContain("secret-token");
  });
});

describe("support_search_knowledge", () => {
  it("finds the documented answer for duplicated drivers (accent-insensitive)", async () => {
    const { call } = await connect({});
    const res = await call("support_search_knowledge", { query: "motorista duplicado nomes diferentes uber bolt" });
    expect(res.isError).toBe(false);
    expect(res.text).toContain("loom.com/share/9f072c9f6b514d5f846a67abf782529c");
  });

  it("explains the password-change / SMS case", async () => {
    const { call } = await connect({});
    const res = await call("support_search_knowledge", { query: "alterei password uber nao recebo sms" });
    expect(res.text).toContain("password");
    expect(res.text.toLowerCase()).toContain("manual");
  });

  it("returns whole files and handles no matches", async () => {
    const { call } = await connect({});
    expect((await call("support_search_knowledge", { query: "x", file: "escalation" })).text).toContain("Always escalate");
    expect((await call("support_search_knowledge", { query: "zzzqqq" })).text).toContain("Do not guess");
    expect((await call("support_search_knowledge", { query: "x", file: "nope.md" })).isError).toBe(true);
  });
});

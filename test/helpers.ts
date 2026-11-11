import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Config } from "../src/config.js";
import { createServer } from "../src/server.js";
import { WatiClient } from "../src/wati-client.js";

export interface RecordedCall {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
}

type Handler = (call: RecordedCall) => { status?: number; body?: unknown; headers?: Record<string, string> };

/** A fake fetch that routes "METHOD /path" to handlers and records every call. */
export function fakeFetch(routes: Record<string, Handler>) {
  const calls: RecordedCall[] = [];
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const call: RecordedCall = {
      method: init?.method ?? "GET",
      path: decodeURIComponent(url.pathname),
      query: Object.fromEntries(url.searchParams),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    calls.push(call);
    const key = `${call.method} ${call.path}`;
    const handler =
      routes[key] ??
      Object.entries(routes).find(([pattern]) => new RegExp(`^${pattern.replace(/\*/g, "[^/]+")}$`).test(key))?.[1];
    if (!handler) return new Response(`no route for ${key}`, { status: 404 });
    const res = handler(call);
    const body = res.body === undefined ? "" : typeof res.body === "string" ? res.body : JSON.stringify(res.body);
    return new Response(body, { status: res.status ?? 200, headers: res.headers });
  }) as typeof fetch;
  return { impl, calls };
}

export const baseConfig: Config = {
  apiHost: "https://wati.test",
  apiToken: "secret-token",
  readOnly: false,
  requireConfirm: true,
  replySignature: "",
  cannedRepliesFile: undefined,
  defaultChannel: undefined,
  timeoutMs: 5000,
};

export async function connect(routes: Record<string, Handler>, overrides: Partial<Config> = {}) {
  const config = { ...baseConfig, ...overrides };
  const fetcher = fakeFetch(routes);
  const wati = new WatiClient(config, fetcher.impl, async () => {});
  const server = createServer(config, wati);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  async function call(name: string, args: Record<string, unknown> = {}) {
    const res = (await client.callTool({ name, arguments: args })) as {
      content: { type: string; text: string }[];
      isError?: boolean;
    };
    return { text: res.content.map((c) => c.text).join("\n"), isError: res.isError === true };
  }

  return { client, call, calls: fetcher.calls };
}

export function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

export function customerMessage(text: string, created: string, conversation_id = "conv1") {
  return { id: `m-${text}`, event_type: "message", owner: false, type: "text", text, created, conversation_id };
}

export function agentMessage(text: string, created: string, operator_name = "Ana") {
  return { id: `a-${text}`, event_type: "message", owner: true, type: "text", text, created, operator_name, status: "Read", conversation_id: "conv1" };
}

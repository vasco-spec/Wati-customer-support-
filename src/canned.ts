/**
 * Canned replies: a small JSON library of approved support answers with
 * {{variable}} placeholders. The file is re-read on each call so edits apply
 * without restarting the server.
 *
 * File format:
 * {
 *   "greeting": { "title": "Greeting", "text": "Hi {{name}}, thanks for reaching out!" },
 *   "refund_policy": { "title": "Refund policy", "text": "...", "tags": ["billing"] }
 * }
 */
import { readFile } from "node:fs/promises";

export interface CannedReply {
  id: string;
  title: string;
  text: string;
  tags: string[];
  variables: string[];
}

export function extractVariables(text: string): string[] {
  const vars = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g)) vars.add(m[1]!);
  return [...vars];
}

export function parseCannedReplies(json: string): CannedReply[] {
  const data = JSON.parse(json) as unknown;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error('Canned replies file must be a JSON object: { "id": { "title": "...", "text": "..." } }');
  }
  return Object.entries(data as Record<string, unknown>).map(([id, raw]) => {
    const entry = (typeof raw === "string" ? { text: raw } : raw) as { title?: string; text?: string; tags?: string[] };
    if (!entry || typeof entry.text !== "string" || !entry.text.trim()) {
      throw new Error(`Canned reply "${id}" is missing a "text" field.`);
    }
    return {
      id,
      title: entry.title ?? id,
      text: entry.text,
      tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
      variables: extractVariables(entry.text),
    };
  });
}

export async function loadCannedReplies(file: string | undefined): Promise<CannedReply[]> {
  if (!file) return [];
  const raw = await readFile(file, "utf8");
  return parseCannedReplies(raw);
}

export function renderCannedReply(reply: CannedReply, variables: Record<string, string> = {}): string {
  const missing = reply.variables.filter((v) => variables[v] === undefined || variables[v] === "");
  if (missing.length) {
    throw new Error(`Canned reply "${reply.id}" needs values for: ${missing.join(", ")}`);
  }
  return reply.text.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, name: string) => variables[name] ?? "");
}

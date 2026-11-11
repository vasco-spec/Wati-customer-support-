import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const GROUND_RULES = `Ground rules:
- Read the conversation (support_get_conversation) before replying. Never invent order numbers, prices, policies or promises.
- Prefer canned replies (support_list_canned_replies) when one fits; adapt tone to the customer's language.
- Every customer-facing send returns a PREVIEW first. Show it to me and wait for my approval before calling again with confirm: true.
- If the 24-hour window is closed, propose an approved template (support_list_templates) instead of a free-form reply.
- Never resend a message just because delivery is not confirmed yet.
- After resolving, suggest a status (solved/pending) and relevant tags, but ask before changing them.`;

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "triage_inbox",
    {
      title: "Triage the support inbox",
      description: "Review conversations waiting for a reply and propose next actions, most urgent first.",
      argsSchema: {
        focus: z.string().optional().describe("Optional focus, e.g. 'unassigned only' or 'refund requests'."),
      },
    },
    ({ focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Triage my Wati support inbox${focus ? ` (focus: ${focus})` : ""}.

1. Call support_inbox (waiting_on="us") to get conversations awaiting our reply, longest waiting first.
2. For each, summarise in one line: who, what they need, how long they've waited, whether the 24h window is open.
3. Group them: urgent (window closing soon / long wait / angry), quick wins (a canned reply fits), needs a human/specialist.
4. For the top items, propose a draft reply (or template if the window is closed), an assignee and tags.
Do not send anything until I approve each item.

${GROUND_RULES}`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "handle_conversation",
    {
      title: "Handle one conversation",
      description: "Read one conversation, draft a reply and propose follow-up actions.",
      argsSchema: {
        target: z.string().describe("Conversation ID or customer phone number."),
        instructions: z.string().optional().describe("Anything specific to tell the customer or to keep in mind."),
      },
    },
    ({ target, instructions }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me handle the Wati conversation ${target}.
${instructions ? `\nMy instructions: ${instructions}\n` : ""}
1. Read it with support_get_conversation and summarise the customer's issue and what has been said so far.
2. Draft the best reply in the customer's language (use a canned reply if one fits).
3. Call the send tool without confirm to get the preview, show it to me, and wait for my OK.
4. Then suggest status/tags/assignment changes.

${GROUND_RULES}`,
          },
        },
      ],
    }),
  );
}

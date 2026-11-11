# Wati customer support MCP

`wati-support` is an MCP server that lets Claude (or any MCP client) handle customer conversations in your **Wati** WhatsApp inbox. It can triage the queue, read threads, draft and send replies, use templates when the 24-hour window has closed, and assign, tag and solve conversations. Guardrails are built in so nothing goes to a customer without your approval.

It runs on the Wati REST API (V3) and is meant to be used **together with Wati's official hosted MCP server**. See [docs/official-wati-mcp.md](docs/official-wati-mcp.md) for how to connect that one and when to use each.

## What it can do

| Tool | What it does | Changes data? |
|---|---|---|
| `support_inbox` | Triage queue: conversations waiting on **our** reply, longest wait first, with latest messages, 24h-window state, assignment and tags. Filters: unassigned/assigned, status, unread, window open/expired, text search, tags, minimum wait. | No |
| `support_list_conversations` | Simple paged list of recent conversations (works on every plan). | No |
| `support_get_conversation` | Transcript (oldest → newest), conversation ID, estimated 24h window, and the contact profile when you pass a phone number. | No |
| `support_get_contact` | Full contact record (attributes, teams, opt-in). | No |
| `support_list_templates` | Approved templates with their body and parameters. | No |
| `support_list_canned_replies` | Your team's canned replies and the variables each one needs. | No |
| `support_reply` | Sends a free-form text reply. Checks the 24h window first. | Sends ✉️ |
| `support_send_canned_reply` | Fills in a canned reply and sends it. | Sends ✉️ |
| `support_send_file` | Sends an image, PDF or video from a URL, with a caption. | Sends ✉️ |
| `support_send_interactive` | Quick-reply buttons (up to 3) or a list menu (up to 10 rows). | Sends ✉️ |
| `support_send_template` | Sends an approved template, including when the window is closed. Checks the name, that it's approved, and its parameters. | Sends ✉️ |
| `support_assign` | Assigns the conversation to an operator by email, or back to the bot. | Yes |
| `support_set_status` | Sets status to `open`, `pending`, `solved` or `block`. | Yes |
| `support_tag` | Adds or removes existing tags. | Yes |

There are also two **prompts**: `triage_inbox` (review the queue and propose actions) and `handle_conversation` (read one thread and draft a reply).

### Guardrails

- **Preview before sending:** every customer-facing send, and `block`, first returns a preview of exactly what would be sent. It only goes out when the tool is called again with `confirm: true`, after you approve. You can turn this off with `WATI_REQUIRE_CONFIRM=false`.
- **24-hour window check:** before any free-form, media or interactive message, the server reads the conversation history. It refuses to send if the customer's last message was more than 24 hours ago, and points to templates instead.
- **Template validation:** it checks the template exists, is `APPROVED`, and that every `{{placeholder}}` has a value. The preview shows the fully rendered message.
- **No automatic resend:** reads are retried on 429/5xx, writes never are, because a failed write may still have been accepted. Business errors that come back inside an HTTP 200 (e.g. "invalid WhatsApp number" for one recipient) are reported as errors.
- **Read-only mode:** with `WATI_READ_ONLY=true`, write tools aren't exposed at all. Useful for analysis or for training new agents.
- The API token is only read from the environment and is never included in tool output.

## Setup

1. **Get API credentials in Wati.** Go to **API → API Tokens** and create a token. Scopes needed: `conversationsv3:read`, `conversationsv3:write`, `contactsv3:read`, `messagetemplatev3:read` and `messagetemplatev3:write`, or the broad `api` scope. Note your **API endpoint host**, e.g. `https://live-mt-server.wati.io`, `https://eu-api.wati.io` or `https://ksa-api.wati.io`.
   > `support_inbox` uses Wati's conversation query API, which is available on the Growth, Pro and Business plans.
2. **Build:**
   ```bash
   npm install
   npm run build
   ```
3. **Optional: canned replies.** Copy `examples/canned-replies.json`, edit it, and point `WATI_CANNED_REPLIES_FILE` at it. Edits apply right away, with no restart.

### Connect to Claude Code

```bash
claude mcp add wati-support \
  -e WATI_API_HOST=https://live-mt-server.wati.io \
  -e WATI_API_TOKEN=your-token \
  -e WATI_CANNED_REPLIES_FILE=/absolute/path/canned-replies.json \
  -- node /absolute/path/to/Wati-customer-support-/dist/index.js
```

### Connect to Claude Desktop

Add this to `claude_desktop_config.json` (**Settings → Developer → Edit Config**):

```json
{
  "mcpServers": {
    "wati-support": {
      "command": "node",
      "args": ["/absolute/path/to/Wati-customer-support-/dist/index.js"],
      "env": {
        "WATI_API_HOST": "https://live-mt-server.wati.io",
        "WATI_API_TOKEN": "your-token",
        "WATI_CANNED_REPLIES_FILE": "/absolute/path/canned-replies.json",
        "WATI_REPLY_SIGNATURE": "\\n— Support team"
      }
    }
  }
}
```

To add Wati's official MCP as well, see [docs/official-wati-mcp.md](docs/official-wati-mcp.md).

### Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `WATI_API_HOST` | yes* | — | API host from Wati (host only; anything pasted after it, like a tenant ID or `/api`, is stripped). |
| `WATI_REGION` | * | — | `global`, `eu` or `ksa`. Use instead of `WATI_API_HOST` for the standard regional hosts. |
| `WATI_API_TOKEN` | yes | — | Wati API token. A leading `Bearer ` is accepted. |
| `WATI_READ_ONLY` | no | `false` | Only expose read tools. |
| `WATI_REQUIRE_CONFIRM` | no | `true` | Sends and `block` need `confirm: true`. |
| `WATI_REPLY_SIGNATURE` | no | — | Appended to free-form and canned replies. `\n` becomes a new line. |
| `WATI_CANNED_REPLIES_FILE` | no | — | Path to your canned-replies JSON file. |
| `WATI_DEFAULT_CHANNEL` | no | — | Channel name or number used for templates. |
| `WATI_TIMEOUT_MS` | no | `30000` | Per-request timeout. |

See `.env.example`.

### Troubleshooting

- **`fetch failed` behind a corporate/HTTP proxy:** Node's built-in `fetch` ignores `HTTPS_PROXY` by default. On Node ≥ 22.21, add `"NODE_USE_ENV_PROXY": "1"` to the server's `env` (and `NODE_EXTRA_CA_CERTS` if the proxy uses its own CA).
- **HTTP 401:** the token is expired or revoked, or it belongs to another region. EU tokens only work with `https://eu-api.wati.io`.
- **HTTP 403 on `support_inbox`:** the conversation query API needs a Growth, Pro or Business plan and the `conversationsv3:read` scope. `support_list_conversations` still works.

## Example requests to Claude

- *"Triage my inbox. Who's been waiting the longest without an answer?"*
- *"Show me unassigned conversations where the window closes soon."*
- *"Read the conversation with 5511999999999 and draft a reply in Portuguese."*
- *"Send the refund_policy canned reply to that customer."* (Claude shows the preview, you approve)
- *"The window is closed. Send the order_update template with order 1234."*
- *"Tag it as refund, assign it to ana@company.com and mark it pending."*

## Development

```bash
npm test          # vitest: unit tests + end-to-end MCP tests against a mocked Wati API
npm run typecheck
npm run dev       # run from source with tsx
```

Code layout:

- `src/wati-client.ts`: REST client (V3 routes, retries, error hints)
- `src/tools.ts`: MCP tools and guardrails
- `src/format.ts`: transcripts, queue rendering, 24h-window estimate
- `src/canned.ts`: canned replies
- `src/prompts.ts`: MCP prompts
- `src/index.ts`: stdio entry point

API reference: https://docs.wati.io/reference/introduction

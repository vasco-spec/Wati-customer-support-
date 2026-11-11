# Wati's official MCP server

Wati hosts its own MCP server. You sign in with OAuth, so you don't need an API key. Use it alongside this repo's `wati-support` server:

| | Official Wati MCP | `wati-support` (this repo) |
|---|---|---|
| Hosting | Wati runs it (remote, Streamable HTTP) | Runs on your machine (stdio) |
| Auth | OAuth sign-in in the browser | Wati API token (`WATI_API_TOKEN`) |
| Tool prefix | `wati_…` | `support_…` |
| Scope | Everything: contacts, conversations, templates, campaigns, segments, webhooks, chatbots, analytics, Astra | Day-to-day support work only |
| Guardrails | Generic | 24h-window pre-check, preview before every customer-facing send, template validation, canned replies, read-only mode |

Use the official server for broad, occasional tasks, such as bulk contact edits, campaign reports, webhook setup and conversation analysis. Use `wati-support` for handling the inbox every day.

## Endpoints

| Workspace region | MCP server URL |
|---|---|
| Global | `https://mcp.wati.io/mcp` |
| EU | `https://eu-mcp.wati.io/mcp` |
| KSA | `https://ksa-mcp.wati.io/mcp` |

Use the URL for your workspace's region. Don't mix regions.

## Connect it

### Claude Code

```bash
claude mcp add --transport http wati https://mcp.wati.io/mcp
```

Then run `/mcp` inside Claude Code and complete the browser sign-in.

### Claude Desktop / claude.ai

Go to **Settings → Connectors → Add custom connector**, use the URL above, then click **Connect** and sign in to Wati.

### Clients that use an `mcpServers` JSON config

```json
{
  "mcpServers": {
    "wati": { "url": "https://mcp.wati.io/mcp" }
  }
}
```

## Running both servers together

Claude Code example (`.mcp.json` in your project, or via `claude mcp add`):

```json
{
  "mcpServers": {
    "wati": {
      "type": "http",
      "url": "https://mcp.wati.io/mcp"
    },
    "wati-support": {
      "command": "node",
      "args": ["/absolute/path/to/Wati-customer-support-/dist/index.js"],
      "env": {
        "WATI_API_HOST": "https://live-mt-server.wati.io",
        "WATI_API_TOKEN": "${WATI_API_TOKEN}",
        "WATI_CANNED_REPLIES_FILE": "/absolute/path/to/canned-replies.json"
      }
    }
  }
}
```

The tool prefixes are different (`wati_` and `support_`), so the two servers don't collide. When both are connected, ask Claude to use the `support_` tools for replying to customers. That way the previews and window checks apply.

## Useful official tools

These come from Wati's MCP docs. Run `tools/list` to see what your account actually exposes.

- **Workspace:** `wati_get_active_tenant`, `wati_list_tenants`, `wati_switch_tenant`. Check the active workspace before any write.
- **Contacts:** `wati_get_contacts`, `wati_get_contact`, `wati_search`, `wati_upload_contact`, `wati_update_contact_attributes`, `wati_assign_contact_teams`
- **Conversations:** `wati_get_conversations`, `wati_get_messages`, `wati_send_message`, `wati_send_file_via_url`, `wati_send_interactive`, `wati_get_message_status`, `wati_assign_operator`, `wati_update_conversation_status`, `wati_add_conversation_tag`, `wati_list_conversation_tags`
- **Analysis:** `wati_analyze_conversations`. This runs an asynchronous, read-only analysis across conversations, such as recurring complaints or sentiment. It can draft replies but never sends them.
- **Templates:** `wati_send_template` and `wati_send_templates`

Rules from Wati that apply to both servers:

- Free-form, media and interactive messages are only allowed within 24 hours of the customer's last message. After that, use an approved template.
- If Wati accepts a send, that doesn't mean it was delivered. Don't resend just because a message isn't shown as delivered yet.
- Assignment, status, tag and contact changes affect live customers. Review them before you run them.

Source: https://docs.wati.io/reference/mcp

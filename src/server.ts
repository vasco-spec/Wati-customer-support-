import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { registerPrompts } from "./prompts.js";
import { registerTools } from "./tools.js";
import { WatiClient } from "./wati-client.js";

export const SERVER_NAME = "wati-support";
export const SERVER_VERSION = "0.1.0";

export function createServer(config: Config, client: WatiClient = new WatiClient(config)): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Customer-support tools for a Wati (WhatsApp) inbox. Typical flow: support_inbox → support_get_conversation → " +
        "support_reply / support_send_canned_reply (or support_send_template when the 24h window is closed) → " +
        "support_set_status / support_tag / support_assign. Customer-facing sends return a preview unless confirm: true; " +
        "always show the preview to the user and get approval first." +
        (config.readOnly ? " This server is in READ-ONLY mode: no sending or changes are possible." : ""),
    },
  );
  registerTools(server, client, config);
  registerPrompts(server);
  return server;
}

#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const server = createServer(config);
  await server.connect(new StdioServerTransport());
  // stdout is the MCP channel; log to stderr only.
  console.error(
    `wati-support MCP server running (host: ${config.apiHost}, read-only: ${config.readOnly}, confirm required: ${config.requireConfirm})`,
  );
}

main().catch((err) => {
  console.error(`wati-support MCP server failed to start: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

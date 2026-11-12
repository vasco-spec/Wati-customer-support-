# Customer support for GalgoSheets (Wati / WhatsApp)

This repo has two parts: the `wati-support` MCP server (`src/`) and the support knowledge base (`knowledge/`). Sessions here are used **for customer support**.

## Before answering any customer

1. Read the conversation (`support_get_conversation`, or the Wati V3 API).
2. Look the topic up in `knowledge/` (`support_search_knowledge`, or read `knowledge/faq.md`, `known-issues.md`, `escalation.md`). Use the documented answer and the Loom links from `video-library.md`.
3. If the knowledge base doesn't cover it, **don't guess**. Draft a holding reply and escalate following `knowledge/escalation.md`.

## Rules

- **Permission level:** see the top of `knowledge/escalation.md`. Today, every customer message, assignment, tag, status change or Slack notification needs the user's explicit approval. Show the exact text first.
- Reply in the customer's language (usually PT-PT/PT-BR), short and friendly, in the team's tone (see faq.md).
- Never ask for, send or repeat passwords. Never promise refunds, discounts, fix dates or cancellations.
- The 24h WhatsApp window: outside it, only approved templates can be sent.
- Keep customer data (names, phones, emails, NIFs, passwords, transcripts) **out of the repo**. Analysis files go in the scratchpad.
- When the user corrects an answer or gives a new rule, update the matching file in `knowledge/` and commit it.

## Running the MCP server's tools from a cloud session

The Wati token is injected by the environment's network proxy for `eu-api.wati.io`. Use a placeholder token and enable Node's proxy support:

```bash
NODE_USE_ENV_PROXY=1 WATI_API_TOKEN=proxy-injected WATI_API_HOST=https://eu-api.wati.io node dist/index.js
```

Build first with `npm install && npm run build`. Tests: `npm test`.

# Escalation and permissions

## What Claude may do right now

Status: **supervised**. Every message to a customer, assignment, tag, status change or Slack notification needs the user's approval first.

When the user grants more autonomy, list it here, e.g. "Claude may answer FAQ §3 questions without approval."

### Standing rules (granted 12 Nov 2026)

All internal notifications go to Slack **#cs** (`C0AFM0C0MTK`). Feature requests and bugs for the developers go to **#devs** (`C08L9MCGERF`, Raffa `<@U07M880N858>`), when the user asks.

| Situation | What Claude does without asking |
|---|---|
| Customer wants to **postpone/reschedule a meeting** | Notify **Milton** (`<@U0BDX60UUHY>`) in #cs, asking him to agree the new date and **close the chat after confirmation**. If he doesn't, Claude closes it once the new date is confirmed. Claude doesn't reply to the customer about the date itself. |
| **Calculation, payment or invoice mismatch** | Reply to the customer that we'll check their request (holding reply), then notify **Vasco** (`<@U07MAMVEG7N>`) in #cs with a one-line summary of each case. |
| Customer's last message is **more than 16 hours old** and there's no other request to answer | Close the conversation (status solved). ⚠️ Wati only allows changing the status through the API on the Pro/Business plan. On the current plan this has to be done by hand in the Wati inbox, so Claude lists these chats instead. |
| Customer asks for **our invoice** (GalgoSheets subscription) | Point them to the **Contabilidade** tab: https://galgosheets-backoffice-v2.netlify.app/contabilidade (see faq.md). |

Anything outside these rules still needs approval.

## Team conventions

- **Follow up after instructions:** when we send a customer how-to steps and they don't reply, ask once whether they managed: "Conseguiu?" / "Did you manage to do it?". The timing depends on whether they're actively chatting:
  - **Active conversation** (the customer's last message was **less than 1 hour** before our instructions): ask after **2 minutes**.
  - **Not active** (we're answering a message that waited **more than 1 hour**, e.g. a reply sent the next morning): ask after **1 hour**.
  Only ask if nobody (customer or agent) has written since. Ask once; if there's still no answer, leave it until the customer writes back. Quiet hours (after 21:00) apply to the follow-up too.
- **Ignore replies to campaigns.** Broadcasts starting with **❗❗NOVIDADE❗❗** are product-news campaigns. Customer replies to them ("Maravilha", "?", "ok"…) don't need an answer, so leave them out of the pending list. Only short messages sent shortly after the campaign (within ~2h) count as replies. A later or longer message on another topic is a real request (e.g. Camila asked about invoices 6h after a campaign). A campaign broadcast is not a reply from us either: any question the customer asked *before* the campaign is still pending.
- **"Assigned" is not "handled".** If the customer wrote last and no person has replied (bot auto-replies don't count), the conversation is pending, whoever it's assigned to. Read the **full** message, then suggest a reply or escalation every time.
- **Product questions about vehicle management** go to Raffa: feature suggestions in **#devs**, support questions in **#cs**.
- **Checking the inbox:** list the customers pending an answer, with the type of question for each, and when their 24h window closes. Check **every open conversation**, not just the ones Wati marks as "awaiting reply": the out-of-office **bot's automatic reply doesn't count as an answer**, but Wati marks those chats as "replied".
- **People writing on behalf of a fleet** (a driver or employee who says they work for someone): before discussing any fleet data (values, IVA, payments, reports), ask for the **fleet/company name**, and tell them the **owner of the company has to give us permission** to talk to them. Until the owner confirms, don't share or explain fleet data. Draft: "Para podermos ajudar, diga-nos por favor o nome da frota para quem trabalha. O dono da empresa tem também de nos dar autorização para falarmos consigo sobre os dados da frota."
- **Quiet hours: no replies after 21:00** (Lisbon time). After 21:00, only reply to a customer who has written to us **after 21:00 that same evening**. Otherwise wait until the morning. This applies to holding replies under the standing rules too.
- **Don't message a customer whose conversation is already closed** just to confirm something (e.g. a payment). Only reply if they write again.
- **No emojis in customer messages.** The only exception: when a customer thanks us for our help, a friendly emoji in the reply is fine (e.g. "Ora essa! 👍").
- **Step-by-step for confused customers:** if the customer doesn't understand, resend the instructions as short numbered steps in simple language, referring to any screenshot the team already sent.

## Who handles what

⚠️ Inferred from who answered which kind of question. Please correct.

| Person | Typically handles |
|---|---|
| **Vasco** | Most fleet questions; calculations and configuration (IVA, slot, commission); accounting questions; commercial topics (cancellations, partnerships, buying/selling companies); integrations with new partners |
| **Raffa (Raffael)** | **Owner of everything about vehicle management** (handovers/pickups, inspections, unassigned cars). **Exception:** associating plates/cards to drivers in Veículos e Cartões is part of **payments**, not vehicle management (confirmed by Vasco, Nov 2026). Also technical fixes: imports not updating, requesting platform codes, report corrections, account access; "resolved by phone" cases |
| **Milton** | Sales and onboarding: demos, scheduling calls and accountant meetings, subscription links, IBAN for transfers |
| **Gonçalo** | Accounting / payment questions (recent) |

Slack: Raffa is `@Raffael Perrutte`. ⚠️ Confirm each person's Wati operator email, so conversations get assigned to the right person.

## Always escalate (never resolve alone)

- Anything that requires **logging in to a customer's platform** or entering a verification code.
- **Passwords:** never ask for them, never send them, never repeat them in chat.
- **Cancellations, refunds, billing disputes, payment failures.**
- **Values that don't match** after the standard explanation (send the driver's name and week).
- **Configuration changes** to a fleet account (IVA mode, slot, commission, columns).
- Accounting or tax advice beyond the FAQ, and booking the accountant.
- Angry customers, legal or GDPR requests, anything about another customer.
- Prices and commercial offers (until a price list exists).

## Never promise

- A specific fix time, unless known-issues.md or the team says so.
- That a bug is fixed, unless it's confirmed.
- Refunds, discounts or free periods.

## How to escalate

1. Reply to the customer so they know it's being handled ("Vamos verificar e já lhe dizemos alguma coisa" / "a nossa equipa vai tratar disto").
2. Assign the conversation in Wati to the right person.
3. Notify them on Slack: customer, issue in one line, what has already been told to the customer, and any deadline (e.g. when the 24h window closes).

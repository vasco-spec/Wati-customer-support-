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

- **Follow up after instructions:** when we send a customer how-to steps and they don't reply, ask after **2 minutes** whether they managed: "Conseguiu?" / "Did you manage to do it?". Only if nobody (customer or agent) has written since. Ask once; if there's still no answer, leave it until the customer writes back.
- **Ignore replies to campaigns.** Broadcasts starting with **❗❗NOVIDADE❗❗** are product-news campaigns. Customer replies to them ("Maravilha", "?", "ok"…) don't need an answer, so leave them out of the pending list. A campaign broadcast is not a reply from us either: any question the customer asked *before* the campaign is still pending.
- **Checking the inbox:** list the customers pending an answer, with the type of question for each, and when their 24h window closes.
- **No emojis in customer messages.** The only exception: when a customer thanks us for our help, a friendly emoji in the reply is fine (e.g. "Ora essa! 👍").
- **Step-by-step for confused customers:** if the customer doesn't understand, resend the instructions as short numbered steps in simple language, referring to any screenshot the team already sent.

## Who handles what

⚠️ Inferred from who answered which kind of question. Please correct.

| Person | Typically handles |
|---|---|
| **Vasco** | Most fleet questions; calculations and configuration (IVA, slot, commission); accounting questions; commercial topics (cancellations, partnerships, buying/selling companies); integrations with new partners |
| **Raffa (Raffael)** | Technical fixes: imports not updating, requesting platform codes, report corrections, account access; "resolved by phone" cases |
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

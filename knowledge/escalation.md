# Escalation and permissions

## What Claude may do right now

Status: **supervised**. Every message to a customer, assignment, tag, status change or Slack notification needs the user's approval first.

When the user grants more autonomy, list it here, e.g. "Claude may answer FAQ §3 questions without approval."

## Team conventions

- **Follow up after instructions:** when we send a customer how-to steps and they don't reply, ask after **2 minutes** whether they managed: "Conseguiu? 🙂" / "Did you manage to do it? 🙂". Only if nobody (customer or agent) has written since.
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

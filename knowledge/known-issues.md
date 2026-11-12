# Known issues and expected behaviour

**Update the "Current incidents" section whenever something breaks or gets fixed.** Claude checks it before telling a customer whether something is a bug.

## Current incidents

| Since | Affects | Status / what to tell customers |
|---|---|---|
| — | — | Nothing recorded yet. Add incidents here, e.g. "Uber sync delayed for all fleets since Monday. Being fixed, ETA Wednesday." |

## Recurring situations (not bugs)

| Situation | Why it happens | What to do |
|---|---|---|
| Uber/Bolt/Prio data not imported on Monday | Platform login expired, or needs a verification code | Escalate. The team requests the code and the customer forwards it |
| Sync stops after the customer **changes a password** | We log in with the old credentials | Escalate. Manual re-connection with the new password and an SMS code |
| Uber SMS code doesn't arrive | Uber SMS can be very slow | Reassure them: it usually arrives. If it expires, the team requests another |
| Via Verde differs from the week | Via Verde billing lags; some amounts were already charged | Explain (see FAQ). Not a loss for the fleet |
| Uber amount ≠ Uber Earnings page | Adjustments from previous weeks, refunds, or a different date range | Ask them to compare the exact same dates. Escalate if it still differs |
| Same driver on two lines | Different names on Uber and Bolt | Merge video (FAQ §3) |
| Report doesn't reflect a change | Reports have to be regenerated | Refresh, then generate again |
| Driver doesn't receive the report on WhatsApp | The driver must message our number first; sometimes WhatsApp needs reinstalling | FAQ §3, escalate if it persists |
| Can't make payments | Revolut/bank authorisation expired | Escalate |
| Prio diesel date is old | It shows the last refuel date | Expected |
| "Dados não disponíveis" warning | No charges that week on that source | Check before escalating |
| Several people editing the same fleet at once | Can cause odd values ⚠️ | Escalate with the driver's name and week |

## Bugs fixed recently (for context)

- Sep 2026: weekly charges in months with 5 weeks only billed 4 weeks for some drivers. Corrected manually that week. ⚠️ Confirm it's fully fixed.
- Sep 2026: "Slot/Aluguer" shown twice in the "Outros" box of the driver report. Fixed.

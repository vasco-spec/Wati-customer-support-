# Known issues and expected behaviour

**Update the "Current incidents" section whenever something breaks or gets fixed.** Claude checks it before telling a customer whether something is a bug.

## Current incidents

| Since | Affects | Status / what to tell customers |
|---|---|---|
| 16 Nov 2026 (Mon morning) | **Prio** (all fleets) | The Prio portal is down/very slow, so we can't sync Prio data. Tell customers: "O portal da Prio está em baixo de momento, por isso ainda não conseguimos sincronizar os dados da Prio. Importamos assim que voltar." Remove this row once Prio is back. |

## Weekly rhythm

- **Monday is payment day.** Fleets pay their drivers on Mondays, so the inbox is busiest on **Monday morning**: data not imported yet, values that don't match, reports, payment files. Check the inbox often (every 5 minutes) and don't leave any conversation unattended.

## Recurring situations (not bugs)

| Situation | Why it happens | What to do |
|---|---|---|
| **Uber data not available yet on Monday morning** (e.g. "a leitura da Uber está com erro") | The weekly Uber import is still running | Tell them to wait and keep refreshing the page; it should be ready **before 10:00**. Draft: "Quando os dados da Uber ainda não estão disponíveis, basta aguardar e ir atualizando a página. Deverão ficar disponíveis antes das 10h." Escalate only if it's still missing after 10:00 (confirmed by Vasco, 16 Nov 2026) |
| Uber/Bolt/Prio data still not imported after 10:00 on Monday | Platform login expired, or needs a verification code | Escalate. The team requests the code and the customer forwards it |
| Sync stops after the customer **changes a password** | We log in with the old credentials | Escalate. Manual re-connection with the new password and an SMS code |
| Uber SMS code doesn't arrive | Uber SMS can be very slow | Reassure them: it usually arrives. If it expires, the team requests another |
| Via Verde differs from the week | Via Verde billing lags; some amounts were already charged | Explain (see FAQ). Not a loss for the fleet |
| Uber payout to the bank ≠ total "Uber Líquido" in the calculation (small difference) | Compare each driver's Net earnings on the Uber page with Uber Líquido; usually one driver has a payment adjustment, e.g. a trip done at the weekly cut-off | Tell the customer which driver and the difference, and that Uber manages these adjustments itself: if it paid more this week, it pays less in another. If they ask whether to adjust the driver's payment: "pela nossa experiência não é necessário" (always "from our experience", so it isn't binding). Balance Uber keeps in the Uber Fleet account: beyond our knowledge, they should contact Uber (confirmed by Vasco, 16 Nov 2026) |
| Uber amount ≠ Uber Earnings page | Adjustments from previous weeks, refunds, or a different date range | Ask them to compare the exact same dates. Escalate if it still differs |
| Same driver on two lines | Different names on Uber and Bolt | Merge video (FAQ §3) |
| Report doesn't reflect a change | Reports have to be regenerated | Refresh, then generate again |
| Driver doesn't receive the report on WhatsApp | The driver must message our number first; sometimes WhatsApp needs reinstalling | FAQ §3, escalate if it persists |
| Can't make payments | Revolut/bank authorisation expired | Escalate |
| Prio diesel date is old | It shows the last refuel date | Expected |
| "Dados não disponíveis" warning | No charges that week on that source | Check before escalating |
| Warning in Calcular Pagamentos: "Detetámos colunas no cálculo que podem não estar a ser consideradas no pagamento final" (e.g. **Dívida**) | A column (like Dívida) isn't included in the total formula, so the report shows it but doesn't deduct it | The team fixes the formula and generates the report again. Tell the customer it's fixed and the new report is ready. If the warning was there in an earlier week with nothing in that column, there was no impact (confirmed by Vasco, 16 Nov 2026) |
| Rent (aluguer) looks wrong, e.g. much lower than usual | Last week the rent was **prorated** because the driver only worked part of the week (e.g. 2 of 7 days of 350€ = 100€), and that value stayed | Before escalating, look at past conversations/weeks for a prorated or manual value. The normal weekly value applies again (confirmed by Vasco, 16 Nov 2026) |
| "Should have deducted X€ of debt, only deducted Y€" | The Mapa de Dívidas holds a different debt than the customer thinks (e.g. ID-7 owed only 15€ from last week) | Check the Mapa de Dívidas for that driver and week first. Explain what it shows, and send the debt-map and manual-debt videos so they can change it themselves. **Debts from past weeks can't be edited.** To increase it, add the extra amount as debt in **last week's** column (e.g. +15€ on 02/11), as in the video, then generate the report again. If the map is right but the report still doesn't deduct, check the **"Dívida (€)" column in Cálculo**: that's the amount charged this week. An "M" means it was set manually (e.g. 0,00€), so nothing is deducted and the debt carries over. Put the amount there and generate again (confirmed by Vasco, 16 Nov 2026) |
| "This driver has no debt but debt is showing" | The driver's **total this week is negative**; the negative amount moves to Dívida Acumulada to be deducted in the next weeks. It isn't in the Mapa de Dívidas yet because it's this week's | Explain it, and ask what the correct value should be if they think this week's total is wrong (confirmed by Vasco, 16 Nov 2026). **A payment registered in the Mapa de Dívidas only affects the following week**: this week still shows the debt, next week "Dívida Sem. Passada" will be 0€ |
| Fuel from a supplier we don't integrate with (e.g. **Alves Bandeira**) is missing | We don't know how that supplier's system works | Ask the customer, politely, if they wouldn't mind adding those values manually: it's easy (confirmed by Vasco, 16 Nov 2026) |
| Several people editing the same fleet at once | Can cause odd values ⚠️ | Escalate with the driver's name and week |

## Bugs fixed recently (for context)

- Sep 2026: weekly charges in months with 5 weeks only billed 4 weeks for some drivers. Corrected manually that week. ⚠️ Confirm it's fully fixed.
- Sep 2026: "Slot/Aluguer" shown twice in the "Outros" box of the driver report. Fixed.

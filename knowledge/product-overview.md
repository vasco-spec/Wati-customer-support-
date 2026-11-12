# GalgoSheets: product overview

> Draft inferred from support conversations. ⚠️ means it needs confirming.

## What it is

GalgoSheets is a back-office platform for **TVDE fleet operators ("frotistas")** in Portugal, also used by some delivery fleets ("estafetas"). It imports each driver's earnings and costs from the ride-hailing platforms, fuel and charging cards, and tolls. It then **calculates each driver's weekly payment**, generates a **weekly report per driver**, sends it to the driver on WhatsApp, and prepares the payments.

GalgoSheets also offers **accounting services** for drivers and fleets (recibos verdes, IVA, Segurança Social, abertura de atividade, accountant consultations), and helps set up or sell TVDE companies.

Customers write in Portuguese (PT and BR), English (often drivers from South Asia), and sometimes Spanish.

## Two kinds of customer

1. **Fleet operators (frotistas):** the main customers. They pay a subscription and run the weekly payment cycle.
2. **Individual drivers:** usually come in through the website form ("Olá! Preenchi o teu formulário…") or the driver campaign, asking about recibos verdes, IVA or Segurança Social. They're offered the driver app and/or a meeting with the accountant.

## Web apps

- **New back office:** `galgosheets-backoffice-v2.netlify.app` (e.g. `/calcular-pagamentos`, `/platforms`, `/faturas`). It works in a phone browser. There's **no native iOS/Android app for the back office**.
- **History of past weeks:** "Cálculo de Pagamentos" → choose the week (the older `app-galgosheets.netlify.app/history` page is also used).
- **Driver app** (accounting): `galgosheets-drivers.netlify.app`. Drivers request recibos verdes and IVA / Segurança Social payment slips there.
- **Vehicle inspections / autos app:** fleets register vehicle handovers and pickups and inspections. ⚠️ Confirm the name and URL.

## Integrations (data imported automatically)

| Source | What | Notes |
|---|---|---|
| Uber (fleet account) | Driver earnings | Uses the fleet's Uber login. Uber may ask for an **SMS code** at login. |
| Bolt (fleets.bolt.eu) | Driver earnings | May ask for a verification code. |
| Prio / MyPrio | Fuel cards (diesel) | Login code sent by SMS/email ("Código de confirmação para login no MyPrio"). Date shown = last refuel. |
| Prio Electric, Miio, Galp | EV charging / fuel | |
| Radius / Repsol | Fuel cards | Appear automatically in the Radius statement. |
| Via Verde | Tolls | Weekly statement by email (Sunday); PDF/xlsx can be uploaded. Never matches exactly (billing lag). |
| Tesla | Charging / vehicle data | Import supported. |
| Revolut, banks (e.g. Montepio) | Paying drivers | Revolut authorisation **expires** periodically and blocks payments until it's renewed. |
| Other platforms | — | No integration: upload the Excel/CSV exported from that platform's portal. |

Most integrations work by **GalgoSheets logging in to the customer's account on that platform**. That's why the team asks for passwords and verification codes, and why **the sync breaks when the customer changes a password**.

## The weekly cycle (fleet operator)

1. **Update "Veículos e Cartões":** which driver has which vehicle, plate, fuel card and Via Verde device this week. Shared cars and drivers with 2 plates are set here. "Sincronizar com autos" pulls plates from the handover records.
2. **Calcular Pagamentos & Gerar Relatórios:** import the week, review per driver, adjust manually if needed.
3. **Enviar Relatórios:** reports go to each driver by WhatsApp. The destination number is set in the Relatórios tab.
4. **Pay drivers:** a batch payment file ("ficheiro de lote") for the bank, or pay directly from the platform.

After **any change**, refresh the page and **generate the report again**. Reports don't update by themselves.

## How driver payments are calculated

- **Charging model per driver:** aluguer (car rent), slot (fixed weekly fee, e.g. €25), or comissão (% of earnings, e.g. 50% with costs split). These can be mixed and set per driver, including different percentages per driver.
- **IVA charged to drivers** (usually 6%, sometimes 3%): it can apply to the **gross** amount (billed trips, which is technically correct) or the **net** amount (what the driver receives). Tips (gorjetas) and tolls (portagens) are normally excluded, but this is configurable.
- **IVA on the driver's recibo verde / IRS withholding:** configured per driver in Veículos e Cartões ("IVA recibo verde" adds IVA to what the driver receives; "IRS" works as withholding).
- **Costs deducted:** Via Verde, fuel/charging, rent, IUC, extra charges, cauções (deposits), parcelamentos (installments).
- **Mapa de Dívidas:** if a driver ends the week negative, the debt carries over to the next week automatically ("dívida acumulada"). Debts can be edited manually.
- **Mapa de Parcelamentos:** spread a debt or charge over several weeks.
- **Cauções:** deposits, with deductions and changes.
- **Adiantamentos:** advances are deducted from the next payment. If the payment isn't enough, the rest becomes debt.
- Uber/Bolt figures can include **adjustments from previous weeks** ("ajustes"), so they can differ from Uber's Earnings page for the same dates.

## Other modules

- **Autos de entrega / recolha:** car handover and pickup records, separate from payments.
- **Inspeções / vistorias:** vehicle inspections.
- **Contratos:** fleet–driver contracts (the team can set up a customer's own template).
- **Faturas:** the customer's GalgoSheets invoices.

## Billing (GalgoSheets subscription)

- Paid by **direct debit via GoCardless**, or by **bank transfer (IBAN)** if the customer can't use direct debit.
- There's a **free trial**: 7 days was mentioned to one prospect, and 1 month on an older subscription link. ⚠️ Confirm the current offer and prices.
- Invoices are in the **Contabilidade** tab (`/contabilidade`) of the back office.
- Autumn 2026: the **entity that collects payments changed**. Customers got an email and possibly a "subscription cancellation" notice. **No action is needed from them.**
- **Cancelling:** the team confirms in the chat that the customer won't be charged again. Refunds go to the customer's IBAN through the finance department.

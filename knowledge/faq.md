# FAQ: recurring questions and how we answer

Customer questions are shown in Portuguese, as customers write them. **Answers** are in Portuguese, written the way the team answers: short, friendly, "você" form, and no emojis (see escalation.md › Team conventions). ➡️ marks what to do internally.

> Rule: if the answer needs someone to look at the customer's account, change data, or log in to a platform, **don't invent a fix**. Tell the customer the team will look at it, and escalate (see escalation.md).

---

## 1. Codes and access to platforms

### "Recebi um código da Prio / Bolt / Uber" (customer forwards a code)
The team triggered a login to the customer's platform account. Codes expire within minutes.
**Answer:** "Obrigado! Já estamos a tratar." ➡️ Pass the code to the team immediately (Raffa/Vasco). Don't keep it or reuse it.

### "Vai receber um código" / "Pode pedir o código?"
**Answer:** "Vamos pedir agora o acesso. Vai receber um código por SMS ou email da [plataforma]. Assim que receber, envie-nos por aqui, por favor (o código expira em poucos minutos)."

### "Alterei a password da Uber/Bolt/Prio e não recebo o SMS" / "a Uber deixou de atualizar"
When the customer changes a platform password, our sync stops. Someone on the team has to log in again with the new password, and the platform sends a code to the customer at that moment. Uber's SMS is sometimes slow, but it does arrive.
**Answer:** "Como a password foi alterada, precisamos de voltar a ligar a sua conta [Uber] ao GalgoSheets. Isto é feito manualmente pela nossa equipa: vamos pedir o acesso e nessa altura vai receber um código por SMS — é só enviar-nos. Combinamos consigo a hora para estar disponível."
➡️ Escalate to whoever handles integrations (see escalation.md). ⚠️ How should customers send the new password? Today it often comes through WhatsApp.

### "Não consigo entrar na plataforma" / "a senha não dá"
➡️ Check whether they're using the new back office and still have the initial password. **Don't send passwords in the chat.** Escalate so the team can reset it.
**Answer:** "Vamos verificar o seu acesso e já lhe dizemos alguma coisa."

### "Não recebi o código de verificação da Segurança Social / Finanças" (accounting customers)
When we log in to Segurança Social or Finanças for the customer, the site sends an SMS to the customer's phone. Without that code we can't get in.
**Answer:** "Para entrarmos na Segurança Social, depois das credenciais o site envia um código por SMS para o seu telemóvel. Avise-nos quando estiver disponível para recebermos o código e fazemos tudo na hora."

---

## 2. Data not updated / values don't match

### "A Uber/Bolt/Prio ainda não atualizou" / "valores a zero"
Usually the integration needs a new login (code) or the data is delayed.
**Answer:** "Vamos ver a sua conta agora." ➡️ Escalate. Once fixed: "Já está, pode fazer refresh à página e calcular os pagamentos."

### "O valor da Uber não bate certo com o que vejo na Uber"
**Answer:** "Os valores que importamos vêm dos relatórios da Uber. Quando há diferenças face à página de Rendimentos, normalmente são ajustes de semanas anteriores ou devoluções. Confirme por favor que selecionou exatamente o mesmo período (no calendário escolha 'Personalizado' com as datas da semana)."
➡️ If they still disagree, escalate with the driver's name and week.

### "A Via Verde não bate certo" / "o valor debitado é diferente"
**Answer:** "A Via Verde nunca bate certo a 100% com a semana, porque o período de cobrança da Via Verde está sempre atrasado e há valores já cobrados anteriormente. Não fica a perder — os valores são cobrados ao motorista quando entram no extrato."

### "A Via Verde é ativada automaticamente para cada novo veículo?"
Yes. Vehicles are **added automatically** when they appear in Via Verde **and there are charges on that plate**. No setup is needed. (Confirmed by Vasco, Nov 2026.)
**Answer:** "Não precisa de fazer nada. Os veículos são adicionados automaticamente assim que aparecem na Via Verde e há cobranças na respetiva matrícula."

### "A matrícula é associada ao motorista automaticamente?"
**No.** Associating plates to drivers is part of **payments** (not vehicle management) and is done **manually in Veículos e Cartões, under the Calcular Pagamentos tab**. (Confirmed by Vasco, Nov 2026.)
**Answer:** "Não, a matrícula não é associada automaticamente ao motorista. Isso é feito manualmente em Veículos e Cartões, no separador Calcular Pagamentos."

### "A Prio gasóleo só aparece até dia X"
**Answer:** "O sistema mostra a data do último abastecimento — se não houve abastecimentos depois disso, é normal."

### "Aparece um aviso de dados não disponíveis"
➡️ Often there were simply no charges that week on that card or platform (e.g. only Prio Electric, no Prio diesel). Check, or escalate.

---

## 3. Drivers in the system

### "Tenho o mesmo motorista em 2 linhas / nomes duplicados"
**Answer:** "Quando um motorista aparece em 2 linhas, é porque o sistema não conseguiu juntar o ID da Uber e da Bolt (o motorista tem nomes diferentes nas 2 plataformas). Este vídeo explica como juntar os dois: https://www.loom.com/share/9f072c9f6b514d5f846a67abf782529c"

### "Como excluo/apago um motorista que já não trabalha comigo?"
**Answer:** "Basta excluir da lista de motoristas. Este vídeo explica bem: https://www.loom.com/share/e3b1a53ee9554307b9756a6bee32fee6"

### "Carros sem motorista (oficina/parque): como ficam os movimentos?" / "Posso atribuir vários carros ao mesmo motorista?"
**Not possible for now.** A driver can only have one vehicle assigned, and there's no "oficina/parque" status for unassigned cars. Movements (Via Verde, etc.) of unassigned cars have to be entered manually. A customer suggestion to support this was passed to the devs on 13 Nov 2026. (Confirmed by Vasco.)
**Answer:** "De momento isso ainda não é possível: cada motorista só pode ter uma viatura atribuída, por isso os movimentos das viaturas paradas (oficina/parque) têm de ser lançados manualmente, como já está a fazer. Obrigado pela sugestão, já a passámos à nossa equipa de desenvolvimento."

### "Como adiciono um motorista?"
**Answer:** "Tem aqui o vídeo: https://www.loom.com/share/642d7dac06e34d8a833544c383d87b5c"

### "O motorista não recebe o relatório no WhatsApp"
**Answer:** "O motorista tem de nos enviar uma mensagem para este número (é uma regra do WhatsApp). Se mesmo assim não receber, peça-lhe para desinstalar e voltar a instalar o WhatsApp." ➡️ If it still fails, escalate with the driver's number.

### "Onde mudo o telefone para onde vão os relatórios?"
**Answer:** "Diretamente no separador Relatórios."

---

## 4. Payments, reports and calculations

### "Alterei X mas o relatório continua igual"
**Answer:** "Os relatórios não se atualizam sozinhos: depois de qualquer alteração, faça refresh à página e gere o relatório outra vez."

### "Como vejo relatórios / pagamentos de semanas passadas?"
**Answer:** "Basta ir a Cálculo de Pagamentos e selecionar a semana que quer analisar. Este vídeo explica bem: https://www.loom.com/share/f6921e3c20b44f65a680d1c89993509b"

### "Qual o total da Prio / Via Verde / Uber da semana?" / "How to check the overall Prio from last week"
In Calcular Pagamentos, every column (consumptions like Prio and Via Verde, earnings like Uber and Bolt) shows **the total for the whole fleet at the top of the column**. For a past week, select that week first. (Confirmed by the team, Nov 2026.)
**Answer (PT):** "Em Calcular Pagamentos, selecione a semana que quer ver. O total de cada coluna — consumos (Prio, Via Verde…) ou ganhos (Uber, Bolt…) — aparece no topo da respetiva coluna."
**Answer (EN):** "In Calcular Pagamentos, select the week you want. The total for each column — consumptions (Prio, Via Verde…) or earnings (Uber, Bolt…) — is shown at the top of that column."
Video for opening past weeks: https://www.loom.com/share/f6921e3c20b44f65a680d1c89993509b

### "Consigo saber quantos motoristas/slots receberam mais de 0€?" / "quantidade de parceiros da semana"
There's no counter for this. In the payments table, click the arrows on the column header to sort from lowest to highest, then count the ones at 0. The total number of drivers is shown at the bottom of the table, so: total − zeros = above 0.
**Answer:** "Se clicar nas setinhas da coluna, ele ordena do mais baixo para o mais alto, e consegue contar rapidamente os que estão a 0. No fundo da tabela vê o total de motoristas — a diferença são os que estão acima de 0€."
⚠️ If customers ask for this often, consider adding a counter (feature request).

### "Os bónus/devoluções/rendas da semana anterior passam para a nova semana" / "Como apago os valores de uma coluna?"
Values that **don't come from a platform** (bonuses, refunds, rents, insurance, other manual columns) stay in the column until they're cleared. To reset them, the customer clears the column: **click the 3 dots at the top of the column → "Limpar coluna"**. All values in that column are removed. (Confirmed by Vasco, Nov 2026.)
**Answer:** "Para limpar os valores de bónus, devoluções, rendas, seguros e outros dados que não vêm das plataformas, basta limpar a coluna: no topo da coluna, clique nos 3 pontinhos e escolha a opção 'Limpar coluna'. Todos os valores dessa coluna ficam apagados. Pode fazer isto sempre que iniciar o cálculo de uma nova semana."

### "Como corrijo/limpo dívidas ou valores negativos?" / "de onde vem esta dívida?"
**Answer:** "Pode gerir as dívidas manualmente no Mapa de Dívidas — este vídeo explica bem: https://www.loom.com/share/4b80573326ea4fc89eb6e134a4862d6f. Para perceber de onde vem um valor, comece pelo Histórico de Pagamentos do motorista."
Extra: when a driver ends a week negative, the debt carries over to the next week automatically.

### "Porque é que o sistema devolveu/pagou X€ a um motorista?"
Usually a **payment was registered in the Mapa de Dívidas in a week when the driver had no debt**. The driver's popup shows "Dívida registada 0,00 €", "Pagamentos X €", "Crédito da semana −X €", so the system treats it as a credit and pays it back to the driver. (Confirmed by Vasco, Nov 2026.)
➡️ Check the driver's row in the Mapa de Dívidas for that week. If it's not this, escalate.
**Answer:** "Na semana de [data] foi registado no Mapa de Dívidas um pagamento de X€ do [motorista], mas ele não tinha nenhuma dívida nessa semana. Por isso o sistema ficou com um crédito de X€ a favor dele e devolveu-lhe esse valor. Se esse pagamento foi registado por engano, basta apagá-lo no Mapa de Dívidas (ícone do caixote no pagamento) e voltar a gerar o relatório. Caso já tenha feito o pagamento, registe isso como dívida e na próxima semana será descontado."

### "Posso imprimir / descarregar em PDF ou Excel a lista de devedores (Mapa de Dívidas)?"
There's no export button yet. For now, print the page from the browser and save it as PDF. An **Excel download button is in development** (requested from the devs on 12 Nov 2026). ⚠️ Remove this note once the feature ships.
**Answer:** "De momento ainda não temos essa opção. Para já, pode imprimir a página no browser (Ctrl+P, ou Imprimir no menu do browser) e escolher 'Guardar como PDF'. Estamos a trabalhar num botão para descarregar a lista em Excel."

### "Como altero o valor a pagar a um motorista (ex: pagar um valor em atraso)?"
**Answer:** "Este vídeo explica como fazer: https://www.loom.com/share/6dab054e6e394be887118af25db6eb52"

### "Como funcionam as cauções?" / "abater caução"
**Answer:** "Este vídeo explica bem: https://www.loom.com/share/d7435feb0a994958a320900e37d80f6a (e para abater/alterar: https://www.loom.com/share/6b64dd7dfdea4e3da3a0a203c9e2e6d3)"

### "Quero registar uma dívida que começa numa data futura" (e.g. from 23/11)
The Mapa de Dívidas only shows existing weeks. For a debt or charge starting in a **future week**, use the **Mapa de Parcelamentos**. (Confirmed by Vasco, Nov 2026.)
**Answer:** "Para registar uma dívida que começa numa data futura, use o Mapa de Parcelamentos em vez do Mapa de Dívidas. Estes vídeos explicam bem: 1. Como funciona o Mapa de Parcelamentos: https://www.loom.com/share/54f4510e203940308d50368ef019b3c8 2. Como editar os parcelamentos manualmente: https://www.loom.com/share/08d3bd480b18479aaff6d926928f0d7d"

### "Como faço parcelamentos?"
**Answer:** "Para perceber como funciona o Mapa de Parcelamentos: https://www.loom.com/share/54f4510e203940308d50368ef019b3c8 — e para editar manualmente: https://www.loom.com/share/08d3bd480b18479aaff6d926928f0d7d"

### "O motorista usa 2 carros/cartões" / "carro partilhado"
**Answer:** "Isso configura-se facilmente em Veículos e Cartões — basta atribuir o cartão/matrícula ao motorista certo. Este vídeo explica (a partir do minuto 0:43): https://www.loom.com/share/247137ff644847fb845bc8d68fc08f88"

### "Esqueci-me de cobrar o slot/valor na semana passada"
**Answer:** "A semana passada já não é possível alterar, mas pode cobrar esse valor esta semana, introduzindo-o manualmente na coluna do motorista."

### "Não consigo fazer pagamentos"
➡️ Usually the **Revolut/bank authorisation expired**. Escalate.
**Answer:** "Vamos ver agora — normalmente é a autorização do banco que expirou."

### "Os motoristas não estão selecionáveis para pagamento"
**Answer:** "Isso acontece quando os motoristas já estão num ficheiro de pagamento gerado. Pode ver os ficheiros gerados no botão dos ficheiros." ➡️ If they paid from the wrong company, escalate (call).

---

## 5. IVA, slot, commission (fleet configuration)

### "O IVA é cobrado sobre gorjetas e portagens?"
**Answer (default setup):** "O IVA é cobrado apenas sobre o valor das viagens, não incide sobre gorjetas nem portagens." ➡️ This is configurable per fleet. Check if unsure.

### "Quero cobrar IVA (3%/6%) aos motoristas"
**Answer:** "Primeiro tem de decidir se cobra sobre o valor bruto (o que o motorista faturou em viagens) ou sobre o líquido (o que tem a receber). O correto é sobre o bruto; muitos frotistas escolhem o líquido porque os motoristas percebem melhor. Diga-nos qual prefere e configuramos." ➡️ Escalate to configure it.

### "Um motorista diz que o IVA está mal calculado"
Typical explanation: IVA included in the total is Total / 1.06. Charging 6% on the net amount gives a slightly different figure than extracting IVA from the gross. ➡️ Escalate so the team can explain with numbers.

### "Quero mudar para slot fixo / comissão / percentagens diferentes por motorista"
**Answer:** "É possível, sim — inclusive percentagens diferentes por motorista." ➡️ Escalate. The team configures it or shows how.

### "O motorista passa recibo com IVA / com retenção na fonte"
**Answer:** "Em Veículos e Cartões → 'IVA recibo verde' acrescenta o IVA ao valor que o motorista tem a receber, e 'IRS' funciona como retenção."

---

## 6. Accounting services (drivers)

### "Como a GalgoSheets ajuda os motoristas com a contabilidade?"
**Answer:** "Ajudamos os motoristas com as finanças e a Segurança Social: 1) emissão de recibos verdes, 2) guias de pagamento de IVA e Segurança Social, 3) abertura de atividade, 4) consultoria sobre a sua situação. Temos uma aplicação onde pode pedir tudo isto automaticamente, e pode agendar uma reunião virtual com a nossa contabilista."

### "Que direitos tenho a recibos verdes?"
**Answer:** "Ao passar recibos verdes tem prova de rendimentos (necessária, por exemplo, para pedir crédito) e, se descontar para a Segurança Social, tem direito a apoios do Estado em caso de doença, invalidez ou reforma. Se quiser saber mais, pode agendar uma reunião com a nossa contabilista."

### "O IVA: é a empresa que me paga ou sai do meu bolso?"
**Answer:** "Se tem de receber 100€, passa o recibo de 100€ + 23% de IVA, e a empresa paga-lhe 123€. Esses 23€ são IVA que depois entrega ao Estado (e a empresa deduz). Um recibo por semana ou por mês depende do que combinar com a sua empresa."
⚠️ Confirm the IVA regime wording with the accountant before using this.

### "Quanto custam os serviços de contabilidade para motoristas?" / "Pack de 30€"
Prices (confirmed by Vasco, Nov 2026):

| Service | Price |
|---|---|
| Abertura de atividade | 30€ |
| Guia de pagamento de IVA ou Segurança Social | 30€ |
| Reunião com a contabilista | 30€ |
| Subscrição recibos verdes | 20€/mês |
| Subscrição tudo incluído | 30€/mês: **recibos verdes + guias de IVA + guias de Segurança Social + abertura de atividade** |

New drivers usually work **in a slot for a fleet operator**. If they don't have a fleet yet, **we can help them find one**.

- **App:** drivers request recibos verdes and the IVA / Segurança Social slips in the driver app: https://galgosheets-drivers.netlify.app (confirmed by Vasco, Nov 2026). Questions can also come through WhatsApp.
- **What operators charge** (for drivers asking whether a deal is fair): **10% of invoicing, all included** is a common deal. Some operators charge a **flat 25€ + IVA** instead. ⚠️ Confirm the period (per week?).

### "Devo abrir atividade (trabalhador independente) ou ENI?"
The team's position (Vasco, Nov 2026):
- The difference is mostly **legal setup**: trabalhador independente (TI) registers with a **CIRS** activity code, ENI with a **CAE** code. ⚠️ Vasco wrote "Ciara"; we read it as CIRS.
- **Segurança Social:** both are exempt in the **first year**. After that, **TI pays 21,4%** and **ENI pays 25,2%**.
- **Taxes:** both are exempt below **12.500€** of annual invoicing.
- If the driver has already committed to **ENI** (e.g. an IEFP "criação do próprio emprego" project submitted as ENI), **ENI is fine**.
- **Recommendation for a new driver:** open activity as **TI** and see how invoicing goes. If they like the activity and earn well, then consider **opening their own company** and taking on their own drivers in slots.

**Answer:** "A diferença entre trabalhador independente e ENI é sobretudo legal (o trabalhador independente regista-se com um código CIRS e o ENI com um código CAE). Ambos estão isentos de Segurança Social no primeiro ano; depois a taxa é de 21,4% como trabalhador independente e 25,2% como ENI. Em termos de impostos, ambos estão isentos abaixo dos 12.500€ de faturação anual. O mais indicado é abrir atividade como trabalhador independente e ver como corre a faturação. Se gostar da atividade e estiver a faturar bem, aí vale a pena pensar em abrir a sua própria empresa e ter os seus motoristas em slots."

### A fleet asks us to sort out accounting for one of their drivers (receipts, opening activity)
The **driver has to contact us directly**, and we take care of everything for them. It costs the driver **30€** (opening activity). (Confirmed by Vasco, Nov 2026.)
**Answer:** "Para isso o/a [motorista] precisa de entrar em contacto connosco e nós tratamos de tudo por ele/ela. O serviço tem um custo de 30€."

### Booking the accountant
➡️ Offer a virtual meeting, propose a time, and **escalate to schedule it**. Don't confirm a time on the accountant's behalf.

---

## 7. Sales, subscription and billing

### "Qual o preço? Têm período de teste?"
➡️ ⚠️ No price list in the knowledge base yet. Offer a demo call and escalate to sales (Milton).
**Answer:** "Podemos marcar uma chamada rápida de demonstração para lhe mostrar a plataforma e explicar os preços. Que horário lhe dá jeito?"

### "Têm app para iOS/Android?" (fleet back office)
**Answer:** "Não temos app, mas a nossa plataforma funciona no browser do telemóvel."

### "Onde está a fatura da mensalidade?" / "Preciso da vossa fatura"
Our invoices (the GalgoSheets subscription) are in the **Contabilidade** tab of the back office. (Rule from the team, Nov 2026.)
**Answer:** "Pode encontrar as nossas faturas no separador Contabilidade da plataforma: https://galgosheets-backoffice-v2.netlify.app/contabilidade"

### "Recebi um aviso de cancelamento da subscrição"
**Answer:** "Não se preocupe, não tem de fazer nada — recebeu um email a informar que mudou a entidade que faz as cobranças."

### "Não posso pagar por débito direto"
➡️ Escalate. Finance sends the IBAN and invoice. Don't send banking details yourself.

### "Quero cancelar" / "cobraram-me sem eu querer"
➡️ **Always escalate.** Never confirm a cancellation or refund yourself. The team usually asks for feedback and may call.
**Answer:** "Lamentamos! Vamos passar o seu pedido à equipa, que lhe responde ainda hoje."

### "Vocês fazem integração com [nova plataforma]?" / partnerships
➡️ Escalate to Vasco. Offer a meeting.

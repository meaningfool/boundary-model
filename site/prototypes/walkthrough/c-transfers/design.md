# Fernwire: a walkthrough example

Example C for page 05, A walkthrough. The map is `map.json`, drawn in `map.html`. It passes `check-map.mjs`: 3 consumers, 1 provider, 7 components, 2 outside services, 10 resources, 12 boundaries and 25 capabilities. Fernwire is an invented name; check it against trademarks before the page goes live.

## The system

Fernwire is a money transfer app. A person opens an account in the phone app, asks what 200 euros will be worth in Philippine pesos, and sends it to their mother's bank account; they pay by bank transfer, and Fernwire pays out through its partner bank. Marketplaces use the same rails through an API to pay hundreds of sellers at once. Behind the scenes, a risk model scores every transfer for signs of money laundering, and when a score is high, a compliance analyst gets an alert. The analyst closes it as no concern, or opens a case on the account, investigates its history, and decides whether to report it to the authorities.

## Walkthrough

Screens are those of `map.html`: All providers, Fernwire, and the boxes that open from it. Steps 2 to 9 are about Level 1 only, but the Fernwire screen always shows the components too, so those steps need crops with the Components column faded, or the text notation.

### 1. What Fernwire is

- Map: no map yet. The step ends on the All providers screen with the Fernwire box alone.
- Concept: the system, told as stories of the people who use it.
- Draft: "Fernwire moves money. People send it to family abroad, businesses pay their sellers with it, and a compliance team watches what moves through it for money laundering."

### 2. The sender and Fernwire

- Map: All providers, with Sender lit and joined to Fernwire. The other two consumers are faded.
- Concept: consumer, provider, boundary, and the external boundary at Level 1.
- Draft: "The sender is the consumer everyone thinks of first. They believe they are using Fernwire, so Fernwire is the provider, and the line between them is the first boundary. It is external, because the sender is outside the system."

### 3. A second consumer inside the company

- Map: All providers, with Compliance analyst lit.
- Concept: a consumer is a role with goals of its own, even when it works for the company. A second boundary, with the same provider.
- Draft: "Compliance analysts work for Fernwire, but they use it like any consumer: through the case console, to find money laundering. That goal is theirs, not the sender's, so they get a boundary of their own with the same provider."

### 4. One boundary, two interfaces

- Map: Fernwire screen, Sender selected. Lines run to the website and mobile app dots, then to Send money, Set rate alert and Open account. Open account is reached only from the mobile app dot.
- Concept: interface; two interfaces that differ; a boundary is not an interface; the apps are clients, parts of their interfaces.
- Draft: "The sender reaches Fernwire through the mobile app and the website. Both sit on one boundary, because one consumer uses one provider through them. They do not offer the same things: you open an account only in the app, because it needs the phone's camera for your ID and a selfie."

### 5. A third consumer, through an API

- Map: Fernwire screen, Business customer selected: the payouts API dot and the Pay out area.
- Concept: a separate consumer needs goals of its own; a business's own scripts are that consumer on another interface; a webhook back to the consumer stays inside its boundary.
- Draft: "A marketplace paying its sellers also sends money, but hundreds of payouts at a time, from its own systems, followed as batches. Those goals make it a third consumer. When Fernwire calls the business's server with a webhook as each payout lands, the call belongs to this boundary: it completes Send payout batch, and it does not make the business a provider."

### 6. Capabilities and what they give back

- Map: Fernwire screen, Send money area selected. The panel lists Get a quote, Send transfer and List transfers, each with what it takes and gives.
- Concept: capability named with a verb; output; representation.
- Draft: "A capability is something the consumer can do to get a result. Get a quote takes an amount and two currencies and gives what the recipient would get, the fee and the rate. Send transfer gives the transfer, and later a push message when the money arrives; that message is one representation of the transfer's status, not a resource of its own."

### 7. Resources, and how capabilities work on them

- Map: Fernwire screen, resource chips. Clicking Account lights the areas whose capabilities work on it, and Accounts, which keeps it. The panel shows each resource's properties.
- Concept: resource, property, relationship, and the four modes.
- Draft: "Capabilities work on resources the consumer cares about, and each says how. Get a quote observes the Exchange rate, Send transfer produces a Transfer and mutates the Account by using up part of its monthly limit, and Set rate alert produces a Rate alert and reacts when the Exchange rate reaches its target. A transfer's status and expected arrival are properties; a case holding several alerts on one account is a relationship."

### 8. Core and supporting areas

- Map: Fernwire screen, the five area boxes, labelled core or supporting.
- Concept: area, core and supporting.
- Draft: "Areas group capabilities by purpose. Send money is the sender's core area, the reason they came. Opening an account is supporting: senders would skip it if they could, and Fernwire's rules do not let them."

### 9. What is not a capability

- Map: Fernwire screen, Investigate alerts selected. The point is what the panel does not list.
- Concept: look-alikes that are steps, interactions, or what the provider does on its own; what stays out.
- Draft: "Checking the sending limit is part of Send transfer, because its answer only decides whether the transfer goes ahead. Getting a quote looks like the first step of sending, but many people check the rate and leave, so it is a capability. And no analyst raises alerts: the risk model does that on its own, and the analyst's capability is reading them, with List alerts."

### 10. Inside Fernwire

- Map: Fernwire screen, the Components column: Accounts, Transfers, Risk scoring and Case management, each with the resources it keeps.
- Concept: Level 2; component; parts that are not components.
- Draft: "Open Fernwire and you find four components. Each keeps state only it changes or makes decisions only it makes: Accounts decides how much each account may send, Risk scoring decides each transfer's score. The mobile app, the website and the service that sends notifications are not components; they keep nothing and decide nothing."

### 11. Components that use each other

- Map: Fernwire screen, lines from Risk scoring to Transfers and Case management, and from Transfers to Accounts. Then the Accounts screen: Transfers uses it through the accounts API for Use sending limit, and it uses the Identity verification service.
- Concept: internal boundary; contract between components; a component that is a consumer of another; a resource kept by two components; outside service.
- Draft: "Inside, the same pattern returns. Transfers is a consumer of Accounts, through the accounts API, when it counts a transfer against the sender's limit. Risk scoring is a consumer of Transfers and keeps its own record of every transfer it scored, so two components keep Transfer. Accounts is a consumer of an outside service, which checks IDs and calls back with the result."

### 12. One level further: inside Transfers

- Map: Transfers screen. Risk scoring uses it through transfer events; inside are Transfer tracker, Pricing and Bank payments; Bank payments and Pricing use the Partner bank, drawn as a dashed box; Transfers uses Accounts.
- Concept: Level 3; the pattern repeats; an outside service reached by a component one level down.
- Draft: "Open Transfers and it has components of its own. The Transfer tracker moves each transfer through its statuses, Pricing decides rates, and Bank payments decides which incoming payment pays for which transfer. The partner bank, which Transfers relied on at Level 2, is now the outside service of two of them."

## Coverage

| Concept | Where it appears | Fit |
| --- | --- | --- |
| Consumer | Sender, Business customer, Compliance analyst | Natural |
| Provider | Fernwire | Natural |
| Boundary | Twelve, one for each consumer and provider pair | Natural |
| External and internal boundary | Three Level 1 boundaries; nine below them, outside services included | Natural |
| Interface | mobile app, website, payouts API, case console; contracts and outside APIs below | Natural |
| Two interfaces that differ | Open account only in the mobile app, because it needs the camera | Natural |
| Capability | 25 in all, 12 at Level 1 | Natural |
| Area, core and supporting | Send money core; Set rate alert and Open account supporting. Transfers <-> Partner bank has Get market rate as supporting. The analyst and the business have a core area only | Natural |
| Resource | Account, Transfer, Exchange rate, Rate alert, Payout batch, Alert, Case at Level 1 | Natural; Rate alert is thin |
| Property | Transfer status and amounts, Account verification status and limit, Alert score and reason | Natural |
| Relationship | An account makes many transfers; a batch holds many transfers; a case holds alerts on one account | Natural in the domain, but the map has no field for it, only descriptions |
| Mode | All four at Level 1: Get a quote observes, Close case mutates, Open case produces, Set rate alert reacts. Watch transfers reacts at Level 2 | Natural; reacts at Level 1 rests on the rate alert, a real remittance feature |
| Output | Every capability's gives; the webhook and the push message | Natural |
| Representation | The push message on arrival, the quote screen, the webhook body | A little forced: only in gives text, never drawn |
| Look-alike that is not a capability | Checking the limit, retaking a blurry selfie, adding a recipient while sending, raising alerts; Get a quote as the reverse case | Natural, and plentiful |
| Component | Accounts, Transfers, Risk scoring, Case management | Natural |
| Internal boundary between components | Transfers <-> Accounts, Risk scoring <-> Transfers, Risk scoring <-> Case management | Natural |
| Contract between components | accounts API, transfer events, alerts API; pricing API and bank payments API at Level 3 | Natural |
| Resource kept by two components | Transfer, by Transfers and by Risk scoring's own record; Bank payment, by Bank payments and by the Partner bank | Natural, and it mirrors the model's fraud-check example |
| Outside service | Partner bank, Identity verification service, which calls back with its result | Natural; the Partner bank is hidden on the Fernwire screen |
| Level 3 | Inside Transfers: Transfer tracker, Pricing, Bank payments | Natural, with the drawing caveat in Weak spots |
| What stays out | Apps and the notification sender as parts; the event stream as an implementation choice; recipients as consumers; filing reports; model training; tests and deployment | Natural, except support, onboarding and sign-in, which are cut for size |

## The change

The request: let analysts freeze an account while a case is open. Today an alert comes after the money has left, and the account can keep sending while the analyst investigates.

### Questions asked while shaping

Each question changed the shape, so it was asked; the highest-leverage one came first.

1. Does a freeze also stop transfers already on their way? Impact: yes would add a held status to Transfer, a new boundary from Accounts or Case management to Transfers, and a change to List transfers for senders. Recommended and chosen: no, new transfers only; holding money already paid in is a change of its own.
2. Does closing the case lift the freeze, or does the analyst lift it by hand? Impact: closing the case puts the freeze in Case management's hands, which adds the NEW Case management <-> Accounts boundary and changes Close case; lifting by hand adds an Unfreeze capability that the case console could call on Accounts directly. Recommended and chosen: closing the case lifts it.
3. Does the freeze cover business accounts? Impact: yes changes the Business customer boundary too. Recommended and chosen: yes, the rule is about accounts, not people.
4. Do analysts need a list of frozen accounts, with who froze each one and why? Impact: yes would make Freeze a NEW resource with a List frozen accounts capability; no makes it a status of Account. Recommended and chosen: no, the case already records who and why.

### Shape

The em dashes in the Open and Details lines come from the `shape-boundaries` format.

```markdown
Resources of Fernwire:

- MODIFIED **Account**: a person's or business's account at Fernwire, now with a status, active or frozen, and the open cases that froze it
- MODIFIED **Case**: an analyst's investigation of one account, now recording the freeze it placed

**Compliance analyst <-> Fernwire**: MODIFIED, an analyst can freeze the account of an open case, and closing the case lifts the freeze

- Interfaces: case console
- Investigate alerts (core)
  - NEW Freeze account: mutates **Account** · mutates **Case**
  - MODIFIED Close case: mutates **Case** · mutates **Account**

**Sender <-> Fernwire**: MODIFIED, a sender whose account is frozen cannot send money

- Interfaces: mobile app · website
- Send money (core)
  - MODIFIED Send transfer: produces **Transfer** · mutates **Account**

**Business customer <-> Fernwire**: MODIFIED, a business whose account is frozen cannot send payout batches

- Interfaces: payouts API
- Pay out (core)
  - MODIFIED Send payout batch: produces **Payout batch** · produces **Transfer** · mutates **Account**

Resources of Accounts:

- MODIFIED **Account**: gains a status, active or frozen, and the open cases that froze it

Resources of Case management:

- MODIFIED **Case**: records the freeze it placed

**Case management <-> Accounts**: NEW, Case management freezes the account of an open case and lifts the freeze when the case closes

- Interfaces: accounts API
- Change account status (core)
  - NEW Change account status: mutates **Account**

**Transfers <-> Accounts**: MODIFIED, Accounts refuses to count a transfer from a frozen account

- Interfaces: accounts API
- Use sending limit (core)
  - MODIFIED Use sending limit: mutates **Account**

**Shape complete: YES**

**Open**

- None

**Details**

- What does a sender see when they try to send from a frozen account? — About: Send transfer
- What does the payouts API return to a frozen business? — About: Send payout batch
- If two open cases freeze one account, when does the freeze lift? — About: Change account status, Close case
- Must the analyst give a reason to freeze? — About: Freeze account
```

The case management boundary reuses the accounts API, which Transfers already calls: one provider's interface, shared by two consumers for different capabilities.

### Slices

Option A, freeze first and lift later. Slice 1 lets analysts freeze; slice 2 makes closing a case lift the freeze. It has an invalid intermediate state: between the slices, a freeze outlives its case and someone must lift it by hand.

Option B, senders first, then businesses. Chosen.

1. Freeze and lift for senders: an analyst freezes a sender's account from an open case, the sender cannot send, and closing the case lets them send again. Boundary changes: MODIFIED Account and Case, NEW Freeze account, MODIFIED Close case, NEW Case management <-> Accounts, MODIFIED Use sending limit, MODIFIED Send transfer. Freeze account is split by consumer and refuses business accounts in this slice.
2. Freeze businesses too: an analyst can freeze a business account, and its payout batches are refused. Boundary changes: the rest of Freeze account, MODIFIED Send payout batch.

Its smell is a heavy first slice, acceptable for a change this small.

Option C, an enabling slice first. Slice 1 teaches Accounts to hold a frozen account and refuse its transfers, with no visible change because nothing freezes one yet; slice 2 adds everything the analyst and the consumers see. Its smell is infrastructure with no immediate consumer, and slice 2 still carries all the behavior.

### Details settled in refinement

- What a frozen sender sees. Expected behavior: a sender whose account is frozen sees "Your account is on hold. Contact us." when they try to send, in the app and on the website, and the message never mentions a case, an alert or compliance. Design decision: Fernwire shows the message it uses for any hold, so the sender is not tipped off that they are under investigation; a message naming the review was rejected.
- Two cases on one account. Expected behavior: an account frozen by two open cases stays frozen until both cases close. Design decision: Accounts keeps the list of open cases holding each account and makes it active again when the list is empty; a single frozen flag, which the first case to close would clear, was rejected.
- A frozen business. Expected behavior: a payout batch from a frozen business is refused at once with the error `account_on_hold`, and Fernwire makes no transfers. Design decision: the refusal comes back on the request, not as a webhook.

Each slice then becomes one issue. Proof of done for the first: freeze an account from a case, see the sender's next transfer refused with the on-hold message, close the case, and see the sender send again.

## Weak spots

- The drawn page has no Level 1 view. The Fernwire screen shows consumers, capabilities and components at once, so steps 2 to 9 need crops or the text notation.
- The Partner bank is missing from the Fernwire screen. Components inside Transfers call it, so the page draws that boundary only once Transfers opens. At Level 2 the reader sees one outside service, not two, and step 11 has to say the second one waits for step 12.
- The Transfers screen shows Risk scoring as its only consumer. Senders, businesses and analysts reach Transfers through Fernwire's interfaces, and the screen does not repeat them. A reader will ask where the senders went. The text notation, with each component's serves line, answers it better than the drawing.
- Watch transfers points against the flow of data: Risk scoring is the consumer, though the events go from Transfers to it. The model is right, but the page needs a sentence, and it is the second direction lesson after the webhook.
- Bank capabilities appear twice. The three on Transfers <-> Partner bank come back at Level 3 on Bank payments and Pricing, because the format wants both levels. Six of the 25 capabilities are the bank's, and three of those are repeats. Readers may think Fernwire has two connections to the bank.
- Use sending limit looks like a contradiction. Step 9 calls checking the limit a step, and step 11 shows Use sending limit as a capability. Both are right, because the consumer changes and Use sending limit also counts the amount, but the page should say so.
- Close alert and Open case are two moves of an alert's status, which brushes against "one capability for moving between statuses". Open case also produces a Case, which justifies it, but a careful reader will notice.
- Relationships and representations have no field in the map. They live in resource descriptions and gives, so the page has to point at them in prose.
- Rate alert is thin. No capability lists or removes alerts. It earns its place by showing reacts at Level 1 and the rule that alerts are resources while notifications are outputs.
- Recipient is a property of Transfer here, recorded as a question. It teaches that property or resource depends on context, but real transfer apps let senders manage recipients, so some readers will find it odd.
- What stays out mixes principles and size cuts. Recipients, report filing and model training stay out by the model's rules; support agents, business onboarding and sign-in stay out to keep the page short. The page should keep the two apart.
- The compliance side is post-event monitoring only. There is no sanctions screening before payout and no hold on a scored transfer, and reports are filed outside Fernwire. An anti-money-laundering reader will notice; one sentence on the page covers it.
- The change is wide. It touches three external boundaries and two internal ones, which shows how a change crosses levels, but the shape is long for a page. Answering no to question 3 removes the business parts if it needs to be shorter.
- Several areas share their only capability's name, as the model asks, so the drawing shows "Set rate alert" and "Open account" twice in a row.

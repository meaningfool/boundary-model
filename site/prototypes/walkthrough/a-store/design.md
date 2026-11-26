# Walkthrough example A: the Store, extended

The map is `map.json`, drawn in `map.html`. Still images of every screen are in `stills/`. Test renders for this design, a Level 1 map with no components and the map after the gift-card change drawn against today's map, are in `/tmp/claude-0/-home-user/cdf782aa-10b7-528c-9e97-39ba0972e579/scratchpad/a-store-tests/`.

## The system

The Store sells home goods online. Shoppers browse, order, cancel and follow their orders in a web shop and a mobile app, and only the app shows their loyalty balance. Behind the scenes, a fraud check holds payments that look risky, and fraud analysts decide on each held order in an internal review console. Store managers keep the catalog right in a dashboard, and import whole catalog files with the `store` command. Inside, Storefront keeps the orders and calls on Catalog for products and stock, Loyalty for points, Payments for the money, and an outside shipping partner to send each order. Payments opens one level further, into Charge service and Fraud check, and Charge service asks the card network for the money.

Counts: 3 consumers, 1 provider, 4 components at Level 2 and 2 at Level 3, 2 outside services, 7 resources, 10 boundaries, 22 capabilities. Two of the 22 repeat: the card network boundary exists for Payments and again for Charge service, as the map format requires.

## Walkthrough

The renderer draws Level 1 and Level 2 on the same screen: the Store screen shows the components beside the capabilities. Steps 2 to 8 therefore use cut-down maps, with the Store's `components` removed and only the consumers met so far. I rendered one such map to check that it draws a clean Level 1 screen; it does. Steps 9 to 12 use the full map.

### 1. What the Store is

- On the map: nothing yet, or a sketch of the Store as one box.
- Introduces: the system the page follows.
- Draft: "The Store sells home goods online. Shoppers buy through a web shop and a mobile app, and Store employees work behind the scenes with tools of their own."

### 2. The first consumer and the provider

- On the map: All providers, cut down to the Shopper and the Store, with one line between them.
- Introduces: consumer, provider, boundary, external boundary, Level 1.
- Draft: "The first consumer is the one everyone thinks of, the Shopper. The provider is the Store: what the shopper believes they are using, with the servers and apps behind it hidden for now. The line between them is a boundary, and since the Shopper is outside the system, it is an external boundary, at Level 1."

### 3. A second consumer inside the company

- On the map: All providers, cut down to the Shopper, the Fraud analyst and the Store. A second line runs into the same box.
- Introduces: a consumer is a role with goals of its own; internal tools count; one boundary per consumer and provider.
- Draft: "Fraud analysts work for the Store. A fraud check holds orders that look risky, and an analyst decides on each one in an internal review console. Analysts want something shoppers never ask for, so they are a second consumer, with a second boundary to the same Store."

### 4. Two interfaces, one boundary

- On the map: the Store screen of the Level 1 map. Select Shopper: web shop and mobile app light up. A line runs from each to Shop, and only the mobile app has a line to See loyalty balance.
- Introduces: interface; a boundary is not an interface; a capability that one interface offers and the other does not.
- Draft: "The Shopper reaches the Store through two interfaces, the web shop and the mobile app. They do not offer the same things: only the app shows the loyalty balance. It is still one boundary, because there is one consumer and one provider. A third interface tomorrow would not add a boundary."

### 5. A third consumer, on the command line

- On the map: same screen. Select Store manager: dashboard and store CLI light up, both leading to Manage the catalog. Select store CLI: the panel lists List products and Import catalog. Select dashboard: it lists List products, Edit product and Alert on low stock. The drawing alone does not show the difference, since all four capabilities sit in one area box.
- Introduces: a command line as an interface; a client that only relays is part of its interface; what stays out.
- Draft: "Store managers keep the catalog right. They edit products in a dashboard and import a whole catalog file with the `store` command. The same command also migrates the database. That works on the system, not with it, so it stays off the map."

### 6. Capabilities

- On the map: same screen. Select Shop: the panel lists Browse products, Place order, List past orders and Cancel order, each with its modes. Select Place order: the panel shows what it takes and what it gives.
- Introduces: capability, verb names, output, and three look-alikes: a step, an interaction, and what the provider does on its own.
- Draft: "A capability is something the consumer can do to get a result. Its name starts with a verb, and it says what it takes and what it gives back: Place order takes a cart, an address and a card, and gives the order, confirmed or on hold. Entering a card, or trying another one after a decline, happens inside Place order, so neither is a capability. Neither is the fraud check flagging a payment: the Store does that on its own, and the analyst's capabilities start from what it flagged."

### 7. Resources, and how capabilities act on them

- On the map: same screen. The Store box keeps Product, Order, Loyalty balance and Fraud review. Select Product: Shop and Manage the catalog light up, and the panel lists its properties and the five capabilities that act on it, each with its mode.
- Introduces: resource, property, relationship, the four modes, representation.
- Draft: "Capabilities work on resources, things with a state the consumer cares about. Browse products observes a Product, Edit product mutates it, Place order produces an Order, and Alert on low stock reacts when a product's stock falls below a threshold. Price and stock are properties of a product, not resources. An order holds one or more products, and a fraud review is about one order. The catalog file a store manager imports is a representation of products: nobody keeps it once the import is done."

### 8. Core and supporting areas

- On the map: same screen, the four capability boxes, each marked core or supporting.
- Introduces: area, core, supporting.
- Draft: "Capabilities that serve one purpose form an area. Shoppers come to shop, so Shop is their core area. They could do without the loyalty balance, so it sits in a supporting area. Analysts and store managers each have one core area and nothing else."

### 9. Inside the Store: components

- On the map: the full map, Store screen. The Components column shows Storefront, Catalog, Loyalty and Payments, each with the resources it keeps. Select Shop: all four light up, because placing an order needs each of them.
- Introduces: Level 2, component, what is not a component, implementation choice.
- Draft: "Open the Store and Level 2 shows the components it relies on. Each keeps state that only it changes, or makes decisions that only it makes: Catalog changes products, Storefront changes orders, Loyalty decides how many points an order earns, and Payments takes the money. The web shop's code, the mobile gateway and the databases are not components. They present, pass on or store what a component owns."

### 10. Internal boundaries and their contracts

- On the map: Store screen, the lines from Storefront to Catalog, Loyalty and Payments. Then open Catalog: Storefront uses it through the catalog API, for Get products for orders.
- Introduces: internal boundary, a component as consumer, a contract as interface, a step at one level that is a capability at the next.
- Draft: "To take an order, Storefront needs the other three components. It is their consumer, so each pair has an internal boundary, and each boundary's interface is a contract: the catalog API, the loyalty API, the charges API. Reserving stock is only a step of Place order for the shopper. For Storefront it is a capability, with an output of its own: the stock held, or the lines that ran out."

### 11. An outside service, and answers that come back later

- On the map: Store screen, Shipping partner as a dashed box after Storefront. Open it: Storefront uses Ship order through the shipping API. Select the shipping API: its description says it brings back each parcel's delivery status. The charges API says the same of a held charge, on the Payments screen of step 12.
- Introduces: outside service; a boundary points one way; a callback belongs to the boundary whose capability it completes.
- Draft: "Storefront hands each confirmed order to the Shipping partner, an outside service with shipments of its own. The partner sends delivery updates back as the parcel moves, and a held charge's outcome reaches Storefront later, on the charges API. These answers travel back, but each boundary still points one way: they complete Ship order and Charge order, which Storefront asked for."

### 12. Zoom in once more: Level 3

- On the map: open Payments. Storefront reaches Charge orders through the charges API; inside sit Charge service and Fraud check, with Card network as a dashed box. Then open Fraud check: Charge service uses Score payment through the fraud scoring API.
- Introduces: Level 3, the same pattern one level down, a resource kept by two components, a component that serves a Level 1 consumer.
- Draft: "Payments opens into two components of its own. Charge service alone changes a charge, and Fraud check alone decides a score and keeps the analysts' reviews. Both keep a Charge, each its own record: Fraud check keeps every charge it scored. It is the same pattern as one level up, a consumer, a boundary and a provider. Fraud check is also where an analyst's decision lands, so the review console from step 3 leads here, two levels down."

## Coverage

| Concept | Where it appears | Fit |
| --- | --- | --- |
| Consumer | Shopper, Fraud analyst, Store manager | Natural |
| Provider | Store | Natural |
| Boundary | Ten in all, one per consumer and provider | Natural |
| External boundary | The three Level 1 boundaries into the Store | Natural |
| Internal boundary | Storefront to Catalog, Loyalty and Payments; Charge service to Fraud check | Natural |
| Interface | web shop, mobile app, review console, dashboard, store CLI | Natural |
| Two interfaces that differ | See loyalty balance only in the mobile app; Edit product only in the dashboard, Import catalog only in the store CLI | Natural. It is the model's own example, and the store manager repeats it |
| Capability | 22, such as Place order, Decide fraud review, Import catalog | Natural |
| Area, core and supporting | Shop core and See loyalty balance supporting; every other boundary has one core area | Natural, but only the Shopper shows a supporting area |
| Resource | Product, Order, Loyalty balance, Fraud review, Charge, Card authorization, Shipment | Natural |
| Property | Product price, stock and low-stock threshold; order status and tracking number; review score and reasons | Natural |
| Relationship | Resource descriptions: an order holds one or more products, each order has one charge, a fraud review is about one order | Natural in the domain, but the map format has no field for it and the drawing shows none. The page has to say it in text |
| Mode | observes in Browse products, mutates in Edit product, produces in Place order, reacts in Alert on low stock | Natural. reacts appears once only |
| Output | Every capability's `gives`, such as Place order giving the order confirmed or on hold | Natural |
| Representation | The catalog file Import catalog takes, the file of codes Issue gift cards gives after the change, the dashboard notice Alert on low stock gives | A little forced. Representations exist only in `takes` and `gives` text; nothing draws them |
| Look-alike that is not a capability | Entering a card and retrying a declined card inside Place order; the fraud check flagging payments and Loyalty expiring points, both in `excluded`; Reserve stock, a step for the shopper and a capability for Storefront | Natural, and the Reserve stock case is a good one |
| Component | Storefront, Catalog, Loyalty, Payments; Charge service and Fraud check | Natural, except Loyalty: a little forced, split out of Storefront to reach four components |
| Not a component | Clients, the mobile gateway, the search index, the scoring model, the card network adapter, the money library, all in `parts` | Natural, but `parts` are not drawn; the page has to list them |
| Contract between components | catalog API, loyalty API, charges API, fraud scoring API | Natural |
| Callback inside its boundary | Held charge outcome on the charges API; the analyst's decision on the fraud scoring API; delivery updates on the shipping API | Natural |
| A resource kept by two components | Charge, kept by Charge service and by Fraud check | A little forced. It is the model's example, but readers need a sentence on why Fraud check keeps its own record |
| Outside service | Shipping partner for Storefront; Card network for Payments and Charge service | Natural |
| Level 3 | Payments opens into Charge service and Fraud check | Natural |
| What stays out | `store migrate` and `store seed`, fraud model training, deploy, tests, flagging, points expiry, index rebuilds and health checks; sign-in left out by the corpus | Natural |
| Implementation choice | The scoring model, the outcome queue, the databases | Natural |

Not in this example, and not asked for: a shared component, a component with variants, a consumer that is another system, and a surface that is a separate provider. The review console comes close to the last one, and the map records in `questions` why it is not.

## The change

The site owner's change: let shoppers pay with gift cards. Shaping asked these questions, highest leverage first. The page can show them as asked and answered.

- Where do gift cards come from? Impact: adds Buy gift card for the Shopper, or Issue gift cards for the Store manager, or an outside gift-card service that keeps Gift card instead of Payments. Answer: store managers issue them in batches from the store CLI, to sell in partner shops and give away. Selling them in the web shop is a later change.
- Is a gift card a kind of loyalty balance? Impact: decides whether Loyalty or Payments keeps Gift card, and whether Storefront's boundary with Loyalty changes. Answer: no. Points are a reward; a gift card is money the shopper spends like a card, so Payments keeps it. "Voucher", "store credit" and "prepaid balance" all mean Gift card here.
- Does a canceled order paid by gift card give the money back? Impact: modifies Cancel order and Refund order, or leaves them alone and stops shoppers canceling such orders. Answer: yes, back on the same gift card.
- Does Payments need a new component for gift cards? Impact: could add a component and an internal boundary inside Payments. Answer: no. Charge service alone changes balances, when it charges, refunds and issues.
- Can store managers block a lost gift card? Impact: adds Block gift card. Answer: not in this change.

The shape, in the form `shape-boundaries` gives:

```markdown
Resources of Store:

- NEW **Gift card**: a code with money on it, which pays for orders until its balance runs out.

Resources of Payments:

- NEW **Gift card**: kept inside Payments by Charge service, which alone changes a gift card's balance.

**Shopper <-> Store**: MODIFIED, shoppers pay with a gift card, get the money back on it when they cancel, and see what is left on it.

- Interfaces: web shop · mobile app
- Shop (core)
  - MODIFIED Place order: produces **Order** · mutates **Loyalty balance** · mutates **Gift card**
  - MODIFIED Cancel order: mutates **Order** · mutates **Loyalty balance** · mutates **Gift card**
- See gift card balance (supporting)
  - NEW See gift card balance: observes **Gift card**

**Store manager <-> Store**: MODIFIED, store managers issue gift cards in batches.

- Interfaces: dashboard · store CLI
- Issue gift cards (supporting)
  - NEW Issue gift cards: produces **Gift card** [store CLI]

**Storefront <-> Payments**: MODIFIED, a charge or a refund can move money on a gift card.

- Interfaces: charges API
- Charge orders (core)
  - MODIFIED Charge order: produces **Charge** · mutates **Gift card**
  - MODIFIED Refund order: mutates **Charge** · mutates **Gift card**

**Shape complete: YES**

**Open**

- None.

**Details**

- Can a gift card pay part of an order, with a card paying the rest? — About: Place order, Charge order
- What does checkout show for an expired or empty gift card? — About: Place order
- Do gift cards expire, and when? — About: Gift card
- Do gift card payments earn loyalty points? — About: Place order
- Does Fraud check score payments made by gift card? — About: Charge order
- What does Issue gift cards write out, and in what form? — About: Issue gift cards
- When an order paid by both is canceled, what goes back where? — About: Cancel order, Refund order
```

The dashes in `Details` are the `shape-boundaries` template's own; the page text around it uses none. Three boundaries do not change, and the page can say why: the fraud analyst's, since a gift-card order is reviewed like any other; Charge service with Fraud check, since whether Fraud check scores gift-card payments is a detail; and both card network boundaries, since money on a gift card never reaches the card network. See gift card balance is a capability and not a step of paying: shoppers check a card before they shop, which the model's seat-availability example matches.

I drew the map after the change against today's map with `render-map.mjs --against`. The Store screen marks Shop and Payments Changed, See gift card balance and Issue gift cards New, and Gift card new on Payments. It is a good image for the page.

### Slices

Option A, by interface, web first. Recommended.

Tradeoff: shoppers can pay with gift cards after the first slice, and each later slice adds one thing they can see. The first slice is the heaviest, since it carries the Charge service change and issuing. Leaving refunds out of it would be worse: a shopper who cancels a gift-card order would get nothing back.

1. Pay with a gift card on the web: a store manager issues gift cards, and a shopper pays with one in the web shop and gets the money back on it after canceling.
   - Boundary changes: NEW Gift card; NEW Issue gift cards; MODIFIED Charge order; MODIFIED Refund order; MODIFIED Place order and Cancel order, split to the web shop
2. See a gift card's balance: a shopper enters a code in the web shop or the app and sees what is left.
   - Boundary changes: NEW See gift card balance
3. Pay with a gift card in the app.
   - Boundary changes: MODIFIED Place order and Cancel order, split to the mobile app

Option B, issue first. A store manager can issue gift cards in slice 1, shoppers pay and cancel on both interfaces in slice 2, and see balances in slice 3. Smells: a heavy second slice, and an invalid intermediate state after slice 1 if any issued card reaches a shopper, since nothing accepts it yet.

The three slices of option A match the three increments on page 01, with issuing and refunds added to the first.

### Details settled in refinement, for slice 1

- Expected behavior: when an order costs more than a gift card holds, the gift card pays all it holds and the shopper's card pays the rest. This settles the part-payment question in the same way page 01 does.
- Expected behavior: after a shopper cancels an order paid partly by gift card, the gift card holds what it held before the order, and the card gets the rest back.
- Design decision: Charge service authorizes the card before it takes money off the gift card, so a declined card leaves the gift card as it was.
- Design decision, as on page 01: each gift card's balance is kept as a list of adjustments, the way Loyalty keeps points. The adjustments are how the balance is kept, not a resource, which is the model's own balance example.

### Issues

- Pay with a gift card on the web. Proof of done: issue a gift card with the store CLI, pay part of an order with it in the web shop, cancel the order, and see the gift card hold what it held before.
- See a gift card's balance. Proof of done: enter a gift card code in the web shop and in the app, and see the money left and the expiry date.
- Pay with a gift card in the app. Proof of done: pay an order with a gift card in the mobile app, and see its balance go down.

## Weak spots

- The drawing does not follow the outside-in order. The Store screen shows Level 1 and Level 2 together, so steps 2 to 8 need cut-down maps, or the components show up before the page has earned them. The cut-down maps are easy to make, but they are hand-made variants of the map that the site has to keep in step with it.
- Card network does not appear on the Store screen. The renderer hides Payments' boundary with Card network because Charge service's boundary with it refines it, and Charge service is not on that screen. Card network shows up only inside Payments. Step 11 works anyway because Shipping partner is drawn at Level 2, but this looks like a renderer gap: the map holds a Level 2 boundary that no Level 2 screen draws.
- The top screen lists Charge among the Store's resources, because the renderer counts what components keep inside it. No Level 1 capability works on Charge, and the model's own text example leaves it out of the Store. Step 2 should use a cut-down map anyway.
- The fraud analyst's link to Fraud check is not drawn. Fraud check's screen shows only Charge service as its consumer. The reader learns that analysts' decisions land in Fraud check only from the panel, or by selecting Review flagged orders on the Store screen. Step 12's last sentence needs the page text to carry it.
- The model's own example says a fraud-scoring module "may be" a provider to a fraud analyst who works with it directly. Readers who know that line will ask why Fraud check is not a provider here. The map answers it in `questions`: analysts use the Store's review console, which has no data of its own. The page should say so in step 3 or 12.
- The example departs from the model's text in two places. Loyalty is its own component, where the model has "Storefront: shopping and loyalty". The card network area is "Take card payments", with Refund card payment added, where the model has one area and one capability named Authorize card payment. Page 02 shows the model's version, so the two pages will disagree unless one of them changes. Both changes have reasons: four components, and refunds that reach the card.
- Loyalty is the weakest component. It passes the test, since only it decides points, but it is there mainly to reach four components at Level 2. A reader who asks "why not inside Storefront?" is right to ask; the map records the choice in `questions`.
- Storefront sounds like the web shop. It is the component that keeps orders. That is a useful point to make in step 9, since the web shop is an interface, but the name works against it.
- Only the Shopper shows core and supporting areas. In the change, Issue gift cards becomes a supporting area of the store manager, which is a little forced: managers would not skip it, it is just not why they come.
- Relationships, representations and `parts` are in the map's text, not in the drawing. Steps 7 and 9 need text or a small sketch for them.
- The drawing shows which interface offers a capability only at the level of an area box. See loyalty balance works because it is an area of its own. The store manager's interface differences, Edit product only in the dashboard and Import catalog only in the store CLI, are visible only by selecting an interface and reading the panel.
- Reserve stock both holds and puts back stock, through one capability. It keeps the count down, but "takes a canceled order's lines to put back" is awkward.
- Shipping partner adds a box, a boundary and a resource. It is there so orders have somewhere to go and Cancel order has a natural limit, "an order that has not shipped yet". Dropping it would leave both questions open.
- Sign-in, accounts and saved cards are left out by the corpus. List past orders and See loyalty balance take "the shopper's account", so a careful reader will notice.
- The walkthrough's shape is larger than page 01's four items: it adds Issue gift cards, Cancel order and Refund order. Page 01 should show its items as a first cut, or match this shape, or the two pages will contradict each other.
- The page is dense: the Store screen holds 3 consumers, 5 interfaces, 4 areas, 4 components and an outside service, and the map has 22 capabilities. It fits the limits, but each step should light only what it introduces.

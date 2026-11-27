# Walkthrough example A: the Store

Page 05 of the site, `site/src/content/docs/walkthrough.mdx`, is built from this design. The maps it draws moved out of this folder, so they outlive the prototypes:

- `site/maps/store/map.json`: the map of the Store today.
- `site/maps/store/after-gift-cards.json`: the map after the gift-card change, drawn against today's map with `render-map.mjs --against`. It exists only to draw the change: a planned change does not belong in the map itself.
- `site/scripts/draw-maps.mjs` cuts the Level 1 maps for steps 2 to 8 from `map.json` on every build, as `steps/make-steps.mjs` did, and draws every map. `steps/` and `change/` here keep the drawings made during the design.

## The system

The Store sells home goods online. Shoppers browse, order, cancel and follow their orders in a web shop and a mobile app, and the app can also show a product in the shopper's room through the phone's camera. Behind the scenes, a fraud check holds payments that look risky, and fraud analysts decide on each held order in an internal review console. Store managers keep the catalog right in a dashboard, and import whole catalog files with the `store` command. Inside, Storefront keeps the orders and the loyalty points, and calls on Catalog for products and stock, on Payments for the money, and on an outside shipping partner to send each order. Payments opens one level further, into Charge service and Fraud check, and Charge service asks the card network for the money.

Counts: 3 consumers, 1 provider, 3 components at Level 2 and 2 at Level 3, 2 outside services, 7 resources, 9 boundaries, 23 capabilities. Two of the 23 repeat: the card network boundary exists for Payments and again for Charge service, as the map format requires.

## Walkthrough

The renderer draws Level 1 and Level 2 on the same screen, so steps 2 to 8 use Level 1 maps with no components, cut from the full map. Each step lights only what it introduces.

| Steps | Map | Screen |
| --- | --- | --- |
| 2 | `steps/step-02.json` | All providers |
| 3 | `steps/step-03.json` | All providers |
| 4 | `steps/step-03.json` | Store |
| 5 to 8 | `steps/step-05.json` | Store |
| 9 to 11 | `map.json` | Store, then Catalog and Shipping partner |
| 12 | `map.json` | Payments, then Fraud check |

### 1. What the Store is

- On the map: nothing yet. A sketch of one box named Store is enough.
- Introduces: the system the page follows.

The Store sells home goods online. Shoppers buy through a web shop and a mobile app. Behind the scenes, Store employees catch fraud and keep the catalog up to date, each with a tool of their own.

We will map it from the outside in. First we ask who uses the Store and for what. Only then do we open it and look at how it is built.

### 2. The first consumer and the provider

- On the map: step-02, All providers. The Shopper, the Store, and one line between them.
- Introduces: consumer, provider, boundary, external boundary, Level 1.

Start with the consumer everyone thinks of first: the Shopper. A consumer is a role, not a person. Anyone buying from the Store is a Shopper while they shop.

The provider is the Store: the thing the shopper believes they are using. The servers, apps and outside companies behind it stay hidden for now.

The line between them is a boundary. It is where the Store offers things to the Shopper. The Shopper is outside the system, so this boundary is external. External boundaries make up Level 1, the top of the map.

### 3. A second consumer inside the company

- On the map: step-03, All providers. The Fraud analyst joins the Shopper, with a second line into the same Store.
- Introduces: a consumer has goals of its own; internal tools count; one boundary per consumer and provider; external means outside the system.

The Store holds orders that look risky. Fraud analysts, who work for the Store, decide on each held order in an internal review console. They want something no shopper ever asks for, so they are a second consumer, with a second boundary to the same Store.

Their boundary is external too. External means outside the system, not outside the company: analysts use the Store, they are not part of it. Their review console belongs on the map even though only staff ever see it, because they use it to get their work done.

### 4. Two interfaces, one boundary

- On the map: step-03, Store screen. The Shopper connects to the web shop and the mobile app. Both lead to Shop and See loyalty balance, and only the mobile app leads to See product in your room.
- Introduces: interface; a boundary is not an interface; a capability that only one interface offers.

The Shopper reaches the Store through two interfaces: the web shop and the mobile app. An interface is the channel a consumer uses.

The two do not offer the same things. Only the app can show a sofa in your living room, at its real size, because it needs the phone's camera.

It is still one boundary: one consumer, one provider, however many interfaces. The boundary says what the Shopper can do. An interface only says where they do it.

### 5. A third consumer, on the command line

- On the map: step-05, Store screen. The Store manager connects to the dashboard and the store CLI, which both lead to Keep the catalog right. Select the store CLI: the panel lists List products and Import catalog. Select the dashboard: it lists List products, Edit product and Alert on low stock.
- Introduces: a command line as an interface; a consumer's own scripts; what stays out.

Store managers keep the catalog right. They edit products in a dashboard. When a supplier sends a new price list, they import the whole file with the `store` command.

A store manager who runs that import every night from a script is still a store manager. The script is their own way of using the store CLI, not a new consumer.

The same `store` command can also migrate the Store's database. That works on the system, not with it, like the tools that build and deploy it, so it stays off the map.

### 6. Capabilities

- On the map: step-05, Store screen. Select Shop: the panel lists Browse products, Place order, List past orders and Cancel order. Select Place order: the panel shows what it takes and what it gives.
- Introduces: capability, verb names, output, and what looks like a capability but is not.

A capability is something a consumer can do with the provider to get a result. Its name starts with a verb, and it says what it takes and what it gives back. Place order takes a cart, a delivery address and a card. It gives the order, confirmed or on hold for review.

Some things look like capabilities and are not. As an order goes through, the Store checks that each product is still in stock. That check is a step of Place order: its only result is whether the order goes ahead. Browse products shows the same stock, but shoppers come to it on its own, to find out, and often leave without buying. So Browse products is a capability, and the stock check is not.

Entering a card, or trying another one after a decline, are steps of Place order too. And when the fraud check flags a payment, the Store does that on its own. No consumer asks for it, so it is not a capability either.

### 7. Resources, and how capabilities act on them

- On the map: step-05, Store screen. The Store keeps Product, Order, Loyalty balance and Fraud review. Select Product: Shop, See product in your room and Keep the catalog right light up, and the panel lists its properties and every capability that acts on it, with its mode. Then select Keep the catalog right to show Alert on low stock.
- Introduces: resource, property, relationship, the four modes, representation.

Capabilities work on resources: things with a state the consumer cares about. The Store's resources are Product, Order, Loyalty balance and Fraud review.

Each capability says how it acts on them. Browse products observes products. Place order produces an order. Edit product mutates a product, and can set its low-stock threshold. Alert on low stock reacts: when a product's stock falls below that threshold, the store manager gets a notice.

A product's price, stock and low-stock threshold are its properties: details that nobody finds or acts on alone. Resources also relate to each other. An order holds one or more products, and each fraud review is about one order.

The catalog file a store manager imports is a representation of products, one form they take. Nobody keeps that file once the import is done, so it is not a resource.

### 8. Core and supporting areas

- On the map: step-05, Store screen. The five area boxes, each marked core or supporting.
- Introduces: area, core, supporting.

Capabilities that serve one purpose form an area. Shoppers come to shop, so Shop is their core area. They could do without seeing a product in their room, or checking their points, so those are supporting areas.

Each boundary has exactly one core area. Analysts come to review flagged orders and store managers to keep the catalog right, and neither has anything else.

### 9. Inside the Store: components

- On the map: `map.json`, Store screen. The Components column shows Storefront, Catalog and Payments, each with the resources it keeps. Select Shop: all three light up, because placing an order needs each of them.
- Introduces: Level 2, component, what is not a component.

Now open the Store. Level 2 shows the components it relies on to keep its promises. A component keeps state that only it changes, or makes decisions that only it makes.

Storefront keeps the orders and the loyalty points, and decides how many points an order earns. Catalog keeps the products, with their prices and stock. Payments takes the money and gives it back, and decides which payments to hold.

Storefront is not the web shop. The web shop and the mobile app only present what the components offer, so they are part of the interfaces. The gateway that passes the app's calls on, the search index that makes browsing fast, and the databases are not components either. They pass on or store what a component owns.

### 10. Internal boundaries and their contracts

- On the map: `map.json`, Store screen, the lines from Storefront to Catalog and Payments. Then open Catalog: Storefront uses it through the catalog API, for Get products for orders.
- Introduces: internal boundary; a component as consumer; a contract as interface; a step for one consumer that is a capability for another.

To take an order, Storefront needs Catalog and Payments. That makes Storefront their consumer, so each pair has a boundary of its own. These are internal boundaries, inside the system. The interface of an internal boundary is a contract: here, the catalog API and the charges API.

Opening Catalog shows what Storefront gets from it: Look up products, Reserve stock and Release stock. For the Shopper, reserving stock was only a step of Place order. For Storefront it is a capability, with a result of its own: the stock held, or the lines that ran out. Whether something is a capability depends on who the consumer is.

### 11. Outside services, and answers that come back later

- On the map: `map.json`, Store screen. Shipping partner is a dashed box after Storefront. Open it: Storefront uses Ship order through the shipping API.
- Introduces: outside service; a boundary points one way; an answer that comes back belongs to the capability it completes.

Storefront hands each confirmed order to the Shipping partner, an outside company with a warehouse. An outside service is not part of the Store, but the Store relies on it, so Storefront has a boundary with it like any other. Payments relies on another one, the card network, which shows up once Payments opens.

Some answers come back later. The shipping partner sends delivery updates as the parcel moves. When the fraud check holds a payment, Payments tells Storefront the outcome once an analyst decides. These messages travel back, but each boundary still points one way, from the consumer who asked to the provider who delivers. Each message completes a capability Storefront asked for: Ship order, or Charge order.

### 12. Zoom in once more: Level 3

- On the map: `map.json`. Open Payments: Storefront reaches Charge orders through the charges API, and inside sit Charge service and Fraud check, with the card network as a dashed box. Then open Fraud check: Charge service uses Score payment through the fraud scoring API.
- Introduces: Level 3; the same pattern one level down; one resource kept by two components; why Fraud check is not the analysts' provider.

Payments opens into two components of its own. Charge service runs each charge and refund, and it alone changes a charge. Fraud check alone decides a payment's score, and keeps the analysts' reviews. Charge service is Fraud check's consumer, through the fraud scoring API. It is the same pattern as one level up: a consumer, a boundary, a provider.

Both components keep a Charge, each its own record. Charge service keeps the charge itself, and Fraud check keeps its own record of every charge it scored. One resource can live in two components, under one name.

Fraud check is also where the analysts' decisions land: the review console from step 3 leads here, two levels down. Fraud check is still not the analysts' provider. They use the Store's review console, which has no data of its own, so to them it is the Store.

## Coverage

| Concept | Where it appears | Fit |
| --- | --- | --- |
| Consumer | Shopper, Fraud analyst, Store manager | Natural |
| Provider | Store | Natural |
| Boundary | Nine in all, one per consumer and provider | Natural |
| External boundary | The three Level 1 boundaries; step 3 adds "outside the system, not outside the company" | Natural |
| Internal boundary | Storefront to Catalog and Payments; Charge service to Fraud check | Natural |
| Interface | web shop, mobile app, review console, dashboard, store CLI; the contracts inside | Natural |
| Two interfaces that differ | See product in your room, only in the mobile app, because it needs the camera; the store manager's dashboard and store CLI | Natural, and the drawing shows the Shopper's case |
| A consumer's own scripts | A store manager's nightly import script, in step 5's text | Natural, text only |
| Capability | 23, such as Place order, Decide fraud review, Import catalog | Natural |
| Area, core and supporting | Shop core; See product in your room and See loyalty balance supporting | Natural, but only the Shopper has supporting areas |
| Resource | Product, Order, Loyalty balance, Fraud review, Charge, Card authorization, Shipment | Natural |
| Property | Product price, size, stock and low-stock threshold; order status and tracking number; review score and reasons | Natural |
| Relationship | Resource descriptions: an order holds one or more products, each order has one charge, a fraud review is about one order | Natural, but the map format has no field for it and the drawing shows none; text only |
| Mode | observes in Browse products, produces in Place order, mutates in Edit product, reacts in Alert on low stock | Natural; reacts appears once, on the store manager |
| Output | Every capability's `gives`, such as the order confirmed or on hold | Natural |
| Representation | The catalog file Import catalog takes; the product drawn in the room; the dashboard notice | Natural, but only in `takes` and `gives` text; nothing draws them |
| Look-alike paired with a capability | The stock check inside Place order next to Browse products; in the change, the gift card check at checkout next to See gift card balance | Natural |
| Other look-alikes | Entering a card, retrying a declined card, the fraud check flagging payments, points expiry; Reserve stock as a step for the shopper and a capability for Storefront | Natural |
| Component | Storefront, Catalog, Payments; Charge service, Fraud check | Natural |
| Not a component | Clients, the mobile gateway, the search index, the scoring model, the card network adapter, the money library, in `parts` | Natural, but `parts` are not drawn; text only |
| Contract between components | catalog API, charges API, fraud scoring API | Natural |
| Answers inside their boundary | A held charge's outcome on the charges API; the analyst's decision on the fraud scoring API; delivery updates on the shipping API | Natural |
| A resource kept by two components | Charge, kept by Charge service and by Fraud check | A little forced; the page gives one sentence on why Fraud check keeps its own record |
| Outside service | Shipping partner for Storefront; Card network for Payments and Charge service | Natural |
| Level 3 | Payments opens into Charge service and Fraud check | Natural |
| What stays out | `store migrate` and `store seed`, fraud model training, deploy, tests, flagging, points expiry, index rebuilds and health checks; sign-in left out by the corpus | Natural |
| Implementation choice | The scoring model, the outcome queue, the databases | Natural |
| NEW, MODIFIED, REMOVED | The change has NEW and MODIFIED at three levels, with a NEW component and a NEW internal boundary; REMOVED appears in one aside | NEW and MODIFIED natural; REMOVED shown in an aside |

## The change

### Page text

A shopper should be able to pay with a gift card. Before anyone talks about tables or endpoints, `shape-boundaries` turns that request into boundary changes, marked against the map: NEW, MODIFIED or REMOVED.

It asks one question at a time, the one that could change the shape most, with a recommended answer. A question whose answer cannot add, remove or redefine a boundary change waits in Details, for refinement.

Checking a gift card at checkout is a step of Place order: its only result is whether the gift card pays. Seeing a gift card's balance is a capability: people check a card before they shop, and some never do. So the shape adds See gift card balance, and no "Check gift card".

### Questions asked while shaping

- Where do gift cards come from? Impact: adds Issue gift cards for the Store manager, or Buy gift card for the Shopper, or an outside gift card service that keeps Gift card instead of the Store. Answer: store managers issue them in batches from the store CLI, for partner shops to sell. Selling them in the web shop is a later change.
- Is a gift card a kind of loyalty balance? Impact: decides whether Storefront keeps Gift card beside the points, or Payments does. Answer: no. Points are a reward; a gift card holds money someone paid, and shoppers spend it like a card, so Payments keeps it. "Voucher", "store credit" and "prepaid balance" all mean Gift card here.
- Does a canceled order paid by gift card give the money back? Impact: modifies Cancel order and Refund order, or leaves them alone and stops shoppers canceling such orders. Answer: yes, back on the same gift card.
- Who inside Payments keeps gift cards? Impact: Charge service keeping them changes no boundary inside Payments; a component of their own adds a component and an internal boundary. Answer: a new Gift cards component. Issuing cards and keeping balances is not running a charge, and Charge service would otherwise serve the store manager.
- Can store managers block a lost gift card? Impact: adds Block gift card. Answer: not in this change.

### The shape

```markdown
Resources of Store:

- NEW **Gift card**: a code with money on it, which pays for orders until its balance runs out.

**Shopper <-> Store**: MODIFIED, shoppers pay with a gift card, alone or with a card, get the money back on it when they cancel, and see what is left on it.

- Interfaces: web shop · mobile app
- Shop (core)
  - MODIFIED Place order: produces **Order** · mutates **Loyalty balance** · mutates **Gift card**
  - MODIFIED Cancel order: mutates **Order** · mutates **Loyalty balance** · mutates **Gift card**
- See gift card balance (supporting)
  - NEW See gift card balance: observes **Gift card**

**Store manager <-> Store**: MODIFIED, store managers issue gift cards in batches for partner shops to sell.

- Interfaces: dashboard · store CLI
- Issue gift cards (supporting)
  - NEW Issue gift cards: produces **Gift card** [store CLI]

Resources of Payments:

- NEW **Gift card**: the same gift card, kept by a new component inside Payments.

**Storefront <-> Payments**: MODIFIED, a charge or a refund can move money on a gift card.

- Interfaces: charges API
- Charge orders (core)
  - MODIFIED Charge order: produces **Charge** · mutates **Gift card**
  - MODIFIED Refund order: mutates **Charge** · mutates **Gift card**

Inside Payments: NEW component **Gift cards**: keeps gift cards and their balances; serves Storefront › Charge orders, Shopper › See gift card balance, Store manager › Issue gift cards.

Resources of Gift cards:

- NEW **Gift card**: the gift card and its balance, which only Gift cards changes.

**Charge service <-> Gift cards**: NEW, Charge service takes money off a gift card for a charge and puts it back for a refund.

- Interfaces: NEW gift cards API
- Charge gift cards (core)
  - NEW Charge gift card: mutates **Gift card**
  - NEW Refund gift card: mutates **Gift card**

**Shape complete: YES**

**Open**

- None.

**Details**

- Can a gift card pay part of an order, with a card paying the rest? — About: Place order, Charge order
- What does checkout show for an unknown or empty gift card? — About: Place order
- Do gift cards expire? — About: Gift card
- Do gift card payments earn loyalty points? — About: Place order
- Does Fraud check score payments made by gift card? — About: Charge order
- What does Issue gift cards write out? — About: Issue gift cards
- When an order paid by both is canceled, what goes back where? — About: Cancel order, Refund order
```

The dashes in Details and the "Inside Payments" line follow the skills' own formats. Three boundaries do not change, and the page can say why. The fraud analyst reviews a gift-card order like any other. Score payment stays as it is, since whether Fraud check scores gift-card payments is a detail. The card network never sees a gift card.

Issue gift cards sits in a supporting area because store managers come to keep the catalog right, and issuing a batch of cards for partner shops is an occasional errand beside that.

The drawn comparison, `change/after-gift-cards.html`, marks Shop, Payments and Charge orders Changed, and See gift card balance, Issue gift cards, Gift cards and its boundary with Charge service New. Its Payments screen, `change/stills/2-store--payments.png`, is the best single image for this part of the page.

### Aside: what REMOVED looks like

Gift cards take nothing away, but a change can. If the Store had dropped its points when gift cards arrived, the shape would also say:

```markdown
Resources of Store:

- REMOVED **Loyalty balance**: the points a shopper earned from orders.

**Shopper <-> Store**: MODIFIED, shoppers no longer earn or see points.

- Shop (core)
  - MODIFIED Place order: produces **Order** · mutates **Gift card**
- See loyalty balance (supporting)
  - REMOVED See loyalty balance: observes **Loyalty balance**
```

### Slices

Option A: by interface, web first. Recommended.

Tradeoff: shoppers can pay with gift cards after the first slice, and each later slice adds one thing they can see. The first slice is the heaviest, since it carries the new component, its boundary and issuing. Leaving refunds out of it would be worse: a shopper who canceled a gift-card order would get nothing back, an invalid intermediate state.

1. Pay with a gift card on the web: a store manager issues gift cards, and a shopper pays with one in the web shop and gets the money back on it after canceling.
   - Boundary changes: NEW Gift card; NEW Issue gift cards; NEW Gift cards and NEW Charge service <-> Gift cards, with Charge gift card and Refund gift card; MODIFIED Charge order and Refund order; MODIFIED Place order and Cancel order, split to the web shop
2. See a gift card's balance: a shopper enters a code in the web shop or the app and sees what is left.
   - Boundary changes: NEW See gift card balance
3. Pay with a gift card in the app.
   - Boundary changes: MODIFIED Place order and Cancel order, split to the mobile app

Option B: issue first. Slice 1 lets a store manager issue gift cards, slice 2 lets shoppers pay and cancel on both interfaces, and slice 3 shows balances. Smells: a heavy second slice, and an invalid intermediate state after slice 1 if any issued card reaches a shopper, since nothing accepts it yet.

### Refinement of slice 1

Expected behavior:

- Issuing gift cards with the store CLI, for a number of cards and an amount, writes a file with one line per new card: its code and its amount.
- At checkout in the web shop, a shopper can enter a gift card code, and checkout shows how much the gift card will pay before the shopper confirms.
- When a gift card holds at least the order total, it pays the whole order, and checkout asks for no card.
- When a gift card holds less than the order total, it pays all it holds, and the shopper's card pays the rest.
- When a gift card holds nothing, checkout says the gift card is empty and asks for another way to pay. The order is placed only once it is paid in full.
- When checkout does not know a code, it says so.
- When a shopper cancels an order paid by gift card, each part goes back where it came from, and the gift card holds what it held before the order.
- An order earns loyalty points on its whole total, whether the shopper paid by card, gift card or both.
- Fraud check scores gift-card payments like card payments. When an analyst cancels a flagged order paid by gift card, the gift card gets its money back.

Design decisions:

- Gift cards live in a new Gift cards component inside Payments, which Charge service reaches through the gift cards API. Rejected: keeping them in Charge service, because issuing cards and keeping balances is not running a charge, and Charge service would then serve the store manager. Settled while shaping.
- Charge service authorizes the card before it takes money off the gift card. Rejected: the gift card first, because a declined card would then need the gift card's money put back, and in between the shopper would see money gone for an order that failed.
- Gift cards do not expire. Rejected: an expiry date on each card, because it adds a rule, a checkout message and a property shoppers must track, and nothing in this change needs it.
- Points count on the whole order total. Rejected: points only on the part paid by card, because a gift card holds money someone already paid in a partner shop, and shoppers would earn different points for the same basket depending on how they paid.
- Fraud check scores every charge, gift card or not. Rejected: skipping the score for gift-card payments, because stolen or guessed codes are a common way to commit fraud with gift cards.
- Checkout refuses an empty gift card with a message. Rejected: quietly charging the whole order to the card, because the shopper would not know whether the gift card worked.
- Gift cards keeps each balance as a list of adjustments, the way Storefront keeps points. Rejected: one balance number changed in place, because a refund, or a shopper asking where the money went, needs every payment and refund behind the balance. The adjustments are how the balance is kept, not a resource.

Slices 2 and 3 raise no new questions: the decisions above settle them.

- Slice 2: entering a gift card code in the web shop or the mobile app shows the money left on it; an unknown code shows that the Store does not know it.
- Slice 3: in the mobile app, every expected behavior of slice 1 that concerns checkout and canceling holds as it does in the web shop.

### Issues

Three standalone issues, one per slice. Each carries everything it needs, so none needs a parent.

```markdown
# Pay with a gift card in the web shop

## Parent

None

## Summary

Shoppers pay for an order in the web shop with a gift card, alone or with a card, and get the money back on it when they cancel. Store managers issue gift cards with the store CLI, for partner shops to sell.

## Type

AFK

## Before Starting

Confirm that each item below is available and works before implementing. If one is not, stop and ask rather than implement work that cannot be proven.

- Access to the card network's test environment, with a test card.

## Expected Behavior

- Issuing gift cards with the store CLI, for a number of cards and an amount, writes a file with one line per new card: its code and its amount.
- Web shop checkout accepts a gift card code and shows how much the gift card pays before the shopper confirms.
- A gift card that holds at least the order total pays the whole order, and checkout asks for no card.
- A gift card that holds less pays all it holds, and the shopper's card pays the rest.
- An empty gift card is refused with a message that it is empty, and the order is placed only once it is paid in full.
- An unknown code is refused with a message that the Store does not know it.
- Canceling an order paid by gift card puts each part back where it came from, and the gift card holds what it held before the order.
- An order earns loyalty points on its whole total, however it was paid.
- Fraud check scores gift-card payments like card payments; canceling a flagged gift-card order puts the money back on the gift card.

## Context and Decisions

- A new Gift cards component inside Payments keeps gift cards and their balances, and alone changes them. Charge service reaches it through a new gift cards API, with two operations: charge a gift card, and refund a gift card. Rejected: keeping gift cards in Charge service, because issuing and balances are not running a charge.
- The charges API's Charge order and Refund order now move money on gift cards; Storefront passes a gift card code with the card or instead of it.
- Charge service authorizes the card before it takes money off the gift card. Rejected: gift card first, which would need money put back after a decline.
- Gift cards do not expire. Rejected: an expiry date, which nothing in this change needs.
- Points count on the whole total. Rejected: points on the card part only, since a gift card holds money already paid in a partner shop.
- Fraud check scores every charge. Rejected: skipping gift-card payments, since stolen or guessed codes are a common fraud.
- Each balance is kept as a list of adjustments. Rejected: one number changed in place, which loses the history a refund or a question needs.
- Out of scope: the balance page, paying in the mobile app, selling gift cards in the web shop, and blocking a lost gift card.

## Proof of Done

In a local Store connected to the card network's test environment, issue one gift card of 30 with the store CLI. In the web shop, place an order of 50 with that gift card and the test card: checkout shows the gift card pays 30, the order is confirmed, and the test card is charged 20. Start another order with the same code: checkout says the gift card is empty. Cancel the first order, then start another order with the same code: checkout shows the gift card pays 30 again.

## Blocked by

None
```

```markdown
# See a gift card's balance

## Parent

None

## Summary

Shoppers enter a gift card code in the web shop or the mobile app and see how much money is left on it.

## Type

AFK

## Before Starting

Confirm that each item below is available and works before implementing. If one is not, stop and ask rather than implement work that cannot be proven.

- The mobile app running in a phone emulator that the agent can drive.

## Expected Behavior

- Entering a gift card code in the web shop shows the money left on it.
- Entering a gift card code in the mobile app shows the money left on it.
- An unknown code shows that the Store does not know it.

## Context and Decisions

- Gift cards keeps the balances, inside Payments; this issue adds the shoppers' way to read them, in both interfaces.
- Gift cards do not expire, so the balance is the only thing shown.
- Shoppers check a card before they shop, so this is a capability of its own, not part of checkout.

## Proof of Done

Issue a gift card of 30 with the store CLI, and pay 12 of an order with it in the web shop. Enter its code in the web shop and in the mobile app: both show 18 left. Enter a code that was never issued: both say the Store does not know it.

## Blocked by

Pay with a gift card in the web shop
```

```markdown
# Pay with a gift card in the mobile app

## Parent

None

## Summary

Shoppers pay for an order in the mobile app with a gift card, alone or with a card, and get the money back on it when they cancel, as they already can in the web shop.

## Type

AFK

## Before Starting

Confirm that each item below is available and works before implementing. If one is not, stop and ask rather than implement work that cannot be proven.

- The mobile app running in a phone emulator that the agent can drive.
- Access to the card network's test environment, with a test card.

## Expected Behavior

- Mobile app checkout accepts a gift card code and shows how much the gift card pays before the shopper confirms.
- A gift card that holds at least the order total pays the whole order, and checkout asks for no card.
- A gift card that holds less pays all it holds, and the shopper's card pays the rest.
- An empty gift card is refused with a message that it is empty, and an unknown code with a message that the Store does not know it.
- Canceling an order paid by gift card in the app puts each part back where it came from.

## Context and Decisions

- The charges API, Gift cards and the gift cards API already handle gift cards; this issue adds them to the mobile app's checkout and cancel.
- The decisions of the web shop issue hold unchanged: the card is authorized before the gift card is charged, gift cards do not expire, points count on the whole total, and Fraud check scores every charge.

## Proof of Done

In the emulator, issue a gift card of 100 with the store CLI. Place an order of 40 with it in the mobile app: checkout asks for no card, and the order is confirmed. The balance page shows 60. Cancel the order: the balance page shows 100.

## Blocked by

Pay with a gift card in the web shop; See a gift card's balance
```

## Weak spots

- The drawing does not follow the outside-in order by itself. The step maps fix that, but they are extra files: `steps/make-steps.mjs` must run again after every change to `map.json`.
- Card network does not appear on the Store screen. The renderer hides Payments' Level 2 boundary with it because Charge service's Level 3 boundary refines it. Step 11's text says the card network shows up once Payments opens. This looks like a gap worth filing against `visualize-boundaries`: the map holds a Level 2 boundary that no Level 2 screen draws.
- The analysts' link to Fraud check is not drawn. Fraud check's screen shows only Charge service as its consumer, so step 12's last paragraph has to carry it.
- The full map's top screen lists Charge among the Store's resources, because the renderer counts what components keep inside it. The step maps avoid it, since they have no components.
- The store manager's interface split shows only in the panel, since all four capabilities share one area box. Step 4 carries the lesson; step 5 only repeats it.
- Level 2 now has three components, below the brief's four. They still teach everything the page needs: a consumer with two internal providers, one component that opens and one that does not, and an outside service at each level.
- See product in your room could be read as another view of Browse products. The map records in `questions` why it is a capability of its own: a different goal, and the camera as an input.
- Issue gift cards in a supporting area is still a little forced. The change states why in one sentence.
- Only the store manager shows reacts. Step 7 selects Alert on low stock on purpose.
- Relationships, representations and `parts` live in the map's text, not in the drawing. Steps 7 and 9 say them in words.
- Storefront sounds like the web shop. Step 9 turns that into a point: the web shop is an interface, and Storefront keeps the orders.
- Browse products returns a collection, which the model's naming rule would call List products. The model's own Store uses Browse products, so the map keeps it.
- Shipping partner adds a box, a boundary and a resource. It gives orders somewhere to go and gives Cancel order a natural limit, "an order that has not shipped yet".
- Sign-in, accounts and saved cards are left out by the corpus. List past orders and See loyalty balance take "the shopper's account", so a careful reader will notice.
- Pages 01 and 02 will need to follow this Store. Catalog keeps products, the card network also takes refunds, the loyalty balance is on both interfaces, and the change has more items than page 01's four.

# Review of the three walkthrough designs

## Verdict

Use design A, the extended Store, after the changes listed at the end. It fits the seven steps as well as C does, it has the easiest domain, it continues pages 01 and 02 as the prototype README already plans, and its drawing serves the page best. Its flaws are local and can be fixed in the map and the page text. C comes second: it makes the two-interface point best and teaches more look-alikes, but its domain is heavy and it breaks the gift-card thread. B's change is the best of the three, but its two-interface point, the one the owner singled out, does not hold up.

## How I checked

- `check-map.mjs` passes all three maps: A has 3 consumers, 1 provider, 6 components, 2 outside services, 7 resources and 10 boundaries; B has 3, 1, 6, 2, 6 and 9; C has 3, 1, 7, 2, 10 and 12. B's map after its change, and A's change map and cut-down step maps, pass too.
- I read each design.md and map.json against `use-boundary-model`, `shape-boundaries`, `slice`, `refine` and `to-issues`, and against page 01 and page 02 in `site/prototypes/site-draft.html` and the Store in `docs/example/store-map.json`.
- I looked at A's and B's stills, and drew and shot C, which had none. C's stills are in /tmp/claude-0/-home-user/cdf782aa-10b7-528c-9e97-39ba0972e579/scratchpad/review-shots/c/.
- The renderer draws a line from an interface to an area when any capability in that area goes through that interface. It draws Level 1 and Level 2 on one screen. It hides a Level 2 boundary with an outside service when a Level 3 boundary refines it. It draws no parts, relationships or representations. These limits hit all three designs the same way, except where noted below.

## Design A: the extended Store

### Violations and doubtful calls

- Loyalty as its own component is forced. It passes the component test, but the design admits it exists to reach four components. The model asks for the simplest model, and both page 02 and the skill's Store keep loyalty inside Storefront.
- The design says it departs from page 02 in two places. There are three: Catalog also takes Product out of Storefront, which page 02 and `docs/example/store-map.json` show keeping Product, Order and Loyalty balance.
- Reserve stock does two opposite things in one capability. It "takes an order's lines, or a canceled order's lines to put back". Hold and release are two outputs. Split it into Reserve stock and Release stock.
- Alert on low stock takes "the products to watch, and a threshold for each", so it sets the low-stock threshold property, yet its only mode is reacts. Either add mutates Product or let Edit product set the threshold and have the alert take only the products to watch.
- The area name Manage the catalog uses Manage, the verb the model gives as its counter-example ("not Manage order lifecycle"). Keep the catalog right, the area's own description, would follow the rule.
- Browse products returns a collection, which the List rule names List products. The skill's own Store uses Browse products, so keep it, but expect a careful reader to ask.
- In the change, Issue gift cards sits in a supporting area. Supporting areas hold what consumers would skip, such as access, credits and settings. A manager issuing gift cards is a second goal, not something to skip. The design admits this.
- The shape folds a Level 3 change into Level 2: "Resources of Payments: NEW Gift card: kept inside Payments by Charge service". `shape-boundaries` asks for every level a change reaches, so the shape should also list Resources of Charge service with NEW Gift card.
- Refinement for slice 1 leaves "Do gift card payments earn loyalty points?" open, though slice 1 modifies Place order, which mutates Loyalty balance. It also leaves what checkout shows for an empty or expired card. `refine` stops only when no open question would change an expected behavior, and both of these would.
- The balance issue's proof of done says "see the money left and the expiry date", but expiry is still an open detail. No refinement settled it.
- The Store's resources leave out Charge, which the Store holds through Payments. The model says a provider keeps what it holds through a component, and the renderer lists Charge anyway. The skill's own example does the same, so this is minor.
- The model says a fraud module "may be" a provider to an analyst who works with it directly. The map answers why Fraud check is not, in `questions`, but no drawing shows it, so the page text has to.

### What holds up

Callbacks sit inside the boundary they complete: a held charge's outcome on the charges API, the analyst's decision on the fraud scoring API, and delivery updates on the shipping API. Reserve stock as a step for the shopper and a capability for Storefront is a good lesson. The `store migrate` command as work on the system, not with it, is a clean example of what stays out. Parts, places and exclusions are careful.

## Design B: Helpdesk

### Violations and doubtful calls

- Get notified of a reply is doubtful as a capability, and the whole two-interface point rests on it. Ask for a person already promises "a specialist's reply in the same conversation later". The notification delivers that same result to the phone, and what it takes, "notifications turned on in the app", is a setting. Read strictly, it is how the mobile app delivers Ask for a person's output. Then the two interfaces offer the same capabilities and the step has nothing to show. B's own `questions` record this doubt.
- The drawing hides the difference. Both chat widget and mobile app draw lines to Get help and to Follow up, because List my conversations is on both. At step 4 the reader sees two identical interfaces.
- Model response is an output, not a resource. Its only property is its text, and nothing about it changes. The model warns against a resource that is "the record a capability leaves behind". Push message is close to the model's own line that the notifications alerts send are "probably just an output".
- The Level 3 split into Library and Search reads as a store and an index. Search passes the test only because it ranks passages. The Library "decides what each sync adds, changes and removes", which is a diff more than a decision. Design A calls a search index a part that "decides nothing", and that fits what the page teaches: storage is not a component. B's Level 3 sends the opposite signal on the very screen meant to show the pattern repeating.
- Improve answers is in a supporting area, though reviewing the assistant is a goal of the specialist's own. B admits this.
- Review answers returns a filtered collection, which the List rule names List answers.
- Some modes are missing. Ask for a person moves the conversation to "waiting for a person" but only produces Ticket. Reply to a ticket shows the reply in the conversation but only mutates Ticket.
- The conversation's messages hold the assistant's answers, and the Assistant keeps the same answers as Answer. The split between Conversations and the Assistant is defensible, but the page needs a sentence on it, as B says.
- Update the index names an implementation idea at Level 3. A name for the responsibility, such as Update searchable articles, would keep technology out.
- In the change comparison, the renderer reports Correct an answer as "was Flag an answer", which contradicts the shape's REMOVED and NEW.
- On a site about coding agents, an example built around an AI assistant invites readers to mix up the assistant with "your agent".

### What holds up

The trace as a property of Answer is the best property-or-resource example in any of the three. Replies posted back into the conversation are the cleanest callback example. "External means outside the system, not outside the company" is a sentence the page needs whichever design wins. The knowledge admin's nightly script being the same consumer applies the model's rule on scripts directly. Both outside services appear on the Level 2 screen, because no component that calls them opens further. The change is the only one with NEW, MODIFIED and REMOVED, it crosses three levels, the customer's boundary stays the same, and option A is a real parallel change.

## Design C: Fernwire

### Violations and doubtful calls

- Get market rate is a supporting area on Transfers to Partner bank and a core area on Pricing to Partner bank: one area of one provider, typed two ways. Supporting is also wrong for the input every price depends on.
- Rate alert is a resource that no capability lists, edits or deletes. The model keeps a resource only if removing it would lose meaning. It is there to show reacts at Level 1, as C admits.
- Risk scoring serves Compliance analyst, Investigate alerts, yet no analyst capability reaches it. It raises alerts on its own and Case management keeps them. Serving an area through what the model calls "what the provider does on its own" is doubtful.
- Close alert, Open case and Close case are status moves. Open case earns its place by producing a Case, but Close alert brushes against "one capability for moving between statuses". C notes this.
- The bank's capabilities appear on Transfers, Bank payments and Pricing: 6 of 25 capabilities for one outside service, 3 of them repeats. The format requires the repeats, but readers will think Fernwire has two connections to the bank.
- `corpus.excluded` says "Nothing." while `excluded` lists size cuts: customer support, business onboarding and sign-in. A puts its size cuts in the corpus, which is where they belong.
- The chosen slicing splits Freeze account by account type. `slice` allows a split only when a change is too large, and only by its capabilities, resources or interfaces. C calls the change small, and account type is none of those three.
- Only the first issue has a proof of done. The issues step, which the owner wants followed, is a single sentence.
- Recipient as a property of Transfer is recorded and defensible, but real transfer apps let senders manage recipients, so some readers will balk.
- The domain needs alerts, cases, identity checks, matching pay-ins to transfers and the rule against tipping off before the model can be taught.

### What holds up

Opening an account only in the app, because it needs the camera, is the best two-interface example of the three. The business customer on the payouts API, with a webhook that stays inside its boundary, is exactly the optional third consumer the owner described. Get a quote as a capability against checking the limit as a step is the clearest look-alike pair. Recipients as non-consumers, and Risk scoring as the consumer of transfer events, are good lessons. Each component makes a plain decision of its own, at both levels. The change adds a NEW internal boundary, and its refinement has real tradeoffs with rejected paths: the generic hold message, and a list of open cases instead of a single frozen flag.

## Scores

| Criterion | A | B | C |
| --- | --- | --- | --- |
| (a) Fit to the seven steps | 5 | 4 | 5 |
| (b) Concepts shown naturally | 4 | 3 | 4 |
| (c) Domain ease for a newcomer | 5 | 4 | 3 |
| (d) Two-interface point | 4 | 2 | 5 |
| (e) Components and Level 3 | 4 | 3 | 4 |
| (f) Change: shaping, slicing, refining, one page | 4 | 5 | 4 |
| (g) Consistency with the site | 4 | 2 | 2 |
| (h) Drawn map serves the page | 4 | 2 | 3 |
| Total | 34 | 25 | 30 |

### Why each score

- (a) A, 5: every step has a natural home: the shopper, the fraud analyst on a review console, the shopper's two interfaces, a store manager on a CLI, and Payments opening at Level 3.
- (a) B, 4: steps 1 to 3 and 5 to 7 fit well, but step 4 rests on a single notification capability.
- (a) C, 5: every step fits, and the optional third consumer is an API consumer with webhooks, as the owner described it.
- (b) A, 4: most concepts come from the domain, but Loyalty as a component, a two-way Reserve stock and Issue gift cards as supporting are forced.
- (b) B, 3: the trace and the posted-back replies are strong, but Get notified of a reply, Model response, Improve answers as supporting and the Library and Search split are forced or doubtful.
- (b) C, 4: Get a quote, recipients and the webhook are excellent, but Rate alert, Get market rate as supporting and the repeated bank capabilities exist for coverage or for the format.
- (c) A, 5: every developer has bought something online, and page 02 has already introduced this Store.
- (c) B, 4: support chat is familiar, but passages, traces, an index and a model service add AI vocabulary, and "the assistant" is easy to confuse with the agents the site is about.
- (c) C, 3: sending money abroad is familiar, but alerts, cases, identity checks, pay-in matching and tipping off are specialist ideas.
- (d) A, 4: only the app shows the loyalty balance, drawn as its own area and repeated by the store manager's dashboard and CLI, but the reason is arbitrary and page 02 already made this exact point.
- (d) B, 2: the only difference is a notification that is doubtful as a capability and does not show in the drawing.
- (d) C, 5: opening an account needs the camera, so only the app offers it, and the drawing shows the website not reaching that area.
- (e) A, 4: Level 3 is the skill's own Charge service and Fraud check and draws cleanly, but Loyalty is forced and Card network is missing from the Store screen.
- (e) B, 3: Conversations, the Assistant and Tickets are clear, but Level 3 looks like a store and an index, the very things the page says are not components.
- (e) C, 4: each component has a plain decision of its own at both levels, but Partner bank is hidden at Level 2 and its capabilities repeat three times.
- (f) A, 4: the shape is compact and its slices match page 01, but it has no REMOVED item, leaves a slice 1 behavior open, and one proof of done relies on an unsettled expiry date.
- (f) B, 5: it is the only change with all three markers, it crosses three levels while the customer's boundary stays the same, and its slicing teaches a parallel change, though laying out three levels on one page takes care.
- (f) C, 4: a NEW internal boundary and sharp refinements teach well, but there is no REMOVED item, the chosen slices split a capability without the reason `slice` requires, and only one issue is written.
- (g) A, 4: it carries page 01's gift cards and page 02's Store, as the README already decided, but its inside differs from page 02 in three places and its shape is larger than page 01's four items.
- (g) B, 2: it contradicts nothing, but page 01's gift-card story would stop on page 01 and the reader would meet a second invented system.
- (g) C, 2: the same as B: a second invented system, and gift cards with no follow-up.
- (h) A, 4: the loyalty difference, the shipping partner and the Payments screen draw cleanly, while Card network at Level 2, the analyst's path to Fraud check and the store manager's interface split need the page text.
- (h) B, 2: the step 4 screen draws both customer interfaces to both areas, the Knowledge base screen drops the knowledge admin, and the change comparison reads a swap as a rename, though both outside services show at Level 2.
- (h) C, 3: the Open account difference and the API consumer draw well, but Partner bank is missing from the Fernwire screen and the Transfers screen shows only Risk scoring as its consumer.

## Recommendation

Choose A. On steps, domain and drawing it is at least as good as the others, and it is the only one that keeps the site's one example running from page 01 to page 05. Its problems are a forced component, a few capabilities to tidy, a change that needs finishing, and differences from pages 01 and 02 that the page must either remove or explain. C's weak points, the domain and the break from the gift-card story, cannot be fixed without replacing the example. B's weak point is step 4.

## Changes A needs, most important first

1. Make the Store's inside agree with page 02. Fold Loyalty back into Storefront, as page 02 and the skill's Store have it; the model asks for the simplest model and the design admits Loyalty is there for the count. Keep Catalog, since the store manager gives it a real job. Then, in step 9, say that this is page 02's Store with a catalog team and a fraud desk added, so products now live in Catalog and the card network also takes refunds. The other way is to update page 02's drawing. Either way, the two pages must not disagree silently.
2. Make the change agree with page 01. Page 01 shows four shape items and the walkthrough shows more. Either page 01 shows the full shape, or page 05 says page 01 showed the first items and shaping found the rest. Match the issue titles and proofs of done to page 01's wording, and drop "the expiry date" from the balance issue unless refinement settles expiry.
3. Finish slice 1's refinement. Settle whether gift-card payments earn loyalty points and what checkout shows for an empty or expired card, or say the page shows only some of the settled details. Add one rejected path, since `refine` defines a design decision as a chosen or rejected path.
4. Tidy the map. Split Reserve stock into Reserve stock and Release stock. Give Alert on low stock a mutates Product, or let Edit product set thresholds. Rename Manage the catalog to Keep the catalog right. Add Charge service's NEW Gift card to the shape at Level 3. Either justify Issue gift cards as supporting in one sentence, or reconsider where it sits.
5. Plan the drawing. Generate the Level 1 maps for steps 2 to 8 from map.json with a script, so they cannot drift from the full map. Light only what each step introduces. Say in step 11 that Card network appears once Payments opens. Consider filing the gap, a Level 2 boundary that no Level 2 screen draws, against `visualize-boundaries`.
6. Write the text the drawing cannot carry: the analyst's path to Fraud check and why Fraud check is not the analyst's provider, Storefront not being the web shop, and the relationships, parts and representations. Take two sentences from B: external means outside the system, not outside the company, and a store manager's nightly import script is still the store manager.

## What C does better, for A to borrow

- C gives its interface difference a reason the reader accepts at once: the camera. A can give the app-only loyalty balance a reason in one sentence, or the page can admit the reason is a business choice and say that is enough for the model.
- C's change adds a NEW internal boundary, which shows that shaping can add boundaries, not only capabilities. A asked "Does Payments need a new component?" and answered no. The page can show what a yes would have added.
- C pairs Get a quote, a capability because people check and leave, with checking the limit, a step. A can frame See gift card balance against checking a coupon the same way, since the model uses the coupon as its own step example.
- C's refinements state the rejected path and why it lost, such as the single frozen flag. A's refinements should do the same.
- C shows all four modes on the main consumer's boundary. In A, reacts appears only on the store manager, so step 7 should select Alert on low stock on purpose.
- From B, the third design: the page should show what REMOVED looks like. Gift cards remove nothing, so one sentence with a short example is better than inventing a removal.

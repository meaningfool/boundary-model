# Helpdesk: an invented example for the walkthrough

## The system

Helpdesk is the customer support of an invented company that makes coffee machines. An assistant answers customers' questions from the company's help articles, in a chat widget on the website and in the company's mobile app. When the articles do not cover a question, or the customer asks for a person, the conversation becomes a ticket for a support specialist, who works in an internal review console and also checks what the assistant said and why. Knowledge admins write the help articles as Markdown in a docs folder and bring Helpdesk in step with `helpdesk kb sync ./docs`. Inside, four components share the work: Conversations, the Assistant, the Knowledge base and Tickets. The Assistant relies on an outside Language model service, Conversations on the phones' Push service, and the Knowledge base opens into a Library and Search. The map has 3 consumers, 1 provider, 6 components, 2 outside services, 6 resources, 9 boundaries and 21 capabilities.

We kept the working name Helpdesk. Like Store, it is a plain noun that says what the system is, so the reader learns nothing extra. We renamed the second consumer from support agent to Support specialist, because the site is about coding agents, and AI products often call the assistant itself an agent.

## Walkthrough

Each step names the screen of `map.html` it uses and the boxes to select there. Selecting a box lights what it connects to.

### 1. The system

- **Map:** All providers. Helpdesk with its four resources: Conversation, Answer, Ticket, Article.
- **Introduces:** the system, and the idea that we describe it from the outside in.
- **Draft:** "Helpdesk is the support of a company that makes coffee machines. An assistant answers customers' questions from the company's help articles, and hands the cases it cannot answer to people."

### 2. The customer and Helpdesk

- **Map:** All providers, Customer selected: one line to Helpdesk.
- **Introduces:** consumer, provider, boundary, external boundary.
- **Draft:** "The customer asks how to descale their machine and gets an answer. They believe they are using the company's help, not a model or a search index, so the provider is Helpdesk, and the line between them is the first boundary. It is external: the customer is outside the system."

### 3. The support specialist

- **Map:** All providers, Support specialist selected.
- **Introduces:** a second consumer with goals of its own, a second boundary, and what external means.
- **Draft:** "Support specialists answer the cases the assistant hands over, and check what it said. They work for the company, but they use Helpdesk from outside it, for goals of their own, so they have a boundary of their own: external means outside the system, not outside the company."

### 4. Interfaces: one boundary, two channels

- **Map:** Helpdesk, Customer selected: lines to the chat widget and the mobile app, then on to Get help and Follow up. The panel lists Get notified of a reply, marked mobile app.
- **Introduces:** interface, a boundary that is not an interface, two interfaces that offer different things.
- **Draft:** "The customer reaches Helpdesk through the chat widget on the website and the help screens of the mobile app. Both let them ask, rate an answer and ask for a person, but only the app can tell them a person has replied. Two interfaces, one boundary: the consumer, the provider and the goals stay the same."

### 5. The knowledge admin and a command line

- **Map:** Helpdesk, Knowledge admin selected: kb CLI, then Keep articles current.
- **Introduces:** a CLI as an interface, and a consumer's own scripts as the same consumer.
- **Draft:** "Knowledge admins write the articles in a docs folder and run `helpdesk kb sync ./docs`. The command line is their interface. The nightly script that runs the same command is still the knowledge admin, not a fourth consumer."

### 6. Capabilities: what each consumer can do

- **Map:** Helpdesk, Get help selected. The panel lists Ask a question, Rate an answer and Ask for a person, each with what it takes and gives.
- **Introduces:** capability, output, resource, mode, representation.
- **Draft:** "A capability is something the consumer does to get a result, named with a verb. Ask a question takes a question and gives an answer with links to the articles it drew on: it changes the Conversation, produces an Answer and reads Articles. The links are a representation of the articles, and Ask for a person gives a ticket number at once and a specialist's reply later."

### 7. Resources seen from two sides

- **Map:** Helpdesk, the Answer resource selected: it lights Get help, Improve answers and Keep articles current. The panel lists Answer's properties.
- **Introduces:** resource, property, relationship, a consumer that sees a resource differently.
- **Draft:** "Answer is one resource, seen in three ways. The customer reads and rates it, the knowledge admin lists the ones specialists flagged, and the specialist also reads its trace: the passages found, what the model was sent, and why the assistant offered a person or not. The trace is a property of the answer, not a resource of its own, and each answer belongs to one conversation and draws on one or more articles."

### 8. Areas: core and supporting

- **Map:** Helpdesk, the five area boxes, with core or supporting in each corner.
- **Introduces:** area, core and supporting.
- **Draft:** "Capabilities group into areas named for what the consumer comes to do. Customers come to Get help; Follow up is supporting, because they would skip it if the first answer were enough. Specialists come to Solve tickets; Improve answers is supporting, because they would skip it if the assistant never erred."

### 9. What is not a capability, and what stays out

- **Map:** Helpdesk, nothing selected. The text names what the map leaves out.
- **Introduces:** look-alikes of capabilities, what stays out.
- **Draft:** "When the articles do not cover a question, the assistant offers a person on its own: that is Helpdesk acting, and the customer's capability is Ask for a person. `helpdesk kb sync --dry-run` is a step of Sync articles. The evaluation suite engineers run before a release checks the system rather than using it, so it stays out, while the traces specialists read in the console stay in."

### 10. Inside Helpdesk: components

- **Map:** Helpdesk, the Components column: Conversations, Tickets, Assistant, Knowledge base.
- **Introduces:** component, and what is not one.
- **Draft:** "Open Helpdesk and four components appear, each keeping state only it changes or making decisions only it makes. Conversations keeps each conversation, the Assistant decides what to say and keeps every answer with its trace, the Knowledge base decides which passages fit a question, and Tickets decides which specialist gets each ticket. The review console app, the model client and the vector database are not components: they present, reach or store."

### 11. Boundaries between components, and outside services

- **Map:** the Assistant screen: Conversations uses it through the answer API, and it uses the Knowledge base and the Language model service. Then the Tickets screen: Conversations, the tickets API, Hand over a conversation.
- **Introduces:** internal boundary, contract between components, a component that is both consumer and provider, outside service, implementation choice.
- **Draft:** "Conversations is the Assistant's consumer: through the answer API, it asks for an answer to each new question. The Assistant is in turn a consumer of the Knowledge base and of an outside Language model service; which vendor runs the model is an implementation choice, so switching changes the model client, not the map. When Tickets posts a specialist's reply back into a conversation, that is not a second boundary: it completes Hand over a conversation."

### 12. Level 3: inside the Knowledge base

- **Map:** the Knowledge base screen: Library and Search, both keeping Article. Then the Search screen: Library, the index API, Update the index.
- **Introduces:** Level 3, a resource kept by two components, a capability that only shows one level down.
- **Draft:** "Open the Knowledge base and the same pattern repeats. The Library keeps the articles as synced; Search keeps its own copy, cut into passages, and decides which passages fit a question, so both keep Article, each with its own state. After each sync, the Library asks Search to update the index: for the knowledge admin this happened on its own, but one level down it is a capability."

## Coverage

| Concept | Where it appears | Fit |
| --- | --- | --- |
| Consumer | Customer, Support specialist, Knowledge admin; inside, Conversations, the Assistant and the Library | Natural |
| Provider | Helpdesk; inside, the Assistant, Tickets, the Knowledge base and Search | Natural |
| Boundary | 9 boundaries, one per consumer and provider | Natural |
| External and internal boundary | 3 external at Level 1; 6 internal, two of them with outside services | Natural. Specialists are inside the company but outside the system, which teaches what external means |
| Interface | chat widget, mobile app, review console, kb CLI | Natural |
| Two interfaces that differ | Get notified of a reply, offered only by the mobile app | Natural but thin: one capability differs, and it is a notification |
| Capability | 14 at Level 1, 7 between components and services | Natural |
| Area, core and supporting | Get help and Follow up; Solve tickets and Improve answers; Keep articles current | Natural for the customer. A little forced for the specialist, who has two real goals |
| Resource | Conversation, Answer, Ticket, Article; Model response and Push message for the outside services | Natural |
| Property | Answer's trace, rating and flag; Ticket's status; Article's last sync | Natural. The trace as a property is a strong example |
| Relationship | A conversation holds many answers and at most one ticket; an answer draws on articles | Natural, but only in resource descriptions: the map has no field for it and the drawing does not show it |
| Mode | observes List tickets, mutates Rate an answer, produces Ask for a person, reacts Get notified of a reply | Natural, except reacts, which appears once and could be read as the end of Ask for a person |
| Output | Every capability's gives, such as a ticket number now and a reply later | Natural |
| Representation | Links to articles in an answer, the trace view, the ticket number, the sync summary | Natural in text; the map has no field for it |
| A look-alike that is not a capability | The assistant offering a person on its own, `kb sync --dry-run`, opening a ticket, copying a ticket number | Natural |
| Component | Conversations, Assistant, Knowledge base, Tickets; Library and Search | Natural, but the split of Conversations and the Assistant needs a sentence |
| Internal boundary | Conversations to Assistant, Conversations to Tickets, Assistant to Knowledge base, Library to Search | Natural |
| Contract between components | answer API, tickets API, search API, index API | Natural |
| A callback inside one boundary | Tickets posting replies back completes Hand over a conversation | Natural |
| A resource kept by two components | Article, kept by the Library and by Search | Natural, and it mirrors the model's own Payments and Fraud check example. It appears only at Level 3 |
| Outside service | Language model service, Push service | Natural |
| Implementation choice | The model vendor, the vector database, the embedding library, all listed as parts | Natural |
| Level 3 | Knowledge base opens into Library and Search | Natural, though engineers may first read it as a store and an index |
| What stays out | Company account system, answer evaluations, logs and metrics, conversation clean-up, tests and deployment | Natural. Logs versus the traces specialists read is a good contrast |

## The change

The request: let support specialists correct an AI answer so the assistant uses the correction next time.

### Shaping questions, in the order asked

1. Should a correction fix only the answer to the same question, or become knowledge the assistant can use for any question it fits? Impact: whether the Assistant or the Knowledge base keeps Correction, and whether Find passages and Update the index change. Answer: knowledge, kept by the Knowledge base, because customers ask the same thing in many words.
2. Does a correction take effect at once, or after someone approves it? Impact: a NEW Approve a correction. Answer: at once, because specialists already reply to customers without approval.
3. Does correcting replace flagging? Impact: REMOVED Flag an answer and List flagged answers. Answer: yes, because a correction says what a flag said, and how to fix it.
4. What do knowledge admins do with corrections? Impact: NEW List corrections and Retire a correction. Answer: they list them, fold them into the articles, and retire them.
5. Do customers see that an answer used a correction? Impact: MODIFIED Ask a question, or no change to the customer's boundary. Answer: no, because the answer still cites articles only.

### The shape

Resources of Helpdesk:

- NEW **Correction**: a support specialist's fix to one answer, which the assistant uses for every question it fits until a knowledge admin retires it.
- MODIFIED **Answer**: loses its flag property.

**Support specialist <-> Helpdesk**: MODIFIED, specialists correct wrong answers instead of flagging them.

- Interfaces: review console
- Improve answers (supporting)
  - NEW Correct an answer: produces **Correction** · observes **Answer**
  - MODIFIED Review answers: observes **Answer** · observes **Conversation** · observes **Correction**
  - REMOVED Flag an answer: mutates **Answer**

**Knowledge admin <-> Helpdesk**: MODIFIED, knowledge admins work through corrections instead of flagged answers.

- Interfaces: kb CLI
- Keep articles current (core)
  - NEW List corrections: observes **Correction**
  - NEW Retire a correction: mutates **Correction**
  - MODIFIED Try a question: observes **Article** · observes **Correction**
  - REMOVED List flagged answers: observes **Answer**

Inside Helpdesk, Level 2. Resources of Knowledge base:

- NEW **Correction**: kept beside the articles, so Search can find it.

**Assistant <-> Knowledge base**: MODIFIED, finding passages also finds the corrections that fit a question.

- Interfaces: search API
- Find passages (core)
  - MODIFIED Find passages: observes **Article** · observes **Correction**

Inside Knowledge base, Level 3. Resources of Library and of Search:

- NEW **Correction**: the Library keeps each correction; Search keeps its own indexed copy.

**Library <-> Search**: MODIFIED, the Library sends corrections to be indexed with the articles.

- Interfaces: index API
- Update the index (core)
  - MODIFIED Update the index: mutates **Article** · mutates **Correction**

**Shape complete: YES**

**Open**

- None.

**Details**

- What does a correction hold besides the corrected text: a note, the question it answers? About: NEW Correction
- How does a correction match a question asked in other words, and rank against article passages? About: MODIFIED Find passages
- Does correcting an answer change what the customer already saw? About: NEW Correct an answer
- How does `helpdesk kb ask` show a passage that comes from a correction? About: MODIFIED Try a question
- Does a retired correction stay visible in Review answers? About: NEW Retire a correction
- What happens to answers flagged before flagging goes? About: REMOVED Flag an answer

The customer's boundary does not change. Customers get better answers, but they never see a correction, so nothing they can see or do is different. This is worth a sentence on the page.

A test of the shape: applied to a copy of the map, it passes the checker and draws with `render-map.mjs --against`. The customer side fades, and the change shows on both staff boundaries, on the Knowledge base and on the line from the Assistant to it.

### Slices

**Option A: correct first, retire flags last.** Tradeoff: a specialist sees the first correction used at the end of slice 1, and flagging keeps working until knowledge admins can see corrections, so no report goes missing. The cost is a short time with two ways to report a wrong answer.

1. Correct an answer and see the assistant use it: a specialist corrects an answer, and the next customer who asks the same thing gets the corrected answer. Boundary changes: NEW Correction (Helpdesk, Knowledge base, Library, Search), NEW Correct an answer, MODIFIED Review answers, MODIFIED Find passages, MODIFIED Update the index.
2. Work through corrections: a knowledge admin lists corrections, sees them used in `helpdesk kb ask`, and retires one once the article covers it. Boundary changes: NEW List corrections, NEW Retire a correction, MODIFIED Try a question.
3. Retire flags: the flag button and `helpdesk kb flagged` are gone. Boundary changes: REMOVED Flag an answer, REMOVED List flagged answers, MODIFIED Answer.

Smells: a heavy first slice, since slice 1 crosses three levels, though each part is needed for the first result anyone can see. Duplicate authority during slices 1 and 2, with flags and corrections both reporting wrong answers; slice 3 ends it.

**Option B: inside out, with an enabling slice.** Tradeoff: the Knowledge base work is proven before anyone depends on it, but nobody can see the first slice, and the two staff boundaries change in separate slices.

1. The Knowledge base keeps and finds corrections: a test stores a correction and gets it back from Find passages. Boundary changes: NEW Correction (Knowledge base, Library, Search), MODIFIED Find passages, MODIFIED Update the index.
2. Specialists correct instead of flagging. Boundary changes: NEW Correction (Helpdesk), NEW Correct an answer, MODIFIED Review answers, REMOVED Flag an answer.
3. Knowledge admins work through corrections. Boundary changes: NEW List corrections, NEW Retire a correction, MODIFIED Try a question, REMOVED List flagged answers.

Smells: an enabling slice with no immediate consumer. An invalid intermediate state after slice 2: flagging is gone, but knowledge admins cannot see corrections until slice 3.

Recommendation: Option A. Its last slice is the contract step of a parallel change: corrections arrive beside flags, people move over, then flags go.

### Details settled in refinement

1. **Questions asked in other words** (slice 1). Expected behavior: after a specialist corrects the answer to "How often should I descale?", a customer who asks "how often does my machine need descaling" gets an answer that follows the correction. Design decision: Search indexes each correction as one passage, made of the question it answers and the corrected text, and Find passages puts a correction ahead of article passages when both fit. Rejected: matching only the exact question, which misses most rephrasings.
2. **Past conversations stay as they were** (slice 1). Expected behavior: correcting an answer changes nothing the customer already saw, and Review answers shows the original answer with its correction beside it. Design decision: a correction points to the answer it corrects, and the answer is never edited.
3. **Corrections in a trial question** (slice 2). Expected behavior: `helpdesk kb ask` marks each passage that comes from a correction and names the specialist who wrote it.

### Issues

- Correct an answer in the review console. Proof of done: correct an answer, ask the same question in other words in the app, and get the corrected answer.
- Work through corrections with `helpdesk kb`. Proof of done: list corrections, retire one, and see `helpdesk kb ask` stop using it.
- Remove answer flags. Proof of done: the flag button and `helpdesk kb flagged` are gone, and corrections still work.

## Weak spots

- **The assistant looks like an actor.** Readers may make the assistant a consumer of the knowledge base, or a provider to the customer. The page needs one sentence: customers believe they use the company's help, so the assistant stays inside Helpdesk and is a component only from Level 2.
- **The interfaces differ by one notification.** Only Get notified of a reply separates the widget from the app, and the map's questions record that it could be read as the end of Ask for a person. A starker difference, such as an anonymous website widget with history only in the app, would bring email in as a third customer interface and a third outside service.
- **The specialist has two goals.** The rule of one core area puts Improve answers in a supporting area, which undersells the trace review the example is meant to feature. The page should say why, or the owner may prefer to make review the core.
- **Conversations and the Assistant as two components.** Readers who would draw one chatbot box will ask why there are two. The answer, different state and different decisions, and Tickets reaching conversations without the Assistant, needs a sentence on the page.
- **Level 3 can look like storage.** Engineers may read the Library and Search as a database and an index. The page has to stress that Search decides which passages fit and keeps state only it changes, while the vector database is a part.
- **The Knowledge base screen hides the knowledge admin.** The drawing shows a box's own boundaries only, so the knowledge admin, who reaches the Knowledge base through Helpdesk's kb CLI, is not on that screen.
- **Relationships and representations are not drawn.** The map format has no field for them, so the page states them in text.
- **The Helpdesk screen is busy.** Three consumers, four interfaces, five areas, four components and two outside services sit on one screen. The steps need selections or cropped stills.
- **The change hides from the customer.** The customer's boundary does not change, though customers are the ones who benefit. That is a good lesson, but readers will expect the opposite unless the page says it.
- **The drawing reads a swap as a rename.** In the comparison, the page reports Correct an answer as "was Flag an answer", while the shape marks one REMOVED and one NEW. The text should follow the shape.
- **Shaping skips the code.** `shape-boundaries` reads the code behind each boundary before shaping. With an invented system, the page has to say that this step was skipped.
- **The name overlaps with real products.** Helpdesk is a common noun, and some products use it as a name. If the owner wants no overlap at all, a different plain name is needed.

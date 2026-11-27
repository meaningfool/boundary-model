# Page 01, second section

The text of this section as it stands on the site. Edit anything after a label, delete what should go, and add remarks in square brackets, such as [too long]. Keep the labels as they are, so each piece finds its place on the page.

## Heading

How do you know you understand each other (you and your agents)?

## Picture

The blind men and the elephant, from an image model, with no text in it. The tags and bubbles below go on top as text.

- Name tags: You · Claude Code, with the Claude logo · Codex, with the OpenAI logo
- Bubble, the person at the tusk (Claude Code): It's a spear!
- Bubble, the person at the side (You): It's a wall!
- Bubble, the person at the tail (Codex): It's a rope!

## Intro

A repository holds code, not the model you have in your head: who uses the system, for what, and which part is responsible for what. From the code alone, agents can write code, but they are not reliable coworkers on what to build.

## Problem 1

- Tab: Agents go deep before they go wide.
- Text: Ask for a change and an agent dives into the first part it sees, down to schemas and error messages, while the rest of the change is still unclear.
- Sketch: "Pay with gift cards" at the top. Below it, "Place order", drilled three levels down: gift_cards table, POST /orders, error codes. Beside it, three parts left open: Balance? · Charges? · Mobile app?
- Caption: Three levels down on one part. The other three are still open.
- With the skills: Every behavior change is laid out first. The details wait until the whole change is agreed.

## Problem 2

- Tab: Behavior changes get drawn into implementation details.
- Text: You want to agree on what people will be able to do. The conversation turns to tables, endpoints and files before you have.
- Sketch:
  - You: Shoppers should be able to pay with gift cards.
  - Agent: I'll add a gift_cards table with a balance column.
  - Agent: Then a POST /gift-cards/redeem endpoint.
  - Agent: And split the amount in charge.ts.
- Caption: What shoppers can do was never agreed. The talk moved to how.
- With the skills: Each change is stated as what changes for the people using the system, marked against the map, and you confirm it before any code.

## Problem 3

- Tab: Agents reinvent concepts between sessions.
- Text: One session says gift card, the next says voucher, the one after that adds a prepaid balance. Nothing holds the names you agreed on.
- Sketch: Session 1: Gift card · Session 2: Voucher · Session 3: Prepaid balance
- Caption: One concept, three names.
- With the skills: You settle the names when you review the map. Every change is then planned in those names, and fuzzy words get questioned.

## Problem 4

- Tab: The code's structure drifts from your mental model.
- Text: The parts you have in mind stop lining up with the folders and services in the code, and nobody notices until a change gets hard.
- Sketch: In your head: Storefront, Payments. In the code: src/shop/, src/checkout/, src/billing/. Lines cross between them.
- Caption: Two parts in your head, three folders in the code, and no clean line between them.
- With the skills: The map cites the code behind each boundary. Updating it shows what changed in the code since the last review.

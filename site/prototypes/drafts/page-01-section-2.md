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

A good conversation is one where you and your agent understand each other, one where you are presented with consequential decisions first and drill down once the foundations are solid. The trajectory of a conversation is quite chaotic and depends on decisions the agent made when gathering context and making assumptions. And there may be the appearance of a mutual understanding when it's actually a mirage. 

The solution is a shared map, so that each new conversation starts from a known place.

Title: "Problems without a shared map"

## Problem 1

- Tab: Agents go deep before they go wide.
- Text: High-leverage questions sit at the top of the decision tree. Agents get drawn into implementation details, losing sight of the behavior changes.
- Sketch: "Pay with gift cards" at the top. Below it, "Place order", drilled three levels down: gift_cards table, POST /orders, error codes. Beside it, three parts left open: Balance? · Charges? · Mobile app?
- With the skills: Boundary changes are laid out first, from outside in during the shaping phase. The details are refined later.

## Problem 2

- Tab: Agents reinvent concepts between sessions.
- Text: One session says gift card, the next says voucher, the one after that adds a prepaid balance. Nothing holds the names you agreed on.
- Sketch: Session 1: Gift card · Session 2: Voucher · Session 3: Prepaid balance
- With the skills: Concepts are settled in the map. Every change is then planned in those names, and fuzzy words get questioned.

## Problem 3

- Tab: The code's structure does not match your mental model.
- Text: You agreed on a model, but the agent did not mirror it in code. Nobody checked. The source of truth is has drifted from your understanding.
- Sketch: In your head: Storefront, Payments. In the code: src/shop/, src/checkout/, src/billing/. Lines cross between them.
- With the skills: The agent detects discrepancies between the shared map and the code base, allowing you to realign when drift is detected.

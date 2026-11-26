---
name: visualize-boundaries
description: Check a boundary map JSON file and draw it as one HTML page for review, one open box at a time, with who uses it, its interfaces, capabilities, components, resources and what it uses, or Level 1 alone. Use when someone wants to see or review a boundary map, whenever it was made.
---

# Visualize boundaries

Turn one boundary map into one self-contained HTML page, and into still images for a review. The map stays the source and the page is a view of it: regenerate the page whenever the map changes, and never edit the page by hand.

## Run

1. Take the map's path from the caller, or use the location in `use-boundary-model`. Take the page's path from the caller too; without one, write the page outside the repository, in the project's scratch location when its instructions name one, otherwise in a temporary folder.
2. Run `node <this skill's folder>/scripts/render-map.mjs <map.json> <page.html>`. It needs Node 18 or later, and the `use-boundary-model` skill installed beside this one: it checks the map with that skill's checker before drawing it.
3. Open the page in a browser. It works from a file; its fonts load from Google Fonts when online.
4. Report the counts the script printed, to show the whole map was read, and how far the map is behind the main branch when it says so.

If the script lists problems, it writes no page. Each one is a place where the map breaks the format or names something it does not define: fix the map, not the page.

For still images, run `node <this skill's folder>/scripts/shoot-map.mjs <page.html> <folder>`. It writes one image of All providers and one of each box that opens, each named by how deep its screen is and the path to it, such as `2-store--payments.png`. Under the drawing, each image gives the descriptions of what it shows. It needs Chrome, Chromium, or Edge; without one it gives the address to start from. Run as root, as in many containers, it turns Chrome's sandbox off, since Chrome refuses to start as root with it on.

To show what changed since an earlier map, such as the one before an update or the draft beside an alternative, add `--against <earlier.json>` to `render-map.mjs`. What did not change fades. A box or capability group that is new, or that changed itself or on the screens inside it, gets a heavier outline, solid when new and dashed when changed, and a New or Changed pill; resources, interfaces and lines are marked the same way. Each image's text starts with what changed on its screen, a rename or a move included, and `shoot-map.mjs` takes only All providers and the screens with a change.

The comparison reports a rename only on strong evidence, and reports anything else as one thing gone and one new, as `shape-boundaries` does:

- A box is renamed when it is the only box gone and the only box new among those of its kind and parent, and the two share a resource, a part, an area they handle, or a box they meet.
- A capability group is renamed when it is the only group gone and the only group new on a boundary, and the two share a capability.
- A capability is renamed when it is the only capability gone and the only one new on a boundary, and the new one does what the other did: the same modes on the same resources, or the same takes and gives. A capability found in another group of the same boundary moved.

To show Level 1 alone, the system as its consumers see it, add `--level 1` to `render-map.mjs`. The page then opens with the Level 1 only switch on, described below, and `shoot-map.mjs` takes All providers and each provider with consumers. Its images take the names that the same screens get at every level, so give it a folder of its own.

## What the page shows

Each screen shows one open box. Going to another screen replaces it, so every screen stays about as busy as the last.

- **All providers**: each provider in a row with the consumers that use it. The page opens on the provider named after the system when there is one, and here otherwise.
- **An open box**, a provider, a component or an outside service, is a frame with columns: who uses it, its interfaces as dots on its edge, its capabilities grouped by area, the components inside it, and what it uses. Each component sits level with the capabilities it handles. A component shared with another provider or component sits in both. An outside service that a box on the screen relies on, itself or through a component inside it, sits as a dashed box in the column after that box, whether or not that box opens.
- **A way in through a box around the open one**: when the open box, or a component inside it, handles an area of a boundary into a box around it, such as an area of the provider's own consumers, the screen shows that area too, with its consumer and the interfaces it comes through. Beside the open box's own boundaries they fade, each such consumer says which box it comes through, such as "via Store", and the frame head says who reaches the open box that way. A box with no boundary of its own shows only those, unfaded, and says it is reached through that box's interfaces.
- Every box is coloured by kind and lists the resources it keeps. Plain lines join consumers to interfaces, interfaces to capabilities, and components to what they depend on.
- An interface that offers only some of a group's capabilities joins the group with a dashed line, and the group lists the capabilities that only some of its interfaces offer, such as "Only on mobile app: Get notified of a reply", or their number when there are more than two. The panel and the text under a still image say the same of each capability.
- A box opens when its screen would show something of its own: components inside it, or capabilities it offers across a boundary of its own. Open, the bar at the foot of the box, goes inside. The box grows into the new frame while the boxes on both screens move to their new places.
- Clicking a box, an area, an interface or a resource lights what it connects to: what it calls, what calls it, what it handles and what it keeps. A lit box whose inner components are not on the screen says what each of them does. The panel beside the map adds only what the map does not show: descriptions, capability lists, and a resource's properties.
- The path above the map keeps the way you came, and Back returns to the previous screen with its scroll and selection.
- The Level 1 only switch above the map shows each provider as its consumers see it: who uses it, its interfaces and its capabilities, without the components inside it or what it uses. The provider lists as its own the resources kept inside it, and only providers with consumers open. Turned on inside a provider, the switch goes to that provider's screen; turned off, it shows every level again.

## Limits

- The page reads only the map format of `use-boundary-model`, and draws only a map that passes its checks.
- A screen draws the open box's own boundaries in full, but the boundaries between its components only as lines. The map records which component handles an area, not which component an interface leads to.
- Areas with the same name from different consumers are drawn as one box.
- A screen where a box stays closed shows an outside service that a component inside that box relies on only when the map gives the box its own boundary with the service, as the format requires.
- The page does not draw parts, places, questions, cleanup candidates or exclusions.

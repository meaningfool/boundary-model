# Website prototypes

Throwaway prototypes for the boundary model website, issue #7. They answered design questions in conversation. The site itself will be built with Astro and Starlight in `site/`. Remove this folder before the website pull request merges.

Open each file in a browser. They need no build.

## Files

- `site-draft.html`: the current draft of the five pages, in the chosen layout. Use the sidebar to move between pages. The text is a draft. Pages 02 to 04 were checked against the skills.
- `sidebar-proposals.html`: the chosen navigation. Numbered pages in the left sidebar, one level. The current page's sections on the right.
- `landing-proposals.html`: three early layouts for a separate home page. Superseded, since page 01 is now the home page, but its sections fed page 01.
- `map-candidates.html`: open-source projects checked as candidates for maps, with a compare view.
- `boundary-maps.html`: the interactive maps of the real projects in `../maps/`, embedded from `maps/`. It prefigures page 06, In the wild.
- `walkthrough/`: three invented systems designed for page 05, A walkthrough, each with its map and its design notes (the walkthrough sequence, which concepts it shows, the change, and its weak spots). `review.md` compares them and recommends A, the Store, which was chosen and then revised. `a-store/design.md` holds the final draft text of each walkthrough step, the change with its shape, slices, refinement and issues; `a-store/steps/` holds a cut-down map for the early steps, and `a-store/change/` the map after the change. Draw still images with `shoot-map.mjs`. `walkthrough-examples.html` shows all three designs with the review.

## Decisions so far

- **Stack, hosting and look:** as in issue #7. Astro with Starlight, the static build served by Cloudflare Workers, and executor.sh's quiet monochrome style with Geist and Geist Mono.
- **Navigation:** one numbered list of pages in the left sidebar, with no Docs link. The right column lists the current page's sections, on every page. GitHub, the version and the licence sit at the foot of the sidebar. There is no search box and no theme switch: the site follows the device's light or dark setting.
- **Pages:** 01 What it is and why, which is the home page; 02 The boundary model; 03 How the skills work together; 04 Install; 05 A walkthrough; 06 In the wild. `site-draft.html` still shows the earlier single page 05, An example.
- **05 A walkthrough:** a simple invented example, the Store, taught outside in and then followed through one change, gift cards, from its shape to the issues. The design is in `walkthrough/a-store/`. It stands on its own: the examples on pages 01 and 02 are not final and may change to match it.
- **06 In the wild:** maps of real open-source projects, embedded as interactive pages, like `boundary-maps.html`. Nine draft maps exist so far, in `../maps/`.
- **Page 01:** the headline "A shared map of your system, for you and your agent." Then four problems shown one at a time, each with a sketch; one vertical flow from behavior changes to implementation details; and boundaries level by level, as a drill-down diagram. Page 01 names no skill.
- **The skills own the rules.** The docs explain them, link to them, and never state a rule a skill does not.
- **Writing:** plain words, short sentences, active voice, sentence-case headings, no em dashes, no promotional words, and no hard-wrapped prose.

## Open questions

- The value proposition, and the line under the headline, are still to be written.
- Whether the walkthrough's material is written by hand, like the README's Store map, or comes from running the skills on a small invented Store codebase. A real run makes every artifact on the page genuine output.
- Which real maps page 06 shows, and which ones are reviewed first.
- Issue #7 still asks for a separate landing page, a search and one real map. It needs updating once these are settled.

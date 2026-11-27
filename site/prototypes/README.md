# Website prototypes

Throwaway prototypes for the boundary model website, issue #7. They answered design questions in conversation. The site itself is in `site/`, built with Astro and Starlight: see `../README.md`. Remove this folder before the website pull request merges.

Open each file in a browser. They need no build.

## Files

- `site-draft.html`: the current draft of the five pages, in the chosen layout. Use the sidebar to move between pages. The text is a draft. Pages 02 to 04 were checked against the skills.
- `sidebar-proposals.html`: the chosen navigation. Numbered pages in the left sidebar, one level. The current page's sections on the right.
- `landing-proposals.html`: three early layouts for a separate home page. Superseded, since page 01 is now the home page, but its sections fed page 01.
- `map-candidates.html`: open-source projects checked as candidates for maps, with a compare view.
- `boundary-maps.html`: the interactive maps of the real projects in `../maps/`, embedded from `maps/`. It prefigures page 06, In the wild.
- `walkthrough/`: three invented systems designed for page 05, A walkthrough, each with its map and its design notes (the walkthrough sequence, which concepts it shows, the change, and its weak spots). `review.md` compares them and recommends A, the Store, which was chosen and then revised. `a-store/design.md` holds the final draft text of each walkthrough step, the change with its shape, slices, refinement and issues. The Store's map and the map after the change moved to `../maps/store/`, and `../scripts/draw-maps.mjs` cuts the maps for the early steps on every build; `a-store/steps/` and `a-store/change/` keep the drawings made during the design. `b-helpdesk/change/` holds Helpdesk's change test: the map after its correction change, and a drawing that compares it with the map before. Draw still images with `shoot-map.mjs`. `walkthrough-examples.html` shows all three designs with the review.

## The site so far

- `site/` holds the Astro and Starlight site: the six pages in the numbered sidebar, the look and the navigation decided below, and a Worker configuration for Cloudflare.
- Page 05, A walkthrough, is built from `walkthrough/a-store/design.md`, with a live map frame for each step. Its lede and its map captions are new text, written from the design's "On the map" notes.
- Pages 01 to 04 are moved from `site-draft.html` with their text unchanged, after a check against the 0.2.0 skills and the README's install commands. Two short pieces are new: the prompt that page 01's "Install with your agent" button copies, and the last line of page 03, which points to the walkthrough.
- Page 06 is a stub.
- No deploy workflow yet: it needs the Cloudflare secrets that issue #7 lists under Before Starting.

## Decisions so far

- **Stack, hosting and look:** as in issue #7. Astro with Starlight, the static build served by Cloudflare Workers, and executor.sh's quiet monochrome style with Geist and Geist Mono.
- **Navigation:** one numbered list of pages in the left sidebar, with no Docs link. No right column and no list of the page's sections: if a page needs one later, it goes under that page in the left sidebar. GitHub, the version and the licence sit at the foot of the sidebar. There is no search box and no theme switch: the site follows the device's light or dark setting.
- **Pages:** 01 What it is and why, which is the home page; 02 The boundary model; 03 How the skills work together; 04 Install; 05 A walkthrough; 06 In the wild. `site-draft.html` still shows the earlier single page 05, An example.
- **05 A walkthrough:** a simple invented example, the Store, taught outside in and then followed through one change, gift cards, from its shape to the issues. The design is in `walkthrough/a-store/`. It stands on its own: the examples on pages 01 and 02 are not final and may change to match it.
- **06 In the wild:** maps of real open-source projects, embedded as interactive pages, like `boundary-maps.html`. Nine draft maps exist so far, in `../maps/`.
- **Page 01:** the headline "High-leverage conversations with your agent using a shared map of your system.", grey from "using". Then four problems shown one at a time, each with a sketch; one vertical flow from behavior changes to implementation details; and boundaries level by level, as a drill-down diagram. Page 01 names no skill.
- **The skills own the rules.** The docs explain them, link to them, and never state a rule a skill does not.
- **Writing:** plain words, short sentences, active voice, sentence-case headings, no em dashes, no promotional words, and no hard-wrapped prose.

## Open questions

- Step 11 of the walkthrough says the card network "shows up once Payments opens". The 0.2.0 renderer also draws it on the Store screen, in the column of outside services, so the sentence may need rewording.
- A Level 2 screen of the full map is about 1,500 pixels wide. In the walkthrough's text column it shows at 70% and scrolls sideways inside its frame. Steps 10 and 11 open on Catalog and on Shipping partner instead, which fit.
- The value proposition is still to be written. The line under page 01's headline is set from a review comment: "From the idea to the spec: the Boundary model skills provide the agent with a roadmap on what to ask and clarify."
- Pages 01 and 02 still use their own versions of the Store. Page 02's Storefront keeps products, where the walkthrough's Catalog does, and page 01 calls slices increments.
- Whether the walkthrough's material is written by hand, like the README's Store map, or comes from running the skills on a small invented Store codebase. A real run makes every artifact on the page genuine output.
- Which real maps page 06 shows, and which ones are reviewed first.
- Pi's review was started at the top level, then paused on three questions. Are Pi's seven libraries separate Level 1 providers? The draft says yes, since each is its own npm product. Is Settings a resource, given that `use-boundary-model` asks to check that a resource is not a setting? And is Model response a resource, or the output of the capabilities that produce it?
- Issue #7 still asks for a separate landing page, a search and one real map. It needs updating once these are settled.

# Website prototypes

Throwaway prototypes for the boundary model website, issue #7. They answered design questions in conversation. The site itself is in `site/`, built with Astro and Starlight: see `../README.md`. Remove this folder before the website pull request merges.

Open each file in a browser. They need no build.

## Files

- `site-draft.html`: the current draft of the five pages, in the chosen layout. Use the sidebar to move between pages. The text is a draft. Pages 02 to 04 were checked against the skills.
- `sidebar-proposals.html`: the chosen navigation. Numbered pages in the left sidebar, one level. The current page's sections on the right.
- `landing-proposals.html`: three early layouts for a separate home page. Superseded, since page 01 is now the home page, but its sections fed page 01.
- `map-candidates.html`: open-source projects checked as candidates for maps, with a compare view.
- `boundary-maps.html`: the interactive maps of the real projects in `../maps/`, embedded from `maps/`. It prefigures page 05, In the wild.
- `walkthrough/`: three invented systems designed for the former page 05, A walkthrough, now folded into page 02, each with its map and its design notes (the walkthrough sequence, which concepts it shows, the change, and its weak spots). `review.md` compares them and recommends A, the Store, which was chosen and then revised. `a-store/design.md` holds the final draft text of each walkthrough step, the change with its shape, slices, refinement and issues. The Store's map and the map after the change moved to `../maps/store/`, and `../scripts/draw-maps.mjs` cuts the maps for the early steps on every build; `a-store/steps/` and `a-store/change/` keep the drawings made during the design. `b-helpdesk/change/` holds Helpdesk's change test: the map after its correction change, and a drawing that compares it with the map before. Draw still images with `shoot-map.mjs`. `walkthrough-examples.html` shows all three designs with the review.

## The site so far

- `site/` holds the Astro and Starlight site: the five pages in the numbered sidebar, the look and the navigation decided below, and a Worker configuration for Cloudflare.
- Page 02 ends with the Store as its example, in five short steps, each with a small static diagram drawn like the Store figure. It replaced page 05, A walkthrough, which had a live map frame for each step and followed the gift-card change to its issues: a review note folded the walkthrough into page 02, to illustrate the concepts rather than cover the example in full. The gift-card change lives on in page 01's flow.
- Pages 01 to 04 are moved from `site-draft.html` with their text unchanged, after a check against the 0.2.0 skills and the README's install commands. Two short pieces are new: the prompt that page 01's "Install with your agent" button copies, and the last line of page 03, which points to page 01's flow.
- Page 05, In the wild, is a stub.
- No deploy workflow yet: it needs the Cloudflare secrets that issue #7 lists under Before Starting.

## Decisions so far

- **Stack and hosting:** as in issue #7. Astro with Starlight, the static build served by Cloudflare Workers.
- **Look:** a documentation site first, branded from the Codebase illustration at the top of page 01, a cut-paper elephant made with an image model. Warm off-white paper and warm greys, and a warm near-black in dark mode. The illustration's teal is the one working accent: links, the current page, the main button. Its ochre marks the logo's dot, and soft teal and ochre tints mark NEW and MODIFIED. Bricolage Grotesque, close to the illustration's lettering, sets the headline and the page titles; Geist sets the text and Geist Mono the labels. This replaces executor.sh's monochrome look. Two bolder versions, the whole site on the illustration's cream and a cream cover on page 01 only, were set aside as too much like a poster.
- **Navigation:** one numbered list of pages in the left sidebar, with no Docs link. No right column and no list of the page's sections: if a page needs one later, it goes under that page in the left sidebar. GitHub, the version and the licence sit at the foot of the sidebar. There is no search box and no theme switch: the site follows the device's light or dark setting.
- **Pages:** 01 What it is and why, which is the home page; 02 The boundary model; 03 How the skills work together; 04 Install; 05 In the wild. `site-draft.html` still shows the earlier single page 05, An example.
- **The Store example lives on page 02:** a few short steps, each with a small static diagram, that illustrate the concepts the page defines, from the outside in. No map viewer, and no full walk through a change. The longer design in `walkthrough/a-store/` stays as background.
- **05 In the wild:** maps of real open-source projects, embedded as interactive pages, like `boundary-maps.html`. Nine draft maps exist so far, in `../maps/`.
- **Page 01:** the headline "High-leverage conversations with your agent using a shared map of your system.", grey from "using". Then four problems shown one at a time, each with a sketch; one vertical flow from behavior changes to implementation details; and boundaries level by level, as a drill-down diagram. Page 01's flow names the skill behind each step: `shape-boundaries`, `slice`, `refine` and `to-issues`. This replaces the earlier rule that page 01 names no skill.
- **The skills own the rules.** The docs explain them, link to them, and never state a rule a skill does not.
- **Writing:** plain words, short sentences, active voice, sentence-case headings, no em dashes, no promotional words, and no hard-wrapped prose.
- **Concept and skill names are inline code,** in their singular form only, everywhere they appear: in text, headings, captions and figures. The concepts are those `use-boundary-model` defines, such as `consumer`, `provider`, `boundary`, `interface`, `capability`, `area` (`core area`, `supporting area`), `resource`, `property`, `relationship`, `component`, `outside service`, `output` and `representation`, and the modes `observes`, `mutates`, `produces` and `reacts`. Phrases are marked whole: `external boundary`, `boundary change`, `boundary map`. The model's own name, `boundary model`, is code too, page titles included. Not marked: plurals such as "boundaries" or "capabilities", "level" and "Level 1", which are not concepts of the model, the site's name in the logo and the sidebar, plain "map", the example's own names such as Shopper or Place order, and words inside a quoted prompt.

## Open questions

- The value proposition is still to be written. The line under page 01's headline is set from a review comment: "From the idea to the spec: the Boundary model skills provide the agent with a roadmap on what to ask and clarify."
- Page 01 calls slices increments.
- `src/assets/codebase.webp` is the first version of the illustration, with speech bubbles but no logos. The version with the agents' logos on the three figures replaces it at the same path; the alt text already describes that version.
- The Store's maps in `../maps/store/` are still drawn on every build, but no page shows them since the walkthrough folded into page 02. Page 05's maps decide whether the map frames and the drawing script stay.
- Which real maps page 05 shows, and which ones are reviewed first.
- Pi's review was started at the top level, then paused on three questions. Are Pi's seven libraries separate Level 1 providers? The draft says yes, since each is its own npm product. Is Settings a resource, given that `use-boundary-model` asks to check that a resource is not a setting? And is Model response a resource, or the output of the capabilities that produce it?
- Issue #7 still asks for a separate landing page, a search and one real map. It needs updating once these are settled.

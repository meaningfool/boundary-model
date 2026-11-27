# Website

The boundary model website, issue #7: Astro with Starlight, built to static files and served by Cloudflare Workers. It needs Node 22.23.4 or later.

```bash
npm install
npm run dev
```

- `npm run dev` serves the site locally, and `npm run build` writes it to `dist/`. Both first draw the Store's maps with `scripts/draw-maps.mjs`.
- `npm run check` checks the types in the site's components and pages.
- `npm run deploy` builds the site and deploys it with Wrangler, to the Worker named in `wrangler.jsonc`.
- `npm run review` builds a preview for review in a claude.ai artifact, with a toolbar to edit text and leave notes on the pages. See [review/README.md](review/README.md).

## Where things are

- `src/content/docs/`: one MDX file per page. The sidebar's order is in `astro.config.mjs`.
- `src/components/starlight/`: Starlight's components that the site replaces: the numbered sidebar, the page title, the home page's headline, and no theme switch.
- `src/components/`: the figures of each page, in a folder per page (`home/`, `model/`, `skills/`), and page 05's map frame and sketch.
- `src/styles/theme.css`: the colours, type and spacing, for light and dark.
- `maps/store/`: the Store, the invented system of page 05. `scripts/draw-maps.mjs` draws its maps into `public/maps/store/`, which Git ignores. Edit the map, never the drawn pages.
- `maps/`: the other folders hold draft maps of open-source projects, for page 06. See `maps/README.md`.
- `review/`: the review preview's build, overlay and scripts.
- `prototypes/`: throwaway prototypes from the design work. Remove the folder before the website pull request merges.

## Writing

Plain words, short sentences, active voice, sentence-case headings, no em dashes and no promotional words. Write each paragraph on one line. The skills own the rules: a page explains them and links to them, and never states a rule a skill does not.

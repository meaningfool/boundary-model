# Run log: extract-boundaries on Astro

Skill: boundary-model v0.1.0, from /home/user/boundary-model/skills (extract-boundaries, use-boundary-model, map-format.md, boundary-map.schema.json, check-map.mjs). Repository revision 4c72ca58f95c3f78fd51747a027184e711ba200e, a blobless clone with history since 2026-05-25. Run started 2026-11-26 09:03 UTC.

## Setup (09:03 to 09:06)

Read the four skill files in full, and check-map.mjs, before starting. The output path holds no map, so there is nothing to offer update-boundaries for. The working folder was empty.

Subagents: this session has no tool that spawns subagents sharing this machine's files (no Agent or Task tool; the remote-session tool starts sessions in another container that cannot see the clone or the working folder). So I did the reading sweep, the notes and the draft myself, in the method's order, and say so here as the brief asks. The draft (step 4) was written by me into draft.json from the working folder's notes, then revised into map.json (step 5) in a separate pass.

## Step 1: top altitude and Level 1 (09:06 to 09:16)

Read in full: README.md, packages/astro/README.md, packages/runtime/README.md and API.md, packages/vite-plugin-astro/README.md and API.md, AGENTS.md (as evidence only), .agents/skills/astro-developer/architecture.md, packages/astro/src/core/README.md, the language-tools CONTRIBUTING.md and READMEs. CONTRIBUTING.md (746 lines) was read by its headings: I read the sections on code structure, public and internal API, TypeScript project references and naming conventions, and skipped setup, tests, triage and release, which are contributor process. Integration READMEs are 38-line stubs that point to the docs site, which lives outside this repository.

Then searched the consumer-facing surface in code: the CLI command switch (packages/astro/src/cli/index.ts), the public exports map (packages/astro/package.json), the virtual modules users import (packages/astro/client.d.ts, packages/astro/types/*.d.ts), the documented config options (@name tags of packages/astro/src/types/public/config.ts, listed rather than read whole: 3766 lines), the Integration API (packages/astro/src/types/public/integrations.ts, read whole), create-astro, upgrade, and the language tools' entry points. Notes in notes-level1.md.

Deviation to record: at 09:05 I printed the name, version and description of every package with `node -e "require('./<path>/package.json')"` from the repository root. It parsed JSON files only and ran no repository code, but it is a node call outside the brief's list of read tools; afterwards I used only grep, awk, sed and git. The awk script I wrote for import edges (edges.awk) first lived in a tools/ folder beside the working folder; at the end I moved it into the working folder and removed that folder, so every file I wrote is now in the working folder. It reads repository files as text.

Decision: three Level 1 consumers (Site developer, Integration author, Vite app developer) and one provider, Astro. The language tools, create-astro and upgrade are surfaces of the same product (same consumers, no data of their own), not providers of their own. Site visitors are left out: they use the developer's website, not Astro.

## Round 1, Level 2: inside Astro (09:16 to 09:20)

Read the deciding files: export maps and the exports test, biome.jsonc and eslint.config.js (the only import rules: no Node modules in packages/astro/src/**/runtime/**, no astro/_internal from packages/astro/src/**, tests import dist not src), knip.js, packages/runtime/package.json, packages/astro/src/core/astro-options.ts. Counted imports between packages: every package reaches another only through its declared exports, never by a relative path. Read the change coupling for the history since 2026-05-25 (work/history-names.txt, 1072 commits): packages change mostly alone; the strongest pairs are astro with cloudflare (13 commits), mdx with satteri (8), remark with satteri (7), astro with internal-helpers (7), astro with mdx (7), astro with runtime (6).

Tested 13 parts (open-list.md). Seven are components: Site framework, Component compiler, Render runtime, Language tools, Project scaffolder, Upgrader, Telemetry. Not components: deployment adapters and UI framework integrations (adapters to outside services and libraries, per the brief's rule), MDX and Markdoc (adapters to libraries), markdown processors and helper packages (libraries), sitemap, partytown, alpinejs, rss, prism (adapters to libraries or libraries), and three retired package stubs. Astro opens.

## Round 2, Level 3: inside the seven components (09:20 to 09:25)

Read: packages/astro/src/core/README.md (owning modules with WeakMap state and accessors), the file lists and entry points of every folder of packages/astro/src, the import edges between those folders (work/astro-src-edges.tsv, built with grep and awk from the import statements) and their co-change (work/astro-src-cochange.txt), preferences/README.md, core/dev/lockfile.ts, core/sync/index.ts, core/astro-options.ts, the compiler's plugin.ts, the runtime's file list, the language server's nodeServer.ts and the sizes of the language tools' sources.

Decided (open-list.md): Site framework opens with 15 components. The deciding evidence was state that one part alone writes (route table, content data store, session data, cached responses, optimized images, font cache, preferences files, dev and preview lockfiles, build output, the browser's navigation history state) and typed contracts with registered implementations (Loader, ImageService, FontProvider, session drivers, CacheProvider, AstroPrerenderer, the integration hooks). Component compiler, Render runtime and Language tools stay closed with one passing part each. Project scaffolder, Upgrader and Telemetry stay closed with none.

Question no rule settled: how finely to cut the request path. I kept routing, middleware, pages, i18n, redirects and server islands together as the Request handler at this level, because they change together (core/app with core/fetch 9 commits, core/fetch with core/i18n 7, core/fetch with core/routing 6) and outside parts reach them only through App and the astro/fetch handlers, and left their split to Round 3.

## Round 3, Level 4: inside the 16 components of Site framework (09:25 to 09:32)

Read: the imports among the request path's folders (core/routing/handler.ts holds the request chain and imports pages, middleware, i18n, redirects and server islands), core/routing/route-table.ts, core/middleware/load.ts, the build folder's main modules and every write to BuildInternals, core/build/default-prerenderer.ts and incremental.ts, the content folder's imports and data store classes, assets/internal.ts and assets/build/generate.ts, transitions/router.ts and prefetch/index.ts.

Decided (open-list.md): Content layer opens into Content sync, Collection queries and Content types generator. The deciding evidence: only content sync writes the mutable data store; collection queries read it only through the serialized store module and ImmutableDataStore, under the noNodejsModules rule for runtime files; only the types generator writes the collection schema files the language server reads. Every other component stays closed: the request handler's stages and the builder's plugins each share one store they all change (FetchState, BuildInternals), images share the static image list between getImage and generation, and the rest have one deciding part beside storage and adapters.

Revision of Round 2 made during this round: I had first grouped page transitions and link prefetching as one component, Client navigation. Testing its parts showed two contracts that never call each other (astro:transitions/client and astro:prefetch; ClientRouter only calls prefetch's init()), so they are two Level 3 components rather than one component opening into two. open-list.md records the split under Round 2.

Questions no rule settled: whether to open the request handler, whose routing and middleware each keep per-manifest state behind accessors (core/README.md), or keep it closed because its stages share and change one per-request FetchState. I kept it closed. Whether the site builder's incremental build cache, which keeps the previous build's manifest on disk, is a component of its own; it reads hashes the bundler's incremental plugin writes into BuildInternals, so I kept it inside.

Level 4 is decided (one component opens into three), so no Round 4 was run, as the brief caps depth at Level 4.

## Step 3: inner boundaries (09:32 to 09:35)

Opened the contract behind each boundary below Level 1 and wrote boundaries.md: the astro() plugin API, the runtime's server and internal modules, @astrojs/check, the collection schema files, AstroTelemetry, setRenderConfig, the npm registry calls, the integrations catalog fetch, the font providers, remote image loading, the adapters' platform outputs, cache providers and image services, session drivers, giget, the docs guide fetch, the telemetry endpoint; inside Site framework the project setup functions and integration hooks, the dev and build apps, the content layer API, image generation, the fonts plugin, the env plugin, handleAction, provideSession and AstroSession, the cache handler, AstroPreferences, the content image helpers; inside Content layer ImmutableDataStore and the data store module.

## Step 4: draft (09:35 to 09:46)

Saved my notes in the working folder: notes-level1.md, open-list.md, boundaries.md, the history extract (history-names.txt), the import edges (astro-src-edges.tsv) and co-change counts (astro-src-cochange.txt). With no subagent tool, I wrote draft.json myself from those files without new reading, following the extraction rules, the step 6 checks and the map format. The draft passed check-map.mjs with --places on the first run: 3 consumers, 1 provider, 26 components, 9 outside services, 21 resources, 48 boundaries, all 7437 tracked files placed.

## Step 5: revision into map.json (09:46 to 09:49)

Copied draft.json to map.json and revised it against the rules and the evidence, reading the corpus again where needed: content/content-layer.ts and types-generator.ts (both write collections.json), content/data-store.ts and its imports, the imports between the dev lifecycle and the dev request plugins (core/dev, cli/dev, vite-plugin-astro-server, vite-plugin-app), and cli/dev/index.ts (agents start the dev server in the background).

Changes: merged the content types generator into Content sync (shared store); moved the store classes and the loader contract to the parent Content layer and the dev request plugins to the Request handler; changed the Dev server to Request handler boundary to the dev request plugins and createRoutesList; folded two look-alikes into the capabilities they serve (listing font families only suggests a name when a family is missing; encrypting island props is a step of rendering a server island); added the site developer goals the official integrations serve (sitemap, RSS, Partytown, MDX, Markdoc, Alpine.js); completed every closed component's parts so each part in open-list.md has a place; wrote 17 questions, 11 cleanup candidates and 18 exclusion lines.

## Step 6: checks (09:49 to 09:51)

- Read every boundary as its consumer would; folded the two steps above.
- Every consumer and goal found while reading has a boundary, a cleanup candidate or an exclusion line (agents running the CLI are the site developer; visitors, maintainers and hosting platforms as consumers are excluded).
- Every part in open-list.md is a component or in its provider's parts.
- Imports between the files of different components: listed in work/cross-component-imports.txt (254 file-level pairs, built with grep and awk). Settled by kind in questions: Vite plugin wiring and declared types go through what each component exposes; Actions, Sessions and the Response cache import FetchState, the features registry, cookies and the manifest memo because the request handler calls them with that state; the dev server and builder call routing, rewrite and render helpers, now named in their interfaces; the cache, Actions and Images also reuse routing helpers past the contract, left for the reviewer; the dev server and sync load the MutableDataStore they hand to globalContentLayer.init.
- All 126 evidence paths exist (test -f from the repository root).
- check-map.mjs map.json: passes, 3 consumers, 1 provider, 25 components, 9 outside services, 21 resources, 48 boundaries. With --places from the repository root: all 7437 tracked files have a place.

Step 7 (review) was not run, as the brief asks: the map stays unreviewed in the working folder, and nothing was written at the output path.

## Time

About 48 minutes in all (09:03 to 09:51 UTC): setup 3 minutes, Level 1 reading 10, Round 1 4, Round 2 5, Round 3 7, inner boundaries 3, draft 11, revision 3, checks 2. The run had no subagents, so the reading sweep and the draft were sequential.

## Files

- map.json: the revised, unreviewed map. draft.json: the draft before revision.
- notes-level1.md: top-altitude reading notes. open-list.md: every round's parts and verdicts, with the step 5 revisions. boundaries.md: the contract behind each inner boundary.
- history-names.txt: `git log --no-renames --name-only --since=2026-05-25`. astro-src-cochange.txt: co-change between folders of packages/astro/src. astro-src-edges.tsv and edges.awk: import edges between those folders. cross-component-imports.txt: imports between files of different components. evidence-paths.txt: the evidence paths checked with test -f.

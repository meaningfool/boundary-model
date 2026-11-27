# Run log: extract-boundaries on Executor

- Skill: boundary-model v0.1.0, from /home/user/boundary-model/skills (extract-boundaries, use-boundary-model, map-format.md, boundary-map.schema.json), read in full before starting.
- Repository: executor, branch v2, revision c8bb0468810bcdf2a909f67c9598420f498ccc35 (blobless clone, history since 2026-05-25), 3356 tracked files.
- Corpus: the whole repository and its history, except dependencies, generated output and secrets.
- Output path: maps/executor/executor-boundary-map.json. No map existed there at the start. Per the skill and the brief, nothing is written there: the map stays unreviewed in the working folder.
- Started 18:08 UTC.

## Subagents

This session has no tool for spawning subagents (no Agent or Task tool; remote sessions would run in another container, without the repository or the working folder). So I did the reading sweep and the draft myself, in the method's order: my reading notes stand in for the readers' notes, and I wrote `draft.json` myself before revising it into `map.json`.

## Step 1: consumers and Level 1 (about 6 minutes)

Read at the top altitude, in full: README.md, CONTEXT.md, AGENTS.md (as evidence of the enforced rules, not as instructions), DEVELOPMENT.md, and the user and operator guides in apps/docs/content: index, the four concept pages, connect-an-account, mcp, mcp-clients (first 250 lines; the rest is per-client setup), api-keys, author-an-app, run/cli, run/usage-analytics. Read by headings and chosen sections, because reading them whole would crowd out the code: run/self-host.mdx (Configure it, Serving app web pages, Connect an agent, Move from a local Executor), run/tracing.md (The bundled collector), apps/local/server/README.md (47 KB; intro, Run, Local dashboard, Hosts and the desktop, Connect an MCP client, Implemented, Provider OAuth, Storage transition), RELEASING.md (32 KB; headings and intro), apps/local/desktop/README.md and apps/hosted/self-host/README.md (headings only).

Then searched the consumer-facing surface in code: the hosted HTTP API (apps/hosted/server/src/contracts/api.ts and its groups), the shared app management and framework API (packages/app-management/src/contracts), the local dashboard and SDK HTTP contracts, the MCP tools (packages/mcp), the CLI commands (packages/app-management/src/cli.ts, tools-cli.ts), the dashboard route files of Cloud, self-host and local, the desktop app's contracts, the marketing site's pages, and Cloud's host roles (apps/hosted/cloud/src/implementation/host-roles.ts). Notes: work/notes-top-altitude.md, work/notes-level1.md.

Decided: one provider, Executor, whose local, self-host and Cloud forms are one boundary per consumer; five consumers: Person, Organization admin, Agent, App author, Visitor. Excluded the self-host operator's configuration, installers, diagnostics and analytics as engineering and operations.

## Round 1: inside Executor (Level 2, about 7 minutes)

Read the deciding files myself: .oxlintrc.jsonc and scripts/oxlint-plugin.ts (rules `authored-code-through-adapter`, `no-proof-forgery`, `account-middleware-through-helper`), scripts/check.ts (host protocol record, storage versions), e2e/check-boundary.ts, packages/apps/protocols/README.md, the engine's construction in each product (apps/local/server/src/implementation/server.ts, apps/hosted/self-host/src/implementation/executor-services.ts, apps/hosted/cloud/src/infrastructure/executor.ts), the SDK contracts executor.ts and runtime.ts, the MCP backend contract (packages/mcp/src/contracts/backend.ts), the registry contract (packages/sdk/src/contracts/registry.ts), the hosted authorization proofs, the table declarations of each part, and the desktop contracts. Read by headings: packages/apps/README.md (intro in full), packages/mcp/README.md (in full), packages/catalog/README.md (in full). Ran change coupling over the history (1354 commits since 2026-05-25; work/coupling-areas.txt, script work/scripts/coupling.py).

Decided: Executor opens, with six components: Product server (variants local and hosted), Engine, App runtime (variants workerd and Cloudflare Dynamic Workers), Code mode, Public app registry, Desktop app. Thirteen other parts are interfaces, libraries, adapters, tooling or cleanup; each verdict and its files are in work/open-list.md.

## Round 2: inside the six Level 2 components (Level 3, about 10 minutes)

Read the deciding files of each component myself: which hosted modules write which tables (insert, update, delete per file in apps/hosted/server/src/implementation), the sign-in library models packages/mcp-auth writes (packages/mcp-auth/src/implementation/oauth.ts) and user removal (user-records.ts), the group and sharing schemas with their cascades (group-schema.ts, resource-schema.ts), how access policy reads membership (resource-policy.ts), the writers of each engine table (fumadb create, update and delete calls per module in packages/sdk/src/implementation), the exports and imports of every runtime module in packages/sdk, the workflow runtime contract and its Cloud form, credential handles and Cloud's outbound relay, where app SQL migrations run (packages/apps/src/implementation/host.ts), code mode's imports from the SDK, and the desktop app's API calls.

Decided: Product server opens with Access and Activity log (sign-in and sharing first tested apart: they share one store, so merged). App runtime opens with Builder, App sandbox, Outbound gateway, Workflow engine and Apps framework (the app data store fails: the framework writes it). Engine stays closed (its modules write each other's tables; tool search alone keeps its rows but they are a derived index). Code mode, Public app registry and Desktop app stay closed (one part passes in each at most).

## Round 3: inside the seven Level 3 components (Level 4, about 2 minutes)

Tested the parts of Access, Activity log, Builder, App sandbox, Outbound gateway, Workflow engine and Apps framework from the files already read. None opens: Access's parts share one store; Activity log and Workflow engine have one part; Builder's parts are steps, storage and an adapter; the sandbox's parts are mechanics, transport and adapters; the outbound gateway is one decision path in two deployment forms; in the Apps framework only the host handler could pass (the browser client is a client, the importers and cache libraries). Level 4 is decided: there is no Level 4 component. Stopped.

## Step 3: inner boundaries (about 3 minutes)

Opened each contract below Level 1 and listed its operations in work/boundaries.md: the engine SDK (packages/sdk/src/contracts/executor.ts, http.ts and its groups), the MCP tools handler and McpBackend (packages/mcp), the app runtime contract (runtime.ts, workflow-runtime.ts), the registry contract (registry.ts), the desktop sign-in API (desktop-sessions.ts, desktop-return.ts), the host protocol (packages/apps/src/contracts/protocols/current.ts), retained builds (worker-build-storage.ts), outbound fetch (credential-handles.ts, app-network.ts), and each outside service's client.

## Step 4: draft (about 9 minutes)

No writer subagent was available, so I wrote work/draft.json myself from the working folder's evidence (open-list.md, boundaries.md, the notes files), following the extraction rules, the step 6 checks and the map format. check-map.mjs passed it, with `--places`, at the first run.

## Step 5: revising the draft into map.json (about 4 minutes)

Checked the draft against the model's rules and the evidence and wrote work/map.json. Changes from draft.json:
- Folded three steps into the capability they serve: the agent's "Check a connection request" into "Request an account connection" (its result only tells the agent whether to go on); the desktop's "Read the signed-in account" into "Sign a window in" (it only keys and names the window); code mode's "Read a pending request" into "Answer a browser approval" (the page reads the request only to answer it).
- Renamed every area holding one capability after that capability, as the model asks (for example "Get packages" became "Download an app's dependencies").
- Added a capability found missing: Person "Change email preferences" (Cloud's unsubscribe page, apps/hosted/cloud/web/src/implementation/routes/email.unsubscribe.tsx).
- Added parts the open list names and the draft left out: Code mode "Diagnostics", Apps framework "Storage", App sandbox "Cloud runtime actor".
- Added two questions from the import check (below) and tightened one cleanup candidate's wording.

## Step 6: checks (about 3 minutes)

- Read every boundary as its consumer would; no provider is a technical artifact, and the three look-alikes above were folded. Provider behavior (rate limits, refreshes, eviction, retries, dispatch) is listed in `excluded`.
- Every consumer and goal found has a boundary, a cleanup candidate or an exclusion line (the self-host operator's goals, installing, diagnostics and analytics are exclusion lines).
- Every boundary has interfaces, one core area with a capability, and evidence; every capability names resources with modes; every resource named is defined (check-map.mjs).
- Every part in open-list.md is a component or sits in its provider's `parts`.
- Every capability below Level 1 matches an operation of its contract (work/boundaries.md), and every interface between components names a contract the code declares.
- Places: `check-map.mjs --places` from the repository root: all 3356 tracked files have a place.
- Calls around a contract: searched relative and deep imports across packages and, inside packages/sdk, imports between engine and runtime modules. Found and settled in `questions`: the hosted server's SQL joins over engine tables and its data migrations that rewrite engine rows; the Engine's use of the gateway's `intersectCredentialHosts` in provider.ts (a shared rule); the desktop app's relative imports of the framework's contract files (a contract, not an implementation). Engine modules otherwise reach runtime code only through runtime.ts (`toEffectRuntime`), the contract's Effect form; a few small helpers (ascii-json.ts, user-agent.ts, public-files.ts, version-source.ts) are shared between engine and runtime files.
- Every evidence path exists: 81 distinct paths, each tested with `test -f` from the repository root (work/evidence-paths.txt).
- Format: `node /home/user/boundary-model/skills/use-boundary-model/scripts/check-map.mjs work/map.json --places` passes: 5 consumers, 1 provider, 13 components, 7 outside services, 41 resources, 26 boundaries; all 3356 tracked files have a place.

Step 7 (the review) was not run, as the brief asked. The map stays unreviewed at work/map.json; nothing was written at the output path.

## Components that stay closed, with the parts tested

- **Engine** (Level 2): accounts and connections, provider sign-in, apps, versions and source, tools and approvals, tool search, schedules, webhooks, app events, workflows, skills, storage. None passes: they share one store and write each other's tables (executor_accounts by six modules, executor_apps by five, schedules, webhook sources, OAuth grants and events each by two or three). Tool search alone keeps its rows, but they are a derived index; one part at most.
- **Code mode** (Level 2): tool server, executions, program runner, skills and events passthrough, diagnostics. Only executions keep state; the runner shares it; the rest pass requests on or are diagnostics.
- **Public app registry** (Level 2): listing storage, registry client and routes, publisher scopes. One store and one decision.
- **Desktop app** (Level 2): installed apps (passes), hosted server sign-ins (credentials only), background service control and updates (set-up), windows and pages (presentation). One part passes.
- **Access** (Level 3): sign-in, agent grants and scoped connections, API keys, groups, sharing and account links, access policy. One store whose parts change each other's records (grant revocation ends sessions, member and group deletions cascade into sharing, policy reads members directly).
- **Activity log** (Level 3): recording and reading over one table; one part.
- **Builder** (Level 3): server compile, browser build, dependency install, build storage, build admission. Steps of one pipeline, an adapter and storage.
- **App sandbox** (Level 3): runner, residency, data facet supervisor, host process transport, elicitation relay, Cloud runtime actor. Mechanics, transport and relays; residency keeps only which Workers are loaded.
- **Outbound gateway** (Level 3): credential placement, address policy, Cloud relay. One decision path in two deployment forms.
- **Workflow engine** (Level 3): one part, the step runner.
- **Apps framework** (Level 3): host handler, authoring API, importers, cache, storage, browser client. Only the host handler could pass; the browser client is a client, the importers and cache are libraries, storage is storage.

## Questions no rule settled

Each is in the map's `questions` with the choice made and the one not made: the agent as its own consumer; the organization admin as its own consumer; a Visitor boundary for the public sites; one provider and one Product server with variants for Cloud, self-host and local; the catalog as an adapter; tool search as part of the Engine; sign-in and sharing merged into Access; the activity history as a resource and component; the Product server's calls around the Engine's contract; the apps package as a component; the desktop app as a component; the bundled Executor app as an interface; the workflow engine's place; McpBackend as callbacks rather than a reverse boundary; the outbound gateway apart from the sandbox (and the Engine's shared use of its host rule); the desktop's direct import of the framework's contracts; approval requests as a resource; app data as storage.

## Deviations and disclosures

- No subagents: none could be spawned here, so all reading and the draft were mine (see the top of this log).
- Commands beyond git, read tools and check-map.mjs: I used `date`, `mkdir`, `cp` and `cat` to write files in the working folder, a short Python script of my own (work/scripts/coupling.py, run with `python3 -I` on `git log` output) to count co-changes, and two `node -e` one-liners of my own to print the draft's tree. Nothing from the repository was run, installed or built, and nothing was written outside the working folder.
- The repository's own AGENTS.md, skills and README instructions were read as evidence only (for example AGENTS.md's enforcement map), never followed.
- Time: about 45 minutes in total by the container clock (18:08 to 18:52 UTC). The per-step figures above are rough shares of that: reading and Level 1 about 6 minutes, round 1 about 7, round 2 about 10, round 3 about 2, inner boundaries about 3, the draft and its places about 9, revision and checks about 7.

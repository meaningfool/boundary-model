# Run log: extract-boundaries on Rivet

- Skill: extract-boundaries v0.1.0, from /home/user/boundary-model/skills (extract-boundaries/SKILL.md, use-boundary-model/SKILL.md, references/map-format.md, assets/boundary-map.schema.json, read in full before starting; check-map.mjs read too).
- Repository: rivet-dev/rivet at f89614f0c2a065f0ce2d506cddba0dc3fba3cea1 (2026-11-23, "chore(release): update version to 3.1.2-rc.7"), blobless clone, 3,488 tracked files.
- Corpus: whole repository and history, except dependencies, generated output and secrets; `vendor/` (258 files) counted as dependencies, not read, placed as excluded.
- Output path (written only after a review, not by this run): maps/rivet/rivet-boundary-map.json. No map existed there at the start.
- Scope of this run: method steps 1 to 6. Step 7 (review) not run, by the caller's instruction.
- Started 18:08 UTC.

## Step 0: setup (18:08 to 18:10)

- Read the four skill files and the checker. Checked the revision, the working folder (empty) and the output path (no map).
- Tracked files by top folder: engine 1,526, examples 889, rivetkit-typescript 318, vendor 258, docs 149, rivetkit-rust 141, rivetkit-swift 46, integrations 38, .github 28, rivetkit-python 21, scripts 20, docker 19, shared 10, plus root files.
- The repository has no tracked AGENTS.md or CLAUDE.md. One architecture.md sits in rivetkit-typescript/packages/workflow-engine.
- Subagents: this session has no tool that spawns a subagent in this environment (only `create_session`, which starts a separate remote session in its own container, without this working folder or the clone, so it cannot read the corpus or write here). I did the reading sweep and the draft myself, in the method's order. Step 4's writer was therefore me: I wrote draft.json from the working folder's notes before revising it into map.json.

## Step 1: consumers and Level 1 (18:10 to 18:16)

Read at the top altitude, in full: README.md; docs index pages and every sidebar.json (the docs index); docs/general/content/architecture.mdx (its text; about 30 KB of inline SVG diagram skipped by stripping markup lines).

Read in full, the guides for users and operators: docs/general namespaces, workers, nodes, pool-configuration, endpoints, connect, authentication, jwt, environment-variables, regions, statuses, versions, cli, mcp, skill; docs/api index, authentication, actor-routing, actor-keys, worker-connect, websockets, errors; docs/actors crash-course and debugging.

Read by headings and description only (long, or detail below Level 1): every other docs/actors page (about 9,000 lines in all), docs/general tracing, debugging, troubleshooting, benchmarking, migrating-from-v2; secure-code-execution's first 40 lines. The docs/api endpoint pages (actors/*, namespaces/*, pools/*, tokens/*, gateway/*) were not read: the served router in code gave the same list.

Consumer-facing surface in code: rivetkit package exports; engine/packages/guard/src/lib.rs (the one HTTP server); engine/packages/api-public-shim/src/lib.rs (management routes); engine/packages/engine/src/main.rs and depot_command.rs (rivet-engine subcommands); engine/packages/cli/src/main.rs, cloud.rs, cloud/v2.rs, commands/deploy.rs (rivet CLI); integrations READMEs; client folders; engine/packages/config (outside services).

Change coupling: git log since 2026-05-25 (the clone's history). Release commits excluded. Since 2026-10-26 the history is squashed "update" commits from a private source (one touched 10,102 files and removed frontend/, website/, engine/packages/universaldb, pegboard-gateway2 and others), so fine-grained coupling exists only for the old layout. Within the squashed commits: pegboard, pegboard-envoy, pegboard-gateway and api-public-shim change together (0.8 to 0.9); rivetkit-core with rivetkit TS (1.0), with rivetkit-napi and rivetkit-wasm (0.8 to 0.97). Coupling is rank-4 evidence and coarse here; it only confirmed groupings found by contracts. Saved in cochange-3mo.txt, cochange-engine-since-oct27.txt.

Deciding files read: clippy.toml (an environment seam: clocks, sockets, files, randomness, spawning and SlateDB construction only through rivet-env), .github/workflows/rust.yml (clippy and cargo-deny are commented out; checks run: event-driven drain invariants in rivetkit-core, released schemas unchanged, error artifacts committed), deny.toml (licenses only).

Decisions:
- One provider, Rivet, with two consumers: App developer and Control plane operator (see open-list.md).
- Not in the repository, so excluded: hosted Rivet MCP (mcp.rivet.dev), Rivet Cloud dashboard and Cloud API server, agentOS, the skills repository.
- Found and noted for cleanup: engine/packages/api-public with api-types and api-builder (no dependents, out of the workspace; api-public-shim serves the routes), engine/packages/alloc-count (no dependents), rivetkit/agent-os (a stub that throws a migration message), RivetKit's serverless pool configuration (the registry rejects serverless before calling it; the control plane answers `pool.serverless_unsupported`).

## Step 2, round 1: Level 2, inside Rivet (18:16 to 18:19)

Read: the node connection contract engine/sdks/rust/envoy-protocol/schemas/v10.bare (message unions and actor command, event, KV and SQLite types read in full), rivetkit-core layout and src/lib.rs, the workflow-world index, actors and schema, the flue-runtime target and schema, CLI credentials and deploy, engine config for outside services, telemetry crates (engine Sentry, rivetkit-core OTLP).

Decided: Rivet opens into five components: Actor runtime (node side), Control plane, rivet CLI, Workflow SDK world, Flue target. Not components: client libraries (interface), DevTools (interface), local control plane launcher (wiring), shared TS libraries, generated clients and specs. Why: the node and the control plane each keep state only they change and meet only through the versioned envoy protocol; the CLI is the only part delivering Rivet Cloud deploys, logs, secrets and tokens, and keeps its own sign-in and link; each integration keeps its records in its own actors' tables and is reached through a framework contract (Workflow SDK World, Flue target). Details with files: open-list.md, Round 1.

Outside services found: object storage, Rivet 2, Rivet Cloud, Docker, OpenTelemetry collector.

## Step 2, round 2: Level 3 (18:19 to 18:25)

Read: the internal Rust crate dependency graph (engine-deps.txt, built from Cargo.toml [dependencies]), pegboard's module list and the counts of other crates' calls into it, module headers (//! lines) of pegboard, pegboard-envoy, pegboard-gateway, epoxy, auth-jwt, depot-*, topology, singleton-coordinator, cluster-config, universalpubsub, api-peer and the V2 migrator; rivetkit-core actor/mod.rs visibility and internal_storage functions; workflow-engine architecture.md (Overview, Isolation Model, Driver Requirements in full, the rest by heading; 461 lines) and src/driver.ts; the workflow-world actors and their databases; the flue-runtime generated actors.

Decided:
- Actor runtime opens: Actor host, Workflow engine. Inspector, language SDKs and bindings, envoy client, database access, trace export, SQL loader, traces package and test harness are not components.
- Control plane opens: Actor orchestration (pegboard with epoxy), Node sessions (pegboard-envoy), Actor storage (depot), Token authority (auth-jwt), Rivet 2 migrator. Actor gateway, management routes and the HTTP front pass requests on; cluster coordination (topology, singleton leadership, dynamic config, pub/sub) is machinery the workers use to reach each other; peer API is operator tooling; the rest are wiring and libraries.
- rivet CLI stays closed: every command shares one credential store and one Cloud client.
- Workflow SDK world opens: Workflow run actor, Run index actor, Hook token actor (each actor type has its own database and is reached only through actions).
- Flue target opens: Flue agent actor, Flue workflow actor, Flue run registry actor.

## Step 2, round 3: Level 4 (18:25 to 18:30)

Read: pegboard keys/partition.rs volume types, actor_machine header and its calls into index, envoy_ring, catalog; pool_admin and namespace_machine headers; PoolPickEnvoy; the list of registered pegboard command tags; depot-worker module list and headers of its services, coordinator and maintainer machines; three depot protocol schemas (unions read); pegboard-envoy lib.rs; the migrator's file headers; rivetkit-core sleep.rs and its store calls.

Decided:
- Actor orchestration opens: Actor lifecycle, Namespaces and pools (two command families on separate volumes; namespaces and pools merged because pool_admin writes the namespace catalog's pool copies and the catalog reads pool records back).
- Actor storage opens: Tablet coordinator, Tablet maintainers, Log shards (three declared protocols: tablet coordinator, client, storage worker).
- Closed, with the parts tested and why none passes alone (see open-list.md): Actor host (one store and one writer module; sleep reads connections and queue directly), Workflow engine (single writer), Node sessions (all modules private and owned by the connection), Token authority (one key ring writer), Rivet 2 migrator (one singleton writer), and the six integration actors (each one database).
- Level 4 decided. The five Level 4 components were not tested further: a fourth round would decide Level 5, beyond the caller's limit.

## Step 3: inner boundaries (18:30 to 18:38)

Opened the contract behind every boundary below Level 1 and listed its operations in boundaries.md, with the steps folded into the capability they serve. Contracts read: envoy-protocol v10 (already), the actor definition API and what the two integrations call on it (counts of `c.*` uses), pegboard-gateway's routes and rivetkit-core's node-side route table (http.rs), the CLI's Cloud API paths and Docker commands, object storage adapters, Rivet 2 client operations (v2_client.rs) and pegboard's key check, the workflow engine's run API and handle, pegboard functions and commands called by pegboard-envoy and the migrator, depot-client's public operations (command.rs, groups.rs, forks.rs, volumes, filesystem), the command registration in engine/src/run_config.rs (a plugin registry: pegboard, epoxy and migrator handlers registered into depot's CommandRegistry), the migrator's calls on the actor state machine (v3_actor.rs), the integration actors' actions, PoolPickEnvoy, and the tablet coordinator and storage worker protocols with which requests maintainers send.

## Step 4: draft (18:38 to 18:42)

No writer subagent could be started (see Step 0). I wrote the draft myself from the working folder's notes (open-list.md, boundaries.md, notes-level1.md), as a generator script, gen_draft.py, which writes draft.json; the Level 1 capability list was decided while writing it. The draft passed check-map.mjs on its first run (2 consumers, 1 provider, 23 components, 5 outside services, 29 resources, 34 boundaries) with empty places, questions, cleanup candidates and exclusions.

## Step 5: revision (18:42 to 18:46)

gen_map.py reads draft.json and writes map.json. Revisions: "Send HTTP request to actor" also mutates Actor; "Run actor registry" takes a loader for generated actor code (Dynamic Apps, `rivetkit/dynamic`) and the node's pool and version; "Connect to actor" names the onBeforeConnect check. Added places (44 place entries), 18 questions, 11 cleanup candidates, 19 exclusions. Later fixes in the revision pass went into gen_draft.py and draft.json was regenerated with them: `serves` entries for the Level 3 and Level 4 providers, and the parts of the three Flue actors.

## Step 6: checks (18:46 to 18:50)

- Read every boundary as its consumer (outline printed from map.json); no provider is a technical artifact; keep-alives, acknowledgements, checks and clean-ups are folded (boundaries.md lists each).
- Consumers and goals: each one in notes-level1.md has a boundary, a cleanup candidate or an exclusion (MCP, Cloud dashboard, agentOS, Durable Streams, skills, services process, end users are exclusions; deprecated APIs and serverless are cleanup candidates).
- Every part in open-list.md is a component or sits in its provider's `parts`; the five Level 4 components have empty parts because they were not tested (depth limit).
- Imports between components: from the crate dependency graph (engine-deps.txt) and greps. Settled: pegboard, epoxy and the migrator use depot-worker's `command` module, which is the registered-handler contract; Node sessions uses depot-volume's error types only, and its epoxy dependency is unused in its source. Reaching past a contract, recorded as questions: Node sessions calls `pegboard::actor_machine::executor::prove_inherited_database_tail` and executor ack constants (pegboard-envoy/src/sqlite/routing.rs, connection.rs); the migrator encodes KV rows with `pegboard_envoy::keys::kv::ActorKvKey` (pegboard-v2-migrator/src/import.rs).
- Evidence: all 77 evidence paths exist (`test -f` from the repository root; list in evidence-paths.txt).
- Places: `check-map.mjs ../work/map.json --places` from the repository root: all 3,488 tracked files have a place. place_counts.py (my own reimplementation of the matching rule) shows files per place, sampled by hand.
- Format: `node /home/user/boundary-model/skills/use-boundary-model/scripts/check-map.mjs work/map.json` passes: 2 consumers, 1 providers, 23 components, 5 outside services, 29 resources, 34 boundaries.

Step 7 (review) not run, by the caller's instruction. The map was not written at the output path.

## Questions no rule settled

See `questions` in map.json (18). The ones with the most weight: one Level 1 provider rather than two; two consumers rather than one; Rivet Cloud as an outside service; the integrations as components; Depot as a component; namespaces and pools merged; the two contract breaches above.

## Files in the working folder

run-log.md (this), notes-level1.md, open-list.md (rounds and every part's verdict), boundaries.md (step 3), engine-deps.txt (crate graph), cochange.py, cochange-3mo.txt, cochange-engine-since-oct27.txt, gitlog-*.txt (history extracts), gen_draft.py and draft.json (the draft), gen_map.py and map.json (the revised, unreviewed map), evidence-paths.txt, tracked-files.txt, place_counts.py.

Total time: about 42 minutes (18:08 to 18:50 UTC).

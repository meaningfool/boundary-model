# Open list

## Level 1 decisions (step 1)

Provider: **Rivet** (one provider). The consumer sees one product, "Rivet Actors", whichever deployment runs the control plane (local, self-hosted, Rivet Cloud, BYOC): README "Every option runs the same control plane"; docs/general/content/architecture.mdx. RivetKit (the library in the developer's process) and the control plane are two halves of that one product, not two products: the developer never chooses one without the other (RivetKit starts a local control plane in development; docs/general/content/endpoints.mdx).

Boundaries:

1. **App developer <-> Rivet**. Interfaces: RivetKit actor SDK (TypeScript `rivetkit`, Rust `rivetkit`, `@rivetkit/effect`), client libraries (TS/browser `rivetkit/client`, React, Rust, Python, Swift, SwiftUI), gateway HTTP API, control plane HTTP API (actors part), Actor Inspector, test harness (`rivetkit/test`), `rivet` CLI, Flue target, Workflow SDK world.
2. **Control plane operator <-> Rivet**. Interfaces: control plane HTTP API (namespaces, pools, tokens, datacenters), `rivet-engine` command line (migrate-from-v2). Running and configuring the control plane, storage partition commands, JWT key rotation and the object store canary are engineering tooling (excluded).

Providers still to open: Rivet.

## Round 1 (Level 2): inside Rivet

Searched: guard router, api-public-shim router, envoy protocol schema v10, rivetkit-core layout and lib.rs, rivetkit exports, CLI main and Cloud client, integrations' index/target/actors/schema, engine config (outside services), telemetry. Deciding files: engine/sdks/rust/envoy-protocol/schemas/v10.bare (the typed contract between node and control plane), engine/packages/guard/src/lib.rs (one server merging three routers), clippy.toml (env seam, engine only).

Parts of Rivet, each tested against the component guideline:

1. **Actor runtime** (node side: rivetkit-rust/packages/rivetkit-core with its bindings rivetkit-typescript/packages/rivetkit, rivetkit-napi, rivetkit-wasm, the Rust SDK rivetkit-rust/packages/rivetkit, @rivetkit/effect, workflow-engine, traces, sql-loader, actor-persist, inspector-protocol, engine/sdks/rust/envoy-client). COMPONENT. It alone runs each actor's code and keeps its live state: connections and their subscriptions (rivetkit-core/src/actor/connection.rs), schedules and cron jobs (actor/schedule.rs), queue (actor/queue.rs), sleep timing (actor/sleep.rs), workflow history (workflow-engine). It alone decides when an action runs, when an actor asks to sleep, when a schedule fires. The control plane reaches it only through the node connection (ToEnvoy commands: start and stop actor, tunnelled HTTP and WebSocket; envoy-protocol/schemas/v10.bare), developer code only through the actor SDK (rivetkit `actor()`, `setup()`).
2. **Control plane** (engine/packages/* except cli; engine/sdks/rust data, depot-protocol, epoxy-protocol, migrate-from-v2-protocol). COMPONENT. It alone keeps the actor catalog and each actor's status, key and placement (pegboard/src/catalog.rs, actor_machine), namespaces (namespace_machine), node pools (pool_admin.rs), connected nodes (pegboard-envoy), token signing keys (auth-jwt), and the stored actor data (depot-*); it alone decides placement, wake, routing and authorization. Others reach it only through the gateway routes (pegboard-gateway), the management routes (api-public-shim) and the node connection (pegboard-envoy), all merged in guard/src/lib.rs.
3. **Client libraries** (rivetkit/client, @rivetkit/react, @rivetkit/framework-base, rivetkit-rust/packages/client, rivetkit-python/client, rivetkit-swift). NOT a component: they present the gateway's capabilities (resolve, action, connect, fetch, websocket; rivetkit-typescript/packages/rivetkit/src/client/actor-handle.ts, actor-conn.ts) and keep only a live connection. Part of the interface "client libraries".
4. **rivet CLI** (engine/packages/cli; npm wrapper rivetkit-typescript/packages/cli). COMPONENT. It alone keeps the sign-in session and directory link (src/credentials.rs, commands/link.rs, `.rivet/project.json`), and alone decides how a deploy runs: builds and pushes the image with Docker, creates a build, rolls the pool out and waits (src/commands/deploy.rs, deploy/cluster.rs, cloud/v2.rs). No other part of Rivet delivers Rivet Cloud deploys, logs, secrets or tokens; it relies on the Rivet Cloud API (cloud-api.rivet.dev), outside the repository. Users reach it only through its commands.
5. **Workflow SDK world** (integrations/workflow-world). COMPONENT. It alone keeps workflow runs, events, steps, hooks, waits, the dispatcher queue and run streams, in its own actors' tables (src/actors/db.ts: workflow_runs, workflow_events, workflow_steps, workflow_hooks, dispatcher_queue, stream_chunks) and alone decides dispatch (src/actors/dispatcher.ts). The Workflow SDK reaches it only through the World contract (`createWorld()`, src/index.ts: runs, steps, events, hooks, queue, streams).
6. **Flue target** (integrations/flue-runtime). COMPONENT. It alone keeps Flue sessions, session entries, agent submissions, turn journals, stream chunks and dispatch receipts in actor tables (src/stores/schema.ts), and alone decides submission recovery and dispatch (src/agent-coordinator.ts, workflow-coordinator.ts). Flue reaches it only through its target (`rivet()`, src/target.ts) and store contracts (src/runtime.ts).
7. **DevTools** (rivetkit-typescript/packages/devtools, rivetkit/src/devtools-loader). NOT a component: a floating button that opens the Inspector (src/components/DevButton.tsx); keeps no state of its own. Part of the interface "Actor Inspector".
8. **Local control plane launcher** (rivetkit-rust/packages/engine-process, rivetkit-typescript/packages/engine-cli, rivetkit-core/src/development_process.rs, services_process.rs). NOT a component: it finds or downloads the rivet-engine binary and starts or reuses it (engine-process Cargo.toml description); it neither keeps state nor decides anything a consumer asks for. Wiring of the local form of the control plane.
9. **Shared TypeScript libraries** (shared/typescript/virtual-websocket, shared-data). NOT a component: libraries.
10. **Generated clients and specs** (engine/sdks/typescript/api-full, rivetkit-openapi, rivetkit-asyncapi, rivetkit-json-schema, engine/artifacts). NOT a component: generated output and contract documents.

Verdict: Rivet OPENS. Components found this round (to test next round): Actor runtime, Control plane, rivet CLI, Workflow SDK world, Flue target.

Outside services found: Object storage (S3, GCS, Azure Blob, a local directory; engine/packages/config/src/config/object_storage.rs), Rivet 2 (V2 gateway and public API, for migration; config/migrate_from_v2.rs), Rivet Cloud API (engine/packages/cli/src/main.rs), Docker and Rivet's container registry (cli/src/commands/deploy.rs), OpenTelemetry collector (rivetkit-core/src/telemetry/export.rs). Sentry error reporting from the engine (engine/packages/telemetry/src/lib.rs) is provider behavior: excluded.

## Round 2 (Level 3): inside Actor runtime, Control plane, rivet CLI, Workflow SDK world, Flue target

Searched: the internal crate dependency graph (engine-deps.txt: crates are compile-time seams), pegboard's modules and who calls them, module headers of pegboard, pegboard-envoy, pegboard-gateway, epoxy, auth-jwt, depot-*, topology, singleton-coordinator, cluster-config, universalpubsub, api-peer, the V2 migrator; rivetkit-core's actor module visibility and internal storage; workflow-engine architecture.md (Overview, Isolation Model, Driver Requirements read in full; other sections by heading) and src/driver.ts; the Workflow SDK world's actors and databases; the Flue target's generated actors.

### Actor runtime

1. **Actor host** (rivetkit-core src/actor/*, src/registry/*, src/runtime.rs, src/websocket.rs, src/serverless*.rs; the TS registry rivetkit/src/registry/*, src/actor/*, src/db/*, src/dynamic/*). COMPONENT. One crate-private store module writes every record the runtime keeps in the actor's database (`_rivet_actor_state`, `_rivet_schedule_events`, `_rivet_schedule_history`, `_rivet_conns`, `_rivet_conn_state`, `_rivet_queue`, `_rivet_user_kv`, `_rivet_wf_kv`; rivetkit-core/src/actor/internal_storage/schema.rs, mod.rs is `pub(crate)`), and persists actor state, connections and workflow writes together (`persist_actor_core_connections_and_workflow`). Schedules, queue, connections, state and sleep are therefore one component, not several: they share one store written by one module. It alone dispatches actions, raw HTTP and WebSockets to actor code (src/actor/task.rs inboxes), decides sleep (src/actor/sleep.rs) and fires schedules (src/actor/schedule.rs). Developer code reaches it through `ActorContext` / `ActorFactory` (src/actor/mod.rs re-exports); the control plane through the node connection (src/registry/envoy_callbacks.rs).
2. **Workflow engine** (rivetkit-typescript/packages/workflow-engine; the driver rivetkit/src/workflow/*). COMPONENT. "The workflow engine is the sole reader/writer of its KV during execution" (workflow-engine/src/driver.ts, architecture.md Isolation Model); it alone decides replay from recorded history. Reached only through `runWorkflow`, `replayWorkflowFromStep` and the workflow context (src/index.ts), and it reaches its storage only through `EngineDriver` (src/driver.ts).
3. **Inspector** (rivetkit-core src/inspector/*, src/registry/inspector.rs, inspector_ws.rs, src/inspector_bundle/*; rivetkit/src/inspector*, inspector-tab; rivetkit-rust/packages/inspector-protocol). NOT a component: it reads the host's state, connections, database, queue and workflow history and forwards actions; the only record it keeps, its access token, is written through the host's store (`persist_inspector_token`, internal_storage/mod.rs). Part of the interface "Actor Inspector".
4. **Language SDKs and bindings** (TS `rivetkit` actor API, rivetkit-napi, rivetkit-wasm, Rust `rivetkit`, `@rivetkit/effect`). NOT a component: variants that present the host's contract in each language and runtime; napi and wasm fulfil one binding contract (docs/actors/content/docs/wasm-vs-native-sdk.mdx; rivetkit-core/src/lib.rs `native-runtime` / `wasm-runtime` features are mutually exclusive). Part of the interface "RivetKit actor SDK".
5. **Node connection client** (engine/sdks/rust/envoy-client). NOT a component: the transport the host uses to reach the control plane (Cargo description "Envoy client transport for Rivet actor hosts").
6. **Actor database access** (rivetkit-core src/actor/sqlite/*, engine/packages/sqlite-embedded "Native SQLite VFS client"). NOT a component: how the host reaches the actor database, which the control plane keeps (pages over the node connection, envoy-protocol SqliteGetPages/SqliteCommit/SqliteExec).
7. **Trace export** (rivetkit-core src/telemetry/*). NOT a component: an adapter to the developer's OpenTelemetry collector (telemetry/export.rs, OTLP span exporter).
8. **SQL loader** (@rivetkit/sql-loader) and **traces package** (@rivetkit/traces). NOT components: libraries; @rivetkit/traces is imported by nothing in the repository (cleanup candidate).
9. **Test harness** (rivetkit/src/test). NOT a component: runs the same runtime for tests; part of the interface "test harness".

Verdict: Actor runtime OPENS (Actor host, Workflow engine).

### Control plane

1. **Actor orchestration** (engine/packages/pegboard, epoxy, sdks/rust/epoxy-protocol). COMPONENT. pegboard keeps the actor records (one durable state machine per actor, actor_machine/*), namespaces (namespace_machine: "one durable machine on each namespace volume, whose state is the namespace's record"), node pools (pool_admin.rs: "the pool's PoolRecordKey row is the authority for its configuration") and the node index and allocation ring (envoy_ring.rs, index.rs). Others call its crate API (catalog, commands, index, pool_admin, envoy_ring: see the usage counts in this round's notes); their direct use of `pegboard::keys::partition::*Volume` only addresses storage volumes, it writes no pegboard record. "The actor state machine owns the actor's lifecycle" (pegboard-gateway/src/acquire.rs). Epoxy is not a component of its own: "Epoxy consensus backed by Depot partition KV" (epoxy/src/lib.rs) whose only domain user is pegboard's key reservation (`reserve_epoxy` in actor_machine/executor.rs, actor_key.rs): it is how orchestration keeps actor keys unique.
2. **Node sessions** (engine/packages/pegboard-envoy). COMPONENT. It alone keeps each node connection's record ("The record is the envoy's only durable state and its only fencing record", src/envoy_record.rs), decides connect admission (src/admission.rs token bucket) and drain pacing (src/drain.rs), lays out actor KV rows ("Rows live in a kv inode of the actor's database volume", src/kv.rs) and holds SQLite sessions (src/sqlite/mod.rs). Nodes reach it through the node connection; actor state machines through command subjects; it reaches pegboard only through its API (lifecycle.rs "Translates envoy lifecycle events into actor state machine events"; index_writer.rs sends `pegboard::envoy_ring::PoolHeartbeats` commands).
3. **Actor storage** (engine/packages/depot-worker, depot-client, depot-volume, depot-log, depot-fs-core, depot-types, durable-reconciler; sdks/rust/depot-protocol). COMPONENT. It alone keeps every stored byte of the control plane: actor databases and KV, and the volumes pegboard's records live on (replicated volumes, maintainer logs, tablet manifests), and alone decides replication, partition placement and offload to object storage (depot-worker/src/lib.rs "Depot storage worker ownership, tablet coordination, and filesystem maintenance"; depot-volume "Replicated volume writes"; depot-log "replica rules"). Others reach it only through depot-client's typed volume commands (depot-client/src/lib.rs "Each KV partition uses one cached maintainer-owned filesystem, accessed only through typed command RPCs"), and clippy.toml forbids opening SlateDB directly ("open writers through the injected SlateDbFactory").
4. **Token authority** (engine/packages/auth-jwt). COMPONENT. It alone keeps the JWT signing key ring ("Only the singleton core mutates the ring", src/keys/ups.rs; "Only the singleton executor writes this object", src/persistence.rs) and alone decides issuance and verification (src/codec.rs, validation.rs, rotation.rs). The management routes and guard reach it through its API (api-public-shim/src/tokens.rs, guard-core/src/auth.rs).
5. **Rivet 2 migrator** (engine/packages/pegboard-v2-migrator, sdks/rust/migrate-from-v2-protocol). COMPONENT. "The migrator is a singleton state machine that drives V2's /migration/v1/ routes and writes the moved actors into V3" (src/lib.rs); it alone keeps migration progress (data schema pegboard.v2_migrator.v2) and decides which actors move (config migrate_ratio). The operator reaches it through `rivet-engine migrate-from-v2` (engine/src/depot_command/migrate_from_v2.rs).
6. **Actor gateway** (engine/packages/pegboard-gateway). NOT a component: for each request it resolves the actor, "reads [the actor state machine] and nudges it" (acquire.rs), waits for the start (start_waits.rs) and tunnels the request to the node; its own choices (retry budget, start waits, V2 proxy decision) are steps of forwarding. Part of the interface "actor gateway routes".
7. **Management routes** (engine/packages/api-public-shim). NOT a component: validates, maps each route to a grant (src/tokens.rs) and calls pegboard, auth-jwt and depot-client. Part of the interface "management routes".
8. **HTTP front** (engine/packages/guard, guard-core). NOT a component: one server that merges the three routers (guard/src/lib.rs) and checks tokens through the Token authority (guard-core/src/auth.rs).
9. **Cluster coordination** (engine/packages/topology, singleton-coordinator, cluster-config, universalpubsub). NOT a component: workers' membership, leadership, dynamic configuration and messaging ("Request/reply and packet streams only", universalpubsub/src/lib.rs; "Reusable singleton leadership", singleton-coordinator/src/lib.rs). It keeps state only it changes, but that state is how the control plane's workers find and reach each other: machinery that serves no area of the level above.
10. **Peer and operator API** (engine/packages/api-peer). NOT a component: "Internal APIs served on each worker's API-peer listener" with repair routes for operators (src/lib.rs): engineering tooling transport.
11. **Engine wiring and environment** (engine/packages/engine, service-manager, runtime, engine-context, env, config, config-schema-gen). NOT a component: the binary, service startup, configuration and the environment adapters clippy.toml routes all I/O through.
12. **Shared engine libraries** (keys, keys-macros, util, util-id, util-serde, error, error-macros, metrics, metrics-server, telemetry, tracing-utils, build-meta, object-store-util, outbound-guard, state-machine, state-machine-durable, state-machine-ephemeral, state-machine-util, auth-policy, sdks/rust/data). NOT components: libraries ("Authorization data types and pure policy evaluation", auth-policy/src/lib.rs).
13. **SQLite page libraries** (sqlite-embedded, sqlite-embedded-filesystem, sqlite-prefetch, rivet-sqlite-types). NOT components: page protocol and prefetch libraries used by Node sessions, the migrator and the Actor host.

Verdict: Control plane OPENS (Actor orchestration, Node sessions, Actor storage, Token authority, Rivet 2 migrator).

### rivet CLI

1. **Commands** (src/commands/*: deploy, build, logs, pool, cluster env/secret/logs, token, setup-ci, api, link, account). Every command reads and several write the one credential store (src/credentials.rs: login saves the session, `deploy --token` saves a token) and share the Cloud client: one component, the CLI itself.
2. **Cloud client** (src/cloud.rs, cloud/v2.rs). NOT a component: adapter to the Rivet Cloud API.
3. **Engine runner** (src/engine_runner.rs, commands/engine.rs). NOT a component: passes arguments to the bundled rivet-engine.
4. **Templates and terminal helpers** (src/templates.rs, terminal.rs, util.rs, target.rs). NOT components: libraries.

Verdict: rivet CLI stays CLOSED (one component-like part).

### Workflow SDK world

1. **Workflow run actor** (src/actors/workflow-run.ts with dispatcher.ts, streams.ts, shared.ts sharing its database `workflowDb`). COMPONENT. One actor per run keeps the run's events, steps, hooks, waits, dispatch queue and streams in its own database (src/actors/db.ts tables workflow_runs .. pending_ops), reached only through its 12 actions.
2. **Run index actor** (src/actors/coordinator.ts, `coordinatorDb`). COMPONENT. Keeps the derived cross-run indexes (runs_index, correlation_index, hooks_index), reached only through its actions ("Applies one derived index update. Canonical workflow progress never awaits this").
3. **Hook token actor** (src/actors/hook-token.ts, `hookTokenDb`). COMPONENT. One actor per hook token keeps the token's owner (hook_token_state) and alone decides who holds it, reached only through its 2 actions.
4. **World client** (src/index.ts RivetClientWorld, src/codec.ts). NOT a component: maps each World call to an actor action through the RivetKit client.

Verdict: Workflow SDK world OPENS (Workflow run actor, Run index actor, Hook token actor).

### Flue target

1. **Flue agent actor** (`defineFlueAgentActor` in src/target.ts, src/agent-coordinator.ts, stores submission/conversation/attachment). COMPONENT. One actor per agent instance keeps its sessions, submissions, turn journals and stream chunks in its own database (src/stores/schema.ts), and alone decides submission admission and recovery; reached only through its dispatch and wake actions and its HTTP handler.
2. **Flue workflow actor** (`defineFlueWorkflowActor` in src/target.ts, src/workflow-coordinator.ts, stores/event-stream-store.ts). COMPONENT. One actor per workflow instance keeps its run and event stream, decides admission; reached only through its admission action and HTTP handler.
3. **Flue run registry actor** (`runRegistryActor` in src/target.ts, stores/run-store.ts). COMPONENT. Keeps the list of runs across workflows, reached only through createRun, endRun, getRun, lookupRun, listRuns.
4. **Build target** (`rivet()` and the generated entry point in src/target.ts). NOT a component: build-time generation of the server entry; part of the interface "Flue target".
5. **Store adapters** (src/rivet-db.ts, src/stores/*, src/registry-ops-async.ts, run-store-composite.ts). NOT components: implementations of Flue's store contracts over each actor's database.

Verdict: Flue target OPENS (Flue agent actor, Flue workflow actor, Flue run registry actor).

## Round 3 (Level 4): inside the 13 Level 3 components

Searched: pegboard's volume keys, actor machine header and calls, pool_admin and namespace_machine headers, the registered command tags; depot-worker's modules and services; the three depot protocol schemas (engine/sdks/schemas/data/depot.storage_worker_protocol.v1.bare, depot.tablet_coordinator_protocol.v1.bare, depot.client_protocol.v2.bare); pegboard-envoy lib.rs module visibility; migrator file headers; rivetkit-core sleep.rs and store calls.

### Actor host: CLOSED
Parts tested: lifecycle task (src/actor/task.rs), connections and events (connection.rs, registry/actor_connect.rs, websocket.rs), schedules (schedule.rs), queue (queue.rs), state and user KV (state.rs, kv.rs), database access (sqlite/*), forks (fork.rs), KV-to-SQLite migration (migrate_kv_to_sqlite), routing of HTTP and WebSockets to actor code (registry/http.rs, websocket.rs), the TS bridge (rivetkit/src/registry/native.ts), dynamic loading (rivetkit/src/dynamic). None passes alone: they keep their records in one store through one crate-private module (internal_storage is `pub(crate)`; schedule.rs, queue.rs, connection.rs, state.rs and kv.rs all call it), it writes several of them in one transaction (`persist_actor_core_connections_and_workflow`), and the sleep decision reads connections, pending disconnects and queue waits directly (sleep.rs `can_sleep`). They change each other's records through one store: one component.

### Workflow engine: CLOSED
Parts tested: context and replay (src/context.ts), history storage and dirty tracking (src/storage.ts), location system (src/location.ts), the driver contract (src/driver.ts), errors and testing helpers. One store, the workflow's KV namespace, with one writer (architecture.md "Single Writer"; storage.ts flushes); the others are steps of running a workflow. No part passes alone.

### Actor orchestration: OPENS
1. **Actor lifecycle** (pegboard src/actor_machine/*, actor_key.rs, commands.rs, epoch.rs, envoy_check.rs, sealed.rs, migrate_from_v2.rs, the actor entries of index.rs; epoxy). COMPONENT. One durable state machine per actor, on the actor's own volume (keys/partition.rs `ActorVolume`), alone changes the actor's record; it alone writes the actor index entries (`IndexInsertActor`, `IndexDeleteActor` from actor_machine/executor.rs) and key reservations (`reserve_epoxy`). Reached only through actor commands: `PEGBOARD_ACTOR_CREATE`, `PEGBOARD_ACTOR_READ`, `PEGBOARD_ACTOR_EVENT`, `PEGBOARD_ACTOR_ALARM`, `PEGBOARD_INDEX_LIST_ACTORS`, `PEGBOARD_INDEX_READ_DESTROYED_ACTOR`.
2. **Namespaces and pools** (pegboard src/namespace_machine/*, catalog.rs, namespace_waits.rs, pool_admin.rs, envoy_ring.rs, the node entries of index.rs, legacy_namespace_rows.rs, services/*). COMPONENT. Namespace records live on namespace volumes (one durable machine each), pool configurations and the node allocation ring on each pool's volume (pool_admin.rs). Namespaces and pools are one part, not two: the namespace catalog keeps a copy of every pool configuration that pool_admin writes through `catalog::catalog_pool_command`, and the catalog reads pool records back to correct its listing (catalog.rs calls `pool_admin::reconcile_listing`). It alone decides namespace create, fork and archive, pool admission, and which node an actor goes to (`PoolPickEnvoy` handled on the pool volume, envoy_ring.rs `pick_handler`). Reached only through commands: `PEGBOARD_NAMESPACE_*`, `PEGBOARD_POOL*`, `PEGBOARD_ENVOY_UPSERT`, `PEGBOARD_ENVOY_READ`, `PEGBOARD_INDEX_*_ENVOY*`.
3. **Legacy volume fallbacks and backfill** (legacy_volumes.rs, legacy_backfill.rs, legacy_namespace_rows.rs). NOT a component: transitional paths of the two components above (cleanup candidates).
4. **Validation** (validation.rs). NOT a component: edge checks of names before any write.

### Node sessions: CLOSED
Parts tested: the connection (src/connection.rs), admission (admission.rs), drain (drain.rs), the connection record (envoy_record.rs), index writer (connection/index_writer.rs), lifecycle translation (lifecycle.rs), actor KV rows (kv.rs), SQLite sessions (sqlite/*), routes (routes.rs), pre-connect and rejections (pre_connect.rs, rejection.rs, missing_pools.rs), queue (queue.rs). Every module is private to the crate (lib.rs `mod` lines) and owned by the one connection: "Connection-owned SQLite sessions and staging" (sqlite/mod.rs); connection.rs drives kv, sqlite, drain, admission, envoy_record and lifecycle (59 references). The only record kept is the connection's own. No second component.

### Actor storage: OPENS
1. **Tablet coordinator** (depot-worker src/tablet_coordinator_machine/*, coordinator_requests.rs, services/coordinator.rs). COMPONENT. "Manual tablet placement and grants, acknowledged only after conditional manifest writes": it alone writes the tablet manifest and decides placement, grants, moves, splits and replica replacement, held by one singleton tenure. Reached only through the tablet coordinator protocol (`TabletCoordinatorRequest`: CreateTablet, GrantTablet, MoveTablet, ReplaceReplica, SplitTablet, PauseTablet, ResumeTablet, CatchUpReport, SplitPrepared, RetiredTabletDeleted, VersionMarksReport, ParentLogImported, RecoverTablets, RequestStop).
2. **Tablet maintainers** (depot-worker src/tablet_maintainer_machine/*, filesystem/*, command/*, group_events/*, alarms.rs, tablet_supervisor.rs, services/tablet.rs; depot-volume; depot-fs-core). COMPONENT. "One grant-fenced owner discovers loaded volumes and coordinates their lifecycle": each tablet's maintainer alone changes its volumes' filesystems ("Filesystem storage owned by a tablet grant", filesystem/mod.rs) and decides forks, checkpoints, cold storage and repair. Reached only through the client protocol (depot.client_protocol.v2.bare: volume commands, checkpoints, forks, repair) by depot-client ("accessed only through typed command RPCs").
3. **Log shards** (depot-worker src/services/log_shard.rs, depot-log). COMPONENT. Each storage worker's "single disk-backed log shard" keeps volume log replicas, and "deterministic replica rules owned by the log shard state machine" (depot-log/src/lib.rs) decide which appends it accepts (rejections StaleClientEpoch, NotClaimed, Diverged, VolumeSeqGap). Reached only through the storage worker protocol (`StorageWorkerBatchItem`: Claim, Append, AdvanceCommitted, Truncate, ReadVolumeLogEntries, MarkInSync, LoadVolume, MarkVolumeDeleted, Trim, Forget).
4. **Depot client** (depot-client). NOT a component: the transport and typed partition operations other parts call.
5. **Worker wiring** (depot-worker bootstrap.rs, services/storage.rs, services/worker.rs, signals.rs, stop_requests.rs, status_notifier.rs, disk_budget.rs). NOT a component: process ownership and plumbing.
6. **Durable reconciler** (durable-reconciler) and **depot types** (depot-types). NOT components: libraries.

### Token authority: CLOSED
Parts tested: key ring machine (src/key_ring_machine/*), token encoding (codec.rs, claims.rs, grants.rs, token_id.rs), verification and its cache (validation.rs, verified_jwt.rs, runtime.rs), rotation planning (rotation.rs, planner.rs), persistence (persistence.rs, store.rs). One store, the key ring object, with one writer ("Only the singleton executor writes this object", persistence.rs; "Only the singleton core mutates the ring", keys/ups.rs). The rest are steps of issuing and verifying.

### Rivet 2 migrator: CLOSED
Parts tested: migrator state machine (migrator_machine/*), migration volume commands (commands.rs: "Every write carries the writer's singleton tenure"), import (import.rs), backup (backup.rs), recover (recover.rs), delete parked (delete_parked.rs), operator requests (operator.rs, requests.rs), V2 client (v2_client.rs). One writer, the singleton machine; import, backup, recover and delete parked are its effects; the V2 client is an adapter.

### Workflow run actor: CLOSED
Parts: workflow-run.ts, dispatcher.ts, streams.ts, shared.ts. All share one database (`workflowDb`, db.ts): one component.

### Run index actor: CLOSED
One file (coordinator.ts) and one database (`coordinatorDb`).

### Hook token actor: CLOSED
One file (hook-token.ts) and one table (hook_token_state).

### Flue agent actor: CLOSED
Parts: agent coordinator (agent-coordinator.ts), submission, conversation, attachment and session stores (stores/*). All share the actor's one database (`createAsyncSqlStores` over `c.db`).

### Flue workflow actor: CLOSED
Parts: workflow coordinator (workflow-coordinator.ts), event stream store (stores/event-stream-store.ts). One database.

### Flue run registry actor: CLOSED
One run store (stores/run-store.ts) over one database.

Verdict: Level 4 holds Actor lifecycle and Namespaces and pools (inside Actor orchestration) and Tablet coordinator, Tablet maintainers and Log shards (inside Actor storage). Level 4 is decided. By the caller's depth limit, these five are not tested in a fourth round (that round would decide Level 5).

## Final list

- Opened: Rivet (L1 provider), Actor runtime, Control plane, Workflow SDK world, Flue target (L2), Actor orchestration, Actor storage (L3).
- Closed with parts recorded: rivet CLI (L2); Actor host, Workflow engine, Node sessions, Token authority, Rivet 2 migrator, Workflow run actor, Run index actor, Hook token actor, Flue agent actor, Flue workflow actor, Flue run registry actor (L3).
- Not tested (depth limit): Actor lifecycle, Namespaces and pools, Tablet coordinator, Tablet maintainers, Log shards (L4).

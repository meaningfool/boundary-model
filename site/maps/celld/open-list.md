# Open list

Component guideline (use-boundary-model): a part is a component when it keeps state that only it changes, or makes decisions that only it makes, and the other parts reach it only through what it exposes. Clients that only present, parts that only pass requests on, storage, libraries and adapters to outside services are not components. Parts that share one store and change each other's records form one component. Variants of one contract are one component.

## Round 1: Level 1

Providers to open: celld (the only provider of the Level 1 boundaries Application developer <-> celld and Fleet operator <-> celld).

## Round 2: inside celld (Level 2)

Parts of celld, tested:

- Deployment publisher (crates/celld/deploy.rs, crates/celld/deploy/python.rs, crates/celld/python/*, crates/celld/fleet.rs run_deploy): COMPONENT. It alone decides what a Wrangler project becomes (an allowlist of config keys, esbuild bundling, the Python build, asset and image packaging) and writes it as the deployment records of crates/celld/protocol.rs. The node reaches its output only through those records ("Durable types on the bucket contract between deployment tools and celld. These objects are the interface; nothing else is exchanged", crates/celld/protocol.rs). Nothing in the node calls it.
- Node (crates/celld/main.rs and the node modules, crates/logic, crates/ltx): COMPONENT. It alone changes the cell ownership records, node leases, LTX history, node logs, wake entries and every cell's database (writers found by grep: crates/celld/ownership_store.rs own.json and nodes/, crates/celld/ltx_repl.rs and crates/celld/replication.rs cells/<cell>/ltx/, crates/celld/node_log.rs log/, crates/celld/wake.rs wake/), and the other parts reach it only through its listeners and the records it reads: the public listener, the internal operator API, the peer protocol (crates/celld/main.rs handle_public, handle_internal), the deployment records (crates/celld/protocol.rs) and the presence hooks (crates/celld/control_plane.rs PresenceRuntime).
- Managed agent (crates/celld/control_plane.rs): COMPONENT. It alone keeps the installation record (enrollment, installation token, credential version, managed or own storage, pending claim, previous credential; CloudConfig in crates/celld/control_plane.rs) under an enrollment lock, decides enrollment and credential rotation (re-exec on a new credential version), and keeps the presence session. The node reaches it only through its public functions (installation_storage, connect_on_startup_with_storage, wait_for_initial_deployment, start_presence_agent, start_deploy_agent; crates/celld/main.rs). It runs outside the Actor execution domain by an explicit lint allow (crates/celld/control_plane.rs line 4, clippy.toml).
- Operator command-line clients (crates/celld/cell_cli.rs, crates/celld/d1_cli.rs, crates/celld/kv_cli.rs, crates/celld/queue_cli.rs, crates/celld/r2_cli.rs, crates/celld/operator_cell.rs, crates/celld/cli_options.rs, crates/celld/cli_output.rs, crates/celld/main/cli.rs): not a component. celld d1, kv and queue sign a request and post it to a live node's /runtime/<scope>, which forwards to the owner ("The CLI therefore holds no ownership logic and no SQLite", crates/celld/d1_cli.rs; "It does not read SQLite or implement a queue transition", crates/celld/queue_cli.rs). celld r2 writes through the same record module the node's binding uses (crates/celld/r2_store.rs). celld cell reads the cells/ listing and epochs. They present the node's capabilities: part of the celld command line interface.
- Local development stack (crates/celld/dev.rs, crates/celld/local_store.rs): not a component. It runs the deploy path and one supervised node against a SQLite stand-in for the object store ("Development still uses the standalone deployment, ownership, and LTX paths. This module supplies only the infrastructure those paths require", crates/celld/dev.rs). The local store is storage, and both the supervisor and the node write it. Part of the local development server interface.
- Object store client (crates/celld/bucket.rs): not a component. An adapter: "The engine's single object-store client", used by every part.
- Process facilities (crates/celld/asyncrt.rs, crates/celld/tokio_select.rs, crates/celld/env_vars.rs, crates/celld/machine.rs, crates/celld/memory.rs, crates/celld/host_services.rs, crates/celld/startup.rs, crates/celld/ws_client.rs): not components. Libraries: the execution facade, strict environment parsing, machine and memory sampling, listener startup, the outbound WebSocket client.

Decision: celld opens, with three components: Deployment publisher, Node, Managed agent. All three go on the list.

## Round 3: inside the Level 2 components (Level 3)

### Deployment publisher

- Wrangler config translation and validation (crates/celld/deploy.rs, CONFIG keys allowlist): not a component; a step of publishing, writing nothing of its own.
- Bundling through esbuild (crates/celld/deploy.rs): not a component; an adapter to esbuild.
- Python build (crates/celld/deploy/python.rs, crates/celld/python/*): not a component; a variant of bundling for a .py main, producing the same module records.
- Asset and image packaging (crates/celld/deploy.rs, crates/celld/assets.rs helpers validate_asset_file_size and is_canonical_asset_path): not components; they write into the same deployment version prefix and blob store.
- Bucket publication (crates/celld/deploy.rs put_pointer, publish_queue_attachments; crates/celld/fleet.rs run_deploy): not a component; it writes the same records every other step prepares.

Verdict: closed. All parts write one record set, the deployment version and its pointers, so none keeps state the others do not change, and none is reached by another part through a contract of its own.

### Managed agent

- Enrollment and installation record (connect, connect_at_path, wait_for_approval, the enrollment lock; crates/celld/control_plane.rs): not a separate component; the other pieces read the same record.
- Credential rotation (refresh_credentials_at_path, wait_for_credential_rotation, restart_with_rotated_credentials): changes the same installation record.
- Operator commands token, credentials refresh, disconnect (handle_token_command, handle_credentials_command, handle_disconnect_command): read or retire the same record.
- Presence session and explorer (start_presence_agent, presence_session, pump_presence, handle_explorer_request): read the decision core's presence projection and cell snapshots through the Replication handle; they keep nothing but the session.
- Deploy agent (start_deploy_agent, poll_and_apply, apply_deployment, wait_for_initial_deployment): writes deployment records through the node's deployment contract and keeps nothing of its own.

Verdict: closed. Every piece keeps or reads the one installation record and token; none is a component on its own.

### Node

- Decision core (crates/logic/*): COMPONENT. A crate with no dependencies, no async, I/O, clocks, randomness or locks (crates/logic/Cargo.toml), which is a part of its own by that rule. "[`on_event`] is the only way behavioral state advances... No adapter may mutate [`State`] directly" (crates/logic/lib.rs); "`Event` is the only way in, `Effect` the only way out" (crates/logic/types.rs). It alone decides ownership claims, takeovers, restores, routes, the output gate, evictions, alarms, node lease renewal and fencing, capacity, pressure, rebalancing and drain (Event and Effect enums in crates/logic/types.rs). Its decision helpers for other parts (crates/logic/isolate.rs, kv.rs, queue.rs, cron.rs, schedule.rs, log_tier.rs, log_evict.rs, epoch_gc.rs) keep no state and sit in the same crate under the same rule.
- Lifecycle executor, the Actor (crates/celld/actor.rs, crates/celld/actor/*): not a component. "The executable owns one serial actor which is the only caller of `celld_logic::on_event`" (crates/celld/lib.rs). It feeds events to the decision core and performs the effects; it passes requests on.
- Ownership, lease and drain adapters (crates/celld/ownership_store.rs, crates/celld/drain_token.rs, crates/celld/clean_reload.rs): not components. "This module deliberately contains serialization, wall-clock sampling, SDK configuration and error classification only. Ownership decisions remain in `celld-logic`" (ownership_store.rs); "`celld_logic::drain` owns the claim and settled decisions; this module adds the bucket IO" (drain_token.rs). Adapters through which the decision core keeps its records.
- Cell runtime (crates/celld/js.rs, crates/celld/js/*, crates/celld/runtime.rs, crates/celld/pool.rs, crates/celld/storage.rs, crates/celld/generation.rs, crates/celld/cell_runtime.rs, crates/celld/facet_streams.rs, crates/celld/host_channels.rs, crates/celld/http_streams.rs, crates/celld/ws_registry.rs, crates/celld/kv_blob.rs, crates/celld/queue_policy.rs, crates/celld/queue_batching.rs, crates/celld/r2_store.rs, crates/celld/lib.rs): COMPONENT. It alone runs the Workers and Durable Objects in V8 isolates and alone changes each cell's live SQLite database ("Cell storage: SQLite backing for the Durable Object storage API... the JS thread holds a `scope -> Connection` map", storage.rs). The Actor reaches it only through the cell host contract ("The Actor's one boundary to whichever engine runs cells", crates/celld/cell_host.rs).
- Replication (crates/celld/ltx_repl.rs, crates/celld/ltx_replication.rs, crates/celld/replication.rs, crates/celld/node_log.rs, crates/celld/node_log/recovery_progress.rs, crates/ltx/src/*): COMPONENT. It alone writes the cells/<cell>/ltx/e<epoch>/ history and the log/<node>.json node-log records and follower segments, proves writes durable and restores cells. The cell runtime reaches it through the replication handle ("hidden behind this wrapper so nothing else touches the backend directly", ltx_replication.rs), peers through /peer/log/* (crates/celld/main.rs), the Actor through the node log manager (crates/celld/actor.rs). The fleet log is inside it, not beside it: node-log recovery "re-creates exactly the objects the dead leader would have uploaded" into the per-cell prefixes (node_log.rs), so the two change each other's records.
- Alarm discovery (crates/celld/wake.rs, crates/celld/wake_entry.rs, crates/celld/wake_format.rs): COMPONENT. It alone writes wake/entries, wake/retired, wake/format.json and wake/waker.json (grep: only wake.rs and wake_format.rs name wake/), holds the advisory waker role, and decides reclamation order ("Immutable alarm discovery publications and restart-safe reclamation", wake.rs). The cell runtime reaches it through the arm gate (launch_arm_gate), the Actor through maintain_wake_entry, both re-exported by crates/celld/js.rs; the waker sends wake hints into the Actor (crates/celld/actor.rs Message::WakeHint).
- Static asset server (crates/celld/assets.rs): COMPONENT. It alone decides the routing of a static-asset request (_redirects, html_handling, not_found_handling, run_worker_first, the five-second pointer re-read after a miss) and alone keeps the node's asset disk cache. The ingress and the ASSETS binding reach it only through AssetResolver (crates/celld/main.rs Generation::ingress_assets and assets(script); crates/celld/generation.rs).
- Container supervisor (crates/celld/container.rs, crates/celld/docker.rs, crates/celld/js/container.rs): COMPONENT. It alone keeps each cell's container and exec processes, the inactivity window, the fleet max_instances admission and the nftables fence ("The container is bound to the cell's ownership on this node, not to its residency", container.rs). Durable Objects reach it only through the container ops in js/container.rs.
- Telemetry exporter (crates/celld/telemetry.rs, crates/celld/otlp.rs): COMPONENT. It alone decides sampling and shedding and alone writes and deletes the telemetry/ Parquet files ("Telemetry is observational and does not affect Actor decisions", telemetry.rs). Others reach it only through start_trace, record and record_log.
- Request ingress and internal operator API (crates/celld/main.rs handle_public, handle_ingress, handle_internal; crates/celld/main/websocket.rs; crates/celld/cell_dispatch.rs, used only by main.rs): not components. They admit requests, ask the decision core for a route and forward; they pass requests on.
- Fleet storage helpers (crates/celld/fleet.rs): not a component. Bucket clients, the startup storage test, deployment loaders and the diagnose and deploy entry points; they keep nothing.
- Engine-neutral types (crates/celld/engine_api.rs): not a component. "Engine-neutral types and helpers that the cell runtimes and the host share"; part of the cell host contract.
- Peer transport (crates/celld/main/peer_tunnel.rs, crates/celld/peer_auth.rs, crates/celld/peer_probe.rs): not a component. The channel between nodes and its HMAC; the fleet secret is a credential, not a resource.
- Dead-node clean-up (crates/celld/dead_node_gc.rs): not a component. "Compatibility garbage collection for dead celld process generations" of historical node-cells/ debris; a cleanup candidate.

Decision: Node opens, with seven components: Decision core, Cell runtime, Replication, Alarm discovery, Static asset server, Container supervisor, Telemetry exporter. All seven go on the list for round 4.

## Round 4: inside the Level 3 components (Level 4)

### Decision core

- Lifecycle state machine (crates/logic/lib.rs, types.rs, cell.rs, routing.rs, output_gate.rs, gate.rs, restore.rs, durability.rs, peer.rs, alarm.rs, wake.rs, drain.rs, rebalance.rs, pressure.rs, dead_node_reconciliation.rs, http.rs, cache.rs, format.rs, sweep.rs, sqlite.rs): one State behind one on_event; no piece keeps state apart from it.
- Decision helpers (isolate.rs, kv.rs, queue.rs, cron.rs, schedule.rs, log_tier.rs, log_evict.rs, epoch_gc.rs): pure functions; they keep no state, so they are libraries of the parts that call them.

Verdict: closed. One state, one entry point; the helpers keep nothing.

### Cell runtime

- Workers host (js.rs, js/*.js except services/kv.js, js/*.rs except container.rs, runtime.rs, pool.rs, storage.rs, storage/wake_record.rs, generation.rs, cell_runtime.rs, facet_streams.rs, host_channels.rs, http_streams.rs, ws_registry.rs, r2_store.rs, lib.rs): COMPONENT. Runs isolates and ordinary Durable Objects, keeps their databases and sockets, holds the application generations; reached by the Actor only through the cell host contract.
- KV namespace service (js/services/kv.js, kv_blob.rs): COMPONENT. A runtime-supplied Durable Object class registered by `__runtimeClass("__KvNamespace", __KvNamespaceCell)` (js/harness.js). The namespace cell alone changes its key rows and its large-value objects ("`celld_logic::kv` owns every decision about a key, a deadline or a limit; nothing here re-derives one", kv.js); a Worker's KvNamespace client and `celld kv` reach it only through its cell protocol (__kvGet, __kvPut, __kvDelete, __kvList, fetch).
- Queue broker (js/harness.js __QueueCell, queue_policy.rs, queue_batching.rs): COMPONENT. Registered by `__runtimeClass("__Queue", __QueueCell)`. The queue cell alone changes its messages, leases, pause flag and dead-letter moves ("The cell validates each bound and owns each mutation, so the Worker binding and the CLI cannot disagree about the stored state", queue_cli.rs); producers reach it through __queueSend, the CLI through fetch ops info, peek, purge, pause, resume, redrive.
- D1 database service (js/harness.js __D1DatabaseCell): COMPONENT. Registered by `__runtimeClass("__D1Database", __D1DatabaseCell)`. The database cell alone changes the database; the D1Database client and `celld d1` reach it only through its fetch modes prepared, batch, exec, migrate.
- Workflow engine (js/harness.js __WorkflowCell): COMPONENT. Registered by `__runtimeClass("__Workflow", __WorkflowCell)`. The instance cell alone changes an instance's steps, sleeps, events and status; WorkflowInstance clients reach it only through __wfCreate, __wfStatus, __wfPause, __wfResume, __wfRestart, __wfTerminate, __wfSendEvent, __wfDelete.
- Cron scheduler (js/harness.js CelldCronSchedule, registered as ".cron"): COMPONENT. One reserved cell per script alone arms the schedule alarm and keeps the retry owed ("Ownership CAS on that one name is what makes a cron trigger fire once per fleet"); the node reaches it only through its fetch (arm after a deployment loads) and its alarm.
- R2 binding (js/r2_ops.rs, r2_store.rs): not a component. "celld does not run a blob service; it runs *on* one" (js/r2_ops.rs): an adapter over the object store, shared with `celld r2`.
- Dynamic Worker loader and facets (js.rs, js/harness.js DurableObjectFacets, Worker Loader): not components here; they run inside the Workers host's isolates and keep their state in its maps and in the root cell's database.

Decision: Cell runtime opens at Level 4, with six components: Workers host, KV namespace service, Queue broker, D1 database service, Workflow engine, Cron scheduler. They are not opened: Level 4 is the depth the caller set.

### Replication

- Cell replication backend (ltx_repl.rs, ltx_replication.rs, replication.rs): writes cells/<cell>/ltx/ and drains node bundles.
- Fleet log (node_log.rs, node_log/recovery_progress.rs): writes log/ and, at recovery, the same per-cell LTX objects.
- LTX library (crates/ltx/src/*): a library; "celld uses this library inside a larger durability protocol" (crates/ltx/README.md).
- Facet streams (facet_streams.rs) were first listed here; the revision moved them to the Workers host, because they manage facet streams for the runtime and reach the backend through Replication::ltx() like the rest of the host.

Verdict: closed. The backend and the fleet log change each other's records; the library keeps nothing of its own.

### Alarm discovery

- Publications and reclamation (wake.rs), arm gate (wake_entry.rs), format initialization and migration (wake_format.rs): all write the one wake/ namespace. Closed.

### Static asset server

- Routing, disk cache and fallback index are all inside AssetResolver (assets.rs). Closed.

### Container supervisor

- Supervisor (container.rs) keeps the state; Docker Engine client (docker.rs) is an adapter; Container ops (js/container.rs) only convert values ("these ops perform the effects through `crate::container`"). Closed.

### Telemetry exporter

- Pipeline, sinks and retention sweep (telemetry.rs); OTLP encoding (otlp.rs) is a library. Closed.

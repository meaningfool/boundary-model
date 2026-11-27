# Inner boundaries (step 3)

Each entry: consumer -> provider, the interface (named after the contract), the contract's path, its operations, and the capabilities, areas and resources they give. Operations that are steps (keep-alives, acknowledgements, retries, checks that only decide whether another operation goes ahead, clean-ups) are listed and folded into the capability they serve.

## Level 2 (inside Rivet)

### Actor runtime -> Control plane
- Interface: **node connection** (the node's outbound WebSocket `GET /envoys/connect`, BARE frames).
- Contract: engine/sdks/rust/envoy-protocol/schemas/v10.bare (`ToRivet`, `ToEnvoy`); served by engine/packages/pegboard-envoy/src/routes.rs; client engine/sdks/rust/envoy-client.
- Operations, node to control plane: ToRivetMetadata (actor names served), ToRivetEvents (EventActorIntent sleep/stop, EventActorStateUpdate running/stopped, EventActorSetAlarm), ToRivetAckCommands, ToRivetStopping, ToRivetPong, ToRivetKvRequest (get, list, put, delete, deleteRange, drop), ToRivetTunnelMessage (responses to forwarded HTTP and WebSocket), ToRivetSqliteGetPagesRequest, ToRivetSqliteCommitRequest and CommitStage Begin/Segment/Finalize, ToRivetSqliteExec/Execute/ExecuteBatchRequest. Control plane to node: ToEnvoyInit, ToEnvoyCommands (CommandStartActor with config, preloaded KV, fork; CommandStopActor with reason), ToEnvoyAckEvents, ToEnvoyKvResponse, ToEnvoyTunnelMessage (forwarded HTTP request start/chunk/abort, WebSocket open/message/close), ToEnvoyPing, Sqlite responses, ToEnvoySqliteProveTail, ToEnvoyPreConnect.
- Steps folded: Pong/Ping (keep-alive), AckCommands/AckEvents (acknowledgements), PreConnect and Metadata (connect handshake, part of Serve actors), ProveTail (part of commit), commit stages (part of commit). Local development's pool upsert (rivetkit-core/src/registry/runner_config.rs `ensure_local_normal_runner_config`) is a step of Serve actors on a localhost endpoint.
- Area **Host actors** (core):
  - Serve actors on node: takes the node's namespace, pool, version and actor names; gives start and stop commands for the actors placed on it, with their clients' HTTP and WebSocket traffic. mutates Node; observes Actor.
  - Drain node: takes the node's stopping notice; gives paced stop commands for its actors. mutates Node.
  - Report actor status: takes an actor's intent to sleep or stop, or its running or stopped state; gives the actor's status updated. mutates Actor.
  - Set wake alarm: takes a time; gives the alarm recorded so the actor wakes then. mutates Actor.
  - Read and write actor KV: takes keys, values or ranges; gives values or confirmation. observes, mutates Actor database (rows "in a kv inode of the actor's database volume", pegboard-envoy/src/kv.rs).
  - Read database pages: takes page numbers; gives the pages. observes Actor database.
  - Commit database pages: takes dirty pages; gives the new committed generation. mutates Actor database.
  - Run SQL on actor database: takes SQL statements and parameters; gives rows or results. observes, mutates Actor database.
- Resources: Actor, Actor database, Node.

### Workflow SDK world -> Actor runtime
- Interface: **actor definition API** (`actor({ db, actions, onWake, onRequest, events, options })`, `setup({ use })`, the action context `c`).
- Contract: rivetkit-typescript/packages/rivetkit/src/actor/definition.ts, config.ts, src/actor/contexts; Rust side rivetkit-rust/packages/rivetkit-core/src/actor/mod.rs (`ActorContext`, `ActorFactory`).
- Operations used (integrations/workflow-world/src): actions (12 on workflowRun, 5 on coordinator, 4 on hookToken), `onWake`, `createVars`/`c.vars`, `c.db.execute` (63 uses), `c.db.transaction`, `c.schedule.after`/`at`, `c.broadcast`, `c.keepAwake`, `c.key`, `run`.
- Steps folded: `c.vars` (in-memory variables of the actor instance, part of Host actor), `c.key` (the actor's identity, a property).
- Area **Host actors** (core):
  - Host actor: takes actor definitions with actions and hooks; gives actors that run their actions when called and wake when needed. produces Actor.
  - Query actor database: takes SQL; gives rows. observes, mutates Actor database.
  - Schedule action: takes an action and a delay or time; gives a schedule that survives sleep. produces Schedule.
  - Broadcast event: takes an event name and payload; gives the event delivered to every connection. produces Connection.
  - Keep actor awake: takes a promise; gives the actor kept awake until it settles. mutates Actor.

### Flue target -> Actor runtime
- Interface: **actor definition API**.
- Operations used (integrations/flue-runtime/src/target.ts): `actor({ db, actions, onWake, onRequest, options })`, `c.db`, `c.schedule`, `c.keepAwake`, `c.request`, `c.abortSignal`, `c.actorId`, `c.key`.
- Steps folded: `c.abortSignal` (shutdown signal, part of Host actor).
- Area **Host actors** (core): Host actor (produces Actor), Handle actor HTTP request (takes a request routed to the actor; gives the handler's response; observes Actor), Query actor database (observes, mutates Actor database), Schedule action (produces Schedule), Keep actor awake (mutates Actor).

### Workflow SDK world -> Control plane
- Interface: **actor gateway routes** (`/gateway/{selector}/...`).
- Contract: engine/packages/pegboard-gateway/src/lib.rs (routes `/gateway/{selector}` and `/gateway/{selector}/*`), src/routes.rs ("authentication, the request's routing parameters ... hand-off of an acquired actor stream to the HTTP or WebSocket tunnel"), src/acquire.rs; client rivetkit-typescript/packages/rivetkit/src/client/actor-handle.ts.
- Operations used: `client.workflowRun.getOrCreate([runId]).<action>`, `coordinator.getOrCreate(["coordinator"]).listRuns/update`, `hookToken.getOrCreate([token]).get/reserve/confirm/release` (src/index.ts, src/actors/workflow-run.ts).
- Area **Reach actors** (core):
  - Call actor: takes an actor name and key, or an id, and a request or action; gives the actor's reply, after creating it when asked and waking it. mutates Actor.

### Flue target -> Control plane
- Interface: **actor gateway routes**.
- Operations used: `createClient().getOrCreate(registry, key)` (src/target.ts `getRegistryHandle`), `handle.action({ name: '__flueAdmitAgentDispatch' })` (dispatch), `handle.fetch(request)` (`forwardToFlueActor`).
- Area **Reach actors** (core): Call actor (mutates Actor).

### rivet CLI -> Rivet Cloud
- Interface: **Rivet Cloud API** (`https://cloud-api.rivet.dev`, API v1 and `/v2`), and Rivet's container registry.
- Contract: engine/packages/cli/src/cloud.rs, cloud/v2.rs, auth.rs (paths listed in step-3 notes): `api/auth/device/code|token|refresh|logout`, `/projects`, `/projects/{p}/namespaces`, `.../managed-pools`, `.../managed-pools/{pool}/logs`, `.../logs/history`, `/projects/{p}/namespaces/{ns}/tokens/{kind}`, `/projects/{p}/tokens/api` and `/revoke`, `/v2/clusters`, `/v2/clusters/{c}/builds`, `/builds/{id}`, `/regions`, `/runner-pools`, `/regions/{r}/runner-pools/{pool}`, `/logs`, `/secrets`, `/oidc-trusts`, `/v2/byoc/clusters/{c}`.
- Steps folded: device sign-in and refresh (access to the API, a credential), temporary registry token create and revoke (deploy.rs), `wait_for_pool` (part of deploy).
- Area **Deploy to Rivet Cloud** (core):
  - Deploy project: takes an image reference, pool settings and variables; gives the managed pool running the image. mutates Compute pool.
  - Upload cluster build: takes an image archive; gives a build id. produces Build.
  - Roll out cluster pool: takes a build, region, pool and variables; gives the pool rolled out to the build. mutates Compute pool.
  - List compute pools / Delete compute pool: observes / mutates Compute pool.
  - Read logs: takes a pool or cluster, filters; gives log lines, live when following. observes Logs.
  - Manage cluster secrets: takes a secret name and value; gives the secret set, listed or deleted. mutates Cluster secret.
  - Mint namespace token: takes a namespace and a kind; gives the token. produces Token.
  - Trust GitHub deploys: takes a repository, branch and workflow; gives an OIDC trust on the cluster. produces Deploy trust.
- Resources: Compute pool, Build, Logs, Cluster secret, Token, Deploy trust.

### rivet CLI -> Docker
- Interface: **docker CLI** (`docker login`, `docker buildx build`, `docker push`, `docker image save`, `docker image inspect`).
- Contract: engine/packages/cli/src/util.rs (login, buildx build), src/commands/deploy.rs (push), deploy/cluster.rs and deploy/byoc.rs (image save, inspect).
- Area **Build images** (core): Build image (takes a Dockerfile and context; gives a tagged image; produces Container image), Push image (takes an image and registry credentials; gives the image in Rivet's registry; mutates Container image), Export image (takes an image; gives an archive to upload; produces Container image).

### Control plane -> Object storage
- Interface: **object storage API** (S3, Google Cloud Storage, Azure Blob, or a local directory).
- Contract: engine/packages/config/src/config/object_storage.rs (`ObjectStoreBackend`), engine/packages/engine-context/src/production/object_storage.rs, local_object_store.rs (conditional `PutMode::Update`, `delete_if_match` needed by heartbeats, leases and the tablet manifest).
- Area **Keep objects** (core): Read object (observes Stored object), Write object, conditionally (mutates Stored object), List objects (observes Stored object), Delete object, conditionally (mutates Stored object).

### Control plane -> Rivet 2
- Interfaces: **Rivet 2 migration API** (`/migration/v1/` routes), **Rivet 2 public API** (`/actors?...`), **Rivet 2 gateway** (proxied gateway requests).
- Contract: engine/packages/pegboard-v2-migrator/src/v2_client.rs (candidates, candidate, export, cutover, confirm, restore, parked, delete_cursor, set_delete_cursor, delete), engine/packages/pegboard/src/migrate_from_v2.rs (`key_exists`), engine/packages/pegboard-gateway/src/migrate_from_v2/proxy.rs (proxy), schema engine/sdks/schemas/migrate-from-v2-protocol/v2.bare.
- Steps folded: confirm (completes cutover), delete cursor get/set (resume point of Delete moved actors).
- Area **Move actors from Rivet 2** (core): List movable actors (observes Rivet 2 actor), Export actor (observes Rivet 2 actor), Cut actor over (mutates Rivet 2 actor), Restore actor in Rivet 2 (mutates Rivet 2 actor), Delete parked actors (mutates Rivet 2 actor), Check key in Rivet 2 (observes Rivet 2 actor) [Rivet 2 public API], Forward request to Rivet 2 (takes a gateway request for an actor still in Rivet 2; gives its response; observes Rivet 2 actor) [Rivet 2 gateway].

### Actor runtime -> OpenTelemetry collector
- Interface: **OTLP** (OTLP span exporter, `OTEL_EXPORTER_OTLP_*`).
- Contract: rivetkit-rust/packages/rivetkit-core/src/telemetry/export.rs.
- Area **Export traces** (core): Export spans (takes spans of actions, workflow steps and outbound calls; gives them stored in the collector; produces Trace).

## Level 3

### Actor host -> Workflow engine
- Interface: **workflow engine API**.
- Contract: rivetkit-typescript/packages/workflow-engine/src/index.ts (`runWorkflow(workflowId, fn, input, driver, options)` returning `WorkflowHandle` with `result`, `message()`, `wake()`, `recover()`, `evict()`; `replayWorkflowFromStep(workflowId, driver, entryId)`), src/types.ts, src/driver.ts (`EngineDriver`, which the host supplies over the actor's `_rivet_wf_kv` table); caller rivetkit-typescript/packages/rivetkit/src/workflow/mod.ts.
- Steps folded: `wake`, `recover`, `evict` (resuming after sleep or an alarm, and unloading: steps of Run workflow); the EngineDriver calls (get, set, list, batch, alarms, messages) are how the engine keeps the run's history through the host, inside Run workflow.
- Area **Run workflows** (core): Run workflow (takes a workflow id, function and input; gives a handle whose result resolves when it completes; produces Workflow run), Send message to workflow (takes a name and data; gives the message queued for the run; mutates Workflow run), Replay workflow from step (takes an entry id; gives the history snapshot replayed from that step; mutates Workflow run).

### Actor host -> OpenTelemetry collector
- Interface: **OTLP**. Same contract and capability as at Level 2 (Export spans).

### Node sessions -> Actor orchestration
- Interface: **pegboard commands** (typed commands registered on volumes, plus command subjects back to the connection).
- Contract: engine/packages/pegboard/src/commands.rs (`EnvoyUpsert`, `ActorEvent`, `ActorRead`), envoy_ring.rs (`PoolHeartbeats`, `send_heartbeats`), envoy_check.rs (`report_reallocate`), catalog.rs (namespace standing, pool reads); callers engine/packages/pegboard-envoy/src/connection.rs, lifecycle.rs, connection/index_writer.rs, drain.rs.
- Steps folded: `ActorRead` and namespace standing and pool reads (checks before forwarding a command or admitting a connect), heartbeats (keep the node admitted: part of Register node), deletion of active index entries on disconnect (clean-up).
- Area **Host actors on nodes** (core): Register node (takes the connection's namespace, pool, version and names; gives the node admitted and allocatable, with start and stop commands for its actors sent back on its subject; mutates Node), Report actor event (takes an actor's intent, state or alarm; gives the actor's record updated; mutates Actor), Report lost actor (takes an actor the node no longer hosts; gives it re-allocated; mutates Actor).

### Node sessions -> Actor storage
- Interface: **volume client** (depot-client).
- Contract: engine/packages/depot-client/src/lib.rs, volumes/mod.rs (`open_filesystem`, `open_or_create_filesystem`), filesystem/mod.rs ("Filesystem calls and optimistic KV transactions over one exclusively owned volume log"); schema engine/sdks/schemas/data/depot.client_protocol.v2.bare; page protocol engine/packages/sqlite-embedded-filesystem/src/lib.rs; callers pegboard-envoy/src/kv.rs, sqlite/mod.rs.
- Area **Keep actor data** (core): Open actor database volume (takes the actor's database volume key; gives an exclusive filesystem on it, fencing any other owner; mutates Volume), Read volume files (observes Volume), Write volume files (takes file edits or staged pages; gives them durably committed; mutates Volume).

### Actor orchestration -> Actor storage
- Interface: **volume client**.
- Contract: engine/packages/depot-client/src/command.rs ("Typed commands run on the volume's maintainer within one deadline", `command::<C>()`), groups.rs (`create_group`, `read_group`, `fork_group`, `archive_group`), forks.rs (`fork`, `fork_to_region`, `prepare_fork`, `resume_fork`, `checkpoint_restore`); registration engine/packages/engine/src/run_config.rs (`pegboard::commands::register`, `pegboard::index::register`, `epoxy::commands::register` into `depot_worker::command::CommandRegistry`).
- Area **Keep records on volumes** (core): Run command on volume (takes a registered typed command and its volume; gives the reply once durable; mutates Volume), Fork volume (takes a source volume; gives a copy that shares its data; produces Volume), Create, fork or archive volume group (takes a namespace's group; gives the group record; mutates Volume group).

### Rivet 2 migrator -> Actor orchestration
- Interface: **pegboard commands**.
- Contract: engine/packages/pegboard-v2-migrator/src/v3_actor.rs ("begin, activate, discard and recall a hold"; `ActorMigrateFromV2Begin`, `ActorEvent::MigrateFromV2`, `ActorRead`), pegboard/src/actor_key.rs (`keyed_actor_id`).
- Steps folded: `ActorRead` (learn what applied), namespace standing reads.
- Area **Place moved actors** (core): Hold actor for migration (takes a V2 actor's id, key and placement; gives the V3 actor created and held as migrating; produces Actor), Change migration hold (takes activate, discard or recall; gives the actor running here, gone, or back in Rivet 2; mutates Actor).

### Rivet 2 migrator -> Actor storage
- Interface: **volume client**.
- Contract: pegboard-v2-migrator/src/import.rs ("Streams one V2 actor's export into its V3 database volume ... holds the volume as its exclusive owner"), commands.rs (commands on the migration volume, registered by engine/src/run_config.rs `pegboard_v2_migrator::commands::register`).
- Area **Keep migration data** (core): Import actor data (takes a V2 actor's export; gives its KV entries and SQLite pages written to its V3 database volume; mutates Volume), Run command on volume (takes a migration-volume command with the singleton's tenure; gives it committed; mutates Volume).

### Rivet 2 migrator -> Rivet 2
- Interface: **Rivet 2 migration API**. Contract v2_client.rs. Area **Move actors from Rivet 2**: List movable actors, Export actor, Cut actor over, Restore actor in Rivet 2, Delete parked actors.

### Rivet 2 migrator -> Object storage
- Interface: **object storage API**. Contract: engine/packages/config/src/config/migrate_from_v2.rs (`backup: Option<ObjectStoreBackend>`), pegboard-v2-migrator/src/backup.rs. Area **Keep objects**: Write object (a moved actor's backup; mutates Stored object).

### Actor orchestration -> Rivet 2
- Interface: **Rivet 2 public API**. Contract pegboard/src/migrate_from_v2.rs ("its reservation asks V2 whether it already holds the key", `key_exists`). Area **Move actors from Rivet 2**: Check key in Rivet 2 (observes Rivet 2 actor).

### Token authority -> Object storage
- Interface: **object storage API**. Contract engine/packages/auth-jwt/src/persistence.rs ("Typed generated BARE object storage. Only the singleton executor writes this object."), store.rs. Area **Keep objects**: Read object, Write object, conditionally.

### Actor storage -> Object storage
- Interface: **object storage API**. Contract: clippy.toml SlateDB rules (writers through `SlateDbFactory`), depot-worker/src/object_store_first_attempt.rs, object_store_metrics.rs; config object_storage.rs. Area **Keep objects**: Read object, Write object, conditionally, List objects, Delete object, conditionally.

### Workflow run actor -> Run index actor
- Interface: **run index actions** (`coordinator` actor).
- Contract: integrations/workflow-world/src/actors/coordinator.ts (actions `update`, `getRunIdByCorrelation`, `getRunIdByHook`, `listHookIndex`, `listRuns`); caller workflow-run.ts (`coordinator.getOrCreate(["coordinator"]).update`). The read actions are called by the World client (src/index.ts), a front door, so they serve the App developer's area directly.
- Area **Index runs** (core): Update run index (takes a run's status, correlation id or hook change; gives the derived index updated; mutates Workflow SDK run).

### Workflow run actor -> Hook token actor
- Interface: **hook token actions** (`hookToken` actor).
- Contract: integrations/workflow-world/src/actors/hook-token.ts (actions `reserve`, `confirm`, `release`, `get`); callers workflow-run.ts.
- Area **Own hook tokens** (core): Reserve hook token (takes a token, run and hook; gives the token held for this run, or a conflict; mutates Workflow hook), Release hook token (takes the token; gives it free; mutates Workflow hook).

### Flue workflow actor -> Flue run registry actor
- Interface: **Flue run registry actions**.
- Contract: integrations/flue-runtime/src/target.ts `runRegistryActor` (createRun, endRun, getRun, lookupRun, listRuns), src/workflow-coordinator.ts (`createRegistryRunStore`).
- Area **Register runs** (core): Record run (takes a run's id and workflow; gives the run listed; produces Flue run), End run (takes the run's outcome; gives the run closed; mutates Flue run).

### Flue workflow actor -> Flue agent actor
- Interface: **Flue agent actions** (`__flueAdmitAgentDispatch`, `__flueWakeAgentSubmissions`).
- Contract: target.ts `dispatchQueue.enqueue` -> `handle.action({ name: FLUE_AGENT_DISPATCH_ACTION })`, `defineFlueAgentActor`; agent-coordinator.ts `admitDispatch`. Agents also dispatch to other agents through the same action.
- Area **Dispatch to agents** (core): Dispatch to agent (takes an agent name, id and input; gives the admitted submission; produces Flue agent session).

## Level 4

### Actor lifecycle -> Namespaces and pools
- Interface: **pool and namespace commands**.
- Contract: engine/packages/pegboard/src/envoy_ring.rs (`PoolPickEnvoy` registered on the pool volume, `pick_envoy`, `ring_open`), index.rs (`list_active_envoys`), catalog.rs (`namespace_standing`, `group_namespace`); caller pegboard/src/actor_machine/executor.rs.
- Steps folded: namespace standing (a check whose result decides whether the actor may start), `ring_open` (a feature check), envoy record reads in envoy_check.rs (judging a failed node: part of re-allocation).
- Area **Place actors** (core): Pick node for actor (takes the actor's namespace, pool and name; gives a live node of the newest version chosen by two random choices; observes Node).

### Tablet maintainers -> Tablet coordinator
- Interface: **tablet coordinator protocol**.
- Contract: engine/sdks/schemas/data/depot.tablet_coordinator_protocol.v1.bare (`TabletCoordinatorRequest`); senders in depot-worker/src/tablet_maintainer_machine/* (CatchUpReport, SplitPrepared, ParentLogImported, RetiredTabletDeleted, VersionMarksReport, RecoverTablets) and tablet_supervisor.rs (RecoverTablets). CreateTablet, GrantTablet, MoveTablet, ReplaceReplica, SplitTablet, PauseTablet, ResumeTablet, AbortReconfiguration and Repair come from operator storage commands (engineering tooling) and RequestStop from worker wiring.
- Area **Hold tablets** (core): Recover tablet grants (takes the worker's tablets after a restart; gives the grants it may serve; observes Tablet), Report reconfiguration progress (takes a replica's catch-up, a prepared split, an imported parent log, a deleted retired tablet or version marks; gives the reconfiguration advanced in the manifest; mutates Tablet).

### Tablet maintainers -> Log shards
- Interface: **storage worker protocol**.
- Contract: engine/sdks/schemas/data/depot.storage_worker_protocol.v1.bare (`StorageWorkerBatchItem`); senders depot-worker/src/tablet_maintainer_machine/*, filesystem/*, depot-volume; receiver depot-worker/src/services/log_shard.rs with rules in depot-log.
- Steps folded: AdvanceCommitted (acknowledges an append), GetDiskIncarnation and ReadVolumeLogStatus (checks), Trim (clean-up after offload).
- Area **Replicate volume logs** (core): Claim volume log (takes a volume and the writer's epoch; gives the replica fenced to this writer; mutates Volume log replica), Append log entries (takes entries; gives them accepted, or a rejection naming the conflict; mutates Volume log replica), Read log entries (observes Volume log replica), Change replica state (takes load, mark in sync, truncate, mark deleted or forget; gives the replica in that state; mutates Volume log replica), List tablet replicas (observes Volume log replica).

### Tablet coordinator -> Object storage
- Interface: **object storage API**. Contract: tablet_coordinator_machine/mod.rs ("acknowledged only after conditional manifest writes"); engine-context local_object_store.rs (the manifest needs conditional updates). Area **Keep objects**: Read object, Write object, conditionally.

### Tablet maintainers -> Object storage
- Interface: **object storage API**. Contract: SlateDB over object storage (clippy.toml `SlateDbFactory`), depot-worker/src/tablet_maintainer_machine/executor/cold_store.rs and state/cold.rs, cold_pass.rs. Area **Keep objects**: Read object, Write object, conditionally, List objects, Delete object, conditionally.

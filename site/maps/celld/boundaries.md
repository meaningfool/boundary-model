# Inner boundaries (step 3)

For each boundary below Level 1: the contract the consumer calls, its operations, and the interface, capabilities and resources they give. Look-alike test applied to each operation: an operation the consumer would not call for itself (keep-alive, acknowledgement, retry, clean-up, validation) is a step of the capability it serves.

## Level 2: inside celld

### Deployment publisher <-> Node

- Interface: deployment objects. Contract: crates/celld/protocol.rs (Manifest at deploy/<script>/<version>/manifest.json, ModuleRef, AssetIndex at deploy/<script>/<version>/assets.json and deploy-blobs/assets/sha256/, DeployPointer at deploy/<script>/current.json and deploy/current.json, QueueConsumerAttachment at deploy/queues/<queue>/consumer.json, the required-feature list). Readers in the node: crates/celld/fleet.rs load_current_worker, read_current_pointer; crates/celld/generation.rs DeploymentGraph::load; the pointer watcher in crates/celld/main.rs.
- Operations: write a version's manifest, modules, asset index and blobs, container image tars (deploy/images/<key>.tar); attach queue consumers; move the script pointer and the fleet pointer (put_pointer with put_cas, crates/celld/deploy.rs). The node polls the pointer every CELLD_DEPLOY_POLL_S and adopts.
- Capabilities: Publish a deployment (produces Deployment). Queue attachment, pointer CAS and feature checks are steps.
- Resource: Deployment (kept by the node, which defines and validates the records).

### Managed agent <-> Node

- Interfaces: deployment objects (as above, written by apply_deployment in crates/celld/control_plane.rs); presence hooks. Contract for the hooks: crates/celld/control_plane.rs PresenceRuntime (snapshot: PresenceSnapshotSource, replication: Option<Replication>, reload: ReloadSender) and celld_logic::PresenceSnapshot, PresenceCell, ActivitySnapshot (crates/logic/types.rs: "Presence is a read-only projection of the decision core").
- Operations: write a managed deployment's records and pointers; nudge the pointer watcher (crate::generation::nudge); read the presence snapshot (serving, owned cells, cells with epochs, activity counters); read a cell's active snapshot or restore its replicated snapshot (Replication::snapshot_active, restore_snapshot); list cells (cells/ common prefixes).
- Capabilities: Publish a deployment (produces Deployment) [deployment objects]; Read node presence (observes Node) [presence hooks]; Read a cell's tables (observes Cell) [presence hooks].
- Resources: Deployment, Node, Cell.

### Node <-> Managed agent

- Interface: managed installation API. Contract: crates/celld/control_plane.rs pub fns connect_on_startup_with_storage, installation_storage, installation_storage_with_version, InstallationStorageConfig (Managed or Byo), wait_for_initial_deployment, install_reexec_node_session_id, report_managed_runtime_state, start_presence_agent, start_deploy_agent; called from crates/celld/main.rs and crates/celld/fleet.rs.
- Operations: enroll or confirm enrollment at startup; read the installation's storage (managed bucket and credentials, or the operator's own bucket) and credential version; wait for the first managed deployment; report storage state (connected, bucket unavailable, credential revoked, storage contract violated); start the presence and deploy agents.
- Capabilities: Enroll the node (produces Managed installation); Get the node's storage (observes Managed installation). Waiting for the first deployment, reporting runtime state and starting the agents are steps.
- Resource: Managed installation.

### Node <-> Node

- Interface: peer protocol. Contract: internal listener routes in crates/celld/main.rs handle_internal (/peer/tunnel, /peer/log/append, /peer/log/stream, /peer/log/seal, /peer/log/tail, /peer/handoff, /peer/abort/<scope>, /peer/probe); the tunnel in crates/celld/main/peer_tunnel.rs (x-cells-* control headers); codecs AppendReq, SealReq, TailReq, TailResp in crates/celld/node_log.rs; HMAC in crates/celld/peer_auth.rs.
- Operations: carry a fetch, RPC or WebSocket to the owner of a cell; abort a forwarded call; append or stream a node's captured segments to a follower; seal a stopped node's log on a follower and read its retained tail; hand a released cell to a successor (accept_handoff); answer a signed probe.
- Capabilities: Call a cell on its owner (mutates Cell); Hand off a cell (mutates Cell); Replicate a write to a follower (produces Node log); Recover a stopped node's log (mutates Node log). Abort is a step of the call; probe is diagnostics of celld diagnose.
- Resources: Cell, Node log.

### Node <-> Object store; Deployment publisher <-> Object store; Managed agent <-> Object store

- Interface: object storage API. Contract: crates/celld/bucket.rs (Bucket: put, put_with_meta, put_cas, conditional create, get, get_range, head, list, common_prefixes, delete; S3 If-Match/If-None-Match with SigV4, Azure etag, GCS x-goog-if-generation-match with OAuth; local SQLite store for celld dev) and crates/ltx/src/client/object_store.rs for LTX.
- Capabilities: Store an object (produces Bucket object); Change an object only if unchanged (mutates Bucket object); Read an object (observes Bucket object); List objects (observes Bucket object); Delete an object (mutates Bucket object). The node uses all five; the publisher stores, reads, lists and changes pointers conditionally (put_pointer); the managed agent stores, reads and lists.
- Resource: Bucket object.

### Node <-> Container engine

- Interface: Docker Engine API (unix socket from DOCKER_HOST or the default Docker, Docker Desktop, OrbStack or Podman socket; crates/celld/docker.rs). Calls in crates/celld/container.rs: /images/load, /images/<image>/json, /networks/create, /networks/<name>, /containers/create, /containers/<id>/start, /containers/<id>/wait, /containers/<id>/kill, /containers/<id>/json, /containers/<id>/logs, /containers/<id>/exec, /exec/<id>/start, /exec/<id>/json, /containers/json.
- Capabilities: Load an image (produces Container image); Run a container (produces Container); Run a process in a container (mutates Container); Stop a container (mutates Container). Network creation and the fence container are steps of the first start; listing old containers at connect is a clean-up step.
- Resources: Container image, Container.

### Node <-> OpenTelemetry collector

- Interface: OTLP/HTTP. Contract: crates/celld/otlp.rs (protobuf by hand) and crates/celld/telemetry.rs (collector base URL from CELLD_OTEL, appends /v1/traces and /v1/logs; OTEL_EXPORTER_OTLP_HEADERS; retries on 408, 429, 502, 503, 504).
- Capabilities: Export traces and logs (produces Trace). Retries are steps.
- Resource: Trace.

### Deployment publisher <-> esbuild

- Interface: esbuild command line (esbuild on PATH or CELLD_ESBUILD; crates/celld/deploy.rs, crates/celld/deploy/python.rs Command::new(&binary)).
- Capabilities: Bundle a Worker (produces Worker bundle).
- Resource: Worker bundle.

### Deployment publisher <-> Container engine

- Interface: docker command line (docker or CELLD_DOCKER; crates/celld/deploy.rs engine_cli, Command::new(engine_cli()) at the build, pull and save calls).
- Capabilities: Prepare a container image (produces Container image): build from a Dockerfile or pull a reference for linux/amd64 or CELLD_CONTAINER_PLATFORM, then save it to a tar.
- Resource: Container image.

### Deployment publisher <-> Pyodide CDN

- Interface: Pyodide download (PYODIDE_BASE_URL https://cdn.jsdelivr.net/pyodide/v0.28.3/full/ in crates/celld/deploy/python.rs; cached under $XDG_CACHE_HOME/celld/pyodide-0.28.3 or CELLD_PYTHON_RUNTIME_DIR; sizes and SHA-256 checked).
- Capabilities: Download the Python runtime (observes Pyodide release).
- Resource: Pyodide release.

### Managed agent <-> Managed Control Plane

- Interface: Managed Control Plane agent API (control URL default https://celld.dev, environment default prod, bearer installation token; crates/celld/control_plane.rs). Paths: POST /api/instances/claims, POST /api/instances/claims/token, POST /api/agent/credentials/next, POST /api/agent/credentials/ack, POST /api/agent/credentials/revoke, POST /api/agent/deploy-token, POST /api/agent/commands/next, POST /api/agent/commands/<id>/complete, WebSocket /api/agent/presence (heartbeat out; explorer_request, deployment, deployment_current in), and the module and asset download URLs a command names.
- Operations grouped by what the agent gets back: a claim a person approves in a browser, then an installation token and storage (claims, claims/token); a rotated credential (credentials/next, then ack); a deploy token for Wrangler (deploy-token); the next deployment command and its module and asset bytes (commands/next, downloads; complete is the acknowledgement); a presence session that carries explorer requests and deployment notices (presence); a revoked installation (credentials/revoke).
- Capabilities: Enroll an installation (produces Managed installation); Rotate storage credentials (mutates Managed installation); Get a deploy token (observes Managed installation); Fetch the next managed deployment (observes Managed deployment); Show the node in the Managed Control Plane (mutates Managed installation); Revoke the installation (mutates Managed installation).
- Resources: Managed installation, Managed deployment.

## Level 3: inside Node

### Decision core <-> Cell runtime

- Interface: cell host contract. Contract: crates/celld/cell_host.rs CellHost (fetch_cell, local_reload_cells, restore_cell, start_cell, swap_out_cell, publish_cell, ensure_durable, await_durable, stop_cell, abort_activity, with_alarm, alarm_observation, refresh_handoff_alarm_coverage, fire_alarm, abort_alarm), implemented by crates/celld/runtime.rs RuntimeManager; driven by the Effects StartRuntime, Publish, Restore, EnsureDurable, AwaitDurable, StopRuntime, FireAlarm, Swap, Reset in crates/logic/types.rs.
- Capabilities: Start a cell (produces Cell; publish is its last step); Dispatch a request to a cell (mutates Cell); Restore a cell's database (produces Cell); Prove a cell's writes durable (observes Cell; ensure and await); Fire a cell's alarm (reacts Cell); Move a cell to a new deployment (mutates Cell; swap); Stop a cell (mutates Cell). Listing local cells at reload, aborting activity, alarm observation and handoff coverage refresh are steps.
- Resource: Cell.

### Cell runtime <-> Decision core; Alarm discovery <-> Decision core

- Interface: Actor mailbox. Contract: crates/celld/actor.rs Message (requests, WakeHint, eviction, output tickets) and the host channels in crates/celld/host_channels.rs (GateReq: "A ticket asking the actor whether an outbound effect may leave the process"; RpcCallReq; SvcCallReq; FacetReq), entering the decision core as Event::Request, Event::GateRequestAt, Event::Output, Event::WakeHintAt, Event::ActivityFinished.
- Capabilities for the cell runtime: Route a call to a cell (observes Cell: local dispatch or the owner's peer route); Release an outbound effect (observes Cell: the effect leaves once a durability proof covers the position it can reveal). Activity reports are steps.
- Capability for alarm discovery: Wake a cell for its alarm (mutates Cell: the waker found a due alarm whose owner stopped).
- Resource: Cell.

### Cell runtime <-> Replication

- Interface: replication handle. Contract: crates/celld/ltx_replication.rs Replication (start, restore, ensure_durable, await_durable, evict, release, close_in_place, close_for_reload, snapshot_active, restore_snapshot, local_cells, prune_local_cache, prune_stale_live, ltx()), and through ltx() the backend crates/celld/ltx_repl.rs LtxRepl (activation_vfs, discard, is_resident, delete_local, delete_streams) used by crates/celld/runtime.rs and crates/celld/facet_streams.rs.
- Capabilities: Restore a cell's database (observes Cell history); Start replicating a cell (produces Cell history); Prove writes durable (observes Cell history); Open a paged database (observes Cell history; activation_vfs); Close a cell's replication (mutates Cell history; evict, release, close_in_place: final upload or snapshot). Pruning the local cache and stale streams are clean-up steps.
- Resource: Cell history.

### Decision core <-> Replication

- Interface: node log manager. Contract: crates/celld/node_log.rs NodeLogManager and OwnLog, held by crates/celld/actor.rs (node_log field), driven by Effect::RecoverNodeLog.
- Capabilities: Recover a stopped node's log (mutates Node log): fence the prior session's record, seal reachable followers, upload retained segments into per-cell prefixes, mark the record sealed.
- Resource: Node log.

### Decision core <-> Alarm discovery; Cell runtime <-> Alarm discovery

- Interface: wake entry gate. Contract: crates/celld/wake_entry.rs (ArmGate, launch_arm_gate, publish_observed_wake_entry, maintain_wake_entry, forget_wake_entry), re-exported by crates/celld/js.rs; crates/celld/wake.rs WakeFlusher.
- Capabilities for the cell runtime: Publish an alarm's wake entry (produces Wake entry; the response edge waits for it).
- Capabilities for the decision core: Reconcile an alarm's wake entry (mutates Wake entry; Actor schedule_wake_maintenance).
- Resource: Wake entry.

### Cell runtime <-> Static asset server

- Interface: asset resolver. Contract: crates/celld/assets.rs AssetResolver (load, binding_name, asset_only, should_run_worker_first, ingress_response, binding_response), held per script by crates/celld/generation.rs; the ASSETS binding reaches binding_response through AssetCallReq (crates/celld/host_channels.rs) and crates/celld/main.rs.
- Capabilities: Serve a static asset (observes Static asset).
- Resource: Static asset.

### Cell runtime <-> Container supervisor

- Interface: container functions. Contract: crates/celld/container.rs (engine, engine_if_ready, ContainerEngine::attach, start, monitor, destroy, signal, exec, release, CellContainer::address, set_inactivity; process, drop_process), called by crates/celld/js/container.rs.
- Capabilities: Start a cell's container (produces Container); Reach a container port (observes Container); Run a process in a container (mutates Container); Stop or signal a container (mutates Container).
- Resource: Container.

### Cell runtime <-> Telemetry exporter

- Interface: telemetry API. Contract: crates/celld/telemetry.rs (start_trace, start_trace_with_parent, child_of, record, record_log, parse_traceparent, traceparent).
- Capabilities: Record a span or a log line (produces Trace).
- Resource: Trace.

### Inner components <-> outside services (Level 3)

- Decision core <-> Object store, through crates/celld/ownership_store.rs, crates/celld/drain_token.rs: Change an object only if unchanged (ownership records cells/<cell>/own.json, node leases nodes/<node>.json, fleet sample fleet/capacity-v1.json, drain token); Read an object; List objects.
- Replication <-> Object store (crates/celld/ltx_repl.rs, crates/celld/node_log.rs, crates/ltx/src/client/object_store.rs): Store, Change only if unchanged (log/<node>.json), Read (ranged), List, Delete (epoch GC).
- Alarm discovery <-> Object store (crates/celld/wake.rs, crates/celld/wake_format.rs): Store, Change only if unchanged (retirement records, waker lease, format marker), Read, List, Delete.
- Static asset server <-> Object store (crates/celld/assets.rs): Read an object (asset index and blobs, newer pointer).
- Telemetry exporter <-> Object store (crates/celld/telemetry.rs): Store an object (Parquet files), List objects, Delete an object (retention sweep).
- Telemetry exporter <-> OpenTelemetry collector: Export traces and logs.
- Container supervisor <-> Container engine (crates/celld/container.rs, crates/celld/docker.rs): Load an image, Run a container, Run a process in a container, Stop a container.
- Container supervisor <-> Object store (crates/celld/container.rs image tars deploy/images/<key>.tar): Read an object.
- Cell runtime <-> Object store (crates/celld/fleet.rs and crates/celld/generation.rs deployment loading, crates/celld/r2_store.rs R2 records under r2/<bucket_name>/, crates/celld/kv_blob.rs KV values above 1 MiB): Store, Read, List, Delete.

## Level 4: inside Cell runtime

### Workers host <-> KV namespace service

- Interface: KV namespace cell protocol. Contract: crates/celld/js/services/kv.js (__KvNamespaceCell methods __kvGet, __kvPut, __kvDelete, __kvList, __kvMetrics, __kvSweep, fetch for the operator protocol, alarm for expiry and blob sweep; client class KvNamespace), registered in crates/celld/js/harness.js.
- Capabilities: Read a key (observes KV namespace); Write a key (mutates KV namespace); Delete a key (mutates KV namespace); List keys (observes KV namespace). Metrics, sweep and alarm are steps or provider behavior.
- Resource: KV namespace.

### Workers host <-> Queue broker

- Interface: queue cell protocol. Contract: crates/celld/js/harness.js __QueueCell (__queueSend, __queueMetrics, __queueDlqAcceptBatch, alarm with _leaseBatch and _settle, fetch ops info, pause, peek, purge, redrive, resume), Queue client class; crates/celld/queue_policy.rs run; consumer dispatch through QueueDispatchReq (crates/celld/host_channels.rs).
- Capabilities: Send messages (produces Queue message); Receive message batches (reacts Queue message: the broker leases a batch to the consumer script and takes back acks and retries). Dead-letter moves are the broker's own behavior on exhaustion.
- Resources: Queue, Queue message.

### Workers host <-> D1 database service

- Interface: D1 cell protocol. Contract: crates/celld/js/harness.js __D1DatabaseCell fetch with mode prepared, batch, exec, migrate; client classes D1Database, D1PreparedStatement, D1DatabaseSession.
- Capabilities: Run a query (mutates D1 database; prepared); Run a batch (mutates D1 database; batch and exec run in one transaction). migrate is used only by celld d1 through /runtime/.
- Resource: D1 database.

### Workers host <-> Workflow engine

- Interface: workflow cell protocol. Contract: crates/celld/js/harness.js __WorkflowCell (__wfCreate, __wfStatus, __wfPause, __wfResume, __wfRestart, __wfTerminate, __wfSendEvent, __wfDelete, alarm) and WorkflowInstance client.
- Capabilities: Create an instance (produces Workflow instance); Read instance status (observes Workflow instance); Change instance status (mutates Workflow instance; pause, resume, restart, terminate); Send an event to an instance (mutates Workflow instance); Delete an instance (mutates Workflow instance). The alarm that replays run() is the engine's own progress.
- Resource: Workflow instance.

### Workers host <-> Cron scheduler

- Interface: cron cell protocol. Contract: crates/celld/js/harness.js CelldCronSchedule (fetch arms the schedule after a deployment loads; alarm runs the due expressions and calls the script's scheduled handler; registered under ".cron"); crates/logic/cron.rs __cron_plan.
- Capabilities: Run a script's Cron Triggers (reacts Cron Trigger).
- Resource: Cron Trigger.

### Inner components <-> outside services (Level 4)

- Workers host <-> Object store: Store, Read, List, Delete (deployments, R2 records; crates/celld/fleet.rs, crates/celld/generation.rs, crates/celld/r2_store.rs).
- KV namespace service <-> Object store: Store, Read, List, Delete (values above 1 MiB under the namespace cell's prefix; crates/celld/kv_blob.rs).

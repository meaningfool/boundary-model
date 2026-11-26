# Open list

## Round 1 decisions (Level 1)

One boundary per consumer and provider:

| Consumer | Provider | Interfaces | Why |
|---|---|---|---|
| Pi user | Pi | terminal UI, print mode, pi shell commands, configuration files | The person who runs `pi` in a folder to get work done (docs/usage.md, cli.md, slash-commands.md). |
| Extension author | Pi | extension API, Pi package manifest | Writes code that runs inside Pi through ExtensionAPI (src/core/extensions/types.ts, docs/extensions.md, packages.md). Own goals: add tools, commands, providers, UI. |
| Integrator | Pi | SDK, RPC mode, JSON event stream | Another program that runs Pi's agent (docs/sdk.md, cli-integration.md, rpc.md, json.md). |
| Library developer | Pi AI | pi-ai package, pi-ai command line | Separately published "Unified LLM API" (packages/ai/README.md). |
| Library developer | Pi Agent Core | pi-agent-core package | "Stateful agent with tool execution and event streaming" (packages/agent/README.md). |
| Library developer | Pi TUI | pi-tui package | "Minimal terminal UI framework" (packages/tui/README.md). |
| Library developer | Pi MCP | pi-mcp package | "A small, standalone Model Context Protocol client" (packages/mcp/README.md). |
| Library developer | Pi Codemode | pi-codemode package | Runs model-written JavaScript against injected tools; "can be used on its own" (packages/codemode/README.md). |
| Library developer | Pi Schema | pi-schema package | "JSON Schema builders and validation without eval" (packages/schema/README.md). |
| Library developer | Pi Telemetry | pi-telemetry package | "Vendor-neutral telemetry contracts" (packages/telemetry/README.md). |

Choice: each published library is its own provider, since each is a separate npm package with its own README, exports and consumers who do not use the coding agent (README "Packages" table; packages/*/package.json). The coding agent depends on some of them; where one passes the component test inside Pi, it is named in Pi's sharedComponents instead of being defined twice.

Not boundaries: packages/evals (checks the coding agent: engineering tooling), .pi (the repository's own Pi prompts, skills and extensions for its maintainers: tooling), scripts, .github, nix, .husky (build, release, CI: tooling).

## Round 2: providers to open

Pi, Pi AI, Pi Agent Core, Pi TUI, Pi MCP, Pi Codemode, Pi Schema, Pi Telemetry.

## Round 2 decisions

Evidence read: scripts/check-entry-graphs.mjs and scripts/check-runtime-deps.mjs (each public package is a unit: its exports map is its only public surface, and it imports only declared dependencies); packages/*/package.json (dependencies: coding-agent -> agent-core, ai, codemode, mcp, tui; agent-core -> ai, schema; ai -> schema, telemetry; mcp, codemode, schema, telemetry, tui -> none of Pi's); coding-agent src/core/sdk.ts and agent-session-services.ts (the dependency-injection setup: modelRuntime, settingsManager, sessionManager, resourceLoader, tools), src/extensions/index.ts (registry of built-in extensions, "replaceable"), src/core/extensions/types.ts (ExtensionAPI), src/core/resource-loader.ts (`interface ResourceLoader`), src/core/package-manager.ts (`interface PackageManager`), src/core/model-runtime.ts (`class ModelRuntime implements Models`), src/core/auth-storage.ts (`class AuthStorage implements CredentialStore`), src/core/models-store.ts (pi-ai `ModelsStore`), src/core/mcp-servers.ts ("The core only validates and stores registrations").

### Pi (opens: 7 components defined here, 2 shared)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Agent session | src/core/agent-session.ts, agent-session-runtime.ts, agent-session-services.ts, sdk.ts, session-manager.ts, compaction/, system-prompt.ts, messages.ts, cache-warmer.ts, nested-tool-calls.ts, tools/, bash-executor.ts, export-html/, session-export.ts, bug-report*.ts; src/modes/interactive/session-share.ts and bug-report.ts; src/extensions/codemode, src/extensions/tool-search | Component | Keeps the sessions: only SessionManager and the session runtime write session files (writes grep). Decides around each run: queues, retries, compaction, model and thinking choice, active tools, system prompt ("shared between all run modes. Modes use this class and add their own I/O layer", agent-session.ts header). Modes, the SDK and the extension runner reach it through AgentSession methods and events. |
| Agent loop (Pi Agent Core) | packages/agent | Component, shared | Decides the turn loop: tool execution order, steering and follow-up polling, when a run ends. AgentSession reaches it only through the package's "." export (check-entry-graphs, check-runtime-deps). Defined as its own provider; named in Pi's sharedComponents. |
| Model runtime | src/core/model-runtime.ts, model-registry.ts, provider-composer.ts, model-config.ts, models-store.ts, auth-storage.ts, remote-catalog-provider.ts, runtime-credentials.ts, virtual-models.ts, model-resolver.ts, radius.ts, src/extensions/llama | Component | Decides which models Pi offers: built-in providers plus models.json, extension providers, the pi.dev catalog overlay and virtual-model routing (`class ModelRuntime implements Models`). Keeps the model-list cache and supplies the file store for credentials. Everything else reaches models through ModelRuntime or its ModelRegistry facade. |
| Pi AI | packages/ai | Component, shared | Decides how each model provider is called and authenticated, and alone writes credentials (login, logout, OAuth refresh run in `Models`; ModelRuntime only resynchronises, model-runtime.ts login/logout). Reached only through package exports. Defined as its own provider; named in Pi's sharedComponents. |
| Extension runtime | src/core/extensions/*, src/core/mcp-servers.ts, src/core/event-bus.ts | Component | Keeps what extensions register (tools, commands, shortcuts, flags, renderers, providers, virtual models, MCP servers) and decides how handlers combine. Extensions reach Pi only through ExtensionAPI (types.ts); AgentSession creates the ExtensionRunner. |
| Resource loader | src/core/resource-loader.ts, skills.ts, prompt-templates.ts, source-info.ts, pi-manifest.ts, slash-commands.ts | Component | Decides which context files, skills, prompt templates, themes and extensions load, in what order and with what collisions (`interface ResourceLoader`, injectable through the SDK). |
| Project trust | src/core/trust-manager.ts, project-trust.ts | Component | Keeps trust.json (only ProjectTrustStore writes it) and decides trust: CLI override, then an extension's answer, then the saved decision, then defaultProjectTrust (project-trust.ts, docs/security.md). Read by main.ts, the resource loader, package commands and MCP config. |
| Package manager | src/core/package-manager.ts | Component | Keeps the installed copies of Pi packages (npm and git directories) and decides reconciliation; writes package declarations through SettingsManager (`interface PackageManager`). |
| MCP connections | src/extensions/mcp/* (except cli.ts and ui.ts, which present it), src/core/radius-mcp.ts | Component | Keeps MCP server configuration edits (mcp.json), sign-ins (mcp-auth.json), the log and the live connections; decides tool exposure. Registered as a replaceable built-in extension and reaches Pi through ExtensionAPI. |
| Built-in tools, codemode tool, tool search | src/core/tools/*, src/extensions/codemode, src/extensions/tool-search | Not components; parts of Agent session | Variants of the tool contract (AgentTool) that the agent loop runs and the session chooses. They act on the working folder, the shell and the session's other tools and keep no state of their own; codemode's `store()` values are session entries it appends through the extension API (execute.ts). |
| llama.cpp support | src/extensions/llama | Not a component; part of Model runtime | A model provider registered through the extension API (provider.ts) plus a /llama screen that presents the llama.cpp router's own model management (client.ts, ui.ts). |
| Settings | src/core/settings-manager.ts, settings-schema.ts, settings-defaults.ts, settings-diagnostics.ts | Not a component | Storage of preferences every part reads; writes go through its setters and decide nothing. |
| Terminal UI | src/modes/interactive/* (except session-share.ts, bug-report.ts), src/core/keybindings*.ts, footer-data-provider.ts, packages/tui | Interface | Presents the session; pi-tui is its rendering library. |
| Print mode, JSON event stream, RPC mode | src/modes/print-mode.ts, json-event.ts, rpc/* | Interfaces | I/O layers over AgentSession; RpcClient is a client of RPC mode. |
| Shell commands | src/main.ts, src/cli/*, src/package-manager-cli.ts, src/extensions/mcp/cli.ts | Interface | Parse arguments and call the components. |
| SDK | src/index.ts, src/core/index.ts | Interface | Re-exports the factories and contracts. |
| Pi TUI, Pi MCP, Pi Codemode, Pi Schema, Pi Telemetry libraries | packages/tui, mcp, codemode, schema, telemetry | Not components of Pi | Libraries: rendering (terminal UI), the adapter MCP connections use to reach MCP servers, the sandbox the codemode tool runs scripts in, schema validation inside pi-ai and agent-core, the telemetry contract pi-ai reports to. Each is its own Level 1 provider. |
| Config and utilities | src/config.ts, src/utils/*, src/migrations.ts, src/core/http-dispatcher.ts, output-guard.ts, timings.ts, diagnostics.ts, crash-log.ts, defaults.ts, telemetry.ts, experimental.ts | Not components | Paths, helpers, start-up migrations and process plumbing. |

### Pi AI (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Models collection | src/models.ts | The one component-like part | Routes each request to the provider that owns the model, resolves auth through it, runs OAuth refresh under the credential store's lock (README "How Auth Resolves", "Credential Store"). |
| Provider factories | src/providers/*.ts (about 45) | Not a component | Variants of the Provider contract, each an adapter to an outside model service: catalog, auth, API (README "Providers and Models"). |
| API implementations | src/api/* | Not a component | Wire-protocol adapters (anthropic-messages, openai-responses, openai-completions...) shared by providers. |
| Auth and OAuth flows | src/auth/* | Not a component | "Built-in login and refresh flows are private provider implementations" (README); the credential store contract is storage the host supplies. |
| Model catalog | src/models.generated.ts, providers/*.models.ts, model-catalog.ts, models-store.ts | Not a component | Generated data and the store contract for refreshed lists. |
| Utilities, telemetry schema | src/utils/*, src/telemetry.ts | Not components | Event streams, validation (through pi-schema), transcript helpers, request spans (through pi-telemetry). |
| pi-ai command line | src/cli.ts | Interface | `pi-ai login` and `list`; a client of the Models collection. |
| Catalog generator | catalog/*, scripts/* | Tooling | Builds the catalog from upstream sources. |

### Pi Agent Core (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Agent and agent loop | src/agent.ts, agent-loop.ts, types.ts | One component | Agent holds the state and queues; the loop runs turns on that same state (agentLoop is the low-level form of the same contract, README "Low-Level API"). They share one state, so one part. |
| Default stream function | src/stream-fn.ts | Not a component | Wiring: the host installs the function that reaches a model ("does not import pi-ai/compat itself", sdk.ts). |
| Proxy stream | src/proxy.ts | Not a component | An adapter that sends model requests to the application's own server (README "Proxy Usage"). |

### Pi TUI (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Renderers | src/tui.ts, tui-main-screen.ts, tui-alt-screen.ts, layout*.ts | Not separate | Variants of the TUI interface (README "Interchangeable Renderers") that draw the widgets; they keep only display state. |
| Widgets | src/components/*, editor-component.ts | Not separate | Written to the Component contract the renderers draw; display state only. |
| Terminal input and output | src/terminal.ts, stdin-buffer.ts, keys.ts, keybindings.ts, terminal-image.ts, terminal-colors.ts | Not components | Adapters to the terminal. |
| Autocomplete, fuzzy match, colours, LaTeX, utilities | src/autocomplete.ts, fuzzy.ts, colors.ts, oklab.ts, latex.ts, utils.ts and others | Not components | Helpers of the widgets. |
| Native clipboard helpers | native/* | Not components | Adapters to the operating system's clipboard. |
None of its parts keeps state other than what it draws, so it is one rendering library.

### Pi MCP (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Client core | src/client.ts, src/protocol/*, src/auth-provider.ts | One part | Owns request correlation, initialization, timeouts, cancellation (README). |
| Transports | src/transports/* (stdio, streamable-http, pipe, in-memory) | Not components | Variants of the transport contract: "An MCP transport owns framing and I/O". |
| OAuth | src/oauth/* | Not a component | Sign-in steps of a connection; tokens kept in a store the application injects ("does not ... choose where credentials are stored"). |
| Config validation, naming, content conversion | src/config.ts, naming.ts, input-schema.ts, model-content.ts, output-limit.ts, result-schema.ts | Not components | Helpers for applications. |
The whole package is an adapter to MCP servers.

### Pi Codemode (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Sandboxes | src/index.ts, portable.ts, runtime/host.ts, runtime/remote.ts, runtime/inline.ts (CodemodeSandbox, RemoteCodemodeSandbox, InlineCodemodeSandbox) | One part with variants | "they share one API, one script environment, and one result format" (README). |
| QuickJS runtime, worker, Cloudflare Durable Object | src/runtime/vm.ts, execution.ts, worker.ts, protocol.ts, prelude-source.ts, src/wasm.ts, src/cloudflare.ts | Not components | Where a variant runs the VM. |
| Source format, declarations | src/source.ts, src/declarations.ts | Not components | Parsing the options line and generating tool declarations. |
The sandbox persists nothing itself (README "Store").

### Pi Schema and Pi Telemetry (stay closed)

- Pi Schema: builders, compiler and validator, coercion, format checks (src/*, src/formats). One job: build and check schemas; formats load only through ./formats (check-entry-graphs).
- Pi Telemetry: the context and span contract, no-op and in-memory reference adapters, typed schemas, render, conformance tests. No exporter, no stored state ("Telemetry is diagnostics, not durable application state").

## Round 3: components to test

Agent session, Model runtime, Extension runtime, Resource loader, Project trust, Package manager, MCP connections (found in round 2). Pi Agent Core and Pi AI were tested above as providers.

## Round 3 decisions (no component opens; the rounds stop here)

### Agent session (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| AgentSession and session runtime | src/core/agent-session.ts, agent-session-runtime.ts, agent-session-services.ts, sdk.ts | One part | Run prompts, queues, retries, model and tool choice; the runtime replaces the session on new, resume, fork and import. |
| Session store | src/core/session-manager.ts, session-cwd.ts | Not separate | Storage of the session tree. It is not the only writer of session files: the runtime copies an imported file into the session folder (agent-session-runtime.ts importFromJsonl) and the terminal UI deletes a cancelled fork's file (interactive-mode.ts switchToForkedSession). Parts that change each other's records are one component. |
| Compaction and branch summaries | src/core/compaction/* | Not separate | Computes summaries and cut points that AgentSession appends to the same tree; customised by extensions through session_before_compact. |
| System prompt, messages, cache warmer, usage, cache stats, nested tool calls | system-prompt.ts, messages.ts, cache-warmer.ts, usage-totals.ts, cache-stats.ts, nested-tool-calls.ts | Not separate | Steps of a run on the same session state; cache warming is provider behaviour. |
| Tools | src/core/tools/*, bash-executor.ts, exec.ts, src/extensions/codemode/*, src/extensions/tool-search/* | Not components | Variants of the tool contract (see round 2). |
| Export, share and bug report | src/core/export-html/*, session-export.ts, bug-report.ts, bug-report-upload.ts, src/modes/interactive/session-share.ts, bug-report.ts | Not separate | Representations of the session and uploads of them. |

### Model runtime (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| ModelRuntime and ModelRegistry | model-runtime.ts, model-registry.ts | One part | ModelRegistry only passes calls on to ModelRuntime (model-registry.ts constructor and methods). |
| Provider composition and models.json | provider-composer.ts, model-config.ts | Not separate | Builds the provider set ModelRuntime holds. |
| pi.dev catalog overlay | remote-catalog-provider.ts | Not a component | Adapter to pi.dev that wraps a provider. |
| Credential and model-list stores | auth-storage.ts, models-store.ts, runtime-credentials.ts | Not components | Storage supplied to Pi AI. |
| Virtual models | virtual-models.ts | Not separate | Dispatches to the router an extension registers; changes the same provider set. |
| Model pattern matching | model-resolver.ts, provider-matching.ts, preferred-providers.ts | Not separate | Steps of model selection. |
| llama.cpp support | src/extensions/llama/* | Not a component | Provider variant and a client of the llama.cpp router. |

### Extension runtime (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Loader | src/core/extensions/loader.ts, jiti-*.ts, virtual-modules.ts, wrapper.ts | Not separate | Loads modules and maps host packages; fills the registrations the runner reads (createExtensionRuntime). |
| Runner | src/core/extensions/runner.ts | Not separate | Dispatches events and combines results on the same registrations. |
| Contract | src/core/extensions/types.ts, index.ts | Contract | ExtensionAPI and ExtensionContext. |
| MCP server registrations | src/core/mcp-servers.ts | Not separate | "The core only validates and stores registrations". |
| Event bus | src/core/event-bus.ts | Not a component | A channel extensions share (pi.events). |

### Resource loader (stays closed)

- DefaultResourceLoader (resource-loader.ts): discovery, precedence, context files. Skill loader (skills.ts), prompt-template loader (prompt-templates.ts), source info (source-info.ts), package manifest reader (pi-manifest.ts), slash command list (slash-commands.ts): parsers whose results only the loader holds. One component.

### Project trust (stays closed)

- ProjectTrustStore (trust-manager.ts) and trust resolution (project-trust.ts) work on the same decisions. One component.

### Package manager (stays closed)

- DefaultPackageManager (package-manager.ts): one class; npm and git handling are steps of install and update.

### MCP connections (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Connection manager | src/extensions/mcp/index.ts, runtime.ts, runtime.lazy.ts | One part | Connects servers, registers their tools, keeps connection state. |
| Config | src/extensions/mcp/config.ts, src/core/radius-mcp.ts | Not separate | Reads and edits mcp.json for the manager. |
| OAuth | src/extensions/mcp/oauth.ts | Not separate | Sign-in state of the same servers (mcp-auth.json). |
| Tools, resources, log | tools.ts, resources.ts, log.ts | Not separate | Steps of calling the same connections. |
| Shell commands and /mcp screen | cli.ts, cli.lazy.ts, ui.ts | Interfaces | Present the manager. |

# Deepening run (2026-11-25)

The earlier run stopped after round 3. This run tests again, from Level 2 down, every provider and component that could open: Pi's seven components (their parts would sit at Level 3) and the seven libraries (each a Level 1 provider whose parts would sit at Level 2). The Level 1 and Level 2 decisions above stand unless a row below says the code contradicts them. Notes and quotes: notes-deepening.md.

How each part is tested (use-boundary-model, Component): it is a component when it keeps state that only it changes, or makes decisions that only it makes, and the other parts reach it only through what it exposes. Clients that present, storage, libraries, adapters to outside services, parts that change each other's records, and variants of one contract are not components on their own. For a part that keeps no state, the decision it makes must be its own and must stand without another part recording it: a stateless part whose result counts only once the part that called it records it is a step of that part's capability.

## Round A: providers and components to open

Pi AI, Pi Agent Core, Pi TUI, Pi MCP, Pi Codemode, Pi Schema, Pi Telemetry (libraries, Level 1 providers); Agent session, Model runtime, Extension runtime, Resource loader, Project trust, Package manager, MCP connections (Pi's Level 2 components).

## Round A decisions (two open: Pi Agent Core and Pi MCP)

### Pi Agent Core (opens: Stateful agent, Agent loop)

The code contradicts the round 2 verdict "they share one state": the Agent hands the loop a copy of its transcript and tools and alone writes its state.

| Part | Files | Verdict | Why |
|---|---|---|---|
| Stateful agent | packages/agent/src/agent.ts | Component | Keeps the transcript, model, thinking level, tools, the steering and follow-up queues and the active run; only `processEvents` and its own methods change them. Library developers and the Agent session reach it only through `Agent`'s methods and events. |
| Agent loop | packages/agent/src/agent-loop.ts, proxy.ts | Component | Decides each turn alone: when to poll the queues, how tool calls run (parallel or sequential, truncated calls failed), when the run ends. Keeps the run's working context, which hooks can replace without touching the Agent's transcript. Reached only through `agentLoop`, `agentLoopContinue`, `runAgentLoop`, `runAgentLoopContinue` and `runToolCall`; README "Low-Level API" offers it "without the Agent class". Imports nothing from agent.ts. |
| Shared types | packages/agent/src/types.ts, index.ts | Not a component | The contract types of both (`AgentState`, `AgentLoopConfig`, `AgentTool`, `AgentEvent`) and the package entry. |
| Default stream function | packages/agent/src/stream-fn.ts | Not a component | Wiring: a slot the host fills, read by both components when no stream function is given. |
| mcp-codemode example | packages/agent/examples/mcp-codemode/* | Not a component | Documentation: an example program using the library. |

### Pi MCP (opens: MCP client, MCP OAuth)

The code contradicts the round 2 verdict "OAuth: sign-in steps of a connection" and "the whole package is an adapter": sign-in runs on its own, has its own entry point and state store, and the transport reaches it only through `AuthProvider`.

| Part | Files | Verdict | Why |
|---|---|---|---|
| MCP client | packages/mcp/src/client.ts, protocol/*, transports/* | Component | `McpClient` alone keeps the connection (state, negotiated version, server capabilities, pending requests) and decides request correlation, timeouts and cancellation; reached only through its methods. Imports no OAuth code. |
| MCP OAuth | packages/mcp/src/oauth/* | Component | Alone writes the sign-in state (tokens, client registration, discovery) through the injected `McpOAuthStateStore` (provider.ts, sign-in.ts) and decides discovery, client registration, shared refresh under the store's lock and step-up scopes. Applications reach it through the `./oauth` entry; the Streamable HTTP transport only through `AuthProvider` (auth-provider.ts). Nothing outside src/oauth imports it. |
| Transports | packages/mcp/src/transports/* | Not a component; part of MCP client | Variants of `McpTransport` ("An MCP transport owns framing and I/O"): adapters to the servers. |
| AuthProvider contract | packages/mcp/src/auth-provider.ts | Contract | `token()` and `onUnauthorized()`, between the transport and MCP OAuth. |
| Config validation, naming and content conversion | packages/mcp/src/config.ts, naming.ts, input-schema.ts, model-content.ts, output-limit.ts, result-schema.ts, index.ts, testing/ | Not components | Helpers for applications that keep nothing, and the package entry. |

### Pi AI (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Models collection | src/models.ts, src/auth/resolve.ts, context.ts, helpers.ts, credential-store.ts, types.ts | The one component-like part | Holds the provider set; alone writes credentials (login, logout, OAuth refresh inside the store's `modify`) and stored model lists (`publishProviderModels`); decides routing and how auth applies to each request. |
| Provider factories | src/providers/*.ts | Not a component | Variants of the `Provider` contract, each an adapter to one model service: its catalog, auth semantics and stream behaviour (README "Providers and Models"). They hold no record only they change: Models persists a dynamic provider's list before running its update, and runs its OAuth refresh inside Models' credential write. |
| Auth and OAuth flows | src/auth/oauth/* | Not a component | Each provider's sign-in and refresh flows; their credentials are stored by the Models collection. |
| API implementations | src/api/* | Not a component | Wire protocols the providers share; adapters. |
| Model catalog | src/models.generated.ts, src/providers/*.models.ts, model-catalog.ts, models-store.ts, providers/model-schema.ts, providers/compat-schema.ts | Not a component | Generated data and the store contract Models writes through. |
| Cache-warming policy | src/cache-warming.ts | Not a component | Stateless numbers for hosts ("Hosts own the scheduling; this module owns the numbers"); it serves no capability, since cache warming is provider behaviour, excluded at Level 1. |
| Utilities and telemetry schema | src/telemetry.ts, session-resources.ts, env-api-keys.ts, utils/* | Not components | Request spans through pi-telemetry, a registry of clean-up callbacks, environment key lookup, helpers. |
| Faux provider | src/providers/faux.ts | Not a component | A test provider (excluded as test help). |
| pi-ai compatibility entry point | src/compat.ts, legacy-api-aliases.ts, compat/, images.ts, images-api-registry.ts, image-models.ts, providers/images/* | Cleanup candidate | The old global API with its own registries; images*.ts are used only by compat.ts. |
| Entry modules | src/index.ts, oauth.ts, lazy-oauth.ts, bun-oauth.ts, bedrock-provider.ts, lazy-bedrock-provider.ts | Not components | Export surfaces; check-entry-graphs budgets ./models and ./utils/*. |
| pi-ai command line | src/cli.ts | Interface | `pi-ai login` and `list`. |
| Catalog generator | catalog/, scripts/ | Tooling | |

Only one part passes.

### Pi TUI (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Renderers and built-in components | src/tui.ts, tui-main-screen.ts, tui-alt-screen.ts, layout*.ts, components/*, editor-component.ts | One part | All fulfil the `Component` contract, and the TUI is itself the root container of the tree (`TuiBase extends Container implements TUI`); `setFocus()` writes the widgets' `focused` flag, so renderer and widgets change each other's records. |
| Terminal input and output | src/terminal.ts, stdin-buffer.ts, keys.ts, terminal-image.ts, terminal-colors.ts | Not a component | Adapters to the terminal. |
| Native clipboard helpers | src/native-*.ts, native/ | Not a component | Adapters to the operating system's clipboard. |
| Keybindings | src/keybindings.ts | Not a component | A store of key settings the widgets read. |
| Autocomplete, fuzzy matching, LaTeX and utilities | src/autocomplete.ts, fuzzy.ts, colors.ts, oklab.ts, latex.ts, utils.ts, kill-ring.ts, undo-stack.ts, word-navigation.ts, wheel-scroll.ts, alt-screen-search.ts, program-status.ts | Not components | Helpers of the widgets; autocomplete providers are variants the editor uses. |

At most one part could pass.

### Pi Codemode (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Sandboxes | src/runtime/execution.ts (`CodemodeSandboxBase`), host.ts, remote.ts, inline.ts | One part with variants | Registers tools, runs scripts, records calls, enforces the deadline; the three sandboxes "share the same host side, prelude, and VM, and replace only the worker thread" (README). |
| QuickJS runtime, worker and Cloudflare Durable Object | src/runtime/vm.ts, prelude-source.ts, worker.ts, protocol.ts, src/wasm.ts, src/cloudflare.ts | Not a component | An implementation choice: the QuickJS interpreter in a worker thread, an isolate or the calling thread. Its isolation does not make a boundary; it carries one run of the sandbox's own capability and persists nothing. |
| Source format and declarations | src/source.ts, declarations.ts, identifier.ts | Not components | Parsing the options line and generating tool declarations. |

### Pi Schema (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Compiler and validator | src/compiler.ts, validator.ts, checks.ts, coerce.ts, resolver.ts, explain.ts, shared.ts | The one deciding part | Decides whether a value matches a schema. |
| Format checks | src/formats/* | Not a component | A group with its own entry-point rule, but pure checks the compiler calls through `compile()`'s `formats` option: steps of the same decision. |
| Builders and types | src/builders.ts, annotations.ts, types.ts, typebox-static.ts, index.ts | Not components | Return plain JSON Schema objects; decide nothing. |

### Pi Telemetry (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Contract and reference adapters | src/index.ts, noop.ts, memory.ts, metrics.ts | One part with variants | `InMemoryTelemetryContext` and the no-op context are variants of `TelemetryContext`; only the in-memory one keeps records. |
| Typed schemas | src/index.ts `createTypedSpanStarter`, src/metrics.ts `createTypedMetrics` | Not a component | Wrap a context and pass calls on. |
| Render and conformance suite | src/render.ts, src/testing/* | Not components | A representation of spans, and test help. |

### Agent session (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| AgentSession | src/core/agent-session.ts | The component's core | Runs prompts, queues, retries, model and tool choice; reached by the modes, the SDK and the extension runner through its methods and events. |
| Session store | src/core/session-manager.ts, session-cwd.ts | Not separate | SessionManager keeps the tree, but the store is also written by the session runtime (`copyFileSync` on import) and by the terminal UI (fork clean-up, session deletion): parts that change each other's records are one component. |
| Session runtime | src/core/agent-session-runtime.ts | Not separate | Replaces the AgentSession on new, resume, fork and import, and copies imported files into the session folder. |
| Compaction and branch summaries | src/core/compaction/* | Not a component | Decides cut points and writes summaries but keeps nothing; the result counts only once AgentSession appends it, AgentSession decides when to compact and whether to take an extension's `session_before_compact` result instead, and its header lists compaction among what it "encapsulates". The SDK offers these functions as "Compaction and summarization utilities". |
| Built-in tools, codemode tool, tool search | src/core/tools/*, src/extensions/codemode/*, src/extensions/tool-search/* | Not components | Variants of the tool contract and adapters to the working folder and shell; codemode keeps its store as session entries, tool_search changes the session's active tools. |
| Session wiring | src/core/sdk.ts, agent-session-services.ts | Not a component | The dependency-injection setup that builds the session and its services. |
| System prompt, messages, cache warmer, usage | src/core/system-prompt.ts, messages.ts, nested-tool-calls.ts, cache-warmer.ts, usage-totals.ts, cache-stats.ts | Not components | Steps of a run on the session's state; nested calls are recorded on the parent call's result; cache warming is provider behaviour. |
| Shell command runner and exec helper | src/core/bash-executor.ts, exec.ts | Not components | Adapters to the shell for `!` commands and `pi.exec`. |
| Export, share and bug report | src/core/export-html/*, session-export.ts, bug-report.ts, bug-report-upload.ts, src/modes/interactive/session-share.ts, bug-report.ts | Not components | Representations of the session and their uploads. |

### Model runtime (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| ModelRuntime | src/core/model-runtime.ts | The component's core | Holds every provider map, the virtual-model registrations, models.json and the availability snapshot. |
| Model registry | model-registry.ts | Not a component | A facade that passes calls on. |
| Provider composition and models.json | provider-composer.ts, model-config.ts | Not separate | Functions that build the `Provider` wrappers ModelRuntime installs, and the models.json reader. |
| pi.dev catalog overlay | remote-catalog-provider.ts | Not a component | A `Provider` wrapper that reaches pi.dev: an adapter. |
| Credential and model-list stores | auth-storage.ts, models-store.ts, runtime-credentials.ts | Not components | Storage, and an overlay for runtime API keys. |
| Virtual models | virtual-models.ts | Not separate | A `Provider` wrapper; ModelRuntime keeps the registrations. |
| Model pattern matching | model-resolver.ts, provider-matching.ts, preferred-providers.ts | Not separate | Steps of choosing a model. |
| llama.cpp support | src/extensions/llama/* | Not a component | A provider variant, a screen and clients of the router and the Hub. |

### Extension runtime (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Loader | src/core/extensions/loader.ts, jiti-*.ts, virtual-modules.ts, pi-ai-extension-view.ts, wrapper.ts | Not separate | `createExtensionRuntime()` and the `pi.register*` functions write the extension records the runner reads. |
| Runner | src/core/extensions/runner.ts | Not separate | Writes the same runtime (binds the session's actions, clears pending registrations). |
| Extension contract | src/core/extensions/types.ts, index.ts | Contract | |
| MCP server registrations | src/core/mcp-servers.ts | Not separate | `McpServerRegistry` lives in the same runtime (`runtime.mcpServers`). |
| Event bus | src/core/event-bus.ts | Not a component | A channel extensions share. |
| Built-in extension list | src/extensions/index.ts | Not a component | The code that registers the replaceable built-in extensions. |

### Resource loader (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| DefaultResourceLoader | src/core/resource-loader.ts | The component's core | Holds every loaded resource and decides precedence. |
| Skill and prompt-template loaders | skills.ts, prompt-templates.ts | Not separate | Parsers whose results only the loader holds. |
| Package manifest reader and source info | pi-manifest.ts, source-info.ts | Not separate | Read the `pi` key and label origins. |
| Slash command list | slash-commands.ts | Not a component | Data. |

### Project trust (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Trust store and trust resolution | src/core/trust-manager.ts, project-trust.ts | One part | `ProjectTrustStore` is storage of trust.json and `resolveProjectTrusted` decides on the same decisions; the store alone decides nothing. |

### Package manager (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| DefaultPackageManager | src/core/package-manager.ts | The component's core | One class. |
| npm and git handling | same file | Not separate | Steps of install and update. |
| Resource discovery and filters | same file (`collect*Entries`, pattern helpers) | Not separate | Helpers of `resolve()`. |

### MCP connections (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Connection manager | src/extensions/mcp/index.ts | The component's core | Holds the server records and decides exposure and start-up waits. |
| Server connections | runtime.ts, runtime.lazy.ts | Not a component | "The part of the MCP integration that talks to servers" (runtime.ts): the adapter, through pi-mcp, whose connection state is a property of the manager's server records. |
| Config | config.ts, src/core/radius-mcp.ts | Not separate | Storage of mcp.json, which only it writes. |
| OAuth | oauth.ts | Not separate | The mcp-auth.json store and the sign-in prompt; pi-mcp's OAuth makes the decisions. |
| Tools, resources and log | tools.ts, resources.ts, log.ts | Not separate | Steps of calling the same connections. |
| /mcp screen and pi mcp commands | ui.ts, cli.ts, cli.lazy.ts | Interfaces | |

## Round B: components to test

Stateful agent, Agent loop (inside Pi Agent Core: Level 2 of that library, Level 3 inside Pi, where Pi Agent Core is shared); MCP client, MCP OAuth (inside Pi MCP, Level 2).

## Round B decisions (nothing opens; the rounds stop here)

### Stateful agent (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Agent | packages/agent/src/agent.ts `Agent` | The component's core | |
| Pending message queues | agent.ts `PendingMessageQueue` | Not separate | Part of the Agent's state, changed through `steer`, `followUp`, `clear*` and drained through the loop's poll callbacks. |
| Event reduction | agent.ts `processEvents` | Not separate | The step that records loop events in the same state. |

### Agent loop (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Run flow | agent-loop.ts `runLoop`, `agentLoop`, `runAgentLoop` and their continue forms | The component's core | |
| Tool-call pipeline | agent-loop.ts `executeToolCalls`, `prepareToolCall`, `executePreparedToolCall`, `finalizeExecutedToolCall`, `runToolCall` | Not separate | The run flow calls the unexported steps directly, not only through `runToolCall`, and they work on the same run. |
| Model call and tool-change declarations | agent-loop.ts `streamAssistantResponse`, `declareToolChanges` | Not separate | Steps of each turn. |
| Proxy stream | proxy.ts | Not a component | A stream function that reaches the application's own server: an adapter. |

### MCP client (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| Client core | packages/mcp/src/client.ts | The component's core | |
| Protocol types and JSON-RPC helpers | protocol/* | Not separate | Message types and helpers of the same client. |
| Transports | transports/* | Not components | Variants of `McpTransport`: adapters. |

### MCP OAuth (stays closed)

| Part | Files | Verdict | Why |
|---|---|---|---|
| OAuth provider and connection auth | packages/mcp/src/oauth/provider.ts, auth-provider.ts | The component's core | |
| Authorization flow and discovery | flow.ts, discovery.ts, client-settings.ts, types.ts, errors.ts | Not separate | Steps on the same sign-in state: discovery, registration, PKCE, token exchange, refresh, step-up. |
| Sign-in halves | sign-in.ts | Not separate | Saves to the same store as the provider. |
| Callback servers | callback.ts, loopback.ts | Not components | Local HTTP listeners for the browser's redirect: adapters. |

No component opened in round B, so Level 4 is decided: nothing below Level 3 inside Pi, and nothing below Level 2 inside the libraries.

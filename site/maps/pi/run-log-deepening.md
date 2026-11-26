# Run log: deepening the Pi boundary map

Revision 362bf6f1bec2db70dc072e4db4eb5b2903f4e9f6. Started 18:09 UTC and finished the checks at 18:38 UTC on 2026-11-25. The map at map.json is unreviewed. The earlier run's folder (../work) was read and not changed.

## Setup

- Read in full: extract-boundaries/SKILL.md, use-boundary-model/SKILL.md, references/map-format.md, assets/boundary-map.schema.json (v0.1.0, /home/user/boundary-model/skills), and check-map.mjs. Read the earlier run-log.md, open-list.md, boundaries.md, notes and map.json.
- Copied map.json and open-list.md here, and boundaries.md so that the step 3 entries sit in one file. The copied map passed check-map.mjs with `--places` before any change.
- No subagents: this session has no Agent or Task tool, and a new cloud session would not see this folder. I did the sweep myself and wrote my notes in notes-deepening.md in place of readers' notes. For the same reason the method's step 4 writer was not used: as the brief asks, each addition went into the map after its step 3 entry, then through steps 5 and 6.
- Reading followed the safety rules: git (read only), read tools and check-map.mjs. One early `grep -rln` over packages/ printed a file name inside packages/durable, which is excluded; the file was not opened, cited or used, and every later search used `git grep` with the excluded folders as negative pathspecs.

## The test applied to every part

The Component guideline: a part is a component when it keeps state that only it changes, or makes decisions that only it makes, and the other parts reach it only through what it exposes; clients that present, storage, libraries, adapters to outside services, parts that change each other's records and variants of one contract are not components on their own. One reading had to be fixed for parts that keep no state: a stateless part's decision counts only when it stands without another part recording it. A stateless part whose result counts only once its caller records it is a step of the caller's capability. The two stateless parts this touches, the agent loop (a component) and compaction (a step), are recorded in `questions`.

## Round A: Pi's seven components and the seven libraries

Tested every part of each, with its files, in open-list.md ("Round A decisions"). Deciding files read myself: scripts/check-entry-graphs.mjs, check-runtime-deps.mjs, check-browser-smoke.mjs; each library's package.json exports and README; packages/agent/src/agent.ts, agent-loop.ts, types.ts; packages/mcp/src/client.ts, auth-provider.ts, transports/transport.ts, streamable-http.ts, oauth/*; packages/ai/src/models.ts, auth/types.ts, index.ts, compat.ts, cache-warming.ts; packages/tui/src/tui.ts, index.ts; packages/codemode/src/index.ts, portable.ts, runtime/execution.ts, protocol.ts; packages/schema/src/index.ts, formats/index.ts; packages/telemetry/src/memory.ts; and in the coding agent agent-session.ts, agent-session-runtime.ts, compaction/, model-runtime.ts, extensions/loader.ts and runner.ts, mcp-servers.ts, resource-loader.ts, trust-manager.ts, project-trust.ts, package-manager.ts, extensions/mcp/index.ts, runtime.ts, oauth.ts, extensions/index.ts. Checked who writes what with a grep of file writes, and change coupling since 2026-05-25 with `git log --no-renames`.

Opened (two):
- Pi Agent Core: Stateful agent and Agent loop. The code contradicts the earlier verdict that the loop runs on the Agent's state: the Agent hands it a copy (createContextSnapshot) and alone writes its state from the loop's events; the loop alone decides each turn, keeps the run's working context, imports nothing from agent.ts, and is offered "without the Agent class" (README, Low-Level API).
- Pi MCP: MCP client and MCP OAuth. The code contradicts the earlier verdict "sign-in steps of a connection": sign-in runs on its own behind the ./oauth entry, only src/oauth saves the sign-in state through the injected McpOAuthStateStore, the HTTP transport reaches it only through AuthProvider, nothing outside src/oauth imports it, and it changed alone in 11 of its 14 commits.

Stayed closed, with the parts tested and why none or only one passed:
- Pi AI: Models collection, provider factories, auth and OAuth flows, API implementations, model catalog, cache-warming policy, utilities and telemetry schema, faux provider, entry modules, pi-ai command line, catalog generator, compatibility entry. Only the Models collection passes: providers are variants of one contract and adapters to model services whose persisted lists and refreshed credentials Models writes; the cache-warming policy is stateless and serves no capability (provider behaviour). Found on the way: images.ts, images-api-registry.ts, image-models.ts and providers/images/ are used only by compat.ts, so they joined the compatibility cleanup place.
- Pi TUI: renderers and built-in components, terminal input and output, native clipboard helpers, keybindings, autocomplete and helpers. At most one part: the TUI is itself the root container of the widget tree (TuiBase extends Container) and writes the widgets' focused flag, so renderers and widgets are one tree on one contract; the rest are adapters, a settings store and helpers.
- Pi Codemode: sandboxes, the QuickJS runtime and where it runs, source format and declarations. One part with variants: the VM is an implementation choice whose isolation carries one run of the sandbox's own capability.
- Pi Schema: compiler and validator, format checks, builders and types. Only the compiler decides; the format checks have their own entry-point rule but are steps of the same decision, and the builders decide nothing.
- Pi Telemetry: contract and reference adapters, typed schemas, render and conformance suite. One contract with variants; the rest wrap it, represent it or test it.
- Agent session: AgentSession, session store, session runtime, compaction and branch summaries, session wiring, built-in tools with codemode and tool search, system prompt and other run steps, shell runner, export and sharing. The core passes; the store is also written by the runtime and the terminal UI (import copy, fork clean-up, the session picker's delete), compaction keeps nothing and its result counts only once the session records it, the tools are adapters keeping their state in the session, the rest are steps, wiring, adapters and representations.
- Model runtime: ModelRuntime, registry facade, provider composition, catalog overlay, stores, virtual models, pattern matching, llama.cpp support. Only ModelRuntime holds state; the others are wrappers it installs, storage, steps and a provider variant.
- Extension runtime: loader, runner, contract, MCP server registrations, event bus, built-in extension list. Loader and runner write the same ExtensionRuntime records; the rest is contract, a registry inside the same runtime, a channel and wiring.
- Resource loader: DefaultResourceLoader, skill and prompt-template loaders, manifest reader and source info, slash command list. Only the loader holds results.
- Project trust: trust store and trust resolution on the same decisions; the store is storage.
- Package manager: one class with npm and git steps and resource discovery helpers.
- MCP connections: connection manager, server connections, config, OAuth store and prompt, tools and resources, interfaces. The connection layer is the adapter whose state belongs to the manager's server records; config and OAuth are storage (MCP connections also removes and migrates sign-in records itself).

Re-checked a Level 2 decision against the new Pi MCP verdict: inside Pi, pi-mcp stays a library rather than its OAuth becoming a shared component, because MCP connections' own store also changes the sign-in records (`questions`).

## Step 3 for the new boundaries

boundaries.md entries 23 to 26: Stateful agent -> Agent loop (agent loop API: Run turns, a new resource Agent run), MCP client -> MCP OAuth (AuthProvider contract: Get access token, onUnauthorized folded in as its step), MCP client -> MCP servers and MCP OAuth -> MCP servers (MCP; the provider Pi MCP keeps its own boundary with MCP servers, as the format gives one to each component that relies on the service). Hooks, queue callbacks, ping, reconnection, token refresh and step-up are steps. A note on entry 1: the session's call to runToolCall for nested tool calls is a step of Run prompt, so the Level 2 boundary keeps its capabilities (`questions`).

## Round B: the components found in round A

Tested Stateful agent (Agent, pending message queues, event reduction), Agent loop (run flow, tool-call pipeline, model call and tool-change declarations, proxy stream), MCP client (client core, protocol helpers, transports) and MCP OAuth (provider and connection auth, authorization flow and discovery, sign-in halves, callback servers). None opens: the queues and event reduction are the Agent's own state and steps; the run flow calls the tool pipeline's unexported steps directly on the same run; the transports and the callback servers are adapters; every OAuth piece reads and writes the same sign-in state. The rounds stop here, so Level 4 is decided: nothing below Level 3 inside Pi (where Pi Agent Core's components sit, the library being shared) and nothing below Level 2 inside the libraries.

## Steps 5 and 6

- Revised the map: the two opened providers with their components and parts; the parts and reasons of every closed provider and component brought in line with open-list.md, adding the parts the earlier map had not named (cache-warming policy, faux provider, entry modules, keybindings, session wiring, shell runner, built-in extension list, resource discovery, server connections, AuthProvider contract); resource Agent run; interfaces agent loop API and AuthProvider contract; four boundaries; places for the four components and the interface; seven `questions`.
- Read each new boundary as its consumer would; every capability matches an operation of the contract its interface names.
- Imports between the new components: agent.ts imports only runAgentLoop and runAgentLoopContinue from agent-loop.ts; nothing outside src/oauth imports it; src/oauth imports the AuthProvider types, a protocol version constant and an object guard (settled as contract and shared helpers); the coding agent imports pi-agent-core and pi-mcp only through their package entries.
- Every part named in open-list.md's new rounds is a component or sits in its provider's or component's `parts`, except the rows marked as a component's core, which are that component.
- Evidence: all 83 evidence paths exist (evidence-paths.txt, `test -f`).
- check-map.mjs: "passes: 4 consumers, 8 providers, 11 components, 8 outside services, 36 resources, 36 boundaries"; with `--places` from the repository root, "All 4844 tracked files have a place."

# Run log: extract-boundaries on Pi

Revision 362bf6f1bec2db70dc072e4db4eb5b2903f4e9f6. Started 11:11 UTC and stopped after the checks at 11:48 UTC on 2026-11-24, about 37 minutes of wall-clock time by the working files' timestamps. Stopped before step 7: the map at map.json is unreviewed.

## Setup (11:11, a few minutes)

- Read the four skill files in full (extract-boundaries, use-boundary-model, map-format.md, the schema) and the checker script.
- Corpus: 2,054 of the repository's 4,844 tracked files, once apps/p2, apps/p2-mac, apps/p3, packages/chord, packages/durable and packages/env are taken out (corpus-files.txt).
- No subagent tool was available in this session: there was no Agent or Task tool, and a new cloud session would not see this working folder. So I did the readers' sweep and the draft myself, in the method's order. My notes per altitude stand in for the readers' notes. This departs from the method in two places: the delegated sweep and step 4's writer subagent.

## Step 1: consumers and Level 1 (11:12 to 11:20)

- Top altitude, read in full: the root README; the coding agent's README and documentation index; "How Pi works"; the quickstart, usage, configuration, CLI, slash commands, sessions, security, CLI integration, models, providers, SDK, Pi packages and MCP guides; the READMEs of pi-agent-core, pi-mcp and the evals.
- Read by headings, plus the sections that answered a question: pi-ai's 110 KB README, the 158 KB extensions guide, and the pi-tui, codemode, telemetry and schema READMEs. Reading them whole would have crowded out the code. The repository's AGENTS.md was read as evidence only.
- Code surface: the package manifests (bins and exports), main.ts, the slash command list, the RPC command types, and a grep of the hosts the shipped code calls. The code showed nothing the documents missed, apart from an anonymous install report and an experimental first-run setup, which are provider behaviour.
- History: change coupling over three months (notes-history.md). One snag: the first `git log --name-only` on the blobless clone made git fetch missing objects in the background, for rename detection. I reran it with `--no-renames`, which needs no blobs, and no further fetch happened.
- Decided: four consumers. Pi (the coding agent) serves the Pi user, the Extension author and the Integrator. Each of the seven published libraries is its own provider for the Library developer. That gives ten Level 1 boundaries.

## Round 2: open the Level 1 providers (11:20 to 11:29)

- Read the deciding files myself. Architecture checks: scripts/check-entry-graphs.mjs ("A package's exports map is the only place that says which modules are public") and scripts/check-runtime-deps.mjs (a public package imports only what it declares). Wiring: sdk.ts and agent-session-services.ts, the dependency-injection setup. Registry: src/extensions/index.ts (built-in extensions, "replaceable"). Contracts: ExtensionAPI, `interface ResourceLoader`, `interface PackageManager`, `ModelRuntime implements Models`, `AuthStorage implements CredentialStore`.
- Checked who writes what with a grep of file writes. Only pi-ai's Models writes credentials; the coding agent supplies the file store. The session runtime and the terminal UI both touch session files.
- Pi opened: seven components defined inside it (Agent session, Model runtime, Extension runtime, Resource loader, Project trust, Package manager, MCP connections), plus Pi AI and Pi Agent Core as shared components.
- The seven libraries stayed closed. Each has at most one part that decides; the rest are provider adapters, transports, variants of one contract, or helpers.

## Round 3: test the new components (11:29)

- No component opened. The parts of each one share its state or are steps, stores or adapters (open-list.md). The rounds stopped there.

## Step 3: inner boundaries (to 11:35)

- Opened each contract and listed its operations (boundaries.md): 13 boundaries between Pi's components and 9 with outside services. Hooks, auth checks, ping and reconnection were folded in as steps.

## Steps 4 and 5: draft and revision (11:35 to 11:47)

- Wrote my notes (notes-decisions.md). Then I wrote draft.json myself from the working folder only, with no new reading, as a stand-in for the writer subagent.
- Revised it into map.json. Folded /copy into Export session, as an interaction with a representation. Gave one-capability areas the same name as their capability. Restricted the trust capability to the interfaces that offer it. Added the missing parts named in open-list.md, and the exclusion lines for contributors, sandboxing and the pi.dev gallery.

## Step 6: checks (11:45 to 11:48)

- Imports between components: 42 value imports cross between component files (cross-imports.txt). Each was settled as a contract use, a shared helper, a tool name or the built-in registry. Three reach past a contract; they are recorded in `questions`.
- Evidence: all 75 evidence paths exist (evidence-paths.txt, `test -f`).
- check-map.mjs passes: 4 consumers, 8 providers, 7 components, 8 outside services, 35 resources, 32 boundaries. With `--places`, all 4,844 tracked files have a place, on the first run.

## Questions no rule settled

- Libraries as their own providers, or interfaces of one Pi.
- Pi AI and Pi Agent Core shown inside Pi as shared components.
- Tools as parts of the session, not a Tools component.
- Session store folded into the Agent session.
- MCP as a component while codemode and tool search are tools.
- Project trust as its own component.
- Radius as one outside service.
- Settings as a resource.
- Print mode for the Pi user, JSON mode for the Integrator.
- Dialog and Widget as resources.
- llama.cpp support inside the Model runtime.
- Self-update excluded.
- How the cross-component imports were settled.

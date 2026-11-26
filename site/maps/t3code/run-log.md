# Run log: extract-boundaries on T3 Code

- Skill: v0.1.0 files in /home/user/boundary-model/skills (extract-boundaries/SKILL.md, use-boundary-model/SKILL.md, references/map-format.md, assets/boundary-map.schema.json), read in full before starting; check-map.mjs read too.
- Repository: github.com/pingdotgg/t3code at 667cb3b25571fc3a1700f29d62453ed50acd5c7c (blobless clone, history since 2026-05-25).
- Corpus: whole repository and history except dependencies, generated output and secrets. `.repos/` (vendored alchemy-effect and effect, 24,482 of 33,539 tracked files) counted as dependencies: not read, cited or named from, placed as excluded. 9,057 files outside `.repos/`.
- Output: the unreviewed map is work/map.json. Step 7 (review) was not run, per the brief, and nothing was written at the output path.
- Run: 18:08 to about 19:00 UTC (about 52 minutes).

## Deviations, stated plainly

- No subagents. This session has no Agent/Task tool; the remote-session tools start separate cloud sessions that cannot see this working folder or the local clone. I did the reading sweep, the draft (step 4) and the revision (step 5) myself, in the method's order. The draft is work/draft.json, written from the working folder's notes; work/map.json is the revised version.
- Tools: besides git (read only), read tools and check-map.mjs, I used shell text tools (grep, awk, sed, sort, uniq, realpath, date) to read and to edit files in the working folder, a small grep/realpath shell loop (work/imports.sh) to count imports between server folders, `cp` to copy draft.json to map.json, and once `node -e` to print the `name` field of package.json files. Nothing from the repository was run, installed or built.
- Change coupling (git history) was not used as evidence: the decisions rested on stronger evidence (lint-enforced seams, typed contracts, registries, which part writes which table). The history was not mined; a reviewer may want it to test the Git split and the Agent providers split.

## Reading by altitude

Top altitude (read myself, 18:08-18:13):
- In full: README.md, docs/README.md (index), docs/internals/00_glossary.md, docs/internals/01_architecture.md, AGENTS.md (read as evidence only), docs/user/install.md, faq.md, outside-agents.md, guest-links.md, secrets.md, triage.md, html-renders.md, browser-import.md, default-browser.md, mobile-notifications.md, question-attachments.md.
- By headings plus the sections that bear on consumers and capabilities (whole reading would have crowded out the code): docs/user/remote-access.md (691 lines), thread-sidebar.md (410), composer.md (451), source-control.md (455), project-settings.md (305), managed-policy.md (317), workflows.md (160), devices.md (171), permission-modes.md.
- Openings only (to place each feature): usage, telemetry, welcome-page, snap-shot, voice-input, terminal, text-generation, prompt-links, portable-handoffs, thread-migration, activity-log, background-service, updating, providers-acp/claude/codex/antigravity, cursor, t3-connect-troubleshooting, appearance, keybindings, keyboard-focus, open-source-licenses, multi-repo-projects.
- Operator runbooks (docs/operations/*): headings, plus 02_connect-setup.md opening. They are maintainer tooling.
Notes: work/notes-top.md.

Consumer-facing surface in code (step 1, 18:13-18:15): web routes (apps/web/src/routes), CLI commands (apps/server/src/cli), MCP tool names (apps/server/src/mcp/toolkits), WS_METHODS and ORCHESTRATION_V2_WS_METHODS, EnvironmentHttpApi endpoints, guest routes, RelayApi groups, marketing pages, DesktopBridge. No consumer was found that the docs missed. Notes: work/level1.md.

Provider round reading (design docs chosen from the index): docs/internals/02_effect-services.md, 03_providers.md, 04_environment-auth.md, 05_remote.md, 06_t3-connect.md, 07_server-updates.md, 09_connection-runtime.md; infra/relay/README.md; packages/client-runtime/README.md; infra/task-cache/README.md (opening).

Deciding files read myself: vite.config.ts (lint import restrictions and per-folder rules), oxlint-plugin-t3code/rules/no-rpc-permission-bypass.ts, no-raw-mcp-registration.ts, no-layout-command-approval-writes.ts; packages/contracts/src/rpc.ts (WS_METHODS), orchestrationV2.ts (method list, launch input), environmentHttp.ts (endpoint list), relay.ts (groups and endpoints), ipc.ts (DesktopBridge), desktopBootstrap.ts, desktopBrowser.ts; packages/provider-core/src/server/ProviderAdapter.ts (ProviderAdapterV2 operations), ProviderHost.ts, driver.ts; apps/server/src/provider/builtInDrivers.ts; the Context.Service interfaces of ~25 server services (operation names extracted, listed in work/boundaries.md); table writers and readers found by searching SQL in apps/server/src and infra/relay/src.

## Step 1: Level 1 (decided 18:15)

- Consumers: Developer; Guest (guest links, own goals); Machine administrator (managed policy, own goals).
- Outside agents and bots on MCP, webhook senders, the developer's scripts and linked environments' agents are the Developer's own integrations: interfaces of the Developer boundary, not consumers.
- Provider: T3 Code, one provider. T3 Connect stays inside it: own deployment and data, but no consumers of its own.
- Developer boundary: 13 areas, 57 capabilities, over 8 interfaces (desktop app, web app, mobile app, t3 command line, MCP server, webhook URLs, mobile notifications, t3.codes website).

## Round 1, Level 2 (18:15-18:18): T3 Code opened

Four of its parts passed the component test: Environment server, T3 Connect relay, Client app, Desktop shell. Not components: t3.codes website (interface), t3 npm launcher (interface), wire contracts and shared utilities (libraries), native helpers (adapters), shared task cache (tooling). Details and files: work/open-list.md, round 1.

## Round 2, Level 3 (18:18-18:26)

- Environment server opened into 17 components: Orchestration, Agent providers, Access control, Workspace, Git, Code host integration, Scheduled tasks, Workflows, Linked environments, T3 Connect link, Terminals, Browser, Devices, Secrets, Settings and policy, Voice transcription, Agent tools. Evidence: which part writes which table (SQL search), the registries, the lint-enforced seams (no-raw-mcp-registration, no-layout-command-approval-writes, the source-control-* split), the server import graph (work/server-import-edges.txt).
- T3 Connect relay opened into 3: Environment connections, Mobile notifications, Held webhooks (separate tables and a Durable Object store, separate writers).
- Desktop shell opened into 3: Server launcher, Desktop browser, SnapShots.
- Client app stayed closed. Parts tested: connection runtime (passes: saved environments, credentials, reconnects, packages/client-runtime/src/connection); shared client state (no: a mirror of server projections, the environment's state wins on reconnect); web UI, mobile UI, desktop window (no: they present; drafts and preferences are presentation state; choosing a machine for a draft is an interaction); voice input controller and device viewer (no: presentation); mobile native modules (no: adapters). Only one part passed.

## Round 3, Level 4 (18:26-18:33)

Opened (each with two or more parts that passed, files in work/open-list.md):
- Agent providers -> Agent drivers (variants, enforced package boundary), Provider registry, Agent installation.
- Git -> Checkpoints (only writer of hidden refs), Git actions (decides stacked actions and branch-switch refusals).
- Code host integration -> Code host connections, Pull requests, Issues (each the only writer of its own tables).
- Settings and policy -> Environment settings, Policy enforcement.
- Agent tools -> Tool server, Agent events.
- Environment connections (relay) -> Account links, Managed tunnels (separate tables; tunnels only read links).

Stayed closed, with the parts tested and why none or only one passed:
- Orchestration: decider, event store and projections, effect worker and run services, provider session manager, read streams, projects, guest view, attachments, MCP app context, triage, keep-awake. All commit through one EventSink into one store, so they change each other's records.
- Access control: sessions and pairing, per-call authorization, MCP sign-in, signing and secret storage, environment identity. One session store; authorization only reads it; the rest is library, storage or an identifier.
- Workspace: task folders (passes), workspace files (filesystem adapter with path rules and a cache), storage cleanup (clean-up job). One part.
- Scheduled tasks: task store and runner, timing, webhook pieces. One set of tables.
- Workflows: store, engine and runtime, triggers and agent steps, script API. One store.
- Linked environments: link store, forwarding, MCP client, thread relay, pairing and link requests. One set of link records.
- T3 Connect link: link state and proofs (passes), tunnel runtime (adapter to cloudflared), activity publisher and hook waker (pass events on), reachability checks (diagnostics).
- Terminals: manager (passes), PTY adapter, output protocol.
- Browser: tab manager (passes), browser hosts (variants it drives, adapters), discovery and loopback tunnel (helpers), visual replies (no store of its own), automation broker (passes requests on).
- Devices: device service (passes), device hosts (variant adapters), tool setup (installation), agent-device shim (passes requests on).
- Secrets: requests, resolver and checks, stored setting values, 1Password adapter. Requests and values share the server secret store.
- Voice transcription: service and model store (one store), engines and cloud speech (adapters), transcript clean-up (uses text generation).
- Mobile notifications: registrations, activity and alerts, deliveries. Deliveries rewrite registration rows, so one store.
- Held webhooks: forwarder and inbox share one Durable Object store.
- Server launcher: local, WSL and SSH variants share the backend pool and app settings.
- Desktop browser: tabs, profiles and cookie import, passkeys share the Electron browser sessions.
- SnapShots: pending captures (one part), platform capture variants, helper workers.

Correction found in round 3 (searched again): apps/server/src/project/* writes Orchestration's store (ProjectService.ts calls eventSink.commitCommand, AgentSessionScanner.ts calls ProjectStore.set), so project/ moved from Workspace to Orchestration.

Stopped after round 3: Level 4 decided, as the brief asks. Deepest level reached: Level 4.

## Steps 3 to 6 (18:33-19:00)

- Step 3: work/boundaries.md lists every boundary below Level 1 with its interface, contract path and operations. Operations a consumer would not call for itself were marked as steps: health checks, websocket tickets, attachment upload URLs, unload/clean-up calls, the registry refresh after an install.
- Step 4: draft.json, written by me (no writer subagent).
- Step 5, revisions from draft.json to map.json: removed the Client app -> Desktop shell area "Keep saved environments" (storage plumbing for the client, not a capability) and Environment connection from the desktop's resources; added parts that open-list.md had and the draft missed (renderer telemetry, forge definitions, workflow script API, peer pairing and link requests, agent-device shim); renamed the forge-routing capability to say what the consumer gets (Get signed-in forge for repository).
- Step 6: check-map.mjs passes (3 consumers, 1 provider, 41 components, 13 outside services, 48 resources, 101 boundaries). With --places from the repository root, all 33,539 tracked files have a place. All 151 evidence paths exist (test -f). Cross-component calls checked: writes to Orchestration's store happen only inside Orchestration once project/ moved there. Other components read projections through its ProjectionStore service, except 11 files that read projection tables with SQL (listed as a cleanup candidate). The relay's account deletion writes other components' rows (cleanup candidate). The relay and the desktop import client-runtime through public subpaths only. The desktop reads apps/server/package.json for the server version at build time.

## Questions no rule settled

The map's `questions` holds 15, each with the choice made and the alternative. The ones that shape the map most:
1. T3 Connect is inside T3 Code at Level 1, not its own provider.
2. Outside MCP agents are a Developer interface, not a consumer.
3. The Client app is a Level 2 component, not only interfaces.
4. Outside services are grouped by kind (Coding agents with the ACP Registry, Code hosting services, Model APIs, Device services), not one per vendor.
5. Updating T3 Code itself is excluded as work on the system; installing agents stays.
6. Agent drivers are a component with variants, not adapters.
7. Direct SQL reads of projections count as going around Orchestration's contract.

## For the reviewer

Look first at the Level 3 split of the Environment server: 17 components in an Effect-services monolith, where every service folder keeps some state. Check whether Agent tools, Voice transcription, Devices and Terminals deserve to be components or are better as parts. Next, look at the outside-service boundaries repeated at Levels 2, 3 and 4, as the format's rule requires: they are the bulk of the 101 boundaries.

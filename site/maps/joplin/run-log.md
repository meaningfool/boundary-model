# Run log: extract-boundaries on Joplin

Skill: extract-boundaries v0.1.0 from /home/user/boundary-model/skills, with use-boundary-model, its map-format.md and boundary-map.schema.json, all read in full before starting.

Repository: /tmp/claude-0/-home-user/cdf782aa-10b7-528c-9e97-39ba0972e579/scratchpad/maps/joplin/repo, branch dev, revision 981e5a3ae7087162e3abccd9823e1acc8e11c389 (checked with git rev-parse HEAD). Blobless clone, 1157 commits since 2026-05-25, 8723 tracked files.

Started 2026-11-26T09:03Z.

## Subagents

This session has no tool that starts a subagent sharing this machine's files: the only session tool available starts a separate cloud session in its own container, which cannot see the repository or the working folder. So I did the reading sweep and the draft myself, in the method's order, and the draft is written by me rather than by a separate writer. The draft step therefore lacks the independence the skill intends; a reviewer should weigh that.

## Step 1: consumers and Level 1 (about 09:05 to 09:15)

Top altitude, read in full myself: README.md up to the contributor list, readme/index.md, readme/apps/index.md, readme/dev/index.md, readme/api/index.md, readme/dev/spec/architecture.md and readme/dev/technical_spec.md. The repository's CLAUDE.md was read as evidence only (it states that SQL belongs in packages/lib/models, which I used as a fact about the code, not as an instruction).

Guides and contracts for users and operators, read in full: readme/apps/sync/index.md, sync/joplin_cloud.md, sync/e2ee.md, web.md, share_notebook.md, publish_note.md, teams.md, email_to_note.md, ai_chat.md, ai_chat_panel.md, ai_mcp.md, ai_semantic_search.md, clipper.md, plugins.md, ocr.md, joplin_server_business.md, mfa.md, server/ldap.md, scan_notebook.md, whiteboard.md, note_history.md, profiles.md, conflict.md, trash.md, to-dos.md, notifications.md, attachments.md, external_links.md, packages/server/README.md, and readme/apps/transcribe/system_architecture.md sections 1 to 3.

Read by headings, because reading them whole would have crowded out the code: readme/apps/terminal.md (758 lines, mostly a command reference), readme/apps/server/saml.md, readme/apps/markdown.md, readme/apps/drawing_tool.md, readme/apps/sync/s3.md, readme/apps/search.md, readme/faq.md, readme/faq_joplin_cloud.md, readme/privacy.md, readme/apps/debugging.md, readme/apps/config_screen.md, readme/apps/import_export.md (the Evernote and Markdown sections in full), and readme/api/references/rest_api.md (introduction, search, item types and events in full, the rest by headings). Not opened: readme/news (107 posts), readme/about/changelog, readme/dev/gsoc and readme/cla/consent_records.

Consumer-facing code searched: packages/server/src/routes/routes.ts and every route file's handlers (api, index, admin), the CLI's command-*.ts list, the desktop app's commands and gui folders, the mobile app's screens, packages/lib/services/rest/routes, packages/lib/services/mcp/McpServer.ts and the AI tool list, the plugin API namespaces (services/plugins/api/Joplin.ts), the web clipper's bridge.js, packages/plugin-repo-cli and packages/generator-joplin.

What the code changed against the documents: Teams and Email to Note are documented for Joplin Cloud and Joplin Server Business but have no code in packages/server (excluded); Joplin Cloud AI's route lives in another repository (outside service); readme/apps/ai_chat_panel.md says conversations are not kept across restarts, but since commit 51560e80 (2026-09-25) they are saved (models/ChatConversation.ts, ChatPanel.tsx), so the map follows the code; the changes page and the api/events endpoint are disabled or no-ops (cleanup candidates).

Decisions: four consumers (Note taker, Plugin developer, Server administrator, Published-note reader) and three providers (Joplin apps, Joplin Server, Plugin repository), with six Level 1 boundaries. The share recipient was merged into the note taker (same goals, a permission attribute). Scripts on the Data API and AI apps on MCP were treated as interfaces of the note taker. Notes in notes-level1.md and open-list.md.

History: 1157 commits since 2026-05-25, exported with git log --no-renames --name-only into history-files.txt; coupling summarised in notes-history.md. The client apps and lib change together; the server changes on its own; inside lib the models change with the synchroniser, AI, note lock and encryption services.

## Round 1, finding Level 2 (about 09:15 to 09:20)

Deciding files read: packages/lib/BaseApplication.ts (service wiring and the sync target registry, lines 700-1000), registry.ts, SyncTargetRegistry.ts, the public methods of Synchronizer.ts, file-api.ts, PluginService.ts, ShareService.ts, RevisionService.ts, AlarmService.ts, OcrService.ts, AiService.ts, EmbeddingIndexer.ts, SearchService.ts, DecryptionWorker.ts, NoteLockKey.ts and NoteLockSession.ts; packages/server/src/models/factory.ts, the cross-model writes of every server model, TaskService.ts, setupTaskService.ts, transcribe/src file list; eslint.config.js and packages/tools/checkLibPaths.ts for enforced seams.

Enforced seams found: almost none. The lint config has no import restrictions between parts; checkLibPaths.ts only forbids relative imports into packages/lib and packages/renderer. The strongest evidence was therefore the registries (SyncTargetRegistry.addClass, InteropService.registerModule, the AI provider and OCR driver variants), who writes which data (a grep of direct SQL showed only SearchEngine and KvStore bypass the models), and the injection of services into BaseItem.

Decisions: Joplin apps opens into 13 components (Note collection, Synchroniser, Encryption, Search engine, Note history, Plugin service, Sharing, AI, OCR, Import and export, Alarms, Note lock, Profiles); Joplin Server opens into 3 (Server store, Task service, Transcribe server); the Plugin repository stays closed. Every part and verdict with its files is in open-list.md.

## Round 2, finding Level 3 (about 09:20 to 09:25)

Read: LockHandler.ts, MigrationHandler.ts, ItemUploader.ts and ResourceFetcher.ts signatures, who writes info.json and the attachment download states, who writes the local sync info (Synchroniser, Encryption, Note lock, MasterKey), DecryptionWorker's key-value records, the plugin reducer's actions and their dispatchers, the AI module's writers of NoteEmbedding and ChatConversation, the note lock classes, LockModel and who calls the smaller server models.

Decisions: Synchroniser opens (Sync engine, Lock handler); Encryption opens (Encryption service, Decryption worker); AI opens (AI chat, Semantic index); Import and export opens (Format registry, Importers, Exporters); Note lock opens (Lock key, Unlock session); Server store opens (Accounts and items, Sync locks). Closed, with the parts tested: Note collection (models change each other's records), Search engine (one class over one index plus parsing libraries), Note history (one class), Plugin service (controllers and service share one state slice; runners relay; plugin API passes calls; repository client is an adapter), Sharing (one store), OCR (one decision-maker plus adapter drivers), Alarms (one service plus OS drivers), Profiles (one module), Task service (one scheduler; tasks run model operations; email sender is an adapter), Transcribe server (API and processor share the job queue; HtrCli is an implementation choice).

## Round 3, deciding Level 4 (about 09:25)

Tested the parts of the 13 Level 3 components. None opens: Sync engine's parts share the sync info and the attachment download states (MigrationHandler writes info.json directly; ResourceFetcher and the sync steps both set Resource local states); Lock handler, Decryption worker, Format registry, Lock key, Unlock session and Sync locks are single classes; Encryption service's other parts are crypto adapters and enable/disable flows; AI chat's providers are adapters and its tools relay; Semantic index's indexer and search share one index and the rest are adapters and a library; Importers and Exporters are each variants of one contract; Accounts and items' models change each other's records. Level 4 is not reached; the deepest level is 3. Details in open-list.md.

## Step 3: inner boundaries (about 09:25 to 09:30)

Read the contract behind every boundary below Level 1 and wrote boundaries.md: interface, contract path, operations grouped into capabilities, resource. Contracts read: models/BaseItem.ts sync functions, EncryptionService methods and e2ee/utils.ts, ShareService.ts and the server's share routes, RevisionService.ts, file-api.ts and file-api-driver-joplinServer.ts with the server's item, batch, lock and session routes, plugin API JoplinData, JoplinAi and JoplinInterop, RepositoryApi.ts, the AI tools and providers, OcrDriverTranscribe.ts, InteropService.ts and the importer and exporter base classes, the note lock classes, syncInfoUtils.ts, setupTaskService.ts, EmailService.ts, utils/stripe.ts, saml.ts, ldapLogin.ts, StorageDriverS3.ts and plugin-repo-cli's search.

## Step 4: draft (about 09:30 to 09:40)

No writer subagent could be started (see Subagents above), so I wrote draft.json myself from the working folder's notes, open-list.md and boundaries.md. The draft had the providers, components, outside services, resources, interfaces, boundaries and places, but empty questions, cleanup candidates and exclusions; those were written during the revision.

## Step 5: revision into map.json (about 09:40 to 09:47)

Changes from the draft: removed "Sign in" as a capability of the synchroniser and sync engine towards Joplin Server, and "Check master password" towards Encryption, as steps; moved the keychain adapter from Encryption to the Note collection, because models/Setting.ts uses it for every secure setting; moved JoplinServerApi.ts to a library place, because Sharing, OCR and the Joplin Cloud AI provider use it too; moved the login and payment adapters from the Joplin Server's parts into the Server store's parts, where their files are placed; fixed the Transcribe proxy route to sit in the Joplin Server API interface; made "Delete user" say both what the admin pages and the users API do; added parts the open list named but the draft omitted (sync scheduler, plugin API, default plugins and blocked versions, share state, chat panel requests, published-note rendering); added 17 questions, 9 cleanup candidates and 15 exclusion lines.

## Step 6: checks (about 09:47 to 09:50)

- Every boundary read as its consumer: providers are components or services named for what they do; look-alikes folded (sign-in and password checks as steps; keep-alives of locks; changedSinceCollection as a step of saving; polling in transcription).
- Every consumer and goal has a boundary, a cleanup candidate or an exclusion: share recipients are the note taker; teams and email-to-note are excluded; settings, translation, diagnostics and app updates are excluded.
- Every part in open-list.md is a component or in its provider's parts.
- Imports between components that reach past their contract were searched (models importing services, services importing each other, routes reading models): listed in the question on cross-contract calls.
- Every evidence path exists (checked each with test -f from the repository root).
- check-map.mjs map.json passes: 4 consumers, 3 providers, 29 components, 15 outside services, 44 resources, 74 boundaries. With --places from the repository root: all 8723 tracked files have a place.

## Questions no rule settled

The 17 entries in map.json's questions. The most consequential: whether Joplin Server and the plugin repository are providers of their own; whether the note collection is one component when its models call the encryption, share and revision services and import synchroniser utilities; and the calls that reach past contracts (the AI and OCR code borrowing the sync target's API client from the registry, the synchroniser checking note lock internals, the raw importer and exporter using note lock and encryption helpers).

## Step 7

Not run, as the caller asked: the map is unreviewed and stays in the working folder as map.json. Nothing was written at the output path.

## Time

Started 09:03 and finished the checks about 09:50 by the container clock, roughly 50 minutes in all. Times per step above are approximate.

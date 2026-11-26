# Open list

## Level 1 decisions (step 1)

Consumers: Note taker, Plugin developer, Server administrator, Published-note reader.

Providers: Joplin apps, Joplin Server, Plugin repository.

Level 1 boundaries:

- Note taker <-> Joplin apps: desktop app, mobile app, web app, terminal app, web clipper, Data API, MCP server, joplin:// links. Scripts and AI apps the note taker connects act for them (Data API, MCP).
- Plugin developer <-> Joplin apps: plugin API (with the plugin generator that scaffolds and packages a plugin for it).
- Plugin developer <-> Plugin repository: publishing a plugin package to npm with the joplin-plugin keyword, which the repository builder picks up.
- Note taker <-> Joplin Server: Joplin Server web pages (account), Joplin website plans page (Joplin Cloud checkout).
- Server administrator <-> Joplin Server: admin pages, users API.
- Published-note reader <-> Joplin Server: published note page.

Why three providers: Joplin Server has its own deployment (Docker image, Dockerfile.server), its own data (PostgreSQL or SQLite with users, items, shares) and consumers of its own (administrators, published-note readers), and users pick it knowingly (Joplin Cloud, a Joplin Server sync target). The plugin repository (github.com/joplin/plugins, built by packages/plugin-repo-cli) has its own deployment and data (manifests.json and .jpl files in its own git repository) and its own consumer (plugin developers); the apps read it (packages/lib/services/plugins/RepositoryApi.ts). The web clipper has no data of its own and needs the desktop app's clipper service, so it is an interface of Joplin apps.

Excluded consumers: Team admin and Email to Note (documented, absent from packages/server). Joplin Cloud AI is an outside service (its route is in another repository).

## Round 1 (finds Level 2): Joplin apps, Joplin Server, Plugin repository

### Joplin apps

Parts and verdicts:

- Desktop, mobile, web and terminal front ends (packages/app-desktop, packages/app-mobile including app-mobile/web, packages/app-cli, packages/lib/components, packages/lib/commands, packages/lib/reducer.ts, services/CommandService.ts, KeymapService.ts, NavService.ts, UndoRedoService.ts, services/style, services/noteList, services/spellChecker, services/contextkey, packages/editor, packages/pdf-viewer). Not components: clients that present the back end's capabilities; they reach the back end through its classes. Part of the interfaces. Evidence: readme/dev/spec/architecture.md ("Front end ... different for each application; Back end: shared by all"), notes-history.md (front ends change with lib).
- Web clipper extension (packages/app-clipper): not a component: a client that captures a page and posts it to the Data API (popup/src/bridge.js `clipperApiExec('POST', 'notes', ...)`); part of the web clipper interface.
- Data API and MCP server (packages/lib/ClipperServer.ts, services/rest/**, services/mcp/**): not components: they pass requests on to the models, the search engine, the revision service and the AI tools (services/rest/routes/*.ts import models/*, SearchEngine, RevisionService; McpServer.ts calls ToolIndex). Part of the Data API and MCP interfaces.
- Note collection (packages/lib/models/**, BaseModel.ts, JoplinDatabase.ts, database*.ts, services/database/**, migrations/**, services/trash/**, services/MigrationService.ts, services/ResourceService.ts, services/KvStore.ts, services/keychain/**, ItemChangeUtils.ts): COMPONENT. Keeps notes, notebooks, tags, attachments and settings in the local database and resource folder; every other part reaches them only through the model classes: of all lib services only SearchEngine and KvStore run SQL themselves (grep of `db().exec|selectAll|selectOne` in services/), and the project rule in CLAUDE.md says SQL is done only in lib/models.
- Synchroniser (Synchronizer.ts, services/synchronizer/**, BaseSyncTarget.ts, SyncTarget*.ts, SyncTargetRegistry.ts, file-api*.ts/js, WebDavApi.ts, DropboxApi.js, onedrive-api*.ts, JoplinServerApi.ts, registry.ts, services/ResourceFetcher.ts, services/conflict/**, services/ReportService.ts): COMPONENT. Alone decides what to upload, download and delete, how to resolve conflicts and when to sync, and holds the sync state (the sync info record of services/synchronizer/syncInfoUtils.ts, which Encryption and Note lock write only through its functions; sync times through the sync functions of models/BaseItem.ts; locks on the target). Reached through Synchronizer.start/cancel and reg.scheduleSync (registry.ts). Sync targets register in SyncTargetRegistry.addClass (BaseApplication.ts lines 809-818, app-mobile/utils/buildStartupTasks.ts): variants of one contract (BaseSyncTarget and the file-api driver), adapters to outside services.
- Encryption (services/e2ee/**, services/DecryptionWorker.ts): COMPONENT. Alone holds the loaded master keys and the public-private key pair and decides how items are encrypted and decrypted; reached through EncryptionService (injected into BaseItem, Synchronizer and ShareService by BaseApplication.ts lines 960-969).
- Search engine (services/search/**): COMPONENT. Alone writes the full-text index tables notes_normalized and notes_fts (only SearchEngine.ts and queryBuilder.ts name them, besides the schema) and decides ranking; reached through SearchEngine.search.
- Note history (services/RevisionService.ts): COMPONENT. Alone decides when a revision is taken and rebuilds old versions from patches; reached through RevisionService (collectRevisions, restoreNoteById, createNoteRevision) and injected into BaseItem.
- Plugin service (services/plugins/**, services/PluginManager.ts): COMPONENT. Alone loads, runs, installs and uninstalls plugins and keeps their install state; reached through PluginService and, for plugins, the plugin API (services/plugins/api/Joplin.ts).
- Sharing (services/share/**, services/joplinServer/**): COMPONENT. Alone holds the share state (shares, share users, invitations in its reducer) and decides which notebooks are shared; reached through ShareService (initialised in BaseApplication.ts line 713, injected into BaseItem and Resource).
- AI (services/ai/**): COMPONENT. Alone writes the embedding index (models/NoteEmbedding.ts is used only by EmbeddingIndexer.ts, SearchService.ts and availability.ts), and alone decides which chat provider is used and whether a remote provider is allowed; reached through AiService, SearchService and ToolIndex.
- OCR (services/ocr/**): COMPONENT. Alone decides which attachments are scanned and writes their OCR text and status; drivers OcrDriverTesseract and OcrDriverTranscribe are variants of OcrDriverBase.
- Import and export (services/interop/**, packages/onenote-converter, packages/htmlpack): COMPONENT. Alone decides how each format maps to notes; importer and exporter modules are variants registered with InteropService (and by plugins through JoplinInterop.registerImportModule / registerExportModule); no state of its own. Reached through InteropService.import / export.
- Alarms (services/AlarmService.ts, AlarmServiceDriverNode.ts, app drivers): COMPONENT. Alone writes alarms (models/Alarm.ts used only by AlarmService) and schedules notifications through platform drivers.
- Note lock (services/noteLock/**): COMPONENT. Alone holds the note lock key and the unlock session and decides lock state; reached through NoteLockService and setNoteLockState.
- Profiles (services/profileConfig/**): COMPONENT. Alone reads and writes the profile list (profiles.json) and splits global and per-profile settings; reached through its exported functions.
- Note renderer (packages/renderer): not a component: a library that turns Markdown or HTML into HTML for the apps and the server, keeping no state.
- Utilities (packages/utils, lib/*Utils.ts, lib/shim*.ts, lib/services/BaseService.ts, lib/services/whiteboard/**): libraries.

Verdict: Joplin apps OPENS (13 components).

### Joplin Server

Parts and verdicts:

- Routes and views (server/src/routes/**, views/**, middleware/**, utils/request/**, utils/views/**, services/MustacheService.ts, public/**): not components: they pass requests on to the models and services (`ctx.joplin.models.*`, `ctx.joplin.services.*`). Part of the interfaces.
- Server store (server/src/models/**, db.ts, migrations/**, models/items/storage/**): COMPONENT. Keeps accounts, items, shares, changes, locks, sessions, notifications, subscriptions and emails in one database; models change each other's records (ItemModel writes userItem, change, share, shareUser and user; ShareModel writes item and userItem; UserModel writes items, shares, sessions, tokens, notifications), so they form one component; routes and services reach it only through models/factory.ts.
- Task service (services/TaskService.ts, utils/setupTaskService.ts, services/UserDeletionService.ts): COMPONENT. Alone decides when the maintenance tasks run and alone writes the task states (models taskState() is called only in TaskService.ts, plus a read in routes/admin/tasks.ts); reached through runTask / enableTask / taskStates.
- Email service (services/EmailService.ts, services/email/**, views/emails/**): not a component: an adapter that sends the emails queued in the store (EmailModel) through SMTP.
- Login adapters (utils/ldapLogin.ts, utils/saml.ts): adapters to outside directory and identity services.
- Stripe integration (utils/stripe.ts, routes/index/stripe.ts, models/SubscriptionModel.ts, StripeEventModel.ts): not a component: a route and an adapter; subscriptions are kept in the store.
- Published-note rendering (utils/joplinUtils.ts, utils/renderMarkdown.ts): part of the published note interface, using the renderer library.
- Transcribe server (packages/transcribe; Dockerfile.transcribe, docker-compose.transcribe.yml; proxy route server/src/routes/api/transcribe.ts): COMPONENT. Its own deployment and job store; alone decides how a handwriting image is transcribed and keeps the jobs; reached only through its HTTP API with a shared secret (readme/apps/transcribe/system_architecture.md, transcribe/src/api/router.ts, auth/authorizationGuard.ts).

Verdict: Joplin Server OPENS (3 components).

### Plugin repository

Parts and verdicts:

- Build command (plugin-repo-cli/index.ts commandBuild, processNpmPackage, lib/searchPlugins.ts, lib/checkIfPluginCanBeAdded.ts, lib/validateUntrustedManifest.ts, lib/overrideUtils.ts, lib/updateReadme.ts): searches npm, validates and copies each plugin into the repository, and writes manifests.json, the README and a commit.
- Release command (commands/updateRelease.ts): uploads the built archives to a release of the same repository.
- Local publish command (index.ts commandPublishPlugin): publishes a plugin to a local registry for testing.

None passes: the build and release commands write the same repository folder and manifests (one store), and the local publish command is a development aid. Verdict: Plugin repository stays CLOSED.

Note on model files: the local database is shared storage. A model class that only one component writes is that component's storage, not part of the Note collection: models/Revision.ts (Note history), models/Alarm.ts (Alarms), models/NoteEmbedding.ts (AI, semantic index), models/MasterKey.ts (Encryption). Revisions and master keys are also saved by the Synchroniser when they arrive from the target, through the same model classes.

## Round 2 (finds Level 3): the 16 Level 2 components

### Note collection

Parts: item models (models/BaseItem.ts, Note.ts, Folder.ts, Tag.ts, NoteTag.ts, Resource.ts, NoteResource.ts, ResourceLocalState.ts, ItemChange.ts, ChatConversation.ts, ChatMessage.ts, Search.ts, SmartFilter.ts, ConflictNoteState.ts, Migration.ts), settings (models/Setting.ts, models/settings/**), database and migrations (JoplinDatabase.ts, database*.ts, services/database/**, migrations/**, services/MigrationService.ts), trash (services/trash/**), attachment bookkeeping (services/ResourceService.ts, ResourceEditWatcher), key-value storage (services/KvStore.ts).

Verdicts: none is a component on its own. The item models change each other's records (Folder.delete deletes notes, Note.save writes ItemChange, Tag and NoteTag write each other, trash/restoreItems.ts and emptyTrash.ts write notes and folders, ResourceService.ts deletes resources and NoteResource rows). Settings, the database and the key-value store are storage. Stays CLOSED.

### Synchroniser

Parts:

- Sync engine (Synchronizer.ts, services/synchronizer/ItemUploader.ts, utils/**, syncInfoUtils.ts, tools.ts, MigrationHandler.ts, migrations/**, services/ResourceFetcher.ts, services/conflict/**, registry.ts scheduling, ReportService.ts): COMPONENT. Alone decides the sync steps (upload, delete, delta, conflict handling, target upgrade, attachment downloads) and holds the sync info and sync times. Inside it, MigrationHandler writes info.json directly (MigrationHandler.ts upgrade, versions 1 and 2) besides syncInfoUtils.uploadSyncInfo, and ResourceFetcher shares the attachment download states with the sync steps (syncDeleteStep.ts and handleConflictAction.ts call Resource.setLocalState): one store, so they are one component.
- Lock handler (services/synchronizer/LockHandler.ts): COMPONENT. Alone writes the sync locks on the target (lock files in the locks folder, or Joplin Server's api/locks through file-api-driver-joplinServer.ts) and decides when a lock is active or expired; the sync engine and the migration step reach it only through acquireLock, releaseLock, locks, startAutoLockRefresh and stopAutoLockRefresh.
- Sync target drivers (file-api.ts, file-api-driver-*.ts/js, SyncTarget*.ts, BaseSyncTarget.ts, WebDavApi.ts, DropboxApi.js, onedrive-api*.ts, JoplinServerApi.ts, SyncTargetAmazonS3.js): not components: adapters to the outside services, variants of the FileApi driver contract.

Verdict: Synchroniser OPENS (Sync engine, Lock handler).

### Encryption

Parts:

- Encryption service (services/e2ee/EncryptionService.ts, crypto.ts, cryptoShared.ts, utils.ts, types.ts, models/MasterKey.ts): COMPONENT. Alone holds the loaded (decrypted) master keys (loadMasterKey, unloadMasterKey) and decides how strings and files are encrypted; reached through its methods (encryptString, decryptString, encryptFile, decryptFile, generateMasterKey, checkMasterKeyPassword, reencryptMasterKey, decryptMasterKeyContent).
- Decryption worker (services/DecryptionWorker.ts): COMPONENT. Alone decrypts downloaded items in the background and alone writes its failure counters and errors in the key-value store (decryptionCounterKey, decryptionErrorKey); reached through scheduleStart, start, decryptionDisabledItems, clearDisabledItem(s).
- Public-private key pairs (services/e2ee/ppk/**): not a component: a library of key-pair functions; the pair itself is kept in the sync info.
- Keychain (services/keychain/**): not a component and not part of Encryption: an adapter that models/Setting.ts uses for every secure setting, so it is placed with the Note collection's settings storage (moved there during the revision).

Verdict: Encryption OPENS (Encryption service, Decryption worker).

### Search engine

Parts: SearchEngine.ts (indexing and querying), queryBuilder.ts, filterParser.ts, gotoAnythingStyleQuery.ts, ftsPhraseRegex.ts, SearchEngineUtils.ts. The index writer and the query side are one class over one index; the others are query-parsing libraries. Stays CLOSED.

### Note history

Parts: RevisionService.ts and its storage models/Revision.ts. One part. Stays CLOSED.

### Plugin service

Parts: PluginService.ts and Plugin.ts (install state), view and menu controllers (ViewController.ts, WebviewController.ts, MenuController.ts, MenuItemController.ts, ToolbarButtonController.ts, EditorPluginHandler.ts), plugin runners (BasePluginRunner.ts and the app runners), plugin API (api/**), repository client (RepositoryApi.ts), default plugins (defaultPlugins/**), blocked versions (refreshBlockedPluginVersions.ts), legacy plugin manager (services/PluginManager.ts).

Verdicts: PluginService, Plugin and the controllers all change the same plugin state (reducer.ts actions PLUGIN_ADD, PLUGIN_VIEW_ADD, PLUGIN_VIEW_PROP_SET, PLUGIN_CONTENT_SCRIPTS_ADD are dispatched from PluginService.ts, Plugin.ts, WebviewController.ts, MenuController.ts, MenuItemController.ts, ToolbarButtonController.ts and app-desktop/app.ts): one store, one component. Runners only host plugin code and relay its calls (utils/executeSandboxCall.ts); the plugin API passes calls on; RepositoryApi is an adapter to the plugin repository. Stays CLOSED.

### Sharing

Parts: ShareService.ts, invitationRespond.ts, reducer.ts. One store (the share state slice), one decision-maker. Stays CLOSED.

### AI

Parts:

- AI chat (AiService.ts, providers/**, aiSettingsTransition.ts, classification.ts, availability.ts, noteChat.ts, tools/**, utils/**): COMPONENT. Alone decides which chat provider answers and whether a remote provider is allowed, and keeps the token usage; reached through AiService.chat, effectiveClassification, invalidateProvider; noteChat.ts builds the chat panel's request and applies edits; tools/** relay note operations for the chat panel and the MCP server.
- Semantic index (EmbeddingIndexer.ts, SearchService.ts, LocalEmbeddingProvider.ts, EmbeddingModelDownloader.ts, chunker.ts, dynamicEsmImport.js, models/NoteEmbedding.ts): COMPONENT. Alone writes the embeddings (NoteEmbedding.saveChunks, deleteByNoteId, clearAll are called only from EmbeddingIndexer.ts) and decides what to index; SearchService reads the same index through NoteEmbedding, so indexer and search are one component; reached through runInBackground, getStatus, search, getEmbeddings.
- Chat providers (providers/OpenAiCompatible.ts, Anthropic.ts, JoplinCloud.ts): not components: adapters to outside chat services, variants of ChatProviderBase.

Verdict: AI OPENS (AI chat, Semantic index).

### OCR

Parts: OcrService.ts (decides which attachments to scan), drivers OcrDriverTesseract.ts and OcrDriverTranscribe.ts (adapters, variants of OcrDriverBase), utils/createAccessiblePdf.ts and filterOcrText.ts (libraries). One decision-maker. Stays CLOSED.

### Import and export

Parts:

- Format registry (services/interop/InteropService.ts, Module.ts, types.ts, utils.ts): COMPONENT. Alone keeps the list of import and export modules, including those plugins register (registerModule), and decides which module handles a request; reached through import, export, modules.
- Importers (InteropService_Importer_*.ts, packages/onenote-converter, xpsToPngPowerShellScript.ts): COMPONENT. Variants of one contract (InteropService_Importer_Base.exec); alone decide how a file format becomes notes, notebooks, tags and attachments.
- Exporters (InteropService_Exporter_*.ts, packages/htmlpack): COMPONENT. Variants of one contract (InteropService_Exporter_Base init, processItem, processResource, close); alone decide how items become files.

Verdict: Import and export OPENS (Format registry, Importers, Exporters).

### Alarms

Parts: AlarmService.ts and its storage models/Alarm.ts; drivers AlarmServiceDriverNode.ts, app-mobile/services/AlarmServiceDriver.android.ts and .ios.ts (adapters to the operating system's notifications). Stays CLOSED.

### Note lock

Parts:

- Lock key (noteLock/NoteLockKey.ts): COMPONENT. Alone creates, resets, re-encrypts and upgrades the note lock key (create, reset, changePassword, upgrade, decrypt) and decides key rules; the key record is stored through the Synchroniser's sync info functions (localSyncInfo, saveLocalSyncInfo), and the comment on reset says other code must rotate it through the unlock session.
- Unlock session (noteLock/NoteLockSession.ts): COMPONENT. Alone holds the decrypted key while the session is unlocked and decides whether unlocking is allowed (rotation and migration guards); reached through unlock, lock, reset, isUnlocked, decryptedKey, setMigrating, isMigrating.
- Lock operations (NoteLockService.ts, NoteLockNote.ts, setNoteLockState.ts, bulkSetNoteLockState.ts, NoteLockKeyMigration.ts, hasLockedNoteWhileSessionLocked.ts, isNoteLockEnabled.ts, noteLockPrompts.ts): not components: they lock, unlock and re-encrypt notes through the Note model with the session's key, relaying crypto to the Encryption service; prompts are UI helpers.

Verdict: Note lock OPENS (Lock key, Unlock session).

### Profiles

Parts: services/profileConfig/index.ts and helpers. One part. Stays CLOSED.

### Server store

Parts:

- Accounts and items (models/ItemModel.ts, ChangeModel/**, UserItemModel.ts, ItemResourceModel.ts, ShareModel.ts, ShareUserModel.ts, UserModel.ts, SessionModel.ts, TokenModel.ts, RecoveryCodeModel.ts, ApplicationModel.ts, ApiClientModel.ts, NotificationModel.ts, EmailModel.ts, SubscriptionModel.ts, StripeEventModel.ts, UserFlagModel.ts, UserDeletionModel.ts, BackupItemModel.ts, KeyValueModel.ts, StorageModel.ts, models/items/storage/**, db.ts, migrations/**): COMPONENT, and not divisible: these models change each other's records (see the Round 1 list).
- Sync locks (models/LockModel.ts): COMPONENT. Alone writes the sync locks (kept in the key-value table under its own per-user key, through keyValue().readThenWrite) and decides lock rules; reached only through acquireLock, releaseLock, allLocks (routes/api/locks.ts).

Verdict: Server store OPENS (Accounts and items, Sync locks).

### Task service

Parts: TaskService.ts, utils/setupTaskService.ts (task list), services/UserDeletionService.ts, models/TaskStateModel.ts and models/EventModel.ts (its storage: task states are written only in TaskService.ts; events only in setupTaskService.ts), services/EmailService.ts (adapter run by the ProcessEmails task). One decision-maker; the tasks run model operations. Stays CLOSED.

### Transcribe server

Parts: API (transcribe/src/api/**), job queue (services/queue/PgBossQueue.ts, SqliteQueue.ts, createQueue.ts), job processor (workers/JobProcessor.ts), handwriting engine call (core/HtrCli.ts), image storage (services/FileStorage.ts). The API creates jobs in the queue and the processor updates them in the same queue (one store); the queue variants are storage; HtrCli runs the local recognition engine (an implementation choice); the API passes requests on. Stays CLOSED.

Round 2 opened: Synchroniser, Encryption, AI, Import and export, Note lock, Server store.

## Round 3 (decides Level 4): the 13 Level 3 components

- Sync engine. Parts: Synchronizer.ts, ItemUploader.ts, MigrationHandler.ts with migrations, ResourceFetcher.ts, syncDeleteStep.ts, handleConflictAction.ts, services/conflict/** (merge library), syncInfoUtils.ts, ReportService.ts, registry.ts. None passes on its own: the sync info is written by MigrationHandler and syncInfoUtils from the sync loop, the attachment download states by ResourceFetcher and the sync steps, sync times by the sync loop through BaseItem; the merge code and ItemUploader are libraries and steps called in-process. CLOSED.
- Lock handler. One class (LockHandler.ts). CLOSED.
- Encryption service. Parts: EncryptionService.ts, crypto.ts and cryptoShared.ts (platform crypto adapters), utils.ts (enable and disable flows writing settings and sync info), models/MasterKey.ts (storage). One holder of loaded keys; the rest are adapters and flows on it. CLOSED.
- Decryption worker. One class. CLOSED.
- AI chat. Parts: AiService.ts, providers (adapters), noteChat.ts, tools/** (relays), settings transition. One decision-maker. CLOSED.
- Semantic index. Parts: EmbeddingIndexer.ts and SearchService.ts (one index), LocalEmbeddingProvider.ts (local runtime adapter), EmbeddingModelDownloader.ts (download adapter), chunker.ts (library). CLOSED.
- Format registry. One class. CLOSED.
- Importers. Variants of one contract. CLOSED.
- Exporters. Variants of one contract. CLOSED.
- Lock key. One class. CLOSED.
- Unlock session. One class. CLOSED.
- Accounts and items. Its parts change each other's records (Round 1 and Round 2 lists). CLOSED.
- Sync locks. One class. CLOSED.

Round 3 opened nothing: Level 4 is decided as not reached. Deepest level: 3.

Revision note: packages/lib/JoplinServerApi.ts, listed above with the Synchroniser, is an adapter shared by the Synchroniser, Sharing, OCR and the Joplin Cloud AI provider; the map places it as a library of the Joplin apps.

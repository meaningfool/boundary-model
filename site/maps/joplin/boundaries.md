# Inner boundaries (step 3)

Each entry: consumer -> provider, interface, the contract's path, its operations grouped into capabilities (with what the consumer gets back), and the resource. Operations left out as steps are named.

## Level 2, inside Joplin apps

### Synchroniser -> Note collection

Interface: model API. Contract: packages/lib/models/BaseItem.ts (itemsThatNeedSync, serializeForSync, unserialize, saveSyncTime, saveSyncDisabled, deleteSyncItem, loadItemByPath, syncItemDefinitions_), Note.ts, Folder.ts, Resource.ts (fullPath, setLocalState).

- List items to upload: itemsThatNeedSync, serializeForSync. Gives the changed notes, notebooks, tags and attachments with their sync form. Observes Note, Notebook, Tag, Attachment. saveSyncTime and saveSyncDisabled are steps of it (the record of what was sent).
- Save downloaded item: unserialize then ItemClass.save. Gives the local item updated. Mutates Note, Notebook, Tag, Attachment.
- Delete item removed on the target: ItemClass.delete with trackDeleted false. Mutates Note, Notebook, Tag, Attachment.

### Synchroniser -> Encryption

Interface: encryption service API. Contract: packages/lib/services/e2ee/EncryptionService.ts (checkMasterKeyPassword), services/e2ee/utils.ts (setupAndEnableEncryption, setupAndDisableEncryption, getMasterPassword), services/e2ee/ppk/ppk.ts (generateKeyPair), models/MasterKey.ts (save of keys received).

- Turn encryption on or off to match the target: setupAndEnableEncryption / setupAndDisableEncryption. Gives the local encryption state matching the target. Mutates Encryption key.
- Create key pair: generateKeyPair. Gives the public-private key pair used to share encrypted notebooks. Produces Encryption key.
- Check master password: checkMasterKeyPassword. Gives whether the password opens the active key. Observes Encryption key.

### Synchroniser -> Sharing

Interface: share service API. Contract: packages/lib/services/share/ShareService.ts (shares, maintenance, checkShareConsistency).

- Refresh shares: maintenance (refreshShares, refreshShareInvitations). Gives the current shares and invitations. Mutates Shared notebook, Share invitation.
- List shares: shares getter, checkShareConsistency. Gives which notebooks are shared and with which keys. Observes Shared notebook.

### Synchroniser -> Note history

Interface: revision service API. Contract: packages/lib/services/RevisionService.ts (deleteUnencryptedHistoryForNote).

- Delete unencrypted history of a note: deleteUnencryptedHistoryForNote. Gives the note's plain-text revisions removed after it was locked on another device. Mutates Revision.

### Synchroniser -> Joplin Server

Interface: Joplin Server API. Contract: packages/lib/file-api-driver-joplinServer.ts and JoplinServerApi.ts (client); packages/server/src/routes/api/items.ts, batch_items.ts, sessions.ts, locks.ts, application_auth.ts (server).

- Sign in: POST api/sessions; GET api/application_auth/:id for sign-in through the browser. Gives a session for the account. Observes Account. Supporting.
- Upload item: PUT api/items/:id/content, PUT api/batch_items. Gives the item stored on the server. Mutates Item.
- Download item: GET api/items/:id/content. Gives the item's content. Observes Item.
- Delete item: DELETE api/items/:id, DELETE api/batch_items. Gives the item removed. Mutates Item.
- List changes: GET api/items/root/delta with a cursor; GET api/items/root:/:children for the first sync. Gives the items changed since the cursor. Observes Item.
- Hold sync lock: POST api/locks, DELETE api/locks/:id, GET api/locks. Gives a lock that keeps other clients from upgrading the target meanwhile. Produces Sync lock.

### Synchroniser -> Dropbox, OneDrive, WebDAV server, S3 storage

Interface per service: Dropbox API, Microsoft Graph files API, WebDAV protocol, S3 API. Contract: packages/lib/file-api.ts (FileApi: list, stat, get, put, multiPut, delete, multiDelete, mkdir, move, delta) and the drivers file-api-driver-dropbox.js, file-api-driver-onedrive.ts, file-api-driver-webdav.js, file-api-driver-amazon-s3.js; credentials in models/settings/builtInMetadata.ts (sync.N.* settings).

- Write sync file: put, multiPut, mkdir, move. Gives the file stored. Mutates Stored file.
- Read sync file: get, stat. Gives the file's content. Observes Stored file.
- List sync files: list, delta. Gives the files changed or present. Observes Stored file.
- Delete sync file: delete, multiDelete. Mutates Stored file.
- Sign in (Dropbox and OneDrive): OAuth flows in DropboxApi.js and onedrive-api.ts. Gives the access token. Observes Stored file... folded into the other capabilities as a step, since the synchroniser only signs in to read and write files.

### Note collection -> Encryption

Interface: encryption service API. Contract: EncryptionService.ts (encryptString, decryptString, encryptFile, decryptFile), injected into BaseItem.encryptionService_ (BaseApplication.ts line 963); calls in models/BaseItem.ts serializeForSync and decryptItem, models/Resource.ts.

- Encrypt item: encryptString, encryptFile with the item's share key or the active key. Gives the encrypted text or file. Produces from Encryption key.
- Decrypt item: decryptString, decryptFile. Gives the plain item or file. Produces from Encryption key.

### Note collection -> Sharing

Interface: share service API. Contract: ShareService.ts shareById, injected into BaseItem.shareService_ and Resource.shareService_ (BaseApplication.ts lines 964-965).

- Look up share of an item: shareById. Gives the share and the key it is encrypted with. Observes Shared notebook.

### Note collection -> Note history

Interface: revision service API. Contract: RevisionService.ts (changedSinceCollection, deleteUnencryptedHistoryForNote), called in models/Note.ts save.

- Delete unencrypted history of a note: deleteUnencryptedHistoryForNote, when a note is locked. Mutates Revision. changedSinceCollection is a step of saving (it decides whether to keep the version before the change).

### Note collection -> IP geolocation service

Interface: IP geolocation API. Contract: packages/lib/geolocation-node.ts (https://ipwho.is), used by models/Note.ts updateGeolocation.

- Look up location: GET ipwho.is. Gives latitude and longitude for a new note. Observes IP location.

### Search engine -> Note collection

Interface: model API. Contract: services/search/SearchEngine.ts uses models/ItemChange.ts (changes since an id), Note.ts (byIds, previews), Resource.ts and NoteResource.ts (OCR text).

- List changes: ItemChange changes since the index's last change id. Gives the notes created, updated and deleted. Observes Change log.
- Read notes: Note.byIds, previews. Gives note titles and bodies to index and show. Observes Note, Attachment.

### Note history -> Note collection

Interface: model API. Contract: RevisionService.ts uses ItemChange.ts, Note.ts, Folder.ts.

- List changes: ItemChange since the last collection. Observes Change log.
- Read note: Note.load. Observes Note.
- Save restored note: Folder.save for "Restored Notes", Note.save. Gives the old version as a new note. Produces Note.

### Plugin service -> Note collection

Interface: in-process Data API. Contract: services/plugins/api/JoplinData.ts (get, post, put, delete, resourcePath, userData*) over services/rest/Api.ts routes (notes, folders, tags, resources, search, revisions).

- Read items: get. Gives notes, notebooks, tags and attachments. Observes Note, Notebook, Tag, Attachment.
- Change items: post, put, delete. Gives the created, updated or deleted item. Mutates Note, Notebook, Tag, Attachment.
- Store plugin data on an item: userDataGet, userDataSet, userDataDelete. Gives plugin-owned values kept on a note or notebook. Mutates Note, Notebook.

### Plugin service -> Import and export

Interface: interop service API. Contract: services/plugins/api/JoplinInterop.ts registerImportModule, registerExportModule -> InteropService.registerModule.

- Register import or export format: registerImportModule, registerExportModule. Gives a new format in the import and export menus. Produces Format module.

### Plugin service -> AI

Interface: AI service API. Contract: services/plugins/api/JoplinAi.ts (chat, search, getEmbeddings, getIndexStatus) -> AiService.chat, SearchService.search, getEmbeddings, EmbeddingIndexer.getPluginStatus.

- Ask the chat model: chat. Gives the model's reply. Produces from Chat model.
- Search notes by meaning: search. Gives notes ranked by meaning. Observes Note.
- Read embeddings: getEmbeddings. Gives note chunks and vectors. Observes Semantic index.
- See index status: getIndexStatus. Observes Semantic index.

### Plugin service -> Plugin repository

Interface: plugin repository files. Contract: services/plugins/RepositoryApi.ts (initialize, search, downloadPlugin, manifests, canBeUpdatedPlugins, pluginCanBeUpdated), refreshBlockedPluginVersions.ts.

- Search plugins: search, manifests. Gives the manifests that match. Observes Plugin release.
- Download plugin: downloadPlugin. Gives the .jpl archive. Observes Plugin release.
- Check for plugin updates: canBeUpdatedPlugins, pluginCanBeUpdated. Gives which installed plugins have a newer release. Observes Plugin release.
- List blocked versions: refreshBlockedPluginVersions. Observes Plugin release.

### Sharing -> Joplin Server

Interface: Joplin Server API. Contract: ShareService.ts calls; server routes api/shares.ts, api/share_users.ts, api/users.ts (public_key).

- Share notebook: POST api/shares (folder). Produces Shared notebook.
- Publish note: POST api/shares (note). Produces Published note.
- Delete share: DELETE api/shares/:id. Mutates Shared notebook, Published note.
- List shares: GET api/shares, GET api/shares/:id. Observes Shared notebook, Published note.
- Invite recipient: POST api/shares/:id/users. Produces Share invitation.
- List recipients: GET api/shares/:id/users. Observes Share invitation.
- Change recipient permissions: PATCH api/share_users/:id (can view, can edit). Mutates Share invitation.
- Remove recipient: DELETE api/share_users/:id. Mutates Share invitation.
- List invitations: GET api/share_users. Observes Share invitation.
- Respond to invitation: PATCH api/share_users/:id status. Mutates Share invitation.
- Get recipient's public key: GET api/users/:id/public_key. Observes Account.
- Not in the corpus's server: GET api/teams/:id/users (team member lookup, Joplin Cloud only).

### Sharing -> Encryption

Interface: encryption service API. Contract: ShareService.ts uses EncryptionService.generateMasterKey, decryptMasterKeyContent; ppk.ts mkReencryptFromPasswordToPublicKey, mkReencryptFromPublicKeyToPassword.

- Create share key: generateMasterKey. Gives the key a shared notebook is encrypted with. Produces Encryption key.
- Re-encrypt key for a recipient or for myself: mkReencryptFromPasswordToPublicKey, mkReencryptFromPublicKeyToPassword. Gives the key readable by the other side. Mutates Encryption key.

### Sharing -> Note collection

Interface: model API. Contract: ShareService.ts uses Folder.ts (save share_id, updateAllShareIds), Note.ts (is_shared), MasterKey.

- Mark items shared: Folder.save with share_id, Note.save with is_shared. Gives notebooks and notes tagged with their share. Mutates Notebook, Note.
- Read notebook: Folder.load. Observes Notebook.

### AI -> Note collection

Interface: model API. Contract: services/ai/tools/global/*.ts (readNote, readNotes, listNotebooks, listTags, createNote, updateNote, deleteNote, manageTags, createNotebook, readImage) and EmbeddingIndexer.ts (ItemChange, Note).

- Read notes: readNote, readNotes, listNotebooks, listTags, readImage. Observes Note, Notebook, Tag, Attachment.
- Change notes: createNote, updateNote, deleteNote (to the trash), manageTags, createNotebook. Mutates Note, Notebook, Tag.
- List changes: ItemChange since the indexer's cursor. Observes Change log.

### AI -> Search engine

Interface: search engine API. Contract: services/ai/tools/global/searchNotes.ts -> SearchEngine.search.

- Search notes: search. Gives notes matching the keywords. Observes Note.

### AI -> OpenAI-compatible chat service, Anthropic API, Joplin Cloud AI

Interfaces: OpenAI chat API (responses and chat/completions), Anthropic messages API, Joplin Cloud AI API (api/ai/chat/completions on the Joplin Cloud account). Contracts: services/ai/providers/OpenAiCompatible.ts, openAiResponses.ts, Anthropic.ts, JoplinCloud.ts; settings ai.* in builtInMetadata.ts.

- Get chat reply: POST of the messages and tools. Gives the reply and token usage. Produces from Chat model.

### AI -> Embedding model downloads

Interface: embedding model release download. Contract: services/ai/EmbeddingModelDownloader.ts (MULTILINGUAL_E5_SMALL.downloadUrl on github.com/joplin/embedding-models releases).

- Download embedding model: GET the archive. Gives the model files. Observes Embedding model.

### OCR -> Note collection

Interface: model API. Contract: services/ocr/OcrService.ts uses Resource.ts (resources needing OCR, save ocr_text, ocr_status, ocr_details).

- List attachments to scan: Resource needToBeOcred queries. Observes Attachment.
- Save recognised text: Resource.save of ocr fields. Mutates Attachment.

### OCR -> Joplin Server

Interface: Joplin Server API. Contract: services/ocr/drivers/OcrDriverTranscribe.ts (POST api/transcribe, GET api/transcribe/:id); server routes/api/transcribe.ts.

- Transcribe handwriting: POST api/transcribe, then GET api/transcribe/:id until done (polling is a step). Gives the text. Produces Transcription job.

### OCR -> OCR language data host

Interface: language data download. Contract: services/ocr/drivers/OcrDriverTesseract.ts (langPath, languageDataPath), setting ocr.languageDataPath; readme/apps/ocr.md names cdn.jsdelivr.net/npm/@tesseract.js-data.

- Download language data: GET of .traineddata.gz files. Observes OCR language data.

### Import and export -> Note collection

Interface: model API. Contract: services/interop/InteropService.ts and modules use Note.ts, Folder.ts, Tag.ts, NoteTag.ts, Resource.ts, BaseItem.ts.

- Read items to export: Note, Folder, Tag, Resource loads. Observes Note, Notebook, Tag, Attachment.
- Save imported items: save of notes, folders, tags, resources. Produces Note, Notebook, Tag, Attachment.

### Import and export -> Note lock

Interface: unlock session API. Contract: InteropService.ts uses NoteLockSession.isUnlocked, decryptedKey and NoteLockNote.isLocked.

- Get unlocked lock key: isUnlocked, decryptedKey. Gives the key to export locked notes readably. Observes Note lock key.

### Alarms -> Note collection

Interface: model API. Contract: services/AlarmService.ts uses Note.load (todo_due, todo_completed) and its own models/Alarm.ts.

- Read to-do: Note.load. Gives the to-do's due date and status. Observes Note.

### Note lock -> Note collection

Interface: model API. Contract: noteLock/setNoteLockState.ts, bulkSetNoteLockState.ts, NoteLockKeyMigration.ts use Note.save with useNoteLock, Note.load, Folder.

- Lock or unlock note: Note.save with the lock state and key. Mutates Note.
- Re-encrypt locked notes: NoteLockKeyMigration. Mutates Note.

### Note lock -> Encryption

Interface: encryption service API. Contract: NoteLockKey.ts and NoteLockService.ts use EncryptionService.generateMasterKey, reencryptMasterKey, decryptMasterKeyContent, masterKeysThatNeedUpgrading, encryptString, decryptString, encryptFile, decryptFile.

- Create lock key: generateMasterKey. Produces Encryption key.
- Open lock key: decryptMasterKeyContent; reencryptMasterKey for a password change or upgrade. Mutates Encryption key.
- Encrypt with lock key: encryptString, encryptFile, decryptString, decryptFile. Produces from Encryption key.

### Note lock -> Synchroniser

Interface: sync info API. Contract: services/synchronizer/syncInfoUtils.ts (localSyncInfo, saveLocalSyncInfo), used by NoteLockKey.ts load and save.

- Store lock key: saveLocalSyncInfo with noteLockKey. Gives the key kept with the sync target's info so other devices get it. Mutates Sync info.
- Read lock key: localSyncInfo().noteLockKey. Observes Sync info.

### Encryption -> Synchroniser

Interface: sync info API. Contract: syncInfoUtils.ts (localSyncInfo, saveLocalSyncInfo, setMasterKeyEnabled, setActiveMasterKeyId, setEncryptionEnabled, setPpk), used by services/e2ee/utils.ts, EncryptionService.ts, ppk.ts.

- Store encryption keys: setMasterKeyEnabled, setActiveMasterKeyId, setEncryptionEnabled, setPpk, saveLocalSyncInfo. Mutates Sync info.
- Read encryption keys: localSyncInfo, masterKeys, ppk. Observes Sync info.

## Level 2, inside Joplin Server

### Task service -> Server store

Interface: server model API. Contract: packages/server/src/models/factory.ts; task list in utils/setupTaskService.ts.

- Delete expired records: token().deleteExpiredTokens, session().deleteExpiredSessions, deleteExpiredAuthCodes, event().deleteOldEvents, backupItem().deleteOldAccountBackups. Mutates Account.
- Process user deletions: UserDeletionService over userDeletion().next/start/end, user().delete, item().delete. Mutates Account, Item.
- Update account sizes and handle oversized accounts: item total sizes, user flags. Mutates Account.
- Compress old changes and process orphaned items and shares: change().compressOldChanges, item().processOrphanedItems, share().updateSharedItems. Mutates Item.
- Send queued emails (with the email server): email().needToBeSent then mark sent. Mutates Email.

### Task service -> Email server

Interface: SMTP. Contract: packages/server/src/services/EmailService.ts (nodemailer createTransport), env MAILER_* in env.ts.

- Send email: sendMail. Gives the email delivered. Produces Email message.

### Server store -> Stripe, SAML identity provider, LDAP directory, S3 storage

- Stripe API (utils/stripe.ts; used in models/UserModel.ts and SubscriptionModel.ts; routes/index/stripe.ts): Cancel or update subscription (mutates Payment subscription), Create checkout session (produces Payment subscription), Receive payment events (webhook into routes/index/stripe.ts, completes the subscription capability). 
- SAML identity provider (utils/saml.ts, samlify; used in UserModel.ts, routes/api/login.ts, routes/index/login.ts): Verify sign-in assertion. Observes Identity.
- LDAP directory (utils/ldapLogin.ts, used in UserModel.ts and SessionModel.ts; env LDAP_*): Check user credentials and read the user's details. Observes Directory user.
- S3 storage (models/items/storage/StorageDriverS3.ts): Write, read and delete item content. Mutates and observes Stored file.

## Level 2, inside Plugin repository (closed, outside service only)

### Plugin repository -> npm registry

Interface: npm registry search and packages. Contract: packages/plugin-repo-cli/lib/searchPlugins.ts, index.ts extractPluginFilesFromPackage (npm install --ignore-scripts).

- Search plugin packages: registry search for keyword joplin-plugin. Observes npm package.
- Fetch plugin package: npm install. Observes npm package.

## Level 3, inside Synchroniser

### Sync engine -> Lock handler

Interface: lock handler API. Contract: packages/lib/services/synchronizer/LockHandler.ts (acquireLock, releaseLock, locks, startAutoLockRefresh, stopAutoLockRefresh).

- Acquire lock: acquireLock (sync or exclusive). Gives the lock or an error if another client holds an exclusive one. Produces Sync lock. startAutoLockRefresh and stopAutoLockRefresh are steps of holding it (a keep-alive).
- Release lock: releaseLock. Mutates Sync lock.
- List locks: locks. Gives active locks on the target. Observes Sync lock.

### Sync engine -> Joplin Server, Dropbox, OneDrive, WebDAV server, S3 storage

Same operations as the Synchroniser's boundaries without the lock calls (items, delta, batch, sessions for Joplin Server; FileApi get, put, list, delta, delete for the others).

### Lock handler -> Joplin Server, Dropbox, OneDrive, WebDAV server, S3 storage

Contract: LockHandler.ts calls FileApi.acquireLock/releaseLock/listLocks when the driver supports locks (file-api-driver-joplinServer.ts: api/locks), otherwise put/list/delete in the locks folder.

- Write lock: acquireLock or put of the lock file. Produces Sync lock (Joplin Server) or Stored file.
- Remove lock: releaseLock or delete. Mutates Sync lock or Stored file.
- List locks: listLocks or list. Observes Sync lock or Stored file.

## Level 3, inside Encryption

### Decryption worker -> Encryption service

Interface: encryption service API. Contract: DecryptionWorker.ts uses EncryptionService (setEncryptionService) through BaseItem.decryptItem and Resource.decrypt, and loadedMasterKeyIds.

- Decrypt item: decryptString / decryptFile through the item models. Produces from Encryption key.
- List loaded keys: loadedMasterKeyIds, masterKeyIsLoaded. Observes Encryption key.

## Level 3, inside AI

### AI chat -> OpenAI-compatible chat service, Anthropic API, Joplin Cloud AI

Same as AI's: Get chat reply.

### Semantic index -> Embedding model downloads

Same as AI's: Download embedding model.

## Level 3, inside Import and export

### Format registry -> Importers

Interface: importer module contract. Contract: services/interop/InteropService_Importer_Base.ts (init, exec), Module.ts (makeImportModule, ImportModule).

- Import file: exec with the source path and options. Gives the import result (notes, notebooks, tags and attachments created, warnings). Produces Note, Notebook, Tag, Attachment.

### Format registry -> Exporters

Interface: exporter module contract. Contract: services/interop/InteropService_Exporter_Base.ts (init, prepareForProcessingItemType, processItem, processResource, close), Module.ts (makeExportModule).

- Export items: init, processItem, processResource, close. Gives the exported file or folder. Produces from Note, Notebook, Tag, Attachment.

## Level 3, inside Note lock

### Unlock session -> Lock key

Interface: lock key API. Contract: noteLock/NoteLockKey.ts (load, decrypt, reset).

- Open lock key: decrypt with the password. Gives the decrypted key for the session. Observes Note lock key.
- Reset lock key: reset (called only through NoteLockSession.reset, per its comment). Gives a new key. Produces Note lock key.

## Level 3, inside Server store

### Accounts and items -> Stripe, SAML identity provider, LDAP directory, S3 storage

Same operations as the Server store's.

Sync locks (models/LockModel.ts) keeps its locks in the key-value table through keyValue().readThenWrite: storage it borrows from Accounts and items, not a capability; no boundary is drawn for it (see questions).

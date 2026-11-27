# Inner boundaries (step 3)

For every boundary below Level 1: the interface, the contract's path, its operations, and the capabilities and resources they give. Operations that are steps of another (keep-alives, acknowledgements, retries, clean-ups, previews) are folded into the capability they serve.

## Level 2 (inside Cloudflare OS)

### Kernel <-> Gatekeepers
Interface: gatekeeper contract (service bindings GATEKEEPER_<NAME> and Durable Object facets). Contract: packages/workshop-shared/src/gatekeeper.ts (GatekeeperVendor, GatekeeperUser, GatekeeperConnectCallback, Gatekeeper<Session>, ApprovalQueue, ObservationAuthorizer, HookController, HookInitiator); registry packages/workshop-backend/src/auth/auth-vendors.ts.

Operations: GatekeeperVendor.describe, getSupportedResources, getTypeScriptTypes, connectAccount; GatekeeperConnectCallback.complete, reconnectComplete, credentialsExpired, credentialsRestored (sent back by the gatekeeper: they complete connecting); GatekeeperUser.describe, getSupportedResources, getGatekeeperClassFor, startResourceConfigurator, revoke, reconnect, commitReconnect, getAuthenticatedEmail, getVerifier, ensureResources (and startAppUi for apps, saveFile, createAccount for auto-provisioned vendors: workshop-backend/AGENTS.md); Gatekeeper.describe, getTypeScriptTypes, getAutoApprovableActions, startSession, addObserver, removeObserver, applyAction, rejectAction, revertAction; ApprovalQueue.submitAction, authorizeObservation, bindHook, getFetcher (sent by the gatekeeper while a session runs: they report its reads and writes); HookController.enable, disable; HookInitiator.startHook (sent by the gatekeeper: delivers an event).

Capabilities and resources (Gatekeepers keeps Connector, Connected account, Connection, Action, Hook, Scheduled task, Context collection):
- List connectors: describe + getSupportedResources + getTypeScriptTypes; observes Connector.
- Connect account: connectAccount, completed by complete() (and createAccount for an auto-provisioned vendor); produces Connected account.
- Reconnect account: reconnect / ensureResources, completed by reconnectComplete and commitReconnect; credentialsExpired / credentialsRestored report the account's state; mutates Connected account.
- Disconnect account: revoke; mutates Connected account.
- Read sign-in email: getAuthenticatedEmail; observes Connected account.
- Choose a resource: startResourceConfigurator; observes Connected account (gives a resource URL picked in the account).
- Grant a resource: getGatekeeperClassFor (a facet class the workspace installs); produces Connection.
- Use a granted resource: startSession; its reads come back through authorizeObservation and its writes through submitAction; observes Connection, produces Action.
- Change action status: applyAction, rejectAction, revertAction; mutates Action.
- Admit an observer: addObserver, removeObserver (getVerifier gives the user's token for it); mutates Connection.
- List auto-approvable action kinds: getAutoApprovableActions; observes Connection.
- Change hook status: HookController.enable, disable; deliveries come back through HookInitiator.startHook; mutates Hook.
- Open management app: startAppUi; observes Connected account (Context collection, Scheduled task through it).
- Save file to account: GatekeeperUser.saveFile (the Workshop passes a gadget export straight to the account, api.ts saveFile); writes a new file in the outside service through the account and mints no connection; observes Connected account.

### Kernel <-> AI model providers
Interface: model provider APIs (packages/workshop-backend/src/ai-models.ts: api.anthropic.com, api.openai.com, generativelanguage.googleapis.com, Workers AI, gateway.ai.cloudflare.com; ai-gateway.ts reads AI Gateway logs; WORKERS_AI binding). Operations: model completion requests (pi-ai getModel/invoke), gateway log reads for cost, Workers AI toMarkdown (web-fetch.ts).
- Run model request; produces AI model output: acts produces on AI model.
- Read request cost; observes Gateway request log.
- Convert document to Markdown; produces on AI model (Workers AI).

### Kernel <-> Cloudflare API
Interface: Cloudflare API (api.cloudflare.com/client/v4; ai-gateway-billing/cloudflare/account-service.ts, connection-service.ts). Operations: list accounts, read AI Gateway credit balance.
- List Cloudflare accounts; observes Cloudflare account.
- Read credit balance; observes Cloudflare account.

### Kernel <-> Notification service
Interface: notification service API (notification-service.ts, signed POSTs to NOTIFICATION_SERVICE_URL; docs/notifications.md). Operations: register a device subscription, publish a notification.
- Register device; produces Device subscription.
- Send push notification; reacts on Device subscription.

### Kernel <-> Deploy service
Interface: update check URL (deployment-updates.ts fetchLatestRelease, CLOUDFLARE_OS_DEPLOYMENT). Operation: ask for the newest release.
- Check for newer release; observes Release.

### Kernel <-> Cloudflare Access
Interface: Access identity tokens, verified only (access.ts verifyCfAccessJwt; CF_ACCESS_AUD, CF_ACCESS_ISS). Operation: verify the cf-access-jwt-assertion.
- Verify Access sign-in; observes Access session.

### Kernel <-> Browser Rendering
Interface: Browser Rendering binding (BROWSER; browser-export.ts uses @cloudflare/puppeteer launch). Operation: launch a browser, load the export page, print.
- Render gadget as PDF; produces on Browser session.

### Kernel <-> Public web
Interface: outbound HTTP fetch, strictly public (global_fetch_strictly_public; fetch-loopback.ts, web-fetch.ts; docs/unified-fetch.md). Operation: GET/HEAD a URL.
- Fetch web page; observes Web page.

### Gatekeepers <-> GitHub
Interface: GitHub OAuth, REST and git APIs, and repository webhooks (gatekeeper-github/src/github-api.ts GitHubApi, git-commits.ts, github-hooks.ts, github.ts webhook route; README "Setting Up GitHub OAuth Credentials", "Event hooks").
- Authorize GitHub account: OAuth code exchange and refresh; observes GitHub account (verified email, scopes).
- Read repository data: issues, pull requests, files, CI; observes GitHub repository.
- Change repository data: push, comment, review, merge, open issues; mutates GitHub repository.
- Register repository webhook; produces Repository webhook; GitHub's deliveries come back through it.

### Gatekeepers <-> MCP servers
Interface: Model Context Protocol over HTTP with OAuth discovery (mcp-shared/src/client.ts McpClient, oauth.ts; gatekeeper-mcp/README.md).
- Authorize MCP server; observes MCP server.
- List MCP tools; observes MCP server.
- Call MCP tool; mutates or observes MCP server (read-only tools observe).

### Gatekeepers <-> MCP server portal
Interface: Model Context Protocol through the organization's portal URL (gatekeeper-mcp-portal/src/portal.ts, config.ts; README).
- Authorize portal; observes MCP server.
- List portal servers and tools; observes MCP server.
- Call MCP tool; observes or mutates MCP server.

### Gatekeepers <-> Cloudflare Artifacts
Interface: Artifacts binding (gatekeeper-context/src/artifact-sync.ts; AGENTS.md "Losing write access revokes the git mirror tokens"; scripts/release/manifest-lib.ts: closed beta, dropped from customer manifests).
- Mirror collection to git repository: read a repository's commit tree into a collection, mint and revoke tokens; observes and mutates Git repository.

## Level 3 (inside the Kernel and the Gatekeepers)

### Workspace <-> User account
Interface: user account RPC (UserDurableObject stub methods, packages/workshop-backend/src/user.ts). Operations called by overseer.ts and observer-ledger.ts: whoami, whoamiIfExists, getChatContext, updateTitle, setWorkspaceLastActive, syncWorkspaceOutputs, workspaceRemoved, deleteWorkspace, recordSharedWorkspaceOpen, updateSharedWorkspaceRole, forgetSharedWorkspace, messageArrived, applyReadHorizon, setChatNotificationsEnabled, getGatekeeperClassFor, createResourceGatekeeper, getSingletonGatekeeperClass, getVerifier, listProvidedAccounts, describeConnectedAccount, listGatekeeperVendors, listModels, listBlueprints, listLibraryBlueprints, updateBlueprint, deleteBlueprint, listWorkspaces.
- Look up user profile: whoami, whoamiIfExists; observes Account.
- Resolve chat model: getChatContext (model, credentials and billing route for a turn); observes AI model, mutates AI usage.
- Record workspace for its owner: updateTitle, setWorkspaceLastActive, syncWorkspaceOutputs, workspaceRemoved, deleteWorkspace; mutates Workspace entry.
- Record shared workspace for a collaborator: recordSharedWorkspaceOpen, updateSharedWorkspaceRole, forgetSharedWorkspace; mutates Workspace entry.
- Deliver chat activity: messageArrived, applyReadHorizon, setChatNotificationsEnabled; mutates Unread state, reacts on Unread state (push).
- Mint gatekeeper from a connected account: getGatekeeperClassFor, createResourceGatekeeper, getSingletonGatekeeperClass (the account checks #assertResourceEnabled first); gives a facet class the workspace installs as a connection; observes Connected account.
- List a user's connected accounts: listProvidedAccounts, describeConnectedAccount, getVerifier, listGatekeeperVendors; observes Connected account.
- List the user's models: listModels; observes AI model.
- Manage the owner's blueprints: listBlueprints, listLibraryBlueprints, updateBlueprint, deleteBlueprint; mutates Blueprint entry.

### User account <-> Workspace
Interface: workspace RPC (OverseerDurableObject.getOutputsForOwnerBackfill, overseer.ts; called from user.ts listOutputs).
- List workspace outputs; observes Gadget.

### Workspace <-> User directory, User account <-> User directory
Interface: directory RPC (UserDirectoryDurableObject, user-directory.ts; docs/admin-access.md "Feeds").
- Workspace: List workspace in directory (syncWorkspace), Remove workspace from directory (removeWorkspace); mutates Directory entry.
- User account: List user in directory (syncUser); mutates Directory entry.

### Admin settings <-> User directory
Interface: directory RPC. Operations: listUsers, listWorkspaces, workspaceListing, removeWorkspace (removal of a stale entry found on inspection: a clean-up step of Inspect).
- List users; observes Directory entry.
- List workspaces; observes Directory entry.

### Admin settings <-> Admin audit log; Workspace <-> Admin audit log; User account <-> Admin audit log
Interface: audit log RPC (AdminAuditDurableObject.append, list, stats; admin-audit.ts; admin-view.ts adminViewCall).
- Admin settings: Record admin action (append, before a setting takes effect), List audit records (list), Get audit statistics (stats); produces / observes Audit record.
- Workspace and User account: Record admin action (append, before an admin view's read leaves the server, or before an admin write takes effect); produces Audit record.

### Admin settings <-> Workspace
Interface: workspace admin RPC (OverseerDurableObject.openForAdmin, applyAdminWrite; reached only over the Durable Object binding, REVIEW.md).
- Inspect workspace: openForAdmin, then AdminWorkspaceView (describe, listChats, getChatState, listChatAttachments, listActions, listFiles, getCommitLog, listFilesAtCommit, listChangedPaths, listPendingChanges, listGatekeepers, listObservers, listObserverRequirements, listShareLinks, listAutoApprovals, listBlueprints, getDiagnostics, api.ts); observes Workspace, Chat, Gadget, Connection, Action.
- Change workspace for an admin: applyAdminWrite (stop an agent, restart the workspace; admin-writes.ts); mutates Workspace, Chat.

### Admin settings <-> User account
Interface: account admin RPC (UserDurableObject.openForAdmin, then AdminUserView: describe, listWorkspaces, listConnectedAccounts, listModels, listSessions, listBlueprints, getDiagnostics; admin-user-view.ts).
- Inspect account; observes Account, Connected account, Workspace entry.

### Admin settings <-> AI model providers
Interface: model provider APIs (admin-settings.ts testGatewayProvider, testGatewayModel, testNewGatewayModel via ai-invoke.ts).
- Run model request (one test request); produces on AI model.

### Admin settings <-> Deploy service
- Check for newer release (checkForUpdates, fetchLatestRelease); observes Release.

### User account <-> Notification service
- Register device (registerNotificationDevice); produces Device subscription.
- Send push notification (publishNotification, outbound alert queue); reacts on Device subscription.

### Workspace <-> AI model providers, Workspace <-> Public web, Workspace <-> Browser Rendering, Workspace <-> Cloudflare API
Same contracts as at Level 2: the agent's turns and gadget model bindings (ai-models.ts, ai-invoke.ts), fetches through the fetch gate (fetch-loopback.ts, web-fetch.ts), gadget PDF export (browser-export.ts), the billing route of a turn (connection-service.ts resolveConnection).

### User account <-> Connected account
Interface: gatekeeper account contract (GatekeeperVendor.connectAccount, GatekeeperUser, GatekeeperConnectCallback; gatekeeper.ts; user.ts connectAccount, openConnectFlow, putConnectedAccount, reconnectAccount, disconnectAccount, getGatekeeperClassFor, startResourceConfigurator, startAccountAppUi, saveFile, provisionAmbientAccount, ensureAccountResources).
- Connect account (connectAccount, complete; createAccount for auto-provisioned); produces Connected account.
- Reconnect account (reconnect, ensureResources, reconnectComplete, commitReconnect); mutates Connected account.
- Disconnect account (revoke); mutates Connected account.
- Read sign-in email (getAuthenticatedEmail); observes Connected account.
- Choose a resource (startResourceConfigurator); observes Connected account.
- Grant a resource (getGatekeeperClassFor); produces Connection.
- Get account verifier (getVerifier); observes Connected account.
- Open management app (startAppUi); observes Connected account.
- Save file to account (saveFile); observes Connected account (writes the file in the outside service).

### Workspace <-> Resource gatekeeper
Interface: resource gatekeeper contract (Gatekeeper<Session> with the agent-facing session types in packages/gatekeeper-*/src/*types.d.ts; ApprovalQueue and ObservationAuthorizer as the facet's way back; ApprovalQueueImpl in overseer.ts).
- Describe resource (describe, getTypeScriptTypes); observes Connection.
- Use a granted resource (startSession; authorizeObservation and submitAction come back); observes Connection, produces Action.
- Change action status (applyAction, rejectAction, revertAction); mutates Action.
- Admit an observer (addObserver, removeObserver); mutates Connection.
- List auto-approvable action kinds (getAutoApprovableActions); observes Connection.

### Workspace <-> Event source
Interface: hook contract (HookController.enable, disable; HookInitiator.startHook comes back; ApprovalQueue.bindHook registers the hook; gatekeeper.ts lines on hooks; GatekeeperHookLoopback in overseer.ts).
- Change hook status (enable, disable); mutates Hook. Event deliveries come back through startHook and travel inside.

### Resource gatekeeper <-> Connected account
Interface: the variant's account methods (GitHub: UserAccount.getAccessToken, reportTokenRejected, checkSubresourceAccess, getScopes in gatekeeper-github/src/github.ts and github-api.ts; MCP: McpAccountBase in mcp-shared/src/account.ts).
- Get access token (getAccessToken; reportTokenRejected is the retry step after a refusal); observes Connected account.
- Check access to a subresource (checkSubresourceAccess); observes Connected account.

### Resource gatekeeper <-> Event source
Interface: schedule driver methods (gatekeeper-scheduler/src/scheduler.ts ScheduleSessionImpl.list calls ScheduleDriver.listWorkspace).
- List scheduled tasks for a workspace; observes Scheduled task.

### Connected account <-> Event source
Interface: schedule driver methods (scheduler.ts ScheduleManagementApi calls ScheduleDriver.listAccount); GitHub's UserAccount calls GitHubHookDriver.reconnected and revoke, which are steps of reconnecting and disconnecting.
- List the account's scheduled tasks; observes Scheduled task.

### Connected account <-> Context collections
Interface: Context Library management API (ContextApi in gatekeeper-context/src/context-types.ts, implemented by ContextApiImpl in context-api.ts over the collection, library and registry objects).
- Create collection (createContextCollection); produces Context collection.
- List library (listEnabledContextCollections, getViewerInfo); observes Context collection.
- Edit collection content (putContextDocument, createContextSkill, deleteContextDocument, deleteContextSkill, deleteContextDocumentTree, moveContextDocument, moveContextSkill, renameContextSkill, updateContextCollection); mutates Context collection.
- Read collection content (getContextCollectionMetadata, listContextDocuments, getContextDocument); observes Context collection.
- Share collection (getContextCollectionPermissions, getContextCollectionSharing, shareContextCollection, setContextCollectionMemberRole, removeContextCollectionMember, leaveContextCollection, setContextCollectionEveryoneCanView); mutates Context collection.
- Sync collection from git (syncContextCollectionArtifactSource, createContextCollectionGitToken, listContextCollectionGitTokens, revokeContextCollectionGitToken); mutates Context collection.
- Delete collection (deleteContextCollection); mutates Context collection.

### Resource gatekeeper <-> Context collections
Interface: Context Library agent session (ContextLibrary in context-types.ts: search, list, read; LibraryReadSession in library-read.ts).
- Search collections; observes Context collection.
- List collection documents; observes Context collection.
- Read document; observes Context collection.

### Context collections <-> Cloudflare Artifacts
- Mirror collection to git repository; observes and mutates Git repository.

### Connected account <-> GitHub, Resource gatekeeper <-> GitHub, Event source <-> GitHub
Same interface as Gatekeepers <-> GitHub: the account authorizes (OAuth) and checks access; the resource gatekeeper reads and changes repository data; the event source registers webhooks and receives deliveries.

### Connected account <-> MCP servers / MCP server portal, Resource gatekeeper <-> MCP servers / MCP server portal
The account runs the OAuth discovery chain; the resource gatekeeper lists and calls tools.

## Level 4 (inside the Workspace and Context collections)

### Workspace host <-> Agent
Interface: agent hooks (runAgent(hooks, ...) and the AgentHooks interface in packages/workshop-backend/src/agent.ts).
- Run agent turn (runAgent; the agent reads and writes the chat through AgentHooks: loadChatHistory, addChatMessages, commitAgentStep, executeCodeMode, createGadget, requestConnection, createExternalResource, ...); mutates Chat, Gadget.

### Workspace host <-> Sharing
Interface: sharing manager (SharingManager in packages/workshop-backend/src/sharing.ts).
- Get effective access (getEffectiveAccess, computeEffectiveAccess, isCollaborator, getCreatorProfile); observes Collaborator.
- Add collaborator (addCollaborator); produces Collaborator.
- Remove collaborator (removeCollaborator, previewRemoveCollaborator as its preview step); mutates Collaborator.
- List collaborators (listCollaborators); observes Collaborator.
- Create share link (createShareLink, newShareLinkKey for another copy); produces Share link.
- Change share link (updateShareLink, revokeShareLink, previewRevokeShareLink as its preview); mutates Share link.
- List share links (listShareLinkRecords); observes Share link.
- Redeem share link (redeemShareKey); produces Collaborator.
- Find who share links stop reaching (computeAffectedByOwnerInvitesOnly): step of turning share links off; folded into Change share link.

### Agent <-> AI model providers, Agent <-> Public web
- Run model request (pi-ai through ai-invoke.ts, ai-models.ts); produces on AI model.
- Fetch web page (webFetch tool, web-fetch.ts); observes Web page.

### Workspace host <-> AI model providers, Public web, Browser Rendering, Cloudflare API
Gadget model bindings, fetches through the fetch gate, PDF export, and a turn's billing route, as at Level 3.

### Collection <-> Collection library
Interface: library methods (UserLibraryDurableObject: addSharedCollection, forgetCollection, removeOwnedCollection; called from context-collection.ts).
- Add collection to a library (addSharedCollection); mutates Library entry.
- Remove collection from a library (forgetCollection, removeOwnedCollection); mutates Library entry.

### Collection <-> Public collection registry
Interface: registry methods (LibraryRegistryDurableObject: syncPublic, removePublic; called from context-collection.ts).
- Publish public collection (syncPublic); mutates Public collection entry.
- Withdraw public collection (removePublic); mutates Public collection entry.

### Collection <-> Cloudflare Artifacts
- Mirror collection to git repository (syncArtifactSource, createGitToken, revokeGitToken); observes and mutates Git repository.

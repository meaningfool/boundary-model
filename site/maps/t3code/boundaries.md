# Step 3: inner boundaries (below Level 1)

Each entry: consumer -> provider | interface | contract path | operations -> capabilities (mode resource). Operations a consumer would not call on their own (acknowledgements, health checks, retries, clean-ups) are noted as steps.

## Level 2 (inside T3 Code)

### Client app -> Environment server | environment API
Contract: packages/contracts/src/rpc.ts (WS_METHODS, WsRpcGroup), packages/contracts/src/orchestrationV2.ts (ORCHESTRATION_V2_WS_METHODS), packages/contracts/src/environmentHttp.ts (EnvironmentHttpApi), packages/contracts/src/guestShare.ts and guestStream.ts with apps/server/src/guest/http.ts. Authorized per call in apps/server/src/auth/RpcAuthorization.ts (scopes in packages/contracts/src/clientRpcPermissions.ts).
- Run threads (core): orchestration.launchThread -> Launch thread (produces Thread); orchestration.dispatchCommand (thread.*, message.dispatch, run.interrupt, thread.settle/snooze/archive/fork/...) -> Dispatch thread command (mutates Thread); subscribeShell, subscribeThread, subscribeCommandOutput, subscribePromptSuggestion, GET /api/orchestration/* -> Follow threads (observes Thread); getTurnDiff, getFullThreadDiff, review.getDiffPreview/getBranchCommits -> Read diffs (observes Thread); searchThreads/searchThread/getOlderSettledThreads -> Search threads (observes Thread); secrets.answerRequest, agentFeedback.answerRequest (plus user-input commands) -> Answer agent request (mutates Agent request); agentSessions.scan/import -> Import agent sessions (produces Thread). Steps: attachments.createUploadUrl/persistChatAttachments (part of sending), assets.createUrl (part of following).
- Manage projects: projects.createNew/createFromThread/mutate, projectClone.start/cancel/retry -> Add or change project (produces/mutates Project); projects.listEntries/readFile/searchContents/searchEntries -> Browse project files (observes Project); projects.writeFile -> Write project file (mutates Project). Step: filesystem.browse (picking a folder).
- Work with Git: vcs.listRefs/createRef/switchRef/init/pull, git.runStackedAction -> Change branches and commit (mutates Repository); vcs.createWorktree/removeWorktree -> Create or remove worktree (produces/mutates Worktree); subscribeVcsStatus/subscribeVcsBranch -> Follow repository status (observes Repository).
- Work with code hosts: pullRequests.list/detail/preview/checks/activity/... -> Read pull requests (observes Pull request); pullRequests.update/comment/submitReview/runAction/setLabels/requestReviewers/setFilesViewed -> Change pull request (mutates Pull request); issues.list/detail/comments -> Read issues (observes Issue); issues.create/comment/update/setState/react -> Create or change issue (produces/mutates Issue); sourceControl.lookupRepository/cloneRepository/publishRepository -> Clone or publish repository (produces Repository); issueTrackers.connect/bindProject, sourceControl.signInStart/Wait -> Connect code host or tracker (mutates Environment).
- Use machine tools: terminal.open/attach/write/resize/clear/close -> Run terminal (produces/mutates Terminal); preview.open/resize/adjust/close/list -> Use browser tab (mutates Browser tab); device.open/close/action/list/configure -> Use device (mutates Device).
- Set up agents: provider.auth.start/respond/complete/cancel/logout, provider.install.start/cancel/remove, server.refreshProviders/updateProvider, server.*AcpRegistry* -> Set up provider (mutates Provider instance); server.getConfig/subscribeServerConfig -> List providers and models (observes Provider instance).
- Automate work: scheduledTasks.upsert/setEnabled/delete/runNow/rotateWebhookToken -> Change scheduled task (produces/mutates Scheduled task); scheduledTasks.subscribe/listWebhookDeliveries -> List scheduled tasks (observes Scheduled task); workflows.answer/resume/cancel -> Steer workflow run (mutates Workflow run); workflows.subscribe/get/counts -> Follow workflow runs (observes Workflow run); workflows.getDefinition/saveDefinition/deleteDefinition -> Edit workflow (mutates Workflow).
- Manage access: POST /api/auth/pairing-token, /api/auth/pairing-links/revoke, /api/auth/clients/revoke*, /api/auth/connect-devices/approve|revoke, GET /api/auth/session -> Pair, approve or revoke access (produces/mutates Access grant); /api/connect/link-proof|relay-config|link-state|unlink|preferences -> Link to T3 Connect (produces/mutates T3 Connect link); peerLinks.link/unlink/list/pairLink/pairClient/answerRequest -> Link another environment (produces/mutates Environment link); peerLinks.subscribeThread/threadHistoryPage -> Read linked thread (observes Thread); guestShare.create (+ thread.guest-share.* commands) -> Share thread with guest (produces/mutates Guest link). Steps: /api/auth/websocket-ticket, /oauth/token (sign-in mechanics).
- Configure environment: server.getSettings/updateSettings, server.upsertKeybinding/removeKeybinding -> Change environment settings (mutates Environment); server.getUsageSummary/refreshUsageRates -> Read usage (observes Usage).
- Transcribe voice: /api/voice/models*, /api/voice/acceleration -> Manage speech models (mutates Speech model); /api/voice/transcribe, /api/voice/cloud/:provider/transcribe -> Transcribe audio (produces Speech model output; modelled as produces on Speech model).
- Serve guests: guest routes redeem/stream/history/item (apps/server/src/guest/http.ts) -> Open shared thread (observes Thread); guest submit -> Submit guest message (produces Guest message).
- Excluded from capabilities: server.updateServer*, server.commitDesktopUpdate, server.getNpmRelease (updating the system itself), server.runStorageCleanup/reclaimDatabaseSpace (clean-up), server.getTraceDiagnostics/getProcessDiagnostics/checkOtlpEndpoint (diagnostics), server.reportClientActivity (telemetry).

### Client app -> T3 Connect relay | relay API
Contract: packages/contracts/src/relay.ts RelayClientGroup, RelayTokenGroup, RelayDpopClientGroup, RelayMobileGroup; client calls in packages/client-runtime/src/relay/*.
- Reach linked environments (core): GET /v1/environments, POST getEnvironmentStatus -> List linked environments (observes T3 Connect link); POST connectEnvironment, exchangeDpopAccessToken -> Connect to linked environment (observes T3 Connect link; gives endpoint and one-time credential); createEnvironmentLinkChallenge + linkEnvironment -> Link environment (produces T3 Connect link); unlinkEnvironment, releaseEnvironmentTunnel -> Unlink environment (mutates T3 Connect link).
- Raise machine limit: getT3ChatLink, createT3ChatLinkRequest, unlinkT3Chat -> Link T3 Chat (mutates T3 Connect account).
- Register for notifications: registerDevice, registerLiveActivity, unregisterDevice, listDevices -> Register phone for notifications (produces/mutates Notification device); agentActivitySnapshot -> Read agent activity (observes Agent activity).

### Client app -> Desktop shell | desktop bridge
Contract: packages/contracts/src/ipc.ts DesktopBridge and DesktopPreviewBridge; apps/desktop/src/preload.ts, apps/desktop/src/ipc/methods/*.
- Run environments on this computer (core): setLocalEnvironmentEnabled, getLocalEnvironmentBootstraps, setServerExposureMode, setTailscaleServeEnabled, getAdvertisedEndpoints, WSL methods -> Run local environment (mutates Environment); ensureSshEnvironment, disconnectSshEnvironment, discoverSshHosts, resolveSshHost -> Run environment over SSH (produces/mutates Environment).
- Browse in the desktop: DesktopPreviewBridge createTab/navigate/... -> Use desktop browser tab (mutates Browser tab); browser import -> Import browser profile (produces Browser profile).
- Capture windows: setupSnapShot, listPendingSnapShots, readSnapShot, acknowledgeSnapShot -> Capture window (produces SnapShot).
- Keep client data: getConnectionCatalog/setConnectionCatalog, getClientSettings/setClientSettings -> Store saved environments (mutates Environment connection).
- Excluded: update methods (updating the app itself), window/menu/theme/paste/permission methods (mechanics), pickFolder (step).

### Desktop shell -> Environment server | desktop launch contract
Contract: packages/contracts/src/desktopBootstrap.ts DesktopBackendBootstrap; apps/desktop/src/backend/DesktopBackendManager.ts.
- Run the local environment (core): bootstrap payload on spawn + readiness proof -> Start local environment server (produces Environment). Stopping is a process signal with no contract operation.

### Environment server -> Desktop shell | desktop browser channel
Contract: packages/contracts/src/desktopBrowser.ts DesktopBrowserCommand / DesktopBrowserEvent; apps/server/src/preview/DesktopBrowserChannel.ts, apps/desktop/src/preview/CdpRelay.ts.
- Drive desktop browser tabs (core): commands cdp, pointer, turn, release; events attached, detached, cdp, loadFailed, shown -> Drive browser tab (mutates Browser tab).

### Environment server -> T3 Connect relay | relay API
Contract: packages/contracts/src/relay.ts RelayServerGroup; apps/server/src/cloud/CloudLink.ts, relay/AgentAwarenessRelay.ts, relay/HeldHooksWaker.ts.
- Keep the machine reachable (core): registerManagedEndpointRecovery, recoverManagedEndpoint -> Recover managed tunnel (mutates Managed tunnel); updateLinkPreferences, updateLiveActivityPreference -> Update link preferences (mutates T3 Connect link).
- Publish agent activity: publishAgentActivity -> Publish agent activity (produces Agent activity).
- Collect held webhooks: wakeHeldHooks -> Release held webhooks (mutates Held webhook).

### T3 Connect relay -> Environment server | relay callback API
Contract: packages/contracts/src/environmentHttp.ts EnvironmentConnectHttpApi (POST /api/t3-connect/mint-credential, /api/t3-connect/health) and EnvironmentWebhooksHttpApi (WEBHOOK_PATH /api/hooks/:hookId/:token); infra/relay/src/environments/EnvironmentConnector.ts, hooks/HookForwarder.ts.
- Admit relayed clients (core): t3MintCredential -> Mint client credential (produces Access grant). Step: health (status shown to clients is part of listing linked environments).
- Deliver webhooks: webhookPost/Put/Patch/Get forwarded -> Deliver webhook (reacts Scheduled task).

### Outside services at Level 2
- Environment server -> Coding agents | agent protocols (CLIs, SDKs, app servers, ACP over stdio). Evidence: apps/server/src/provider/builtInDrivers.ts, packages/provider-core/src/server/ProviderAdapter.ts, packages/effect-acp, packages/effect-codex-app-server. Run agents (core): Run agent turn (mutates Agent conversation), Fork or roll back conversation (mutates Agent conversation), Read conversation (observes Agent conversation). Set up agents: Sign in to agent account (mutates Agent account), Install agent runtime (produces Agent runtime), Read usage limits (observes Agent account).
- Environment server -> Model APIs | model APIs (apps/server/src/speech/CloudSpeech.ts, textGeneration/TextGenerators.ts): Generate text (produces Model output, on Model), Transcribe audio (produces, on Model).
- Environment server -> Usage quota sources | quota endpoints (apps/server/src/usage/cliproxyApi.ts, UsageLimitSources.ts): Read quota windows (observes Usage quota).
- Environment server -> Code hosting services | code host APIs, git remotes (packages/source-control-*/src/server/*, apps/server/src/vcs/GitVcsDriverCore.ts): Push and fetch branches (mutates Repository) [git remotes]; Publish repository (produces Repository); Read and change pull requests (mutates Pull request); Read and change issues (mutates Issue). Sign-in is a step.
- Environment server -> Linear | Linear API (packages/issue-tracker-linear/src/server/*): Read and change issues (mutates Issue).
- Environment server -> 1Password | 1Password CLI (packages/secret-provider-onepassword/src/*): Read secret (observes Secret).
- Environment server -> Cloudflare | cloudflared tunnel (apps/server/src/cloud/ManagedEndpointRuntime.ts): Carry traffic to the machine (mutates Tunnel).
- Environment server -> Clerk | Clerk OAuth (apps/server/src/cloud/CliTokenManager.ts; docs/internals/06_t3-connect.md "headless CLI uses a public PKCE OAuth client"): Sign in user from the command line (observes Account).
- Environment server -> Tailscale | Tailscale CLI (apps/server/src/environment/DirectEndpoints.ts, policy/managedLimits.ts, cli/pair.ts): Read tailnet address (observes Tailnet node); Change Serve routes (mutates Tailnet node).
- Environment server -> Device services | device host APIs (apps/server/src/device/SimlockDeviceHost.ts, SshDeviceHost.ts, EasDeviceHost.ts, ExpoApi.ts): Lease or start remote device (produces Device); Fetch app build (observes App build).
- T3 Connect relay -> Clerk | Clerk API (infra/relay/src/auth/RelayTokens.ts, accounts/AccountDeletion.ts; RelayAccountWebhooksGroup): Identify user (observes Account); Learn of deleted account (reacts Account).
- T3 Connect relay -> Cloudflare | Cloudflare API (infra/relay/src/environments/ManagedEndpointProvider.ts, CloudflareApiPause.ts): Create or delete tunnel (mutates Tunnel).
- T3 Connect relay -> T3 Chat | T3 Chat link API (infra/relay/src/t3chat/T3ChatAccounts.ts): Read linked plan (observes T3 Chat plan).
- T3 Connect relay -> Push notification services | APNs and FCM (infra/relay/src/agentActivity/ApnsClient.ts, FcmClient.ts): Send push or Live Activity update (reacts Notification device).
- Desktop shell -> SSH hosts | SSH (packages/ssh/src/tunnel.ts, apps/desktop/src/ssh/DesktopSshEnvironment.ts): Start or reuse server over SSH (produces SSH connection); Forward port (mutates SSH connection) -> folded: forwarding is a step of starting.
- Desktop shell -> Tailscale | Tailscale CLI (apps/desktop/src/backend/tailscaleEndpointProvider.ts, DesktopServerExposure.ts): Turn Serve on or off (mutates Tailnet node); Read tailnet address (observes Tailnet node).
- Client app -> Clerk | Clerk sign-in (apps/mobile/clerk-theme.json, packages/client-runtime/src/relay/cloudAccountService.ts): Sign in to T3 Connect (observes Account).

## Level 3 inside Environment server
Contracts are Effect service interfaces (Context.Service). Operation lists extracted from each interface.

- Orchestration -> Agent providers | provider adapter contract. packages/provider-core/src/server/ProviderAdapter.ts (ProviderAdapterV2: ensureThread, resumeThread, injectHistory, startTurn, resumeTurn, steerTurn, interruptTurn, compactThread, applyModelSelection, stopTask, awaitBackgroundTasks, stopSubagent, unloadThread, respondToRuntimeRequest, readThreadSnapshot, rollback, fork, events), apps/server/src/orchestration-v2/ProviderAdapterRegistry.ts, provider/ProviderRegistry.ts (getProviders). Capabilities: Start agent session (produces Agent session: ensureThread/resumeThread/injectHistory); Run turn (mutates Agent session: startTurn/resumeTurn/steerTurn, events, respondToRuntimeRequest is a step); Stop work (mutates Agent session: interruptTurn/stopTask/stopSubagent); Fork or roll back session (mutates Agent session); Compact session (mutates Agent session); List ready providers (observes Provider instance). Steps: unloadThread (clean-up), awaitBackgroundTasks.
- Orchestration -> Workspace | task folder service. apps/server/src/workspace/TaskFolders.ts (plan, create, createForProjectFolder, addRepository, find, remove, removeIfTaskFolder, renameBranch, restore, layoutCommands). Capabilities: Prepare thread folder (produces Worktree: plan/create/addRepository); Find or restore thread folder (observes/mutates Worktree); Remove thread folder (mutates Worktree).
- Orchestration -> Git | Git service. apps/server/src/checkpointing/CheckpointStore.ts (captureCheckpoint, restoreCheckpoint, diffCheckpoints, listAuthoredPaths, deleteCheckpointRefs), git/GitManager.ts (status, branchPullRequest, createWorktree). Capabilities: Capture checkpoint (produces Checkpoint); Restore checkpoint (mutates Checkpoint/Repository); Diff checkpoints (observes Checkpoint); Read branch status (observes Repository). Step: deleteCheckpointRefs (clean-up on delete).
- Orchestration -> Code host integration | pull request and issue services. apps/server/src/pullRequest/PullRequestService.ts (detail, refreshAfterTurn, subscribeStateChanges, subscribeMerges), PullRequestWatchService.ts, issue/IssueService.ts (detail, linkMetadata). Capabilities: Watch thread pull request (observes Pull request: state changes and merges that settle threads); Read linked issue (observes Issue).
- Orchestration -> Settings and policy | settings service. apps/server/src/serverSettings.ts (getSettings, subscribeChanges), policy/ManagedPolicy.ts. Capability: Read environment settings (observes Environment).
- Orchestration -> Linked environments | peer link service. apps/server/src/peer/PeerLinks.ts (resolve, get), peer/RemoteDelegation.ts. Capability: Delegate task to linked machine (produces Environment link task; modelled mutates Environment link).
- Agent tools -> Orchestration | thread management service. apps/server/src/orchestration-v2/ThreadManagementService.ts (dispatch, sendToThread, getThreadSnapshot, getThreadTranscript, searchThread, listProjectThreads, waitForThread, interruptThread, settleThread, submitRunOutput, stopWorkflow, streamDomainEvents), ThreadLaunchService.ts. Capabilities: Launch thread (produces Thread); Send to thread (mutates Thread); Read or wait on thread (observes Thread); Stop or organize thread (mutates Thread); Follow thread events (observes Thread: streamDomainEvents, used by Agent events).
- Agent tools -> Workspace | task folder service (WorktreeMcpService.ts -> TaskFolders): Create or hand off worktree (produces/mutates Worktree).
- Agent tools -> Git | Git service (GitManager.status, runStackedAction): Read worktree status (observes Repository); Commit and push (mutates Repository).
- Agent tools -> Code host integration | pull request and issue services (mcp/toolkits/pullRequests, issues): Read pull request (observes Pull request); Create, review or merge pull request (produces/mutates Pull request); Read or change issue (observes/mutates Issue).
- Agent tools -> Scheduled tasks | scheduled task service (ScheduledTaskService.ts: list, upsert, delete, runNow): Schedule task (produces Scheduled task); Change or run task (mutates Scheduled task); List tasks (observes Scheduled task).
- Agent tools -> Workflows | workflow service (workflows/Workflows.ts: start, answer, resume, cancel, get, list, storeSet): Start workflow run (produces Workflow run); Steer workflow run (mutates Workflow run); Read workflow runs (observes Workflow run).
- Agent tools -> Linked environments | peer link service (PeerLinks.link/list/unlink, PeerForwarding.ts): Link environment (produces Environment link); Forward call to linked machine (mutates Environment link; gives the other machine's answer).
- Agent tools -> Secrets | secret service (SecretRequests.ts: answer, savedRef, consume, saveToFile, savePasted): Request secret (produces Agent request; gives the secret to the tool or a private file).
- Agent tools -> Browser | preview service (preview/Manager.ts open/resize/close/list, mcp/PreviewAutomationBroker.ts, htmlRender/HtmlRender.ts): Drive preview tab (mutates Browser tab); Publish visual reply (produces Visual reply... modelled produces Browser tab? -> use Thread? decided: produces Visual reply on Browser? see draft).
- Agent tools -> Devices | device service (device/DeviceService.ts: list, open, close, action, screenshot): Use device (mutates Device).
- Agent tools -> Agent providers | provider registry (ProviderRegistry.getProviders): List providers and models (observes Provider instance).
- Scheduled tasks -> Orchestration | thread management service (ThreadLaunchService, ThreadManagementService.sendToThread): Run task in thread (produces/mutates Thread).
- Workflows -> Orchestration | thread management service (WorkflowAgents.ts, WorkflowAgentThreads.ts): Run agent step (produces Thread).
- Workflows -> Code host integration | pull request and issue services (WorkflowForge.ts, forgeApi.ts): Watch new issues and pull requests (observes Issue, Pull request); Comment or update item (mutates Issue, Pull request).
- Workflows -> Linked environments | peer link service: Run agent step on linked machine (mutates Environment link).
- Workflows -> Agent tools | milestone hub (MilestoneHub.publish): Publish workflow event (produces Agent event).
- Linked environments -> Orchestration | thread management service (PeerThreadRelay.ts, RemoteDelegation.ts): Read thread for linked machine (observes Thread); Record delegated result (mutates Thread).
- Linked environments -> Agent tools | agent tool MCP endpoint (PeerMcpClient.ts -> the other environment's /mcp, McpHttpServer.ts): Call tool on linked machine (mutates Thread there; gives the tool's result). Same contract outside agents use.
- Linked environments -> Access control | auth service (EnvironmentAuth.issuePairingCredential, PeerClientPairing.ts): Mint pairing for linked machine (produces Access grant).
- T3 Connect link -> Access control | auth service (EnvironmentAuth.issueConnectCredential, approveConnectDevice): Mint relayed client credential (produces Access grant).
- T3 Connect link -> Orchestration | thread management service (relay/AgentAwarenessRelay.ts -> getAgentAwarenessSnapshot): Read agent activity (observes Thread).
- Agent providers -> Settings and policy | settings service (ServerSettingsService.getSettings/updateProviderInstance, ManagedPolicy.providers): Read provider configuration (observes Environment); Save provider instance (mutates Environment).
- Agent providers -> Secrets | secret service (SecretResolver: resolve references): Read secret reference (observes Secret).
- Agent providers -> Access control | auth service (EnvironmentAuth.issueMcpClientSession; provider-core McpProviderSessions.ts): Issue agent tool session (produces Access grant).
- Workspace -> Git | Git service (vcs worktree create/remove via GitVcsDriver/VcsProvisioningService): Create or remove worktree checkout (produces/mutates Worktree... kept by Git as Repository) -> Git keeps Worktree too.
- Git -> Code host integration | code host connection registry (SourceControlProviderRegistry.resolve, PullRequestService.createPullRequest via git/linkCreatedPullRequest.ts): Open pull request for branch (produces Pull request).
- Git -> Agent providers | text generation service (textGeneration/TextGeneration.ts): Write commit message (produces Generated text -> modelled produces on Provider instance? decided: observes Provider instance? see draft).
- Code host integration -> Git | Git service (VcsDriver remotes, refs): Read repository remotes (observes Repository).
- Code host integration -> Secrets | secret service (SecretResolver): Read code host token (observes Secret).
- Code host integration -> Agent providers | text generation service (PullRequestReviewGuideService.ts): Write review guide (produces...).
- Devices -> Secrets | secret service (SecretResolver: device host tokens): Read device host token (observes Secret).
- Voice transcription -> Agent providers | text generation service (speech/postProcessing.ts): Clean up transcript.
- Voice transcription -> Secrets | secret service (cloud speech keys): Read speech API key (observes Secret).

Outside services at Level 3 (Environment server branch): Agent providers -> Coding agents, Model APIs, Usage quota sources; Git -> Code hosting services [git remotes]; Code host integration -> Code hosting services, Linear; Secrets -> 1Password; T3 Connect link -> Cloudflare, Clerk; Voice transcription -> Model APIs; Devices -> Device services; Access control -> Tailscale (DirectEndpoints.ts); Settings and policy -> Tailscale (managedLimits.ts).

## Level 3 inside T3 Connect relay
- Mobile notifications -> Environment connections | environment connections service (infra/relay/src/agentActivity/* imports environments/EnvironmentLinks.ts, EnvironmentPublishSignatures.ts): Verify publishing environment (step) ; Find account for environment (observes T3 Connect link).
- Held webhooks -> Environment connections | environment connections service (hooks/HookForwarder.ts, HeldHooks.ts import environments/*): Find environment endpoint (observes T3 Connect link, Managed tunnel).
- Outside: Environment connections -> Clerk, Cloudflare, T3 Chat; Mobile notifications -> Push notification services.

## Level 3 inside Desktop shell
- No calls between Server launcher, Desktop browser and SnapShots found (each is reached from the window through the bridge).
- Outside: Server launcher -> SSH hosts, Tailscale.

## Level 4
- Inside Agent providers: Provider registry -> Agent drivers | provider driver contract (packages/provider-core/src/server/driver.ts: ProviderDriver create, ProviderInstance snapshot, refreshModels, invalidateCaches, auth, acpSessionManagement): Build provider instance (produces Provider instance); Check status and models (observes Provider instance); Run sign-in (mutates Provider instance: auth controller, passed on by ProviderAuthService). Agent installation -> Provider registry: only a refresh after install (step, no boundary).
  Outside: Agent drivers -> Coding agents; Agent installation -> Coding agents (download runtimes, managedRelease.ts, antigravityCliRelease.ts).
- Inside Git: no calls between Checkpoints and Git actions. Outside: Git actions -> Code hosting services [git remotes].
- Inside Code host integration: Pull requests -> Code host connections | code host connection registry (SourceControlProviderRegistry.ts: resolve, get, resolveHandle): Get forge for repository (observes Repository); Issues -> Code host connections | code host connection registry (IssueTrackerRegistry uses sourceControl/builtInDrivers.ts): Get forge tracker (observes Repository). Outside: Code host connections -> Code hosting services; Pull requests -> Code hosting services; Issues -> Code hosting services, Linear.
- Inside Settings and policy: Environment settings -> Policy enforcement | managed policy service (policy/ManagedPolicy.ts: document, settings, providers, summary; serverSettings.ts managedPolicy): Read locks and limits (observes Managed policy). Outside: Policy enforcement -> Tailscale.
- Inside Agent tools: no calls between Tool server and Agent events found (Agent events serves bots directly on /mcp and takes workflow events).
- Inside Environment connections (relay): Account links -> Managed tunnels | managed endpoint provider (ManagedEndpointProvider.ts, ManagedEndpointAllocations.ts used by EnvironmentConnector.ts, EnvironmentLinker.ts): Allocate tunnel (produces Managed tunnel); Release tunnel (mutates Managed tunnel). Outside: Account links -> Clerk, T3 Chat; Managed tunnels -> Cloudflare.

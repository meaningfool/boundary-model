# Inner boundaries (below Level 1)

Each entry: the contract the consumer calls, with its path, its operations, and the capabilities and resources they give (operations grouped by what the consumer gets back; steps folded into the operation they serve).

## Level 2 (inside Executor)

### Product server -> Engine
- Interface: **engine SDK**, `createExecutor` and the `Executor` type, projected from the HTTP contract `ExecutorApi` (packages/sdk/src/contracts/executor.ts, http.ts; groups in account.ts, account-connection.ts, oauth-clients.ts, apps.ts, skills.ts, tools.ts, schedules.ts, app-data.ts, webhooks.ts, webhook-setup.ts, owner.ts, workflows.ts, publications.ts).
- Operations: accounts (list, get, provider, health, listHealth, check, update, remove, revocation, signIn); accountConnections (create, get, cancel, submit, oauthSetup, startOAuth, findOAuth, completeOAuth); oauthClients (register, list, issuers, get, update, remove); apps (checkCredentials, create, workspace, commit, history, revision, copy, deploy, get, list, remove, rename, activate, versions, version, deployments, deployment, source; host-only copyAs, deployReplacing, build); skills (list, bundle, read); tools (list, index, get, call, resume, pruneApprovals; host-only approval, searchable, search); schedules (list, definitions, configure, copy, update, runNow, remove, runs, approval, answer); appData (subscribe, query, mutate); webhooks (get, definitions, list, create, reconcile, remove, sources, configureSource, link, unlink, confirmRemoval, deliver); webhookSetup (read, complete); owners (check, remove); appWorkflows (list); appWorkflowRuns (start, get, pinned, list, terminate); publications (status, preview, publish, owned, unpublish); registry (list, snapshot, file); events (host-only); managedAccounts (host-only). Hooks the product supplies, `ResourceLifecycle` (userLinks, appLinks, appResolving, accountsResolving, connectionCompleting, appCreated, appRemoving, accountCreated, accountRemoving...), are callbacks inside this boundary: the engine asks the product which accounts a call runs with and lets it keep its records in the same transaction.
- Capabilities: core **Run apps**: List tools (observes Tool), Call a tool (mutates App data; produces Approval request when the call pauses; the engine keeps pending approvals, not the call history), Resume a paused tool call (mutates Approval request), Search tools (observes Tool), Read skills (observes Skill), Query app data (observes App data), Change app data (mutates App data). Supporting **Keep accounts**: Connect an account (produces Connection request, produces Account), Check an account (observes Account), Edit an account (mutates Account), Remove an account (mutates Account), Register an OAuth client (produces OAuth client). **Manage app code**: Create an app (produces App), Read app source (observes App source), Commit source (mutates App source), Deploy a version (produces Version), Activate a version (mutates App), Copy an app (produces App), Remove an app (mutates App). **Run background work**: Configure a schedule (mutates Schedule), Run a schedule now (mutates Schedule), Answer a scheduled run's approval (mutates Approval request), Set up a webhook (mutates Webhook), Start a workflow run (produces Workflow run), Stop a workflow run (mutates Workflow run), Subscribe to app events (produces Event subscription). **Publish apps**: Publish an app (produces Publication), Unpublish an app (mutates Publication), List public apps (observes Publication). **Remove an owner's resources** (owners.remove): a step of removing an organization or user, folded into those (provider behavior of the product).

### Product server -> Code mode
- Interface: **MCP tools handler**: `mcp`/`makeMcp(options)` (packages/mcp/src/implementation/server.ts) returning the protocol handler and browser accessors (`BrowserApprovals` get/answer, packages/mcp/src/contracts/browser.ts); the product supplies `McpBackend` (packages/mcp/src/contracts/backend.ts: listSkills, bundleSkills, readSkill, authorizeElicitation, listApps, listAccounts, listTools, searchableTools, searchTools, callTool, findEventSubscription, subscribeEvent, unsubscribeEvent, resumeInvocation), which code mode calls back to complete each tool. Tools served: skills, search, describe, call, execute, resume (contracts/execute.ts, skills.ts, tools.ts).
- Capabilities: core **Serve agent tools**: Run a program (produces Program run), Call tools (produces Program run), Resume a paused call (mutates Program run), Search tools (observes Tool), Describe tools (observes Tool), Read skills (observes Skill). Supporting **Collect browser approvals**: Read a pending request (observes Approval request), Answer a pending request (mutates Approval request).

### Engine -> App runtime
- Interface: **app runtime contract**: `Runtime` / `AppRuntime` (packages/sdk/src/contracts/runtime.ts; packages/sdk/src/implementation/runtime.ts) and `WorkflowRuntime` (packages/sdk/src/contracts/workflow-runtime.ts). Operations: build, asset, skills, inspect, index, query, mutate, webhook, workflow, call, checkAccount, migrate, changes; workflows start, status, terminate (`WorkflowHost` get, seed, context, invoke, execute, finish are callbacks inside the boundary).
- Capabilities: core **Run app code**: Call a tool (mutates App data), Describe an app (observes Tool, observes Skill), Run a webhook command (mutates App data), Check an account (observes Account: runs the provider's check against the service and gives healthy or needs sign-in), Run a workflow (produces Workflow run, observes Workflow run, mutates Workflow run). Supporting **Build apps**: Build an app (produces Build), Apply app migrations (mutates App data), Read a public file (observes Build).

### Engine -> Public app registry
- Interface: **registry contract**: `Registry` (list, snapshot, file, files) and `RegistryStorage` (get, list, owned, publish, unpublish) (packages/sdk/src/contracts/registry.ts); over HTTP for local and self-host, `/v1/registry/apps`, `/v1/registry/source`, `/v1/registry/file` (packages/sdk/src/contracts/publications.ts, implementation/remote-registry.ts).
- Capabilities: core **Keep public listings**: Publish a listing (produces Publication), Remove a listing (mutates Publication), List public apps (observes Publication), Read a published snapshot (observes Publication).

### Desktop app -> Product server
- Interface: **desktop sign-in API**: hosted `/api/auth/desktop/session-link`, `/api/auth/desktop/session`, `/api/auth/desktop/account` with a desktop OAuth token (apps/hosted/server/src/contracts/desktop-sessions.ts); local pairing `/auth/pair` and OAuth returns `/api/desktop/oauth-returns` (apps/local/server/src/contracts/auth.ts, desktop-return.ts); the app page location and icon reads (apps/hosted/server/src/contracts/app-ui.ts, apps/local/server/src/contracts/app-ui.ts).
- Capabilities: core **Open signed-in windows**: Sign a window in (produces Session), Read the signed-in account (observes Member), Find an app's page (observes App).

### Engine -> Connected services
- Interface: **service OAuth endpoints** (packages/sdk/src/implementation/oauth-protocol.ts, oauth.ts, oauth-probe.ts; contracts/oauth.ts): discovery, dynamic client registration, client metadata documents, authorization code exchange, refresh, revocation.
- Capabilities: core **Authorize accounts**: Authorize an account (produces Service authorization), Revoke an authorization (mutates Service authorization). Discovery, registration and refresh are steps of authorizing and of using an account.

### App runtime -> Connected services
- Interface: **service APIs**, reached by app code's fetch through the outbound path (packages/sdk/src/implementation/credential-handles.ts `credentialFetch`, app-network.ts; Cloud app-outbound-relay.ts).
- Capabilities: core **Use services**: Call a service API (observes Service data, mutates Service data), Read a service description (observes Service description: live OpenAPI, MCP and GraphQL discovery in packages/apps/src/implementation/openapi-source.ts, mcp.ts, graphql.ts). Webhook deliveries from a service travel inside this boundary: they complete the webhook an app registered with a call.

### App runtime -> npm registry
- Interface: **npm registry** (packages/sdk/src/implementation/worker-dependencies.ts; `EXECUTOR_NPM_REGISTRY`, apps/docs/content/run/self-host.mdx).
- Capabilities: core **Get packages**: Download an app's dependencies (observes Package).

### Product server -> Identity providers
- Interface: **identity provider sign-in** (Google, GitHub, ChatGPT on Cloud: apps/hosted/cloud/src/implementation/auth-options.ts, chatgpt-sign-in.ts; OIDC SSO on Cloud and self-host: apps/hosted/cloud/src/implementation/sso.ts, apps/hosted/self-host/src/implementation/auth-options.ts, `SSO_DISCOVERY_URL`).
- Capabilities: core **Sign people in**: Verify a person's identity (observes External identity).

### Product server -> Official app feed
- Interface: **official app feed**: `index.json` and `apps/<id>.json` at `EXECUTOR_CATALOG_URL` (packages/catalog/src/implementation/source.ts, contracts/catalog.ts).
- Capabilities: core **List official apps**: List official apps (observes Catalog app), Fetch an official app's source (observes Catalog app).

### Product server -> Connected services
- Interface: **service APIs** (shared with the App runtime's boundary): the catalog's MCP access check (packages/catalog/src/implementation/detection.ts `detectMcpAccess`, custom.ts).
- Capabilities: core **Check remote servers**: Check how a remote MCP server connects (observes Service description).

### Product server -> Billing service (Cloud)
- Interface: **billing API** (apps/hosted/cloud/src/contracts/billing.ts `Billing` overview, checkout, portal; autumn.ts; implementation/autumn-client.ts, billing-seats.ts).
- Capabilities: core **Manage subscriptions**: Read the subscription (observes Subscription), Start a checkout (mutates Subscription), Open the billing portal (observes Subscription), Update seats (mutates Subscription).

### Product server -> Email delivery (Cloud)
- Interface: **email sending** (apps/hosted/cloud/src/contracts/email.ts `SendAuthEmail`, `SendWelcomeEmail`; infrastructure/email.ts).
- Capabilities: core **Send email**: Send an email (produces Email message).

### Product server -> Company profile lookup (Cloud)
- Interface: **company lookup API** (apps/hosted/cloud/src/implementation/company-profile.ts `companyLookupLive`, brand retrieve endpoint).
- Capabilities: core **Look up companies**: Look up a company's brand (observes Company profile).

## Level 3

### Inside Product server
- **Access -> Identity providers**: same interface and capability as the Product server's (Access runs sign-in).
- **Access -> Email delivery**: sign-in codes and invitations (Better Auth email OTP and organization invitations; apps/hosted/cloud/src/infrastructure/email.ts `SendAuthEmail`). Capability: Send an email (produces Email message).
- No boundary between Access and Activity log: the activity log is written by the MCP adapter and tool handlers (parts) and read by dashboards.

### Inside App runtime
- **App sandbox -> Apps framework**: interface **host protocol** (packages/apps/src/contracts/protocols/current.ts `HostRequest`: requirements, inspect, skills, query, mutate, call, account-check, migrate, webhook command, workflow command; bundle messages workflowControl, workflowStep; packages/apps/src/contracts/host.ts). Capabilities: core **Run app code**: Describe the app (observes Tool, observes Skill), Run a tool (mutates App data), Run a query or mutation (observes App data, mutates App data), Run a webhook command (mutates App data), Run a workflow step (mutates App data), Check an account (observes Account), Apply migrations (mutates App data).
- **App sandbox -> Builder**: interface **retained builds** (packages/sdk/src/implementation/worker-build-storage.ts `loadWorkerBuild`, `loadWorkerFramework`, `workerBuildAsset`). Capability: Load a build (observes Build).
- **Apps framework -> Outbound gateway**: interface **outbound fetch** (generated network module, packages/sdk/src/implementation/app-network.ts; `CredentialOutbound`, `AppEgress` in credential-handles.ts). Capability: Call a service API (observes Service data, mutates Service data), Read a service description (observes Service description).
- **Outbound gateway -> Connected services**: interface **service APIs**. Capabilities as App runtime -> Connected services.
- **Builder -> npm registry**: interface **npm registry**. Capability: Download an app's dependencies (observes Package).
- The engine reaches the Builder (build), the sandbox (call, inspect...) and the Workflow engine (start, status, terminate) through the Level 2 app runtime contract; those components serve the areas of Engine -> App runtime.

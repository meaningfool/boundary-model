# Inner boundaries (below Level 1)

Each entry: consumer -> provider, interface, contract path, the operations the consumer calls, and the capabilities and resources they give. Steps (keep-alives, checks, callbacks, wiring) are folded into the capability they serve.

## Inside Pi

### 1. Agent session -> Pi Agent Core
- Interface: pi-agent-core package (shared with the Library developer's boundary; same provider).
- Contract: packages/agent/src/agent.ts (`class Agent`), packages/agent/src/types.ts (`AgentState`, `AgentTool`, `AgentEvent`, hooks). Created in packages/coding-agent/src/core/sdk.ts (`new Agent({... streamFn: ... modelRuntime.streamSimple ...})`).
- Operations: prompt, continue, subscribe, waitForIdle; steer, followUp, clearSteeringQueue, clearFollowUpQueue, clearAllQueues, peekQueuedMessages, hasQueuedMessages; abort; reset; state.model / thinkingLevel / tools / messages setters, toolExecution, steeringMode, followUpMode; hooks the session installs: beforeToolCall, afterToolCall, prepareRequest, finishTurn, transformContext, convertToLlm, streamFn.
- Capabilities:
  - Run prompt (prompt, continue): takes user messages; gives the run's events, the assistant messages and the tool results. mutates Agent. subscribe and waitForIdle deliver its output; the hooks are the session's callbacks inside the run (tool preflight, context preparation, end of turn), steps of this capability.
  - Queue message (steer, followUp, clear*, peek): takes a message for the current run or for after it; gives it queued. mutates Agent.
  - Abort run (abort): gives the run stopped. mutates Agent.
  - Change agent state (state setters, reset, modes): takes a model, thinking level, tool set or transcript; gives the agent using it on the next request. mutates Agent.
- Resource: Agent.

### 2. Agent session -> Model runtime
- Interface: model runtime API.
- Contract: packages/coding-agent/src/core/model-runtime.ts (`class ModelRuntime implements Models`), src/core/model-registry.ts (`class ModelRegistry`, a facade).
- Operations used by the session (agent-session.ts, sdk.ts, compaction.ts, codemode execute.ts through ModelRegistry): streamSimple, completeSimple (through the session's stream function), resolveModel (virtual-model routing), getPhysicalModel, getModel, getAvailable, getAvailableSnapshot, checkAuth, hasConfiguredAuth, isUsingOAuth, getAuth, refresh, classify, generateImages.
- Capabilities:
  - Get model response (streamSimple, completeSimple, resolveModel): takes a model and a conversation; gives the streamed assistant response, routed to the physical model when the model is virtual. produces Model response; observes Model. checkAuth / hasConfiguredAuth / getAuth are checks whose result only decides whether the request goes ahead: steps.
  - List available models (getAvailable, getAvailableSnapshot, getModel, getPhysicalModel): gives the models whose providers have usable credentials. observes Model.
  - Refresh model lists (refresh): gives reloaded models.json and refreshed provider lists. mutates Model.
  - Generate images (generateImages, for codemode's `models`): produces Model response.
  - Classify state (classify, for codemode's `models`): produces Model response.
- Resources: Model, Model response.

### 3. Agent session -> Extension runtime
- Interface: extension runner.
- Contract: packages/coding-agent/src/core/extensions/runner.ts (`class ExtensionRunner`), created in agent-session.ts.
- Operations: emitInput, emitBeforeAgentStart, emitContext, emitBeforeProviderRequest, emitBeforeProviderHeaders, emitToolCall, emitToolResult, emitMessageEnd, emitUserBash, emitCacheWarmingDecision, emitResourcesDiscover, emit (session and agent lifecycle events), emitSessionShutdownEvent; getAllRegisteredTools, getToolDefinition, getRegisteredCommands, getCommand, getFlags, getShortcuts, getMessageRenderer, getEntryRenderer, getMarkdownTransformers; bindCore, bindCommandContext, setUIContext (wiring: steps).
- Capabilities:
  - Run extension handlers (emit*): takes a session event (input, start of a run, context, provider request, tool call, tool result, session change); gives the extensions' combined answer: block, changed input, context or result, or nothing. reacts Extension.
  - List registered tools and commands (getAllRegisteredTools, getToolDefinition, getRegisteredCommands, getCommand, getFlags, getShortcuts, renderers): observes Tool, Command.
  - Run extension command (getCommand(...).handler from AgentSession.prompt): takes `/name` and its arguments; gives the command's effect. produces Command.
- Resources: Extension, Tool, Command.

### 4. Extension runtime -> Agent session
- Interface: session actions.
- Contract: `ExtensionActions`, `ExtensionContextActions`, `ExtensionCommandContextActions` in packages/coding-agent/src/core/extensions/types.ts, bound by AgentSession through `ExtensionRunner.bindCore` and `bindCommandContext` (agent-session.ts). The runner passes these on when an extension calls pi.* or ctx.*.
- Operations: sendMessage, sendUserMessage, appendEntry, setSessionName, getSessionName, setLabel; setModel, getThinkingLevel, setThinkingLevel; getActiveTools, getAllTools, setActiveTools, refreshTools; getCommands; isIdle, abort, hasPendingMessages, getContextUsage, compact, getSystemPrompt, executeTool, shutdown; waitForIdle, newSession, fork, navigateTree, switchSession, reload.
- Capabilities:
  - Add to session (sendMessage, sendUserMessage, appendEntry, setSessionName, setLabel): takes a message, custom entry, name or label; gives it recorded on the active branch, starting a turn when asked. mutates Session.
  - Read session (getActiveTools, getAllTools, getCommands, getContextUsage, getSystemPrompt, isIdle, getSessionName, the read-only session manager): gives the session's tools, commands, context usage, prompt and entries. observes Session.
  - Control session (setModel, setThinkingLevel, setActiveTools, abort, compact, newSession, fork, navigateTree, switchSession, reload, shutdown): gives the session changed, replaced or stopped. mutates Session.
  - Run tool call (executeTool, used by codemode for nested calls): takes a tool name and arguments; gives the tool's result, recorded as a nested call. mutates Session.
- Resource: Session.

### 5. Agent session -> Resource loader
- Interface: ResourceLoader contract.
- Contract: packages/coding-agent/src/core/resource-loader.ts (`interface ResourceLoader`, `class DefaultResourceLoader implements ResourceLoader`); injectable through CreateAgentSessionOptions.resourceLoader (sdk.ts).
- Operations: getExtensions, getSkills, getPrompts, getThemes, getAgentsFiles, getSystemPrompt, getSystemPromptSource, getAppendSystemPrompt, getAppendSystemPromptSources, extendResources, reload.
- Capabilities:
  - List loaded resources (get*): gives the context files, system prompt files, skills, prompt templates, themes and extensions in force. observes Skill, Prompt template, Theme, Context file, Extension.
  - Reload resources (reload): gives everything rediscovered from disk and packages. mutates Skill, Prompt template, Theme, Context file, Extension.
  - Add resource paths (extendResources, from resources_discover answers): takes skill, prompt and theme paths an extension supplies; gives them loaded. mutates Skill, Prompt template, Theme.
- Resources: Skill, Prompt template, Theme, Context file, Extension.

### 6. Resource loader -> Package manager
- Interface: PackageManager contract.
- Contract: packages/coding-agent/src/core/package-manager.ts (`interface PackageManager`, `class DefaultPackageManager implements PackageManager`), created in resource-loader.ts.
- Operations the loader calls: resolve(onMissing), resolveExtensionSources(sources, { temporary }). The others (install, installAndPersist, remove, removeAndPersist, update, listConfiguredPackages, addSourceToSettings, removeSourceFromSettings, getInstalledPath) are called by the shell commands, an interface.
- Capability:
  - Resolve package resources (resolve, resolveExtensionSources): takes the configured and `-e` package sources; gives the paths of their extensions, skills, prompt templates and themes, installing missing packages first. observes Pi package; produces Pi package.
- Resource: Pi package.

### 7. Resource loader -> Extension runtime
- Interface: extension loader.
- Contract: packages/coding-agent/src/core/extensions/loader.ts (`loadExtensionsCached`, `loadExtensionFromFactory`, `createExtensionRuntime`).
- Capability:
  - Load extensions: takes extension paths and inline or built-in factories; gives the loaded extensions with what they registered, and load errors. produces Extension.
- Resource: Extension.

### 8. Resource loader -> Project trust
- Interface: project trust check.
- Contract: `ResourceLoaderReloadOptions.resolveProjectTrust` (packages/coding-agent/src/core/resource-loader.ts), implemented by `resolveProjectTrusted` (src/core/project-trust.ts) over `ProjectTrustStore` (src/core/trust-manager.ts); wired in src/main.ts.
- Capability:
  - Decide project trust: takes the working folder and the extensions loaded before trust; gives whether project resources may load, asking the user and saving the choice when needed. observes Project trust decision; mutates Project trust decision.
- Resource: Project trust decision.

### 9. Project trust -> Extension runtime
- Interface: extension runner.
- Contract: `emitProjectTrustEvent` in packages/coding-agent/src/core/extensions/runner.ts, called from src/core/project-trust.ts.
- Capability:
  - Ask extensions to decide trust: takes the working folder; gives the first extension's yes or no, or no answer. reacts Extension.
- Resource: Extension.

### 10. Model runtime -> Pi AI
- Interface: pi-ai package (shared with the Library developer's boundary; same provider).
- Contract: packages/ai/src/models.ts (`interface Models`, `interface Provider`, `createModels`), packages/ai/src/providers/all.ts, the store contracts it fills (`CredentialStore` in packages/ai/src/auth/credential-store.ts, implemented by coding-agent src/core/auth-storage.ts; `ModelsStore` in packages/ai/src/models-store.ts, implemented by src/core/models-store.ts).
- Operations: createModels, setProvider, stream, streamSimple, complete, completeSimple, streamDeferred, fetchDeferred, cancelDeferred, generateImages, classify, getProviders, getModels, getAllModels, getAvailable, getAllAvailable, getModelOfType, getAuth, checkAuth, login, logout, refresh.
- Capabilities:
  - Get model response (stream*, complete*, *Deferred): produces Model response.
  - Generate images (generateImages): produces Model response.
  - Classify state (classify): produces Model response.
  - List models (getModels, getAllModels, getAvailable*, getProviders): observes Model.
  - Refresh model lists (refresh): mutates Model.
  - Sign in to provider (login): takes a provider and an interaction for prompts; gives a stored credential. produces Provider credential.
  - Sign out of provider (logout): mutates Provider credential.
  - Check provider auth (getAuth, checkAuth): gives whether and how a provider is configured, with the resolved key or token. observes Provider credential. Model runtime uses it for availability and for `pi auth check`.
- Resources: Model, Model response, Provider credential.

### 11. Extension runtime -> Model runtime
- Interface: model runtime API.
- Contract: `ModelRuntime.registerProvider`, `registerNativeProvider`, `unregisterProvider`, `registerVirtualModel`, `unregisterVirtualModel` (src/core/model-runtime.ts); pending registrations applied in src/core/agent-session-services.ts, later ones forwarded by the runner.
- Capabilities:
  - Register model provider: takes a provider config or a pi-ai Provider from an extension; gives its models available in /model. produces Model.
  - Register virtual model: takes a router; gives a selectable model that picks a physical model per request. produces Model.
- Resource: Model. (ctx.modelRegistry is handed to extensions as is; the runner only passes it on.)

### 12. MCP connections -> Extension runtime
- Interface: extension contract.
- Contract: `ExtensionAPI` and `ExtensionContext` in packages/coding-agent/src/core/extensions/types.ts, as src/extensions/mcp/index.ts calls them.
- Operations: pi.registerTool, pi.registerToolRenderer, pi.registerCommand, pi.registerMcpServer, pi.getMcpServers, pi.getActiveTools, pi.getAllTools, pi.setActiveTools, pi.on (session_start, mcp_servers_change, session_shutdown and others), ctx.ui.select / input / notify, ctx.modelRegistry, ctx.isProjectTrusted.
- Capabilities:
  - Register tool (registerTool, registerToolRenderer): gives an MCP tool callable as `mcp__<server>__<tool>`. produces Tool.
  - Register command (registerCommand): gives `/mcp`. produces Command.
  - Change active tools (setActiveTools, getActiveTools, getAllTools): gives codemode or tool_search switched on for servers that need them. mutates Tool.
  - List registered MCP servers (getMcpServers, mcp_servers_change): gives the servers other extensions registered. observes MCP server.
  - Handle session events (pi.on): takes handlers for session start, shutdown and server changes; gives them run when those happen. reacts Extension.
- Resources: Tool, Command, MCP server, Extension.

### 13. MCP connections -> Model runtime
- Interface: model runtime API.
- Contract: `ModelRegistry` (src/core/model-registry.ts) received as ctx.modelRegistry; src/extensions/mcp/index.ts "The session's model registry, which resolves `auth.provider` tokens".
- Capability:
  - Get provider credential: takes a provider id named in a server's `auth.provider` (the Radius MCP server); gives its token. observes Provider credential.
- Resource: Provider credential.

## Outside services

### 14. Agent session -> Radius
- Interface: Radius API. Contract: POST /v1/artifacts (src/modes/interactive/session-share.ts), POST /v1/bug-reports (src/core/bug-report-upload.ts), gateway origin in src/core/radius.ts.
- Capabilities: Upload shared session (produces Artifact); Upload bug report (produces Bug report).

### 15. Agent session -> GitHub
- Interface: GitHub CLI (gh). Contract: `gh gist create --public=false` (src/modes/interactive/session-share.ts).
- Capability: Create private gist (produces Gist).

### 16. Package manager -> Package sources
- Interface: npm and git. Contract: npm install/view and git clone/fetch run by src/core/package-manager.ts (npmCommand setting).
- Capabilities: Download package (observes Package release); Check for newer release (observes Package release).

### 17. Model runtime -> pi.dev
- Interface: pi.dev catalog API. Contract: GET /api/models/providers/<id> (src/core/remote-catalog-provider.ts).
- Capability: Get model catalog (observes Model catalog).

### 18. Model runtime -> llama.cpp router
- Interface: llama.cpp router API. Contract: src/extensions/llama/client.ts (`LlamaClient`: list models, load, unload, download).
- Capabilities: List router models (observes Local model); Load model (mutates Local model); Unload model (mutates Local model); Download model (produces Local model).

### 19. Model runtime -> Hugging Face
- Interface: Hugging Face Hub API. Contract: src/extensions/llama/huggingface.ts (`HuggingFaceClient`: /api/models search and model files).
- Capabilities: Search models (observes Hub model); Get model files (observes Hub model).

### 20. Pi AI -> AI model providers
- Interface: model provider APIs. Contract: packages/ai/src/api/* (wire protocols), packages/ai/src/providers/* (endpoints and auth), packages/ai/src/auth/oauth/* (account sign-in).
- Capabilities: Get model response (produces Model response); Generate images (produces Model response); Classify state (produces Model response); List models for a credential (observes Model: OpenRouter /models/user, Radius /v1/config, dynamic providers); Sign in with an account (produces Provider credential: OAuth device-code and PKCE flows, token refresh).

### 21. MCP connections -> MCP servers
- Interface: MCP. Contract: packages/mcp/src/client.ts (`McpClient`: connect, listTools, callTool, listResources, listResourceTemplates, readResource, ping, close), packages/mcp/src/oauth/*; used from src/extensions/mcp/runtime.ts and oauth.ts.
- Capabilities: List tools (observes MCP tool); Call tool (produces MCP tool); List resources (observes MCP resource); Read resource (observes MCP resource); Sign in to server (produces MCP sign-in). ping and reconnection are steps.

### 22. Pi MCP -> MCP servers
- Interface: MCP. Contract: packages/mcp/src/client.ts, packages/mcp/src/transports/*, packages/mcp/src/oauth/*.
- Capabilities: the same five as entry 21.

## Added in the deepening run (2026-11-25)

Entries 1 to 22 above are the earlier run's, unchanged except for the note on entry 1 at the end.

### Inside Pi Agent Core (Level 2 of the library; Level 3 inside Pi, where Pi Agent Core is shared)

### 23. Stateful agent -> Agent loop
- Interface: agent loop API.
- Contract: packages/agent/src/agent-loop.ts (`runAgentLoop`, `runAgentLoopContinue`; `agentLoop` and `agentLoopContinue` are the stream forms offered to library developers), packages/agent/src/types.ts (`AgentContext`, `AgentLoopConfig`, `AgentEvent`, `StreamFn`). Called from packages/agent/src/agent.ts `runPromptMessages` and `runContinuation`.
- Operations the Agent calls: `runAgentLoop(prompts, context, config, emit, signal, streamFn)` and `runAgentLoopContinue(context, config, emit, signal, streamFn)`. `context` is a copy of the transcript and tools (`createContextSnapshot`). `config` carries the model and thinking level and the Agent's callbacks: `getSteeringMessages` and `getFollowUpMessages` (drain its queues), `beforeToolCall`, `afterToolCall`, `prepareRequest`, `prepareNextTurn`, `finishTurn`, `convertToLlm`, `transformContext`, `getApiKey`. `emit` is the sink the loop sends every event to.
- Capability:
  - Run turns (both operations): takes the copy of the transcript and tools, the model and thinking level, the Agent's hooks and the callbacks that hand over queued messages, and new messages or none (continue); gives the run's events in order, ending with `agent_end`, and the messages it added: assistant responses and tool results. produces Agent run. The callbacks are the consumer's own steps inside the run; `emit` delivers the output.
- Resource: Agent run (new: the loop works on a copy and adds messages to a run the Agent records afterwards, so it does not work on the Agent directly).

### Inside Pi MCP (Level 2 of the library)

### 24. MCP client -> MCP OAuth
- Interface: AuthProvider contract.
- Contract: `interface AuthProvider` in packages/mcp/src/auth-provider.ts (`token()`, `onUnauthorized(context)`), implemented by `createMcpAuthProvider` (packages/mcp/src/oauth/auth-provider.ts) and `adaptOAuthProvider` (packages/mcp/src/oauth/flow.ts); held as `authProvider` and called by `StreamableHttpTransport` (packages/mcp/src/transports/streamable-http.ts).
- Operations: `token()` before each request whose answer the transport waits for; `onUnauthorized()` after a 401, or a 403 that reports `insufficient_scope`, before the request is retried.
- Capability:
  - Get access token (`token()`): takes nothing; gives the stored bearer token, refreshed first when it is about to expire, or `McpOAuthAuthorizationRequiredError` when the user has to sign in. observes MCP sign-in; mutates MCP sign-in (a refresh saves rotated tokens). `onUnauthorized()` serves a failed request and is a step of it: it refreshes or reports that more scope is needed, and the next `token()` returns the result.
- Resource: MCP sign-in.

### 25. MCP client -> MCP servers
- Interface: MCP.
- Contract: `McpClient` (packages/mcp/src/client.ts: `connect`, `listTools`, `callTool`, `listResources`, `listResourcesPage`, `listResourceTemplates`, `listResourceTemplatesPage`, `readResource`, `ping`, `notify`, `close`), the protocol types (packages/mcp/src/protocol/types.ts) and the transports (packages/mcp/src/transports/*).
- Capabilities: List tools (`tools/list`, observes MCP tool); Call tool (`tools/call`, produces MCP tool); List resources (`resources/list`, `resources/templates/list`, observes MCP resource); Read resource (`resources/read`, observes MCP resource). Initialization, `ping`, server requests, progress, cancellation and the HTTP session's reconnection are steps of these.
- Resources: MCP tool, MCP resource.

### 26. MCP OAuth -> MCP servers
- Interface: MCP (its OAuth authorization).
- Contract: packages/mcp/src/oauth/discovery.ts (`discoverProtectedResourceMetadata`, `discoverAuthorizationServerMetadata`, `discoverOAuthServerInfo`), packages/mcp/src/oauth/flow.ts (`registerClient`, `startAuthorization`, `exchangeAuthorizationCode`, `refreshAuthorization`, `authorizeMcp`), packages/mcp/src/oauth/sign-in.ts (`startMcpSignIn`, `completeMcpSignIn`).
- Capability:
  - Sign in to server: takes the server's URL and the authorization code from the browser's redirect; gives tokens and a client registration from the server's authorization server, after discovery and, where needed, dynamic registration. produces MCP sign-in. Token refresh and step-up authorization keep the same sign-in: steps of it.
- Resource: MCP sign-in.

### Note on entry 1 (Agent session -> Pi Agent Core)

The session also calls pi-agent-core's `runToolCall` (agent-session.ts `_executeNestedToolCall`) for calls a tool makes while it runs (codemode's nested calls). nested-tool-calls.ts: "The agent loop does not know about them: the session runs each one through the agent's tool pipeline (`runToolCall`) ... and records the calls and their usage on the model-issued call's tool result message." The session calls it only while a tool call of the current run executes, and its result returns into that call, so it is a step of Run prompt, not a capability of its own. Recorded in `questions`.

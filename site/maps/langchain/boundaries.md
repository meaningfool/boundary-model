# Inner boundaries (step 3)

For each boundary below Level 1: the contract the consumer calls (with its path), the operations it calls, grouped by what the consumer gets back, and the resource they work on. Steps folded into an operation are named. Paths are repository-relative.

## Level 2: inside LangChain

### Agent framework -> Core abstractions
- Interface: langchain-core public API (the base classes and functions exported by libs/core/langchain_core/*/__init__.py).
- Calls seen: libs/langchain_v1/langchain/agents/factory.py imports `BaseChatModel`, messages, `BaseTool`; `_get_bound_model` calls `bind_tools` then the model; LangGraph's `ToolNode` (a library the agent loop uses) calls `BaseTool.invoke` with a tool call; middleware/summarization.py calls `model.invoke`; middleware/auto_mode.py and model_router.py ask `BaseDecisionModel` questions; mcp/tools.py builds `StructuredTool`s; messages/utils.py `trim_messages`, `count_tokens_approximately` used by summarization.py.
- Capabilities:
  - Call chat model: takes messages and the tools the model may call (bind_tools folded in as a step); gives an AI message with content blocks, tool calls and usage. produces Message. Contract: language_models/chat_models.py `BaseChatModel.invoke`, `ainvoke`, `stream`, `bind_tools`.
  - Run tool: takes a tool call; gives a tool message with the result, an artifact or the error. produces Message. Contract: tools/base.py `BaseTool.invoke`.
  - Ask decision model: takes a question and the content; gives a typed answer with its confidence. produces Model (an answer from the model). Contract: decisions/base.py `BaseDecisionModel.invoke`.
  - Define tool: takes a function, a schema and a description; gives a tool. produces Tool. Contract: tools/structured.py `StructuredTool.from_function`, tools/convert.py `tool`.
  - Trim messages: takes messages and a token budget; gives the messages that fit. observes Message. Contract: messages/utils.py `trim_messages`.
- Resources: Message, Tool, Model.

### Classic chains -> Core abstractions
- Interface: langchain-core public API.
- Calls seen: chains call `BaseLanguageModel.invoke`/`generate_prompt` (libs/langchain/langchain_classic/chains/llm.py), prompts `format_prompt` (chains/llm.py), output parsers `parse` (chains/llm.py, agents/output_parsers/), retrievers `invoke` (chains/retrieval_qa/base.py, conversational_retrieval/base.py), vector stores `similarity_search`, `add_documents` (memory/vectorstore.py, retrievers/parent_document_retriever.py), embeddings `embed_query` (evaluation/embedding_distance/base.py, retrievers/document_compressors/embeddings_filter.py), tools `run` (agents/agent.py `AgentExecutor._perform_agent_action`), callbacks `CallbackManager.configure` (chains/base.py), chat history `add_messages` (memory/chat_memory.py), key-value stores `mset`/`mget` (retrievers/parent_document_retriever.py, embeddings/cache.py).
- Capabilities:
  - Call chat model: as above. produces Message.
  - Embed text: takes texts; gives one vector per text. produces Model. Contract: embeddings/embeddings.py `Embeddings.embed_documents`, `embed_query`.
  - Render prompt: takes a prompt template and its variables; gives the text or messages. observes Prompt template. Contract: prompts/base.py `BasePromptTemplate.format_prompt`, `invoke`.
  - Parse output: takes a model's output; gives structured data. observes Message. Contract: output_parsers/base.py `BaseOutputParser.parse`, `parse_result`.
  - Retrieve documents: takes a query; gives the relevant documents. observes Vector store. Contract: retrievers.py `BaseRetriever.invoke`.
  - Add documents: takes documents; gives their ids. mutates Vector store. Contract: vectorstores/base.py `VectorStore.add_documents`.
  - Search documents: takes a query and k; gives the most similar documents. observes Vector store. Contract: vectorstores/base.py `VectorStore.similarity_search`.
  - Run tool: as above. produces Message.
  - Record run: takes a run's start, its tokens, its end or its error; gives the run recorded for callbacks and tracers. produces Run. Contract: callbacks/manager.py `CallbackManager.configure`, `on_chain_start`, run manager `on_chain_end`.
  - Keep chat history: takes a session's new messages; gives the stored history. mutates Conversation memory. Contract: chat_history.py `BaseChatMessageHistory.add_messages`, `messages`, `clear`.
- Resources: Message, Model, Prompt template, Vector store, Run, Conversation memory.

### Standard tests -> Core abstractions
- Interface: langchain-core public API.
- Calls seen: libs/standard-tests/langchain_tests/integration_tests/chat_models.py calls `invoke`, `stream`, `batch`, `bind_tools`, `with_structured_output`; unit_tests/chat_models.py checks construction and `dumpd`/`load` round trip; integration_tests/embeddings.py `embed_documents`/`embed_query`; vectorstores.py `add_documents`, `similarity_search`, `delete`, `get_by_ids`; retrievers.py `invoke`; tools.py `invoke` with a tool call; cache.py `lookup`/`update`; base_store.py `mset`/`mget`; indexer.py `upsert`/`get`/`delete`.
- Capabilities:
  - Call chat model: produces Message.
  - Get structured output: takes messages and a schema; gives an object matching it. produces Message. Contract: chat_models.py `BaseChatModel.with_structured_output`.
  - Embed text: produces Model.
  - Add documents: mutates Vector store.
  - Search documents: observes Vector store.
  - Retrieve documents: observes Vector store.
  - Run tool: produces Message.
  - Save object: takes an object; gives its JSON form. produces Serialized object. Contract: load/dump.py `dumpd`.
- Resources: Message, Model, Vector store, Serialized object.

### Classic chains -> Text splitters
- Interface: text splitter API (libs/text-splitters/langchain_text_splitters/__init__.py exports).
- Calls seen: libs/langchain/langchain_classic/retrievers/parent_document_retriever.py `child_splitter.split_documents`; chains/combine_documents/base.py and mapreduce.py `TextSplitter`; indexes/vectorstore.py default `RecursiveCharacterTextSplitter`; chains/qa_generation/base.py.
- Capabilities:
  - Split documents: takes documents or text with chunk size and overlap; gives chunk documents. produces Document. Contract: base.py `TextSplitter.split_documents`, `split_text`, `create_documents`.
- Resource: Document.

### Core abstractions -> Text splitters
- Interface: text splitter API.
- Calls seen: libs/core/langchain_core/document_loaders/base.py `BaseLoader.load_and_split` defaults to `RecursiveCharacterTextSplitter`; messages/utils.py `trim_messages` accepts a `TextSplitter` for partial messages.
- Capabilities: Split documents (as above). produces Document.
- Resource: Document.

### Core abstractions -> outside services (through the integration adapters)
Each adapter is configured with the provider's key and base URL (environment variables in the adapter, e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
- OpenAI (OpenAI API; libs/partners/openai/langchain_openai/chat_models/base.py, embeddings/base.py, llms/base.py, decisions/; `OPENAI_API_KEY`, `OPENAI_BASE_URL`): Generate response (takes messages, tools, settings; gives a completion or a stream), Embed text (texts; vectors), Classify content (a question and content; a decision). All on Hosted model.
- Azure OpenAI (Azure OpenAI API; chat_models/azure.py, embeddings/azure.py, llms/azure.py; `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_AD_TOKEN`): Generate response, Embed text. Hosted model.
- ChatGPT (ChatGPT Codex backend; chat_models/codex.py, chatgpt_oauth.py; OAuth against auth.openai.com, calls to chatgpt.com; private `_ChatOpenAICodex`, not exported): Generate response. Hosted model. Sign-in and token refresh are steps.
- Anthropic (Anthropic API; libs/partners/anthropic/langchain_anthropic/chat_models.py, llms.py; `ANTHROPIC_API_KEY`): Generate response.
- Groq (Groq API; langchain_groq/chat_models.py; `GROQ_API_KEY`): Generate response.
- Mistral AI (Mistral AI API; langchain_mistralai/chat_models.py, embeddings.py; `MISTRAL_API_KEY`): Generate response, Embed text.
- Fireworks AI (Fireworks AI API; langchain_fireworks/chat_models.py, embeddings.py, llms.py, rerank.py; `FIREWORKS_API_KEY`): Generate response, Embed text, Rerank documents (a query and documents; the documents ordered by relevance).
- DeepSeek (DeepSeek API; langchain_deepseek/chat_models.py on langchain-openai's `BaseChatOpenAI`; `DEEPSEEK_API_KEY`): Generate response.
- xAI (xAI API; langchain_xai/chat_models.py; `XAI_API_KEY`): Generate response.
- OpenRouter (OpenRouter API; langchain_openrouter/chat_models.py; `OPENROUTER_API_KEY`): Generate response.
- Perplexity (Perplexity API; langchain_perplexity/chat_models.py, embeddings.py, retrievers.py, tools.py; `PERPLEXITY_API_KEY`): Generate response, Embed text, Search the web (a query; web results). Hosted model, Web index.
- Hugging Face (Hugging Face Inference API; langchain_huggingface/llms/huggingface_endpoint.py, embeddings/huggingface_endpoint.py, chat_models/huggingface.py; `HUGGINGFACEHUB_API_TOKEN`): Generate response, Embed text. Local pipelines (llms/huggingface_pipeline.py, embeddings/huggingface.py) run in process through libraries.
- Ollama (Ollama API; langchain_ollama/chat_models.py, embeddings.py, llms.py; a local or remote Ollama server): Generate response, Embed text.
- Nomic (Nomic API; langchain_nomic/embeddings.py; `NOMIC_API_KEY`): Embed text.
- Exa (Exa API; langchain_exa/retrievers.py, tools.py; `EXA_API_KEY`): Search the web, Find similar pages. Web index.
- Chroma (Chroma client; langchain_chroma/vectorstores.py; a local, server or cloud Chroma database): Store vectors (documents with vectors; ids), Search vectors (a query vector; nearest documents). Vector collection.
- Qdrant (Qdrant client; langchain_qdrant/qdrant.py, vectorstores.py; `QDRANT_API_KEY`): Store vectors, Search vectors. Vector collection.
- TypeSafe (TypeSafe API; langchain_typesafe/client.py, classifier.py; `TYPESAFE_API_KEY`): Classify content. Hosted model.
- LangSmith (LangSmith API through the langsmith SDK; libs/core/langchain_core/tracers/langchain.py `LangChainTracer`, `get_client`; document_loaders/langsmith.py `LangSmithLoader`; `LANGSMITH_API_KEY` read by the SDK, tracing switched on by `LANGSMITH_TRACING`/`LANGCHAIN_TRACING_V2`): Record traces (runs; traces in a project), Load dataset examples (a dataset; its examples). Trace, Dataset.
- LangSmith (LangSmith LLM gateway; libs/core/langchain_core/utils/_gateway.py, used by the chat adapters and by `init_chat_model(..., model_provider="langsmith")`; `LANGSMITH_GATEWAY`, `LANGSMITH_GATEWAY_API_KEY`): Generate response through gateway. Hosted model.
- mermaid.ink (mermaid.ink API; libs/core/langchain_core/runnables/graph_mermaid.py `_render_mermaid_using_api`): Render diagram (Mermaid text; a PNG). Diagram.

### Agent framework -> outside services
- MCP servers (MCP protocol through fastmcp; libs/langchain_v1/langchain/mcp/adapter.py `MCPAdapter`, `list_tools`; tools.py `as_langchain_tool` `call_tool`; elicitation.py): List tools (a server; its tools), Call tool (a tool and arguments; its result, with the server's elicitation questions turned into interrupts). MCP tool.
- Shell sandbox (subprocess; libs/langchain_v1/langchain/agents/middleware/_execution.py `HostExecutionPolicy`, `DockerExecutionPolicy` (`docker`), `CodexSandboxExecutionPolicy` (`codex`); shell_tool.py): Run command (a command; its output and exit code in a persistent shell session). Shell session.
- OpenAI (OpenAI API; libs/partners/openai/langchain_openai/middleware/openai_moderation.py `moderations.create`): Moderate content (text; flagged categories). Hosted model.
- LangSmith (LangSmith API; libs/langchain_v1/langchain/agents/factory.py `traceable(name=f"{m.name}.wrap_model_call")`): Record traces (middleware spans). Trace.

### Text splitters -> outside services
- Web sites and HTTP APIs (HTTP through core's SSRF-safe client; libs/text-splitters/langchain_text_splitters/html.py `HTMLHeaderTextSplitter.split_text_from_url`): Fetch page (a URL; its HTML). Web resource.

### Classic chains -> outside services
- LangSmith (LangSmith API; libs/langchain/langchain_classic/hub.py `push`, `pull` (deprecated); smith/evaluation/runner_utils.py `run_on_dataset` with `langsmith.Client`): Push or pull hub prompt (a prompt name; the prompt), Run tests on dataset (a dataset; a test project with runs and feedback). Hub prompt, Dataset, Trace.
- OpenAI (OpenAI API; agents/openai_assistant/base.py `OpenAIAssistantRunnable`; chains/moderation.py): Run assistant (an assistant, a thread and a message; the run's output), Moderate content. Assistant thread, Hosted model.
- Elasticsearch (Elasticsearch API; chains/elasticsearch_database/base.py): Query index (a query; matching records). Search index.
- Web sites and HTTP APIs (HTTP; chains/natbot/crawler.py through Playwright; chains/openai_functions/openapi.py through requests): Browse page (a URL; the page's elements), Call HTTP API (an operation of an OpenAPI spec; the response). Web resource.
- SQL database (SQLAlchemy URL; indexes/_sql_record_manager.py `SQLRecordManager`; memory/entity.py `SQLiteEntityStore`): Keep records (keys and times; stored rows). Database table.
- Redis (Redis protocol; memory/entity.py `RedisEntityStore`, `UpstashRedisEntityStore`): Keep entity facts (an entity's facts; stored entries). Key-value entry.

### Model profile refresher -> outside services
- models.dev (models.dev API; libs/model-profiles/langchain_model_profiles/cli.py `refresh`, `api_url = "https://models.dev/api.json"`): Fetch model catalog (nothing; every provider's models with their capabilities). Model catalog.

## Level 3: inside Agent framework

### Agent loop -> Middleware
- Interface: middleware hooks (libs/langchain_v1/langchain/agents/middleware/types.py `AgentMiddleware`).
- Operations: `before_agent`, `before_model`, `after_model`, `after_agent` (return state updates or a jump), `wrap_model_call` (returns a `ModelResponse` or `ExtendedModelResponse`), `wrap_tool_call` (returns a `ToolMessage` or `Command`); plus the attributes `tools` and `state_schema` read when the graph is built (steps of creating the agent).
- Capabilities:
  - Adjust agent state: takes the thread state at a hook point; gives state updates or a jump to the model, the tools or the end. mutates Agent thread.
  - Handle model call: takes the model request (model, messages, tools, system prompt) and the next handler; gives the model response, changed or replaced. mutates Agent thread.
  - Handle tool call: takes a tool call request and the next handler; gives the tool message or a command. mutates Agent thread.
- Resource: Agent thread (each middleware's own keys).

### Agent loop -> Model initializer
- Interface: init_chat_model (libs/langchain_v1/langchain/chat_models/base.py `init_chat_model`; embeddings/base.py `init_embeddings`).
- Operation: `init_chat_model(model, model_provider=None, configurable_fields=None, **kwargs)`; factory.py calls it when `create_agent` gets a model name.
- Capabilities: Resolve model: takes "provider:model" or a model name and settings; gives a chat model of the matching integration. produces Model.
- Resource: Model.

### Middleware -> Model initializer
- Interface: init_chat_model.
- Calls: model_fallback.py, model_router.py, summarization.py, tool_emulator.py, tool_selection.py call `init_chat_model`.
- Capabilities: Resolve model (as above). produces Model.

## Level 3: inside Core abstractions

### Models -> Run tracing
- Interface: callback manager (libs/core/langchain_core/callbacks/manager.py `CallbackManager.configure`, `CallbackManagerForLLMRun`).
- Operations: `configure`, `on_chat_model_start`, `on_llm_start`, `on_llm_new_token`, `on_llm_end`, `on_llm_error`.
- Capabilities: Record run: takes a model call's start, tokens, end or error; gives the run recorded and passed to every handler. produces Run.

### Tools -> Run tracing
- Interface: callback manager. Operations: `configure`, `on_tool_start`, `on_tool_end`, `on_tool_error` (tools/base.py imports callbacks). Capability: Record run. produces Run.

### Documents and retrieval -> Run tracing
- Interface: callback manager. Operations: `configure`, `on_retriever_start`, `on_retriever_end`, `on_retriever_error` (retrievers.py). Capability: Record run. produces Run.

### Runnable runtime -> Run tracing
- Interface: callback manager; plus the event-stream and log-stream tracers that `astream_events`/`astream_log` add as handlers (runnables/base.py imports tracers/event_stream.py, log_stream.py, root_listeners.py).
- Operations: `configure`, `on_chain_start`, `on_chain_end`, `on_chain_error`; adding an event-stream or listener handler.
- Capabilities: Record run (produces Run); Stream run events: takes a run started with an event stream; gives start, stream and end events for every nested step (observes Run).

### Models -> Runnable runtime
- Interface: Runnable composition (libs/core/langchain_core/runnables/base.py `RunnableSequence`, `RunnableMap`, `RunnablePassthrough`, `|`).
- Calls: language_models/chat_models.py `with_structured_output` composes the bound model with a parser (`RunnableMap`, `RunnablePassthrough.assign`); `bind_tools` returns a `RunnableBinding`.
- Capabilities: Compose chain: takes steps; gives a chain that runs them in order or side by side. produces Chain.

### Models -> Output parsers
- Interface: output parser contract (libs/core/langchain_core/output_parsers/base.py `BaseOutputParser`; openai_tools.py `PydanticToolsParser`, `JsonOutputKeyToolsParser`).
- Capabilities: Parse output: takes an AI message with tool calls; gives the schema's object. observes Message.

### Models -> Tools
- Interface: tool schema conversion (libs/core/langchain_core/utils/function_calling.py `convert_to_openai_tool`).
- Capabilities: Describe tool: takes a tool, a function or a schema; gives its JSON description for a model. observes Tool.

### Models -> Serialization; Run tracing -> Serialization; Prompts -> Serialization
- Interface: serialization functions (libs/core/langchain_core/load/dump.py `dumpd`, `dumps`; load.py `load`, `loads`).
- Calls: chat_models.py and llms.py `dumps` for cache keys and `dumpd` for run inputs; tracers/core.py, tracers/langchain.py `dumpd`; prompts/base.py `dumpd`.
- Capabilities: Save object: takes an object; gives its JSON form without secrets. produces Serialized object.

### Documents and retrieval -> Models
- Interface: embeddings contract (libs/core/langchain_core/embeddings/embeddings.py `Embeddings`).
- Calls: vectorstores/in_memory.py `embedding.embed_documents`, `embed_query`; vector store adapters (Chroma, Qdrant) the same.
- Capabilities: Embed text: takes texts or a query; gives vectors. produces Model.

### Indexing -> Documents and retrieval
- Interface: vector store contract (libs/core/langchain_core/vectorstores/base.py `VectorStore`; indexing/base.py `DocumentIndex`).
- Calls: indexing/api.py `destination.add_documents`, `destination.upsert`, `destination.delete`.
- Capabilities: Add documents (documents with ids; mutates Vector store), Delete documents (ids; mutates Vector store).

### Tools -> Documents and retrieval
- Interface: retriever contract (libs/core/langchain_core/retrievers.py `BaseRetriever`).
- Calls: tools/retriever.py `retriever.invoke`, `ainvoke`.
- Capabilities: Retrieve documents: takes a query; gives the relevant documents. observes Vector store.

### Prompts -> Documents and retrieval
- Interface: vector store contract.
- Calls: example_selectors/semantic_similarity.py `vectorstore.add_texts`, `similarity_search`, `max_marginal_relevance_search`.
- Capabilities: Add documents (mutates Vector store), Search documents (observes Vector store).

## Level 3: inside Classic chains

### Legacy chains -> Memory
- Interface: memory contract (libs/langchain/langchain_classic/base_memory.py `BaseMemory`).
- Calls: chains/base.py `self.memory.load_memory_variables`, `save_context`, `asave_context`.
- Capabilities: Load memory (inputs; the remembered context to add to the prompt; observes Conversation memory), Save turn (inputs and outputs; the updated memory; mutates Conversation memory).

### Legacy agents -> Legacy chains
- Interface: Chain contract (libs/langchain/langchain_classic/chains/base.py `Chain`, chains/llm.py `LLMChain`).
- Calls: agents/agent.py `Agent.llm_chain: LLMChain`, `self.llm_chain.run`/`predict`.
- Capabilities: Run chain: takes the chain's inputs; gives its outputs. produces Legacy chain.

### Classic retrievers -> Legacy chains
- Interface: query constructor (libs/langchain/langchain_classic/chains/query_constructor/base.py `load_query_constructor_runnable`).
- Calls: retrievers/self_query/base.py.
- Capabilities: Build query constructor: takes a model, a description of the documents and their metadata fields; gives a chain that turns a question into a query with filters. produces Legacy chain.

### Dataset runner -> Evaluation
- Interface: evaluator loader (libs/langchain/langchain_classic/evaluation/loading.py `load_evaluator`; schema.py `StringEvaluator.evaluate_strings`).
- Calls: smith/evaluation/runner_utils.py `load_evaluator`; string_run_evaluator.py wraps string evaluators.
- Capabilities: Score output: takes a prediction, an optional reference and the input; gives a score, a value and reasoning. produces Evaluation.

## Level 4: inside Run tracing

### Callback manager -> Tracers and handlers
- Interface: callback handler contract (libs/core/langchain_core/callbacks/base.py `BaseCallbackHandler`; `on_chain_start`, `on_llm_new_token`, `on_tool_end`, `on_retriever_end`, `on_custom_event` ...).
- Calls: callbacks/manager.py `handle_event` (`getattr(handler, event_name)(*args, **kwargs)`), `ahandle_event`.
- Capabilities: Record run event: takes an event for a run; gives the handler's update (the run tree, a printed line, a streamed event, a usage total). mutates Run.

## Level 4: inside Prompts

### Prompt templates -> Example selectors
- Interface: example selector contract (libs/core/langchain_core/example_selectors/base.py `BaseExampleSelector.select_examples`, `aselect_examples`).
- Calls: prompts/few_shot.py `self.example_selector.select_examples(kwargs)`.
- Capabilities: Select examples: takes the prompt's input variables; gives the examples to include. observes Example.

## Level 4: inside Legacy agents

### Agent executor -> Agent types
- Interface: agent planning contract (libs/langchain/langchain_classic/agents/agent.py `BaseSingleActionAgent.plan`, `aplan`, `BaseMultiActionAgent.plan`, `return_stopped_response`).
- Calls: agents/agent.py `AgentExecutor._iter_next_step` -> `self._action_agent.plan(...)`.
- Capabilities: Plan next step: takes the input and the steps taken so far; gives the next tool action or the final answer. observes Agent scratchpad.

## Level 4: inside Classic retrievers

### Retriever variants -> Document compressors
- Interface: document compressor contract (libs/core/langchain_core/documents/compressor.py `BaseDocumentCompressor.compress_documents`).
- Calls: libs/langchain/langchain_classic/retrievers/contextual_compression.py `self.base_compressor.compress_documents`.
- Capabilities: Compress documents: takes documents and the query; gives the documents kept, cut down or reordered. produces Document.

## Added in step 5 (revision)

- Agent framework -> Core abstractions: Create model: takes an integration's class, a model name and settings; gives a configured chat or embedding model. produces Model. Contract: the integration classes' constructors, called by libs/langchain_v1/langchain/chat_models/base.py `_get_chat_model_creator` (`_import_module`, `getattr(module, class_name)`).
- Middleware -> Model initializer: Infer model provider: takes a model name; gives its provider. observes Model. Contract: the private `_attempt_infer_model_provider` (libs/langchain_v1/langchain/chat_models/base.py), imported by middleware/provider_tool_search.py; named in the init_chat_model interface.
- Standard tests -> Core abstractions: Use response cache: takes prompts, model settings and generations; gives the entries stored, looked up and cleared. mutates Response cache. Contract: caches.py `BaseCache.lookup`, `update`, `clear` (libs/standard-tests/langchain_tests/integration_tests/cache.py).
- Classic chains -> SQL database: Read table schema: takes table names; gives their definitions and sample rows. observes Database table. Contract: langchain_community's `SQLDatabase` (a dependency) as used by libs/langchain/langchain_classic/chains/sql_database/query.py `create_sql_query_chain` (`db.dialect`, table info).
- Areas that hold one capability renamed to the capability's name (model rule): for example "Record runs" to "Record run" for Models, Tools and Documents and retrieval; "Reuse model responses" to "Cache model responses".

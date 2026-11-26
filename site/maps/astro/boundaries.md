# Boundaries below Level 1

For each boundary: the interface, the contract the consumer calls with its path, its operations, and the capabilities and resources they give. Steps an operation serves are folded into it. Capabilities are grouped in areas; the first area is core.

## Level 2: inside Astro

### Site framework <-> Component compiler

- Interface: astro() plugin API. Contract: `astro(options: AstroPluginOptions, cli?: AstroPluginCli): Plugin[]` and `getAstroApi(config)` (packages/vite-plugin-astro/src/plugin.ts, src/options.ts, src/internal/cli.ts); the declared `_internal/*` modules the framework imports (API.md "Internal modules": compile, metadata, vite-plugin-css/collect, client-directive, vite-id, errors). Called from packages/astro/src/core/create-vite.ts with toAstroOptions and toAstroCli (packages/astro/src/core/astro-options.ts).
- Operations: astro(options, cli) compiles .astro modules, serves renderers, directives and scripts; getAstroMetadata(moduleInfo) gives a module's hydrated components, scripts and propagation; collectCSSWithOrder gives a dev page's stylesheets; buildClientDirectiveEntrypoint bundles a custom directive; HMR of .astro files is a step of compiling in dev.
- Capabilities: Compile components (core): Compile Astro components (takes .astro files and the project's options; gives JavaScript modules with scoped styles and scripts; produces Component). Read component metadata (takes a compiled module; gives its islands, scripts and head propagation; observes Component). Collect page styles (takes a page in dev; gives its stylesheets in order; observes Component). Bundle client directive (takes a custom directive's entrypoint; gives the bundled script; produces Component).
- Resources: Component.

### Site framework <-> Render runtime

- Interface: render runtime API. Contract: `@astrojs/runtime/server` (renderComponent, renderPage, renderTemplate, renderSlot, createAstro) and `_internal/*` (server/render/page.js, render-scope/*, core/encryption.js, transitions/*) (packages/runtime/package.json exports, packages/runtime/API.md "Internal modules", packages/runtime/src/server/index.ts).
- Operations: renderPage renders a page component to a streamed Response; renderComponent renders a component or island; server island rendering and encryption (createKey, encryptString, decryptString) protect island props; render scope collects the images and content entries a page used (installRenderScope, collect); transition events and swap functions run a view transition in the browser.
- Capabilities: Render pages (core): Render page (takes a page component and its props and request; gives the HTML response; observes Page). Render component (takes a component, its props and slots; gives its HTML and island script; observes Component). Encrypt island props (takes server island props and the site key; gives encrypted props, and decrypts them on the island's request; produces Component). Collect render metadata (takes a prerendered page's render; gives the images and content entries it used; observes Page). Swap page in the browser (takes the next page's document; gives the swapped document with transition events; observes Page).
- Resources: Page, Component.

### Site framework <-> Language tools

- Interface: @astrojs/check API. Contract: `check(flags)` and `parseArgsAsCheckConfig(argv)` (packages/language-tools/astro-check/src/index.ts), called from packages/astro/src/cli/check/index.ts after sync.
- Operations: check runs the language server's diagnostics over the project, once or in watch mode, and returns whether errors were found.
- Capabilities: Check project (core): Check project (takes the project root and check options; gives diagnostics and an exit result; observes Component).
- Resources: Component.

### Language tools <-> Site framework

- Interface: collection schema files. Contract: `.astro/collections/collections.json` and the per-collection JSON schemas written by packages/astro/src/content/types-generator.ts (COLLECTIONS_DIR, COLLECTIONS_MANIFEST_FILE in content/consts.ts), read by packages/language-tools/language-server/src/nodeServer.ts loadCollectionConfig.
- Operations: read the collections manifest and the schema of each collection for frontmatter completions and validation.
- Capabilities: Read collection schemas (core): Read collection schemas (takes a workspace folder; gives each content collection's JSON schema; observes Content collection).
- Resources: Content collection.

### Site framework <-> Telemetry

- Interface: AstroTelemetry API. Contract: class AstroTelemetry: record(event), notify(callback), setEnabled(value), clear(), isValidNotice() (packages/telemetry/src/index.ts), used from packages/astro/src/events/index.ts, cli/telemetry/index.ts and cli/index.ts.
- Operations: record sends events when telemetry is enabled; notify shows the notice once (a step of recording); setEnabled and clear change the setting and the anonymous ID.
- Capabilities: Record usage (core): Record usage event (takes an event name and payload; gives nothing to wait for, the event is sent when allowed; produces Usage event). Change telemetry setting (supporting): Change telemetry setting (takes enable, disable or reset; gives the new setting; mutates Preference).
- Resources: Usage event, Preference.

### Component compiler <-> Render runtime

- Interface: render setup module. Contract: `setRenderConfig()` in packages/runtime/src/internal/render-setup.ts, called by `virtual:astro:render-setup`, which the compiler adds to every compiled module in server environments (packages/vite-plugin-astro/src/vite-plugin-render-setup/index.ts); compiled components import `@astrojs/runtime/compiler-runtime` (packages/runtime/src/compiler/index.ts).
- Operations: setRenderConfig registers renderers, client directives and the component assets function; the compiler-runtime exports are what compiled code calls to render.
- Capabilities: Register render setup (core): Register renderers (takes the plugin's renderers, client directives and component assets; gives a runtime ready to render compiled components; mutates Renderer).
- Resources: Renderer.

### Site framework <-> npm registry

- Interface: npm registry API. Contract: fetchPackageJson and fetchPackageVersions (packages/astro/src/cli/install-package.ts, registry from the package manager or https://registry.npmjs.org).
- Operations: get a package's manifest for a tag; get its published versions.
- Capabilities: Look up packages (core): Look up package versions (takes a package name and tag or range; gives its manifest or versions; observes Package).
- Resources: Package.

### Site framework <-> Astro integrations catalog

- Interface: integrations catalog API. Contract: GET https://astro.build/api/v1/dev-overlay/ (packages/astro/src/runtime/client/dev-toolbar/apps/astro.ts fetchIntegrationData).
- Capabilities: List integrations (core): List integrations (takes nothing; gives the featured integrations for the dev toolbar; observes Integration listing).
- Resources: Integration listing.

### Site framework <-> Web font providers

- Interface: font provider APIs. Contract: unifont providers adobe, bunny, fontshare, fontsource, google wrapped as FontProvider (packages/astro/src/assets/fonts/providers/index.ts, types.ts FontProvider resolveFont, listFonts).
- Operations: resolveFont(family, options) gives font faces and file URLs; listFonts lists available families; the files are downloaded and cached (infra/cached-font-fetcher.ts), a step of resolving.
- Capabilities: Get web fonts (core): Resolve font family (takes a family name, weights, styles and subsets; gives font faces and font files; observes Font family). List font families (takes nothing; gives the provider's family names, used to suggest names; observes Font family).
- Resources: Font family.

### Site framework <-> Remote image hosts

- Interface: HTTP image fetch. Contract: loadRemoteImage and revalidation in packages/astro/src/assets/build/remote.ts and assets/endpoint/loadImage.ts, limited by image.domains and image.remotePatterns (isRemoteAllowed from @astrojs/internal-helpers/remote, packages/internal-helpers/src/remote.ts).
- Capabilities: Fetch remote images (core): Fetch remote image (takes an allowed image URL; gives the image bytes and cache headers; observes Image).
- Resources: Image.

### Site framework <-> Hosting platform

- Interface: platform deployment output and platform APIs, reached through the deployment adapters. Contract: AstroAdapter set with setAdapter (packages/astro/src/types/public/integrations.ts); the adapters write each platform's format (packages/integrations/vercel/src/index.ts .vercel/output config, packages/integrations/netlify/src/index.ts .netlify functions, packages/integrations/cloudflare/src/index.ts and wrangler.ts), and implement CacheProvider (vercel|netlify|cloudflare src/cache/provider.ts: CDN cache headers and invalidateByTag, purgeCache, cache.purge), image services (vercel/src/image/build-service.ts, netlify/src/image-service.ts, cloudflare/src/entrypoints/image-service-*.ts).
- Capabilities: Run the site (core): Run built site (takes the server entrypoint, static files and routes in the platform's format; gives the site served by the platform's functions or workers; produces Deployment). Cache responses on the CDN (supporting): Cache response on CDN (takes a response with max age and tags; gives it cached at the edge; mutates Cached response). Purge CDN cache (takes tags or paths; gives the matching entries removed; mutates Cached response). Transform images on the platform (supporting): Transform image (takes an image URL, width, format and quality; gives the platform-optimized image; produces Image).
- Resources: Deployment, Cached response, Image.

### Site framework <-> Session storage

- Interface: session driver. Contract: unstorage drivers named by session.driver, with built-in entries in packages/astro/src/core/session/drivers.ts, Netlify Blobs set by packages/integrations/netlify/src/index.ts, Cloudflare KV by packages/integrations/cloudflare/src/index.ts; read and written by AstroSession (packages/astro/src/core/session/runtime.ts load, persist through the storage).
- Capabilities: Store sessions (core): Store session data (takes a session ID and its data with a TTL; gives it stored; mutates Session). Load session data (takes a session ID; gives the stored data; observes Session). Remove session data (takes a session ID; gives the entry removed; mutates Session).
- Resources: Session.

### Project scaffolder <-> GitHub

- Interface: GitHub repository archives, through giget. Contract: downloadTemplate(`github:withastro/astro#examples/<name>` or a third-party repo) and verifyTemplate (packages/create-astro/src/actions/template.ts, verify.ts).
- Capabilities: Get templates (core): Download template (takes a template name or repository; gives the template's files; observes Template). Check template exists (a step of downloading, folded in).
- Resources: Template.

### Project scaffolder <-> npm registry

- Interface: npm registry API. Contract: fetch(`${registry}/${packageName}/${packageTag}`) in packages/create-astro/src/messages.ts getVersion; dependency install runs the package manager (src/actions/dependencies.ts).
- Capabilities: Look up packages (core): Look up package versions (takes a package name and tag; gives the version; observes Package).
- Resources: Package.

### Upgrader <-> npm registry

- Interface: npm registry API. Contract: fetch(`${registry}/${name}`) and `/latest` in packages/upgrade/src/actions/verify.ts; install with the package manager in src/actions/install.ts.
- Capabilities: Look up packages (core): Look up package versions (takes an installed Astro package; gives its versions and tags; observes Package).
- Resources: Package.

### Upgrader <-> Astro documentation site

- Interface: docs website. Contract: fetch(`https://docs.astro.build/en/guides/upgrade-to/v<major>/`) in packages/upgrade/src/actions/verify.ts.
- Capabilities: Find upgrade guide (core): Find upgrade guide (takes a major version; gives the guide's URL when it exists; observes Upgrade guide).
- Resources: Upgrade guide.

### Telemetry <-> Astro telemetry service

- Interface: telemetry API. Contract: POST https://telemetry.astro.build/api/v1/record (packages/telemetry/src/post.ts).
- Capabilities: Record usage (core): Record usage event (takes events with anonymous context; gives them stored by the service; produces Usage event).
- Resources: Usage event.

## Level 3: inside Site framework

### Dev server <-> Project setup, Site builder <-> Project setup, Preview server <-> Project setup

- Interface: project setup functions. Contract: resolveConfig (packages/astro/src/core/config/config.ts), createSettings (core/config/settings.ts), runHookConfigSetup, runHookConfigDone, runHookServerSetup, runHookServerStart, runHookServerDone, runHookBuildStart, runHookBuildSetup, runHookBuildSsr, runHookBuildGenerated, runHookBuildDone, runHookRoutesResolved (packages/astro/src/integrations/hooks.ts), createVite (core/create-vite.ts), syncInternal (core/sync/index.ts). Called from core/dev/container.ts, core/build/index.ts, core/preview/index.ts.
- Capabilities: Set up the project (core): Resolve project (takes the root and inline config; gives the validated settings with every integration's additions; produces Project). Run integration hooks (takes a lifecycle stage and its data; gives the integrations' changes applied; mutates Project). Create Vite config (takes the settings and command; gives the Vite config with Astro's plugins; observes Project). Sync project (takes the settings; gives content synced and types generated; mutates Project). The preview server uses Resolve project and Run integration hooks only.
- Resources: Project.

### Dev server <-> Request handler

- Interface: dev app. Contract: createAstroServerApp (packages/astro/src/vite-plugin-app/createAstroServerApp.ts) building an App (core/app/base.ts render, match, devMatch, renderError) and updateRouteTable (core/routing/route-table.ts), with the dev environment registered by setEnvironment (core/environment/index.ts).
- Capabilities: Serve requests in development (core): Render request (takes a dev request; gives the page, endpoint or error response; observes Page). Update routes (takes the new route list after a file change; gives the route table swapped at once; mutates Page).
- Resources: Page.

### Site builder <-> Request handler

- Interface: build app. Contract: renderForPrerender (packages/astro/src/core/app/prerender.ts), StaticPaths (runtime/prerender/static-paths.ts), createRoutesList (core/routing/create-manifest.ts), manifest serialization (core/app/manifest.ts, src/manifest/serialized.ts).
- Capabilities: Prerender pages (core): List routes (takes the project; gives every page, endpoint and redirect with its pattern; observes Page). List static paths (takes the routes; gives every path to prerender with its params; observes Page). Prerender page (takes a path and its route; gives the rendered response and its render metadata; observes Page).
- Resources: Page.

### Dev server <-> Content layer, Project setup <-> Content layer

- Interface: content layer API. Contract: globalContentLayer (packages/astro/src/content/instance.ts) and ContentLayer.sync, watchContentConfig, unwatchContentConfig, dispose, regenerateCollectionFileManifest (content/content-layer.ts); createContentTypesGenerator (content/index.ts, content/types-generator.ts); attachContentServerListeners (content/server-listeners.ts).
- Capabilities: Keep content in sync (core): Sync content (takes the content config, and optionally the collections to refresh; gives the data store filled by the loaders; mutates Content collection). Watch content (takes the dev server's watcher; gives the store updated when files change; mutates Content collection). Generate content types (takes the content config; gives the types and collection schemas; observes Content collection).
- Resources: Content collection, Content entry.

### Site builder <-> Images

- Interface: image generation API. Contract: prepareAssetsGenerationEnv, generateImagesForPath, StaticImageRegistry (packages/astro/src/assets/build/generate.ts), called from core/build/generate.ts.
- Capabilities: Generate images (core): Generate optimized images (takes the static image transforms the pages used; gives the optimized files, reused from the cache when unchanged; produces Image).
- Resources: Image.

### Project setup <-> Fonts

- Interface: fonts plugin and sync. Contract: the fonts Vite plugin (packages/astro/src/assets/fonts/vite-plugin-fonts.ts) added by assets/vite-plugin-assets.ts in core/create-vite.ts, and syncFonts (assets/fonts/sync.ts) called by core/sync/index.ts.
- Capabilities: Prepare fonts (core): Resolve fonts (takes the `fonts` config; gives each family's faces, fallbacks and file URLs, served in dev and copied at build; produces Font family). Generate font types (takes the settings; gives the font CSS variable types; observes Font family).
- Resources: Font family.

### Project setup <-> Environment variables

- Interface: env plugin and sync. Contract: astroEnv Vite plugin (packages/astro/src/env/vite-plugin-env.ts), syncAstroEnv (env/sync.ts), validators (env/validators.ts).
- Capabilities: Prepare environment variables (core): Validate environment variables (takes `env.schema` and the loaded variables; gives typed values or a list of invalid variables; observes Environment variable). Generate env types (takes the schema; gives the astro:env types; observes Environment variable).
- Resources: Environment variable.

### Request handler <-> Actions

- Interface: action handler. Contract: handleAction(state) (packages/astro/src/actions/handler.ts) and getActionResult, callAction through the API context (actions/runtime/server.ts, actions/load.ts).
- Capabilities: Run actions (core): Handle action call (takes an action request, JSON or form; gives the serialized result or error, or the result for the page to read; produces Action). Call action on the server (takes an action and its input from page code; gives the typed result; produces Action).
- Resources: Action.

### Request handler <-> Sessions

- Interface: session provider. Contract: provideSession(state) (packages/astro/src/core/session/provider.ts re-exporting handler.ts) and AstroSession get, set, delete, has, keys, values, entries, regenerate, destroy, load (core/session/runtime.ts).
- Capabilities: Keep sessions (core): Provide session (takes the request and its session cookie; gives Astro.session for the page; observes Session). Read session data (takes a key; gives the value; observes Session). Change session data (takes keys and values, or regenerate or destroy; gives the updated session, saved after the response; mutates Session).
- Resources: Session.

### Request handler <-> Response cache

- Interface: cache handler. Contract: provideCache, handleCache, provideAndHandleCache (packages/astro/src/core/cache/handler.ts) and CacheLike on Astro.cache: set, tags, invalidate (core/cache/runtime/cache.ts, core/cache/types.ts CacheProvider).
- Capabilities: Cache responses (core): Serve cached response (takes a request whose route has cache rules; gives the cached response or renders and stores it; mutates Cached response). Set cache options (takes max age and tags from page code; gives them applied to the response; mutates Cached response). Invalidate cached responses (takes tags or paths; gives the entries removed; mutates Cached response).
- Resources: Cached response.

### Dev server <-> Preferences

- Interface: AstroPreferences. Contract: get, set, getAll, list (packages/astro/src/preferences/index.ts), created by core/config/settings.ts, read by core/dev/dev.ts and core/astro-options.ts toolbarEnabled.
- Capabilities: Read preferences (core): Read preference (takes a key such as devToolbar.enabled or checkUpdates.enabled; gives its value from the project, the global file or the defaults; observes Preference).
- Resources: Preference.

### Content layer <-> Images

- Interface: content image helpers. Contract: imageSrcToImportId (packages/astro/src/assets/utils/resolveImports.ts) and createSvgComponent (assets/runtime.ts), imported by content/runtime.ts; the `image()` schema helper resolves images during sync (content/utils.ts).
- Capabilities: Resolve entry images (core): Resolve entry image (takes an image path in an entry's data or body; gives the image's import and metadata; observes Image).
- Resources: Image.

### Request handler <-> Render runtime

- Interface: render runtime API (as at Level 2). Contract: renderPage and renderComponent (packages/runtime/src/server/index.ts), encryption (packages/runtime/src/internal/core/encryption.ts), used from packages/astro/src/core/render/, core/server-islands/endpoint.ts.
- Capabilities: Render pages (core): Render page, Render component, Encrypt island props (as at Level 2).
- Resources: Page, Component.

### Project setup <-> Component compiler

- Interface: astro() plugin API (as at Level 2). Contract: astro(toAstroOptions(settings), toAstroCli(settings, ...)) in packages/astro/src/core/create-vite.ts.
- Capabilities: Compile components (core): Compile Astro components (as at Level 2).
- Resources: Component.

### Integration installer <-> npm registry, Dev server <-> npm registry

- Interface: npm registry API (as at Level 2). Contract: fetchPackageJson, fetchPackageVersions (packages/astro/src/cli/install-package.ts), used by cli/add/index.ts and core/dev/update-check.ts.
- Capabilities: Look up packages (core): Look up package versions (as at Level 2). For the dev server: Check for Astro update (takes the installed version; gives the latest published version; observes Package).
- Resources: Package.

### Dev server <-> Astro integrations catalog

- Same contract as at Level 2 (dev toolbar Astro app, served by the dev server).

### Fonts <-> Web font providers; Images <-> Remote image hosts; Images <-> Hosting platform; Response cache <-> Hosting platform; Site builder <-> Hosting platform; Sessions <-> Session storage

- Same contracts as the Level 2 boundaries with these outside services, used by the component named.

## Level 4: inside Content layer

### Collection queries <-> Content sync

- Interface: data store module. Contract: the serialized data store served as a virtual module (packages/astro/src/content/vite-plugin-content-virtual-mod.ts, paths.ts getDataStoreFile) and read through ImmutableDataStore get, entries, values, keys, has, hasCollection, collections (content/data-store.ts), globalDataStore used by content/runtime.ts.
- Capabilities: Read stored entries (core): Read stored entry (takes a collection and an ID; gives the entry's data, body, rendered HTML and digest; observes Content entry). List stored entries (takes a collection; gives its entries; observes Content collection).
- Resources: Content entry, Content collection.

### Cross-level boundaries of the Level 4 components

- Dev server and Project setup reach Content sync and Content types generator through the content layer API above (sync, watch, generate types).
- Site developer's Build sites area reaches Collection queries through astro:content (getCollection, getEntry, getEntries, render, getLiveCollection, getLiveEntry: packages/astro/src/content/runtime.ts).
- Language tools read the collection schemas the Content types generator writes.

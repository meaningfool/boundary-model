# Review preview

A build of the site for review in a private claude.ai artifact. A toolbar over the site lets the owner edit text and leave notes on the page itself. Each change is saved in the artifact's database, and one button sends the whole batch to Claude, who applies the edits to the MDX files.

The deployed site never changes: `npm run build` has no source tags and no overlay. Only `npm run review` adds them.

## Build

```bash
npm run review
```

It draws the Store's maps, builds the site into `review/out/site/` with one HTML file per page and every link relative, and checks the source tags. It writes:

- `out/index.html`: the shell, the artifact's main page. It shows `site/index.html` full size in a frame and carries the toolbar.
- `out/overlay.js`: the toolbar and pop-ups, loaded by the shell.
- `out/sources.json`: each page's MDX file, and the source of every tagged element, which the pop-ups show.
- `out/site/`: the built site.
- `out/files.json`: the `files` map to publish beside the shell, with `contentType` set for fonts.

The build writes a temporary `review.config.mjs` beside `astro.config.mjs` and deletes it when the build ends. It keeps its own cache in `review/.cache/`, so nothing from it reaches the deployed build.

## Publish

Publish `out/index.html` as the page, with `out/files.json` as its supporting files, and declare `capabilities: {db: {}, user: {}, comments: {}}`. The shell follows the artifact page contract: no `html`, `head` or `body` tags, colour tokens for light and dark, and no external scripts.

## Source tags

In the review build, each block of text that comes from one line of an MDX file carries `data-src="<path from site/>:<line>"`, such as `data-src="src/content/docs/walkthrough.mdx:28"`. Tagged: `p`, `h2` to `h4`, `li`, `td` and `th`, including paragraphs written as a component's children, such as a `<MapFrame>` caption. Not tagged: code blocks, aside titles, a list item whose text is in paragraphs (the paragraphs are tagged), and text that `.astro` components render, such as the figures.

Text from frontmatter carries a key instead of a line: the page title (`#title`), the lede (`#description`), and page 01's hero (`#hero.title`, `#hero.tagline`).

- `source-tags.mjs` adds the tags. Astro 7 renders MDX with Sätteri, which runs hast plugins rather than rehype plugins, so the plugin goes into the resolved Markdown processor through a small integration, as Starlight adds its own. It finds the line by the element's position, and corrects for a compile that dropped the frontmatter.
- `check-tags.mjs` tags the frontmatter text in the built pages, then checks every tag: the element's text must be what its source line renders as, once Markdown and JSX marks are stripped. The build fails and lists every mismatch.

## The overlay

- Browse is the site as visitors see it. In Edit, click tagged text to change its source line. In Note, click anything, figures included, to leave a note about it. Escape closes a pop-up, then returns to Browse.
- Text typed in a pop-up is kept as a draft in the viewer's browser at every keystroke, in `localStorage` under `bm-review-drafts`. Escape, Close, a mode change, a link or a reload, including the one a new version of the preview causes, never loses it. After a reload, the pop-up that was open reopens with its text, on its page. Only Save and Discard clear a draft, and Discard asks twice. Drafts also show under Changes, with Open and Discard.
- In Edit mode the site's header and sidebar still navigate, so you can move between pages. Text without a tag is not editable, and a click on it offers a note instead.
- A saved edit shows in place, its Markdown marks stripped, marked as pending until Claude answers.
- Changes opens the list: each change's page, location, before and after or the note, its status and Claude's reply. A pending change can be deleted.
- Send posts one comment to Claude, anchored on the send button, and then marks the batch `sent`. If the comment is not posted, for example while the viewer has not yet allowed the page to comment, every change stays pending.
- Without the database, the toolbar says editing is unavailable, and the site works for browsing.

## Changes in the database

Each change is one document in the collection `review-changes`, with its id as the document id.

| Field | Value |
| --- | --- |
| `id` | The document id. |
| `kind` | `edit` or `note`. |
| `page` | The site page's path, such as `/walkthrough/`. |
| `file` | The page's MDX file, such as `src/content/docs/walkthrough.mdx`, or null outside the six pages. |
| `src` | The element's tag, such as `src/content/docs/walkthrough.mdx:28` or `src/content/docs/index.mdx#hero.tagline`, or null for an element without one. |
| `before` | For an edit, and a note on tagged text: the whole source line, or the frontmatter value, as it was when the change was made. Otherwise null. |
| `after` | For an edit: the whole replacement line, with its indentation and list or heading marker, or the new frontmatter value. Otherwise null. |
| `note` | For a note: its text. Otherwise null. |
| `location` | Where the change is, in words: the page's title and path, the nearest heading above, the tag or the element (such as `figure.fig`), and a short excerpt. |
| `heading` | The nearest heading above, or null. |
| `excerpt` | A short excerpt of the element's text, or null. |
| `element` | For an element without a tag, what it is, such as `figure.fig > div.box`. Otherwise null. |
| `status` | `pending`, then `sent` once sent to Claude, then `applied`, `stale` or `done` once Claude has handled it. |
| `reply` | Claude's one-line answer, shown in the list, or null. |
| `createdAt`, `updatedAt`, `sentAt` | ISO 8601 times; `sentAt` is null until sent. |
| `createdBy` | The viewer's user id, or null. |

A second edit of a pending line replaces that change's `after`. An edit of a line whose change is already sent becomes a new change, whose `before` is the earlier `after`, so the edits apply in order.

## Apply the edits

When the comment arrives, export the collection's documents to a JSON file and run:

```bash
node review/apply-edits.mjs changes.json
```

For each edit with status `sent`, in the order they were made, it replaces the line only when the file still has exactly `before` there, and a frontmatter value only when it still equals `before`, quoting it when YAML needs it. It prints one result per id: `applied`, `stale` with the current line, `note` for a person to act on, or `skipped`. `--dry-run` writes nothing, `--json` prints the results as JSON, and `--root <dir>` reads the files from another folder. Then set each row's `status` and `reply`, and rebuild the preview.

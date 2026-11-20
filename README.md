# Boundary model

Nine agent skills built around one boundary model: who uses a system, for
what, and through which interfaces, kept apart from how it is built.

They are for developers who build and change software with a coding agent, such
as Claude Code or Codex. With them, the agent can:

- map an existing repository's boundaries, and review the map with you;
- keep the map up to date as the code changes;
- turn a planned change into boundary changes, slices of work, and GitHub
  issues.

## Install

Install all nine skills. The map scripts find `use-boundary-model` in the
folder next to theirs, so the skills must sit side by side.

### With npx skills

```bash
npx skills add meaningfool/boundary-model --skill '*'
```

It supports Claude Code, Codex, and most other agents.

- `-a <agent>` picks an agent, such as `-a claude-code -a codex`.
- `-y` skips the confirmation prompts.
- `-g` installs for your user instead of the current project.

In a project, the skills go in `.agents/skills/`, linked into each agent's own
folder such as `.claude/skills/`, and `skills-lock.json` records the version.
To update, run `npx skills update`. To remove, run `npx skills remove --all`.

### In Claude Code

```text
/plugin marketplace add meaningfool/boundary-model
/plugin install boundary-model@meaningfool
```

From a shell, run `claude plugin marketplace add meaningfool/boundary-model`,
then `claude plugin install boundary-model@meaningfool`.

Auto-update is off by default for this marketplace. To update, run
`claude plugin update boundary-model@meaningfool`, or turn on auto-update for
`meaningfool` on the Marketplaces tab of `/plugin`.

### In Codex

```bash
codex plugin marketplace add meaningfool/boundary-model
codex plugin add boundary-model@meaningfool
```

Start a new session to use the skills. To fetch a newer version of the
marketplace, run `codex plugin marketplace upgrade meaningfool`. To remove,
run `codex plugin remove boundary-model@meaningfool`.

Both plugins install the nine skills as one plugin, so each skill's name
becomes `boundary-model:<skill>`, such as `boundary-model:extract-boundaries`.

### By hand

```bash
git clone https://github.com/meaningfool/boundary-model.git
cd boundary-model/skills
mkdir -p ~/.claude/skills
cp -R use-boundary-model extract-boundaries review-boundaries \
  update-boundaries visualize-boundaries shape-boundaries \
  slice refine to-issues ~/.claude/skills/
```

These commands install for Claude Code. For another agent, use its skills
folder in the last two commands, such as `~/.agents/skills/` for Codex. To
share the skills with a team, use the project's skills folder instead.

Keep the folder names, and name each folder as above. Don't copy with a
trailing-slash glob such as `skills/*/`. On macOS, `cp -R` with a trailing
slash copies a folder's contents instead of the folder.

## What the skills need

- Node 18 or later, for the map scripts.
- Chrome, Chromium, or Edge, for still images of a map. Without one,
  `visualize-boundaries` still draws the map as a page. Set `CHROME_PATH` if
  the script cannot find the browser.
- Access to GitHub, for `to-issues` to create issues.

## Where to start

- Nothing built yet: `shape-boundaries`.
- Code, but no boundary map: `extract-boundaries`.
- Code with a boundary map: `update-boundaries` to bring the map up to date,
  or `shape-boundaries` to plan a change.
- No boundary model wanted: `slice`, `refine`, and `to-issues`, on their own.

`extract-boundaries` ends by offering a review with `review-boundaries`. It
writes the map at its location only after that review, unless you ask
otherwise. `update-boundaries` ends with the review. So the map at its
location is one a person has reviewed.

`shape-boundaries` starts from the map when there is one. It reads the code
behind the boundaries the change touches rather than trusting the map.

The skills keep the map at `docs/boundary-map.json` by default. Ask the agent
in plain words, such as "map this repository's boundaries", or name the skill.

To plan a change, shape it, slice it, refine each slice, then publish the
issues. Skip a step that has nothing to settle.

## Skills

- `use-boundary-model`: defines the model, its vocabulary, and the boundary
  map's format, schema, and checker.
- `extract-boundaries`: maps an existing system's boundaries from its
  repository, then offers a review.
- `review-boundaries`: walks a person through a map, level by level, with still
  images and short questions, then writes the reviewed map.
- `update-boundaries`: brings a map up to date with what changed since its
  revision, then reviews it.
- `visualize-boundaries`: checks a map and draws it as a page or as still
  images, optionally marking what changed since an earlier map.
- `shape-boundaries`: expresses a change as the boundary changes it leads to.
- `slice`: compares ways to divide a change into pieces of work.
- `refine`: settles a change's expected behavior and design decisions.
- `to-issues`: publishes slices or changes as GitHub issues, each with its
  proof of done.

## Licence

MIT. See [LICENSE](LICENSE).

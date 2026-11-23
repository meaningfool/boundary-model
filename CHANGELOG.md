# Changelog

Each release gets a `vX.Y.Z` tag in this repository.

## 0.1.0 - 2026-11-23

First release from this repository. The nine skills move here from `meaningfool/skills`, with their history. They work in any repository, without the context of the project they were built in, and are released under the MIT licence.

### Skills

- `use-boundary-model`: the model, its vocabulary, and the boundary map's format, schema, and checker.
- `extract-boundaries`: maps an existing system's boundaries from its repository, then offers a review.
- `review-boundaries`: walks a person through a map, level by level, with still images and short questions.
- `update-boundaries`: brings a map up to date with what changed since its revision, and ends with a review.
- `visualize-boundaries`: checks a map and draws it as a page or as still images, optionally marking what changed since an earlier map.
- `shape-boundaries`: expresses a change as the boundary changes it leads to.
- `slice`: compares ways to divide a change into work.
- `refine`: settles a change's expected behavior and design decisions.
- `to-issues`: publishes slices or changes as GitHub issues, each with its proof of done.

### Install routes

The README gives the commands for each route.

- `npx skills`, from `meaningfool/boundary-model`, is the main route. It installs the nine skills side by side for the agent you pick.
- The Claude Code plugin installs as `boundary-model@meaningfool`, from the marketplace in this repository.
- The Codex plugin installs from the same repository.
- Copying by hand is the fallback. Put the nine `skills/<name>` folders side by side in an agent's skills folder.

Both plugins install the nine skills as one plugin, so their names become `boundary-model:<skill>`.

# Changelog

Each release gets a `vX.Y.Z` tag in this repository.

## 0.2.0 - 2026-11-26

A new check in `use-boundary-model`, and outside services drawn in full by `visualize-boundaries`.

- The map checker now tests a rule the map format already stated: a component that holds a component calling an outside service, through `components` or `sharedComponents`, has its own boundary with that service. A map without one now fails, with a problem such as "Payments relies on Card network through Charge service but has no boundary with it". A Level 1 provider needs none. Add the missing boundaries to a map that passed before.
- A screen now shows every outside service that the open box or anything inside it uses, once each, in the box's last column after Components. Before, a service called from inside a component with components of its own did not show until that component was opened. Each service is a one-line box with no line to it: select a component to light the services it uses, or a service to light the components that use it. The panel lists a service's resources.
- A closed box keeps its line to another box when a component inside it has its own boundary with that box. The line used to be dropped.

## 0.1.1 - 2026-11-26

Two fixes to `visualize-boundaries`.

- A Level 1 provider that another provider also lists in its `sharedComponents` showed as "Shared with null" on that provider's screen. It now shows as "Also a provider".
- `shoot-map.mjs` wrote no images when run as root, as in many containers and cloud sessions, because Chrome refuses to start as root with its sandbox on. It now turns the sandbox off when it runs as root, so a wrapper script passed as `CHROME_PATH` is no longer needed.

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

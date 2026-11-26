# Draft boundary maps

Maps of open-source projects, extracted with the boundary model skills v0.1.0 for the website's examples. No person has reviewed them yet, so each one is a draft. Each map lists, in `questions`, the choices its extraction could not settle.

| Project | Repository | Revision | Levels | Components | Boundaries |
| --- | --- | --- | --- | --- | --- |
| Executor | [UsefulSoftwareCo/executor](https://github.com/UsefulSoftwareCo/executor), branch v2 | `c8bb046` | 3 | 13 | 26 |
| T3 Code | [pingdotgg/t3code](https://github.com/pingdotgg/t3code) | `667cb3b` | 4 | 41 | 101 |
| Rivet | [rivet-dev/rivet](https://github.com/rivet-dev/rivet) | `f89614f` | 4 | 23 | 34 |
| LangChain | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | `9d461bb` | 4 | 33 | 64 |
| Pi | [earendil-works/pi](https://github.com/earendil-works/pi) | `362bf6f` | 3 | 11 | 36 |

Each folder holds `draft-map.json` and `run-log.md`. The run log says what the extraction read, what each round decided, and how long each step took. Pi has a second log, `run-log-deepening.md`, for a pass that looked one level further.

## How they were made

- One agent per project followed `extract-boundaries` through its checks, and stopped before the review.
- Each agent looked as deep as the code supported, up to Level 4.
- No subagents were available, so each agent did all of its reading alone, instead of handing the broad sweep to parallel readers as the skill asks.
- What each map leaves out is recorded in its `system.corpus`: vendored copies of other repositories in T3 Code and Rivet, and Pi's experimental runtime and apps.

## Using them

Check a map with `node skills/use-boundary-model/scripts/check-map.mjs <map>`, and draw it with `node skills/visualize-boundaries/scripts/render-map.mjs <map> <page.html>`, from the repository root.

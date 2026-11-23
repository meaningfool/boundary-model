# Agent instructions

This repository holds the boundary model skills and the manifests that install
them as one plugin for Claude Code and for Codex.

## Structure

- Put each skill in `skills/<name>/`, where `<name>` is the `name` in its
  `SKILL.md` frontmatter. Keep every skill directly in `skills/`, side by side
  with the others, with no category folder. The scripts of `update-boundaries`
  and `visualize-boundaries` reach the map checker at
  `../../use-boundary-model/scripts/check-map.mjs`, so the skills work only
  next to each other.
- Keep documentation for people at the repository root, in `README.md` and
  `CHANGELOG.md`. Installers copy each skill folder into an agent's skills
  folder, so a skill folder holds only agent instructions and the files they
  use.

## Editing skills

- Write instructions in imperative form.
- Keep instructions portable across target repositories. Resolve project
  conventions from the target repository instead of assuming this one's.
- Use only `name` and `description` in `SKILL.md` frontmatter. Put the
  conditions that trigger the skill in the description.
- Link bundled references from `SKILL.md` by relative path, such as
  `[references/map-format.md](references/map-format.md)`.
- Before committing a changed skill, run `claude plugin validate .` and
  `node scripts/check-skills.mjs`, and fix every error they report. The second
  catches frontmatter that strict YAML parsers reject, such as an unquoted
  value containing ": ". Some installers skip a skill whose frontmatter fails.

## Adding a skill

1. Create `skills/<name>/SKILL.md` by the rules above.
2. Add the skill to the README's skill list.
3. Update the skill count in the `longDescription` of the root `plugin.json`.
4. Run `claude plugin validate .` and check that it lists the new skill, then run
   `node scripts/check-skills.mjs`.

Both plugins find the skills in `skills/` on their own, so no manifest lists
them.

## Releasing a version

1. Set the new version in `.claude-plugin/plugin.json` and the root
   `plugin.json`, in the same commit. Claude Code gives users a new copy only
   when the version changes, so every release bumps it. Leave the marketplace
   files without a version. Claude Code's docs say not to set it in both
   `plugin.json` and the marketplace entry.
2. Run `node scripts/check-versions.mjs` and fix any difference it reports.
   The `check` workflow runs it on every pull request and on pushes to `main`.
3. Add an entry at the top of `CHANGELOG.md`, headed `## X.Y.Z - Unreleased`,
   that says what changed for people who use the skills.
4. Ask the user before tagging. Once they approve, replace Unreleased with the
   tag date, tag `vX.Y.Z` on `main`, and publish a GitHub release with the
   entry as its notes.

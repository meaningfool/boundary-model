#!/usr/bin/env node
// Checks the frontmatter of every skills/<name>/SKILL.md, so that every installer can read it.
// Some installers parse frontmatter as strict YAML and skip a skill whose frontmatter fails, so
// each value must be a single-line YAML scalar: plain text without ": " or " #", or quoted.
// Node 18 or later, no dependencies. Run from anywhere: node scripts/check-skills.mjs

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const allowedKeys = ["name", "description"];
const problems = [];

// A plain (unquoted) YAML scalar may not start with an indicator character, and may not contain
// ": " or " #", or end with ":", since YAML would read those as a mapping or a comment.
const plainProblem = (value) => {
  if (value === "") return "is empty";
  if (/^[-?:,\[\]{}#&*!|>'"%@`]/.test(value)) return `starts with "${value[0]}", which YAML reads as syntax; quote the value`;
  if (value.includes(": ")) return 'contains ": ", which YAML reads as a nested mapping; reword it or quote the value';
  if (value.includes(" #")) return 'contains " #", which YAML reads as a comment; reword it or quote the value';
  if (value.endsWith(":")) return 'ends with ":"; reword it or quote the value';
  return null;
};

const quotedProblem = (value) => {
  if (value.startsWith('"')) {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(value)) return "has an unbalanced or unescaped double quote";
    return null;
  }
  if (!/^'(?:[^']|'')*'$/.test(value)) return "has an unbalanced single quote";
  return null;
};

const names = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const name of names) {
  const file = join("skills", name, "SKILL.md");
  if (!existsSync(join(root, file))) {
    problems.push(`${file}: missing`);
    continue;
  }
  const text = readFileSync(join(root, file), "utf8").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    problems.push(`${file}: no frontmatter between "---" lines at the top`);
    continue;
  }
  const seen = new Map();
  for (const line of match[1].split("\n")) {
    const entry = line.match(/^([A-Za-z0-9_-]+):(?: (.*))?$/);
    if (!entry) {
      problems.push(`${file}: "${line}" is not a one-line "key: value" entry`);
      continue;
    }
    const [, key, raw = ""] = entry;
    const value = raw.trim();
    if (!allowedKeys.includes(key)) problems.push(`${file}: key "${key}" is not allowed; use only ${allowedKeys.join(" and ")}`);
    if (seen.has(key)) problems.push(`${file}: key "${key}" appears twice`);
    seen.set(key, value);
    const problem = /^["']/.test(value) ? quotedProblem(value) : plainProblem(value);
    if (problem) problems.push(`${file}: ${key} ${problem}`);
  }
  for (const key of allowedKeys) if (!seen.has(key)) problems.push(`${file}: missing "${key}"`);
  const declared = seen.get("name")?.replace(/^["']|["']$/g, "");
  if (declared !== undefined && declared !== name) problems.push(`${file}: name "${declared}" does not match its folder "${name}"`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) in skill frontmatter.`);
  process.exit(1);
}
console.log(`Frontmatter of ${names.length} skills is valid: ${names.join(", ")}.`);

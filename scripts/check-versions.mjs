#!/usr/bin/env node
// Check that every plugin manifest carries the same version.
//
//   node scripts/check-versions.mjs
//
// Needs Node 18 or later and nothing else. It reads the root plugin.json and
// every JSON file in .claude-plugin/, .codex-plugin/ and .agents/plugins/,
// prints each version it finds, and exits with 1 when a plugin manifest has
// no version or two versions differ.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// Plugin manifests: each must exist and carry a version.
const required = ["plugin.json", ".claude-plugin/plugin.json"];
// Folders whose JSON files are read too: any version they carry must match.
const folders = [".claude-plugin", ".codex-plugin", ".agents/plugins"];

const files = [...required];
for (const folder of folders) {
  const dir = join(root, folder);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    const file = `${folder}/${name}`;
    if (name.endsWith(".json") && !files.includes(file)) files.push(file);
  }
}

const found = []; // { where, version }
const problems = [];

for (const file of files) {
  const path = join(root, file);
  if (!existsSync(path)) {
    problems.push(`${file}: file not found`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`${file}: not valid JSON (${error.message})`);
    continue;
  }

  const candidates = [
    [file, data?.version],
    [`${file} metadata`, data?.metadata?.version],
  ];
  if (Array.isArray(data?.plugins)) {
    data.plugins.forEach((plugin, i) => {
      candidates.push([`${file} plugins[${i}] ${plugin?.name ?? ""}`.trim(), plugin?.version]);
    });
  }

  for (const [where, version] of candidates) {
    if (version === undefined) continue;
    if (typeof version !== "string" || version.trim() === "") {
      problems.push(`${where}: version must be a non-empty string`);
      continue;
    }
    found.push({ where, version });
  }

  if (required.includes(file) && data?.version === undefined) {
    problems.push(`${file}: no version`);
  }
}

const width = Math.max(0, ...found.map(({ where }) => where.length));
for (const { where, version } of found) {
  console.log(`${where.padEnd(width)}  ${version}`);
}

const versions = [...new Set(found.map(({ version }) => version))];
if (versions.length > 1) {
  problems.push(`versions differ: ${versions.join(", ")}`);
}

if (problems.length > 0) {
  console.error("");
  for (const problem of problems) console.error(`error: ${problem}`);
  process.exit(1);
}

console.log(`\nAll ${found.length} versions are ${versions[0]}.`);

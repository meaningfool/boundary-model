#!/usr/bin/env node
// Apply the review edits that were sent to Claude: node review/apply-edits.mjs <changes.json>
//
// <changes.json> holds the documents of the db collection "review-changes", as an array (each
// document either flat or as { id, data }). For each edit with status "sent", in the order they
// were made, the script replaces the source line `before` with `after`, only when the line is still
// exactly `before`. A frontmatter value is replaced in place, quoted when YAML needs it. Nothing is
// ever edited on a mismatch. Notes are left for a person. One result per id is printed:
//   applied  the line was replaced
//   stale    the line has changed since; the current line is shown
//   note     a note, to read and act on
//   skipped  not an edit with status sent, or not a change this script can apply
//
// Options: --root <dir> resolves the files' paths against <dir> instead of site/, --dry-run writes
// nothing, --json prints the results as JSON.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readValue, replaceValue } from "./frontmatter.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 1) && true : false;
};
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const dryRun = flag("--dry-run");
const asJson = flag("--json");
const root = resolve(option("--root") ?? dirname(dirname(fileURLToPath(import.meta.url))));
if (args.length !== 1) {
  console.error("Usage: node review/apply-edits.mjs <changes.json> [--root <dir>] [--dry-run] [--json]");
  process.exit(2);
}

/** The change documents in an export, whatever its wrapping. */
function documents(raw) {
  const list = Array.isArray(raw) ? raw : (raw?.documents ?? raw?.docs ?? raw?.items ?? raw?.rows ?? []);
  return list.map((d) => (d && typeof d.data === "object" && d.data ? { id: d.id, ...d.data } : d)).filter((d) => d && typeof d === "object");
}

const changes = documents(JSON.parse(readFileSync(args[0], "utf8"))).sort(
  (a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")) || String(a.id).localeCompare(String(b.id)),
);

const SRC = /^(src\/content\/docs\/[\w.-]+\.mdx?)(?::(\d+)|#([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*))$/;
const files = new Map();
function load(path) {
  if (!files.has(path)) {
    const full = resolve(root, path);
    if (!full.startsWith(root + sep)) throw new Error(`${path} is outside ${root}`);
    const text = readFileSync(full, "utf8");
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    files.set(path, { full, eol, lines: text.split(/\r?\n/), changed: false });
  }
  return files.get(path);
}

const results = [];
const result = (c, outcome, detail, current) => results.push({ id: String(c.id ?? "?"), outcome, src: c.src ?? null, detail, ...(current !== undefined ? { current } : {}) });

for (const c of changes) {
  if (c.kind === "note") {
    result(c, "note", `${c.location ?? c.page ?? ""}: ${String(c.note ?? "").replace(/\s+/g, " ")}`);
    continue;
  }
  if (c.kind !== "edit") {
    result(c, "skipped", `not an edit or a note (kind ${JSON.stringify(c.kind)})`);
    continue;
  }
  if (c.status !== "sent") {
    result(c, "skipped", `status ${c.status}, not sent`);
    continue;
  }
  const m = SRC.exec(String(c.src ?? ""));
  if (!m || typeof c.before !== "string" || typeof c.after !== "string" || /[\r\n]/.test(c.after)) {
    result(c, "skipped", "no valid src, before and one-line after");
    continue;
  }
  let file;
  try {
    file = load(m[1]);
  } catch (e) {
    result(c, "skipped", `cannot read ${m[1]}: ${e.message}`);
    continue;
  }
  if (m[2]) {
    const i = Number(m[2]) - 1;
    const current = file.lines[i];
    if (current !== c.before) {
      result(c, "stale", `${c.src} has changed`, current ?? null);
      continue;
    }
    file.lines[i] = c.after;
  } else {
    const current = readValue(file.lines, m[3]);
    if (!current || current.value !== c.before) {
      result(c, "stale", `${c.src} has changed`, current ? current.value : null);
      continue;
    }
    try {
      const next = replaceValue(file.lines, m[3], c.after);
      file.lines[next.index] = next.line;
    } catch (e) {
      result(c, "skipped", e.message);
      continue;
    }
  }
  file.changed = true;
  result(c, "applied", c.src);
}

if (!dryRun) for (const f of files.values()) if (f.changed) writeFileSync(f.full, f.lines.join(f.eol));

if (asJson) console.log(JSON.stringify(results, null, 2));
else {
  for (const r of results) {
    console.log(`${r.outcome.padEnd(8)} ${r.id}  ${r.detail}`);
    if (r.outcome === "stale") console.log(`         current: ${r.current === null ? "(missing)" : JSON.stringify(r.current)}`);
  }
  const count = (o) => results.filter((r) => r.outcome === o).length;
  console.log(`\n${count("applied")} applied, ${count("stale")} stale, ${count("note")} notes, ${count("skipped")} skipped${dryRun ? " (dry run: nothing written)" : ""}.`);
}

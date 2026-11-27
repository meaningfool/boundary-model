#!/usr/bin/env node
// Draw the Store's maps, made for the former page 05, A walkthrough, into public/maps/store/. No
// page shows them now. The renderer checks each map first and draws nothing when a check fails, so
// a broken map stops the build.
//
// Steps 2 to 8 teach Level 1 before any component, and add one consumer at a time, so they use maps
// cut here from the full map instead of maps kept by hand: they cannot drift from it. Each cut keeps
// the Store's boundaries with the consumers met so far, drops the Store's components, and keeps only
// the interfaces, resources and places those boundaries still use.
//
// The map after the gift-card change is drawn against today's map, to show what the change adds. A
// planned change never goes in the map itself.
//
// Usage, from site/: node scripts/draw-maps.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const path = (p) => fileURLToPath(new URL(p, import.meta.url));
const renderer = path("../../skills/visualize-boundaries/scripts/render-map.mjs");
const store = path("../maps/store/");
const out = path("../public/maps/store/");

const steps = {
  "step-02": { consumers: ["Shopper"], about: "Step 2: the first consumer and the provider" },
  "step-03": {
    consumers: ["Shopper", "Fraud analyst"],
    about: "Steps 3 and 4: a second consumer, and the Shopper's two interfaces",
  },
  "step-05": {
    consumers: ["Shopper", "Fraud analyst", "Store manager"],
    about: "Steps 5 to 8: a third consumer, capabilities, resources and areas",
  },
};

function cut(full, { consumers, about }) {
  const map = structuredClone(full);
  map.system.description = `${about}, at Level 1 only. Cut from the walkthrough's full map of the Store. ${full.system.description}`;
  map.boundaries = map.boundaries.filter((b) => b.provider === "Store" && consumers.includes(b.consumer));
  map.consumers = map.consumers.filter((c) => consumers.includes(c.name));
  map.outsideServices = [];
  const usedInterfaces = new Set(map.boundaries.flatMap((b) => b.interfaces));
  const usedResources = new Set(
    map.boundaries.flatMap((b) => b.areas.flatMap((a) => a.capabilities.flatMap((c) => c.acts.map((x) => x.resource)))),
  );
  map.interfaces = map.interfaces.filter((i) => usedInterfaces.has(i.name));
  map.resources = map.resources.filter((r) => usedResources.has(r.name));
  for (const p of map.providers) {
    delete p.components;
    p.resources = p.resources.filter((r) => usedResources.has(r));
  }
  map.places = map.places.filter(
    (p) =>
      (p.kind === "interface" && usedInterfaces.has(p.place)) ||
      (p.kind === "component" && p.place === "Store") ||
      !["component", "interface"].includes(p.kind),
  );
  map.questions = [];
  return map;
}

const draw = (map, page, ...options) =>
  execFileSync(process.execPath, [renderer, map, join(out, page), ...options], { stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "store-steps-"));
try {
  const full = JSON.parse(readFileSync(join(store, "map.json"), "utf8"));
  for (const [name, step] of Object.entries(steps)) {
    const file = join(work, `${name}.json`);
    writeFileSync(file, `${JSON.stringify(cut(full, step), null, 2)}\n`);
    draw(file, `${name}.html`);
  }
  draw(join(store, "map.json"), "map.html");
  draw(join(store, "after-gift-cards.json"), "after-gift-cards.html", "--against", join(store, "map.json"));
} finally {
  rmSync(work, { recursive: true, force: true });
}

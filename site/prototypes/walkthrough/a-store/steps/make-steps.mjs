#!/usr/bin/env node
// Cut the Level 1 maps that the walkthrough's steps 2 to 8 need out of the full map, so they cannot
// drift from it. Each keeps the Store's boundaries with the consumers met so far, drops the Store's
// components, and keeps only the interfaces, resources and places those boundaries still use.
// Usage, from this folder: node make-steps.mjs ../map.json
import { readFileSync, writeFileSync } from "node:fs";

const full = JSON.parse(readFileSync(process.argv[2] ?? "../map.json", "utf8"));

const steps = {
  "step-02": { consumers: ["Shopper"], about: "Step 2: the first consumer and the provider" },
  "step-03": { consumers: ["Shopper", "Fraud analyst"], about: "Steps 3 and 4: a second consumer, and the Shopper's two interfaces" },
  "step-05": { consumers: ["Shopper", "Fraud analyst", "Store manager"], about: "Steps 5 to 8: a third consumer, capabilities, resources and areas" },
};

for (const [name, { consumers, about }] of Object.entries(steps)) {
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
    (p) => (p.kind === "interface" && usedInterfaces.has(p.place)) || (p.kind === "component" && p.place === "Store") || !["component", "interface"].includes(p.kind),
  );
  map.questions = [];
  writeFileSync(`${name}.json`, `${JSON.stringify(map, null, 2)}\n`);
  console.log(`Wrote ${name}.json`);
}

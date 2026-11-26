// Draws a boundary map one open box at a time. Each screen shows who uses the open box, its
// interfaces, its capabilities, the components inside it, and what it uses; every box lists the
// resources it keeps. A click lights what the clicked thing connects to and explains it in the
// panel; Open, at the foot of a box, makes it the open box. With ?still in the address the page
// draws one screen for a still image, with what the panel would say written under the drawing.

// ---------- the map ----------

const RAW = JSON.parse(document.getElementById("map-data").textContent);
const params = new URLSearchParams(location.search);
const STILL = params.has("still");
if (STILL) document.documentElement.classList.add("still");
const MODE_WORD = { produces: "creates", mutates: "changes", observes: "reads", reacts: "reacts to" };
const KIND_WORD = {
  consumer: "Consumer",
  provider: "Provider",
  component: "Component",
  outside: "Outside service",
};

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of children.flat(3)) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

function svgEl(tag, attrs = {}) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  return e;
}

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const inline = (s) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const sentence = (s) => s.replace(/^[a-z]/, (c) => c.toUpperCase());
const text = (tag, s, cls) => el(tag, { class: cls, html: inline(sentence(s)) });
const unique = (xs) => [...new Set(xs)];
const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : (xs[0] ?? ""));
const whose = (name) => (name.endsWith("s") ? `${name}'` : `${name}'s`);
// Level 1 alone shows each provider as its consumers see it: who uses it, its interfaces and its
// capabilities, without the components inside it or what it uses. render-map.mjs --level 1 opens
// the page this way; the switch above the map turns it on and off.
let levelOne = document.documentElement.dataset.level === "1";

const nodes = new Map();
for (const c of RAW.consumers) nodes.set(c.name, { ...c, kind: "consumer", children: [], shared: [], also: [] });
const addComponent = (c, parent) => {
  const n = {
    name: c.name,
    description: c.description,
    kind: parent ? "component" : "provider",
    parent: parent ?? null,
    resources: c.resources,
    parts: c.parts,
    serves: [...(c.serves ?? [])],
    children: (c.components ?? []).map((k) => k.name),
    shared: [],
    also: [],
  };
  nodes.set(c.name, n);
  for (const k of c.components ?? []) addComponent(k, c.name);
};
for (const p of RAW.providers) addComponent(p, null);
for (const s of RAW.outsideServices)
  nodes.set(s.name, { ...s, kind: "outside", children: [], shared: [], also: [], parts: [] });
// A component can sit inside a second provider or component at any level.
const defined = (c) => [c, ...(c.components ?? []).flatMap(defined)];
for (const p of RAW.providers.flatMap(defined))
  for (const s of p.sharedComponents ?? []) {
    nodes.get(p.name).shared.push(s.name);
    nodes.get(s.name).also.push(p.name);
    nodes.get(s.name).serves.push(...s.serves);
  }

const boundaries = RAW.boundaries.map((b) => {
  const boundary = { ...b, id: `${b.consumer} → ${b.provider}` };
  boundary.areas = b.areas.map((a) => {
    const area = { ...a, key: `${b.consumer} › ${a.name}`, boundary };
    area.capabilities = a.capabilities.map((c) => ({
      ...c,
      area,
      id: `${area.key} › ${c.name}`,
      via: c.interfaces ?? b.interfaces,
    }));
    return area;
  });
  return boundary;
});
const allAreas = boundaries.flatMap((b) => b.areas);
const allCapabilities = allAreas.flatMap((a) => a.capabilities);
const capabilityById = new Map(allCapabilities.map((c) => [c.id, c]));
const resourceByName = new Map(RAW.resources.map((r) => [r.name, r]));
const interfaceText = new Map(RAW.interfaces.map((i) => [i.name, i.description]));

const node = (name) => nodes.get(name);
// On Level 1 alone, only boundaries whose consumer is not a component count.
const inView = (b) => !levelOne || node(b.consumer).kind !== "component";
const incoming = (name) => boundaries.filter((b) => b.provider === name && inView(b));
const subtree = (name) => [name, ...node(name).children.flatMap(subtree)];
const ancestors = (name) => {
  const p = node(name).parent;
  return p ? [...ancestors(p), p] : [];
};
const handlers = (area) => {
  const serving = [...nodes.values()]
    .filter((n) => n.serves?.some((s) => `${s.consumer} › ${s.area}` === area.key))
    .map((n) => n.name);
  return serving.length ? serving : [area.boundary.provider];
};
// A boundary drawn on a whole component that one of its inner components carries in detail.
const refinedBy = (b) =>
  boundaries.find((o) => o !== b && o.provider === b.provider && node(b.consumer).children.includes(o.consumer));

// ---------- motion ----------

// Moves things to their new place where the browser can, and just redraws where it cannot.
const NO_MOTION = STILL || matchMedia("(prefers-reduced-motion: reduce)").matches;
const cssName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
function transition(fn) {
  if (!document.startViewTransition || NO_MOTION || document.visibilityState === "hidden") return fn();
  const t = document.startViewTransition(fn);
  // A transition that a quicker click cuts short still runs its update; only the motion is lost.
  t.ready.catch(() => {});
  t.updateCallbackDone.catch(() => {});
  t.finished.catch(() => {});
}

// ---------- screens ----------

// One open box per screen, in fixed columns: who uses it, its interfaces, its capabilities, its
// components, and what it uses. Blue dots are the interfaces of the open box only; each box lists
// the resources it keeps. Lines join who uses the box to its interfaces, its interfaces to its
// capabilities, and each component to what it depends on; they light with whatever is in focus.
// All providers, above every open box, shows each provider with the consumers that use it.
const TOP = "";
// Keep in step with addressOf in render-map.mjs, which refuses a map where two names share an address.
const slugOf = (s) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
const bySlug = new Map([...nodes.keys()].map((n) => [slugOf(n), n]));
// The page opens on the provider named after the system, when there is one, else on All providers.
const HOME = RAW.providers.some((p) => p.name === RAW.system.name) ? [RAW.system.name] : [];

let openBox = TOP;
let trail = []; // the boxes opened from All providers down to the open one, as you came
const visited = []; // earlier trails, most recent last, for Back
const memory = new Map(); // a screen's address -> its scroll and selection when it was left
let selected = null; // the data-key of what is selected
let current = null; // what the selection lights, from lineage
let screen; // what the open box shows, from screenOf
let reg; // what the screen drew, by data-key: the first element drawn for each
let drawn; // every element drawn with a data-key, as [key, element]; a shared resource is drawn twice

const servedBy = (name) =>
  allAreas.filter((a) => node(name).serves?.some((s) => `${s.consumer} › ${s.area}` === a.key));
const actedOn = (g) => unique(g.members.flatMap((a) => a.capabilities.flatMap((c) => c.acts.map((x) => x.resource))));
const actingOn = (r) => allCapabilities.filter((c) => c.acts.some((a) => a.resource === r));
// A box and everything in it, components it shares with another provider included.
const within = (name) => [name, ...[...node(name).children, ...node(name).shared].flatMap(within)];
// A box opens when its screen has something of its own: components inside it, or capabilities it
// offers across a boundary of its own. Otherwise its screen would repeat the level above. On Level 1
// alone, only a provider with consumers opens.
const opens = (name) => {
  const n = node(name);
  if (levelOne) return n.kind === "provider" && incoming(name).length > 0;
  return n.kind !== "consumer" && (n.children.length + n.shared.length > 0 || incoming(name).some((b) => !refinedBy(b)));
};
// Who keeps a resource, leaving out a box when one of its inner components keeps it too.
const keepersOf = (r) => {
  const keepers = [...nodes.values()].filter((n) => n.resources?.includes(r)).map((n) => n.name);
  return keepers.filter((k) => !keepers.some((o) => o !== k && subtree(k).includes(o)));
};
const kindClass = (name) => `k-${node(name).kind === "provider" ? "component" : node(name).kind}`;

// The interfaces that offer any of an area's capabilities.
const portsOf = (a) => unique(a.capabilities.flatMap((c) => c.via));
// The interfaces of its boundary that offer a capability, when not all of them do.
const onlyOn = (c) => (c.via.length < c.area.boundary.interfaces.length ? c.via : null);
// "Select model and Set thinking level", or "8 capabilities" when there are more than two.
const someOf = (names) => (names.length > 2 ? `${names.length} capabilities` : list(names));

function screenOf(name) {
  const top = name === TOP;
  const n = top ? null : node(name);
  const into = top ? [] : incoming(name).filter((b) => levelOne || !refinedBy(b));
  const own = into.flatMap((b) => b.areas);
  // Areas of a box around this one, such as the provider it sits in, that this box or a box inside
  // it handles: their consumers reach it through that box's interfaces. Beside boundaries of its own
  // they are a second way in, and fade.
  const encloses = (p) => p !== name && within(p).includes(name);
  const around = top || levelOne ? [] : unique(within(name).flatMap(servedBy)).filter((a) => !own.includes(a) && encloses(a.boundary.provider));
  const faded = new Set(own.length ? around : []);
  const areas = [];
  for (const a of [...own, ...around]) {
    const same = areas.find((g) => g.name === a.name);
    if (same) same.members.push(a);
    else areas.push({ name: a.name, type: a.type, members: [a] });
  }
  for (const g of areas) {
    g.ports = unique(g.members.flatMap(portsOf));
    g.consumers = unique(g.members.map((a) => a.boundary.consumer));
    // Consumers may reach areas of the same name; each capability is listed once.
    g.capabilities = g.members
      .flatMap((a) => a.capabilities)
      .filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i);
    g.faded = g.members.every((a) => faded.has(a));
    // The interfaces that offer only some of the group's capabilities, whose lines are dashed, and
    // the capabilities that only some of its interfaces offer, by the interfaces that do.
    g.partial = g.ports.filter((p) => g.members.some((a) => portsOf(a).includes(p) && a.capabilities.some((c) => !c.via.includes(p))));
    const only = new Map();
    for (const a of g.members)
      for (const c of a.capabilities.filter((c) => c.via.length < portsOf(a).length)) {
        const via = g.ports.filter((p) => c.via.includes(p));
        const key = via.join("\n");
        only.set(key, { via, names: unique([...(only.get(key)?.names ?? []), c.name]) });
      }
    g.only = [...only.values()];
  }
  const inner = top || levelOne ? [] : [...n.children, ...n.shared];
  const consumers = top ? RAW.consumers.map((c) => c.name) : unique(areas.flatMap((g) => g.consumers));
  // The boxes around this one through which each consumer that fades reaches it.
  const fadedConsumers = new Map();
  for (const c of consumers) {
    const theirs = areas.flatMap((g) => g.members).filter((a) => a.boundary.consumer === c);
    if (theirs.length && theirs.every((a) => faded.has(a))) fadedConsumers.set(c, unique(theirs.map((a) => a.boundary.provider)));
  }
  const ports = unique(areas.flatMap((g) => g.ports));
  const fadedPorts = new Set(own.length ? ports.filter((p) => !own.some((a) => portsOf(a).includes(p))) : []);
  // What the frame head says about the ways in through a box around this one.
  const ways = new Map();
  for (const a of around) ways.set(a.boundary.provider, unique([...(ways.get(a.boundary.provider) ?? []), a.boundary.consumer]));
  const notes = !own.length
    ? ways.size
      ? [`Reached through ${list([...ways.keys()].map(whose))} interfaces.`]
      : []
    : [...ways].map(([p, cs]) => `${list(cs)} also reach${cs.length > 1 ? "" : "es"} ${name} through ${whose(p)} interfaces.`);
  // What the open box and the boxes on the screen depend on. A boundary of a box on the screen is
  // drawn from that box, whichever box inside it carries it in detail. A boundary of the open box
  // itself is drawn from the box inside that carries it in detail, when there is one.
  const calls = top
    ? []
    : boundaries.filter(
        (b) =>
          inner.includes(b.consumer) ||
          (!levelOne && b.consumer === name && !boundaries.some((o) => o.provider === b.provider && inner.includes(o.consumer))),
      );
  // An outside service that a component inside calls sits with the components, in the column after
  // its callers, so its links stay short; what the open box itself calls sits to the right of it.
  const outside = unique(calls.filter((b) => inner.includes(b.consumer) && node(b.provider).kind === "outside").map((b) => b.provider));
  const boxes = top ? RAW.providers.map((p) => p.name) : [...inner, ...outside];
  const uses = unique(calls.filter((b) => !within(name).includes(b.provider) && !outside.includes(b.provider)).map((b) => b.provider));
  // Each resource kept inside the open box goes in the box on this screen that holds its keeper.
  const holder = (k) => boxes.find((b) => subtree(b).includes(k)) ?? (!top && subtree(name).includes(k) ? name : null);
  const kept = new Map();
  for (const r of RAW.resources)
    for (const h of unique(keepersOf(r.name).map(holder)).filter(Boolean)) kept.set(h, [...(kept.get(h) ?? []), r.name]);
  return {
    top,
    consumers,
    fadedConsumers,
    ports,
    fadedPorts,
    areas,
    notes,
    columns: top ? [boxes] : columnsOf(boxes),
    boxes,
    uses,
    visible: new Set([...consumers, ...boxes, ...uses]),
    kept,
    // What each component, or the open box, depends on among the boxes on this screen.
    links: calls.filter((b) => boxes.includes(b.provider) || uses.includes(b.provider)),
  };
}

function columnsOf(ids) {
  const depth = new Map();
  const visit = (id, seen) => {
    if (depth.has(id)) return depth.get(id);
    const before = boundaries.filter((b) => b.provider === id && ids.includes(b.consumer) && !seen.has(b.consumer));
    const d = Math.max(-1, ...before.map((b) => visit(b.consumer, new Set([...seen, id])))) + 1;
    depth.set(id, d);
    return d;
  };
  ids.forEach((id) => visit(id, new Set([id])));
  const columns = [];
  for (const id of ids) (columns[depth.get(id)] ??= []).push(id);
  return columns.filter(Boolean);
}

// ---------- what a selection lights ----------

// What leads to the selection and what it leads to, on this screen. A component that is not on the
// screen lights the box that holds it, which then says which components it stands for.
function lineage(key) {
  const s = screen;
  const keys = new Set([key]);
  const cut = key.indexOf(":");
  const kind = key.slice(0, cut);
  const id = key.slice(cut + 1);
  // Components to light, with what each does; each lights the box on this screen that holds it.
  const requests = [];
  const lightBox = (name, role) => name && requests.push([name, role]);
  const holders = (name) => (s.visible.has(name) ? [name] : [...s.visible].filter((v) => within(v).includes(name)));
  // Who handles an area on this screen: the boxes inside the open box that handle it. A component
  // that uses the open box may also handle an area around it, but not here.
  const handling = (area) => (s.top ? handlers(area) : handlers(area).filter((h) => within(openBox).includes(h)));
  const upstream = (g) => {
    keys.add(`a:${g.name}`);
    g.ports.forEach((p) => keys.add(`p:${p}`));
    g.consumers.forEach((c) => keys.add(`b:${c}`));
  };
  if (kind === "a") {
    const g = s.areas.find((x) => x.name === id);
    if (g) {
      upstream(g);
      g.members.flatMap(handling).forEach((h) => lightBox(h, "handles"));
      actedOn(g).forEach((r) => keys.add(`r:${r}`));
    }
  }
  if (kind === "c") {
    const c = capabilityById.get(id);
    const g = s.areas.find((x) => x.members.includes(c.area));
    if (g) keys.add(`a:${g.name}`);
    c.via.filter((p) => s.ports.includes(p)).forEach((p) => keys.add(`p:${p}`));
    lightBox(c.area.boundary.consumer, "asks");
    handling(c.area).forEach((h) => lightBox(h, "handles"));
    c.acts.forEach((a) => keys.add(`r:${a.resource}`));
  }
  if (kind === "p")
    for (const g of s.areas.filter((x) => x.ports.includes(id))) {
      keys.add(`a:${g.name}`);
      g.members.filter((a) => a.boundary.interfaces.includes(id)).forEach((a) => keys.add(`b:${a.boundary.consumer}`));
    }
  if (kind === "r") {
    const caps = actingOn(id);
    for (const g of s.areas) if (g.members.some((a) => caps.some((c) => c.area === a))) keys.add(`a:${g.name}`);
    keepersOf(id).forEach((o) => lightBox(o, "keeps"));
    unique(caps.flatMap((c) => handling(c.area))).forEach((h) => lightBox(h, "acts"));
  }
  if (kind === "b") {
    const inside = within(id);
    if (s.consumers.includes(id))
      for (const g of s.areas.filter((x) => x.consumers.includes(id))) {
        keys.add(`a:${g.name}`);
        g.members.filter((a) => a.boundary.consumer === id).forEach((a) => a.capabilities.forEach((c) => c.via.forEach((p) => keys.add(`p:${p}`))));
      }
    for (const g of s.areas) if (g.members.some((a) => handling(a).some((h) => inside.includes(h)))) upstream(g);
    for (const b of boundaries) {
      if (refinedBy(b)) continue;
      for (const [near, far, role] of [
        [b.provider, b.consumer, "calls"],
        [b.consumer, b.provider, "called"],
      ]) {
        if (!inside.includes(near) || inside.includes(far)) continue;
        // A call to a component that the other box also contains stays inside both.
        if (holders(far).some((o) => within(o).includes(near))) continue;
        lightBox(far, role);
      }
    }
    (s.kept.get(id) ?? []).forEach((r) => keys.add(`r:${r}`));
  }
  // A shared component sits in more than one box on the screen: it lights the one already lit, else
  // the one holding the selection, else the one it is defined in.
  const home = kind === "r" ? [...s.kept].find(([, rs]) => rs.includes(id))?.[0] : kind === "b" ? id : null;
  const notes = new Map(); // a lit box -> what the components inside it do, by role
  const assign = (at, name, role) => {
    keys.add(`b:${at}`);
    if (at === name || at === id) return;
    const roles = notes.get(at) ?? notes.set(at, new Map()).get(at);
    (roles.get(role) ?? roles.set(role, new Set()).get(role)).add(name);
  };
  const later = [];
  for (const [name, role] of requests) {
    const c = holders(name);
    if (c.length === 1) assign(c[0], name, role);
    else if (c.length > 1) later.push([name, role, c]);
  }
  for (const [name, role, c] of later)
    assign(c.find((v) => keys.has(`b:${v}`)) ?? c.find((v) => v === home) ?? c.find((v) => ancestors(name).includes(v)) ?? c[0], name, role);
  return { keys, notes };
}

// What the components inside a lit box do with the selection: "Run controller keeps it; Conversations
// and Execution kits act on it."
const VERBS = { keeps: ["keeps it", "keep it"], acts: ["acts on it", "act on it"], handles: ["handles it", "handle it"], calls: ["calls it", "call it"], asks: ["asks for it", "ask for it"] };
function noteOf(roles) {
  const keepers = roles.get("keeps") ?? new Set();
  const parts = [...roles].map(([role, names]) => {
    const list = [...names].filter((n) => role === "keeps" || !keepers.has(n));
    if (!list.length) return null;
    const who = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];
    return role === "called" ? `It calls ${who}` : `${who} ${VERBS[role][list.length > 1 ? 1 : 0]}`;
  });
  return `${parts.filter(Boolean).join("; ")}.`;
}

// ---------- drawing ----------

const pick = (key) => (event) => {
  event.stopPropagation();
  selected = key;
  render();
};

const register = (key, e) => {
  e.dataset.key = key;
  if (!reg.has(key)) reg.set(key, e);
  drawn.push([key, e]);
  return e;
};

const kindLine = (kind, qualifier) =>
  el("span", { class: "b-top" }, el("span", { class: "b-kind" }, kind), qualifier && el("span", { class: "b-qual" }, qualifier));

function chips(names) {
  if (!names.length) return null;
  return el(
    "span",
    { class: "b-chips" },
    names.map((r) => register(`r:${r}`, el("button", { type: "button", class: "b-chip", onclick: pick(`r:${r}`) }, r))),
  );
}

function box(name, where) {
  const n = node(name);
  const key = `b:${name}`;
  const inner = n.children.length + n.shared.length;
  // A box shared into the open one says where else it sits: inside the box that defines it, or,
  // for a provider, among All providers.
  const shared = where === "inside" && n.also.includes(openBox) ? (n.parent ? `Shared with ${n.parent}` : "Also a provider") : null;
  const canOpen = opens(name);
  const enter = (e) => (e.stopPropagation(), go(name));
  const note = current?.notes.get(name);
  // A consumer that reaches the open box only through a box around it fades, and says which.
  const around = where === "left" ? screen.fadedConsumers.get(name) : null;
  return register(
    key,
    el(
      "section",
      {
        class: `b-box ${kindClass(name)}${n.kind === "provider" ? " provider" : ""}${canOpen ? " opens" : ""}${around ? " outer" : ""}`,
        onclick: pick(key),
        ondblclick: canOpen ? enter : null,
      },
      kindLine(shared ?? KIND_WORD[n.kind], around && `via ${list(around)}`),
      el("button", { type: "button", class: "b-name", onclick: pick(key) }, name),
      note && el("span", { class: "b-via" }, noteOf(note)),
      where === "inside" && chips(screen.kept.get(name) ?? []),
      canOpen &&
        el("button", { type: "button", class: "b-go", onclick: enter }, el("span", {}, inner && !levelOne ? `Open, ${inner} components` : "Open"), el("span", {}, "›")),
    ),
  );
}

// A group of capabilities, with the capabilities that only some of its interfaces offer.
function areaBox(g) {
  return register(
    `a:${g.name}`,
    el(
      "button",
      { type: "button", class: `b-box k-capability b-area${g.faded ? " outer" : ""}`, onclick: pick(`a:${g.name}`) },
      kindLine("Capabilities", `${g.type}, ${g.capabilities.length}`),
      el("span", { class: "b-name" }, g.name),
      g.only.map((o) => el("span", { class: "b-only" }, `Only on ${list(o.via)}: ${someOf(o.names)}`)),
    ),
  );
}

const zone = (cls, title, ...content) => el("div", { class: `b-zone ${cls}` }, el("h3", {}, title), el("div", { class: "b-zone-body" }, content));

function frame(name) {
  const n = node(name);
  const s = screen;
  const keeps = s.kept.get(name) ?? [];
  const body = [
    zone(
      "z-interface",
      "Interfaces",
      s.ports.map((iface) =>
        register(`p:${iface}`, el("button", { type: "button", class: `b-port edge${s.fadedPorts.has(iface) ? " outer" : ""}`, onclick: pick(`p:${iface}`) }, iface)),
      ),
    ),
    zone("z-capability", "Capabilities", s.areas.map(areaBox)),
    s.columns.length > 0 &&
      zone("z-component", "Components", el("div", { class: "b-cols" }, s.columns.map((c) => el("div", { class: "b-col b-placed" }, c.map((id) => box(id, "inside")))))),
  ];
  return el(
    "section",
    { class: `b-frame ${kindClass(name)}` },
    el(
      "header",
      { class: "b-frame-head" },
      el("span", { class: "b-kind" }, KIND_WORD[n.kind] + (n.also.length ? `, shared with ${n.also.join(", ")}` : "")),
      el("h2", {}, name),
      text("p", n.description),
      s.notes.map((t) => el("p", { class: "b-through" }, t)),
      keeps.length > 0 && el("div", { class: "b-keeps" }, el("span", { class: "b-keeps-label" }, "Keeps"), chips(keeps)),
    ),
    el("div", { class: "b-body" }, body),
  );
}

// Places absolutely positioned items, each as close as it can to the height it wants its centre at.
// Items that would overlap form a block, kept in order and centred on what its items want on
// average, so that several boxes linked to one thing sit around it rather than below it. Returns
// the height used.
function settle(items, gap) {
  const blocks = [...items].sort((a, b) => a.want - b.want).map((it) => ({ items: [it] }));
  const place = (b) => {
    let off = 0;
    const tops = b.items.map((it) => {
      const want = it.want - it.el.offsetHeight / 2 - off;
      off += it.el.offsetHeight + gap;
      return want;
    });
    b.height = off - gap;
    b.top = Math.max(0, avg(tops));
  };
  blocks.forEach(place);
  for (let i = 1; i < blocks.length; ) {
    const [a, b] = [blocks[i - 1], blocks[i]];
    if (a.top + a.height + gap <= b.top) i++;
    else {
      a.items.push(...b.items);
      blocks.splice(i, 1);
      place(a);
      i = 1;
    }
  }
  for (const b of blocks) {
    let y = b.top;
    for (const it of b.items) {
      it.el.style.top = `${y}px`;
      y += it.el.offsetHeight + gap;
    }
  }
  const last = blocks.at(-1);
  return last ? last.top + last.height : 0;
}

function render() {
  reg = new Map();
  drawn = [];
  screen = screenOf(openBox);
  const s = screen;
  current = null;
  if (selected)
    try {
      current = lineage(selected);
    } catch {
      selected = null;
    }
  const stage = el("div", { class: `b-stage${s.top ? " top" : ""}` });
  const wires = svgEl("svg", { class: "b-wires" });
  const left = zone("z-consumer b-left", "Used by", s.consumers.map((c) => box(c, "left")));
  const middle = s.top ? zone("z-component b-mid", "Providers", el("div", { class: "b-col b-placed" }, s.boxes.map((p) => box(p, "inside")))) : frame(openBox);
  const right = s.uses.length > 0 && zone("z-uses b-right", "Uses", s.uses.map((u) => box(u, "right")));
  stage.append(wires, left, middle, ...[right].filter(Boolean));
  document.getElementById("scroll").replaceChildren(stage);
  drawNav();
  if (selected && !reg.has(selected) && !selected.startsWith("c:")) {
    selected = null;
    return render();
  }

  const o = stage.getBoundingClientRect();
  const mid = (e) => {
    const r = e.getBoundingClientRect();
    return { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top, y: (r.top + r.bottom) / 2 - o.top };
  };
  const bodyOf = (cls) => stage.querySelector(`.${cls} > .b-zone-body`);

  // Capabilities stack in the order of the interfaces that reach them, each interface sits level
  // with its capabilities, each component level with the capabilities it handles, and each
  // consumer level with what it uses. A group linked to one thing is centred on it.
  if (!s.top) {
    const first = (g) => Math.min(...g.ports.map((p) => s.ports.indexOf(p)));
    let y = 0;
    for (const g of [...s.areas].sort((a, b) => first(a) - first(b))) {
      const e = reg.get(`a:${g.name}`);
      e.style.top = `${y}px`;
      g.y = y + e.offsetHeight / 2;
      y += e.offsetHeight + 12;
    }
    const h = settle(s.ports.map((p) => ({ el: reg.get(`p:${p}`), want: avg(s.areas.filter((g) => g.ports.includes(p)).map((g) => g.y)) })), 6);
    bodyOf("z-capability").style.height = `${Math.max(y, h)}px`;
    bodyOf("z-interface").style.height = `${Math.max(y, h)}px`;
    // A component without capabilities on this screen sits level with what calls it. Columns go
    // left to right, so callers are already placed.
    const capTop = mid(bodyOf("z-capability")).t;
    for (const col of stage.querySelectorAll(".b-cols > .b-col")) {
      const t = mid(col).t;
      const items = [...col.children].map((e) => {
        const inside = subtree(e.dataset.key.slice(2));
        const served = s.areas.filter((g) => g.members.some((a) => handlers(a).some((x) => inside.includes(x))));
        const callers = s.links.filter((b) => b.provider === inside[0] && s.boxes.includes(b.consumer)).map((b) => mid(reg.get(`b:${b.consumer}`)).y);
        const want = served.length ? avg(served.map((g) => capTop + g.y)) : callers.length ? avg(callers) : t;
        return { el: e, want: want - t };
      });
      col.style.height = `${settle(items, 14)}px`;
    }
  }
  const targetsOf = (c) =>
    unique(
      s.top
        ? boundaries.filter((b) => b.consumer === c && s.boxes.includes(b.provider)).map((b) => reg.get(`b:${b.provider}`))
        : boundaries.filter((b) => b.consumer === c).flatMap((b) => b.interfaces).filter((i) => s.ports.includes(i)).map((i) => reg.get(`p:${i}`)),
    );
  const leftBody = bodyOf("b-left");
  if (s.top) {
    // Each provider and the consumers that use it form a row, centred on each other.
    const col = stage.querySelector(".b-mid .b-col");
    const firstUse = (c) => s.boxes.find((p) => boundaries.some((b) => b.consumer === c && b.provider === p));
    const rows = [...s.boxes.map((p) => [reg.get(`b:${p}`), s.consumers.filter((c) => firstUse(c) === p)]), [null, s.consumers.filter((c) => !firstUse(c))]];
    let y = 0;
    for (const [pe, cs] of rows) {
      const ces = cs.map((c) => reg.get(`b:${c}`));
      const ph = pe?.offsetHeight ?? 0;
      const ch = ces.reduce((n, e) => n + e.offsetHeight + 14, -14);
      const rh = Math.max(ph, ch);
      if (rh <= 0) continue;
      if (pe) pe.style.top = `${y + (rh - ph) / 2}px`;
      let cy = y + (rh - Math.max(ch, 0)) / 2;
      for (const e of ces) {
        e.style.top = `${cy}px`;
        cy += e.offsetHeight + 14;
      }
      y += rh + 28;
    }
    col.style.height = leftBody.style.height = `${Math.max(0, y - 28)}px`;
  } else {
    const lt = mid(leftBody).t;
    leftBody.style.height = `${settle(
      s.consumers.map((c) => {
        const to = targetsOf(c);
        return { el: reg.get(`b:${c}`), want: (to.length ? avg(to.map((p) => mid(p).y)) : 0) - lt };
      }),
      14,
    )}px`;
  }
  // A box that both uses the open box and is used by it is drawn on both sides; what it is used for
  // starts from, and places, the one on the right.
  const usedBox = (u) => right?.querySelector(`.b-zone-body > [data-key="${CSS.escape(`b:${u}`)}"]`) ?? reg.get(`b:${u}`);
  // What the open box uses is centred, as a block, on the open box's body.
  // Each box to the right sits level with what calls it; the open box calls from its body's middle.
  if (right) {
    const body = right.querySelector(".b-zone-body");
    const rt = mid(body).t;
    const frameMid = mid(stage.querySelector(".b-body")).y;
    const items = s.uses.map((u) => {
      const ys = s.links.filter((b) => b.provider === u).map((b) => (b.consumer === openBox ? frameMid : mid(reg.get(`b:${b.consumer}`)).y));
      return { el: usedBox(u), want: (ys.length ? avg(ys) : frameMid) - rt };
    });
    body.style.height = `${settle(items, 14)}px`;
  }

  wires.setAttribute("width", stage.scrollWidth);
  wires.setAttribute("height", stage.scrollHeight);
  const curve = (a, b) => {
    const dx = Math.max(20, Math.abs(b[0] - a[0]) / 2);
    return `M${a[0]},${a[1]} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b[0]},${b[1]}`;
  };
  const wire = (from, to, a, b, cls) => wires.append(svgEl("path", { d: curve(a, b), "data-from": from, "data-to": to, class: cls }));
  for (const c of s.consumers)
    for (const t of targetsOf(c)) {
      const from = mid(reg.get(`b:${c}`));
      const to = mid(t);
      wire(`b:${c}`, t.dataset.key, [from.r, from.y], [to.l - (s.top ? 0 : 4), to.y]);
    }
  // An interface that offers only some of a group's capabilities joins it with a dashed line.
  for (const g of s.areas) {
    const at = mid(reg.get(`a:${g.name}`));
    for (const p of g.ports) {
      const from = mid(reg.get(`p:${p}`));
      wire(`p:${p}`, `a:${g.name}`, [from.r, from.y], [at.l, at.y], g.partial.includes(p) ? "part" : null);
    }
  }
  // Dependencies, from the right edge of a component, or of the open box, to what it depends on. A
  // line that passes a column in between goes straight through the nearest gap between its boxes,
  // so that it never seems to leave from a box it only passes behind.
  const frameEl = stage.querySelector(".b-frame");
  const cols = [...stage.querySelectorAll(".b-cols > .b-col")].map((c) => ({ ...mid(c), boxes: [...c.children].map(mid).sort((a, b) => a.t - b.t) }));
  const colOf = (e) => cols.findIndex((c) => e.l >= c.l - 1 && e.r <= c.r + 1);
  const gapAt = (c, want) => {
    const gaps = [[-Infinity, c.boxes[0]?.t ?? Infinity], ...c.boxes.map((x, i) => [x.b, c.boxes[i + 1]?.t ?? Infinity])];
    const ys = gaps.map(([lo, hi]) => (hi - lo < 40 ? (lo + hi) / 2 : Math.min(Math.max(want, lo + 12), hi - 12)));
    return ys.reduce((best, y) => (Math.abs(y - want) < Math.abs(best - want) ? y : best));
  };
  for (const b of s.links) {
    const own = b.consumer === openBox;
    const from = mid(own ? frameEl : reg.get(`b:${b.consumer}`));
    const to = mid(s.uses.includes(b.provider) ? usedBox(b.provider) : reg.get(`b:${b.provider}`));
    const y = own ? Math.min(Math.max(to.y, from.t + 40), from.b - 20) : from.y;
    const start = own ? -1 : colOf(from);
    const end = colOf(to) === -1 ? cols.length : colOf(to);
    let d = "";
    let at = [from.r, y];
    for (let k = start + 1; k < end && start !== -1; k++) {
      const gy = gapAt(cols[k], at[1] + ((to.y - at[1]) * (cols[k].l - at[0])) / Math.max(1, to.l - at[0]));
      d += `${d ? " " : ""}${curve(at, [cols[k].l - 10, gy])} L${cols[k].r + 10},${gy}`;
      at = [cols[k].r + 10, gy];
    }
    wires.append(svgEl("path", { d: `${d}${d ? " " : ""}${curve(at, [to.l, to.y])}`, "data-from": `b:${b.consumer}`, "data-to": `b:${b.provider}` }));
  }
  paint(stage);
  drawPanel();
  if (selected && reg.has(selected)) reg.get(selected).scrollIntoView({ block: "nearest", inline: "nearest" });
  if (STILL) drawLegend(stage);
}

function paint(stage) {
  const keys = current?.keys;
  for (const [key, e] of drawn) {
    const on = Boolean(keys?.has(key));
    e.classList.toggle("lit", on);
    e.classList.toggle("chosen", key === selected);
    e.classList.toggle("dim", Boolean(keys) && !on);
  }
  // A resource in a lit box is part of that box, so it does not fade; it is outlined only when it is
  // linked to the selection. In the box of a selected resource, the other resources still fade.
  if (keys)
    for (const chip of stage.querySelectorAll(".b-chip.dim")) {
      const box = chip.closest(".b-box");
      if (!box?.classList.contains("lit")) continue;
      if (selected.startsWith("r:") && box.querySelector(`[data-key="${CSS.escape(selected)}"]`)) continue;
      chip.classList.remove("dim");
    }
  // A line lights when both its ends are; the open box counts as lit.
  const end = (k) => keys.has(k) || k === `b:${openBox}`;
  for (const p of stage.querySelectorAll(".b-wires path")) {
    const on = Boolean(keys) && end(p.dataset.from) && keys.has(p.dataset.to);
    p.classList.toggle("lit", on);
    p.classList.toggle("dim", Boolean(keys) && !on);
  }
}

// ---------- the panel: only what the map does not already show ----------

function capabilityList(caps) {
  return el(
    "ul",
    { class: "b-caps" },
    caps.map((c) =>
      el(
        "li",
        { class: selected === `c:${c.id}` ? "on" : "" },
        el("button", { type: "button", onclick: pick(`c:${c.id}`) }, c.name),
        el("span", {}, [onlyOn(c) && `Only on ${list(onlyOn(c))}; `, c.acts.map((a) => `${MODE_WORD[a.mode]} ${a.resource}`).join(", ")].filter(Boolean).join("")),
      ),
    ),
  );
}

function panelOf(key) {
  const s = screen;
  const cut = key.indexOf(":");
  const kind = key.slice(0, cut);
  const id = key.slice(cut + 1);
  const head = (k, cls, title) => [el("span", { class: `b-kind ${cls}` }, k), el("h2", {}, title)];
  if (kind === "a") {
    const g = s.areas.find((x) => x.name === id);
    return [head(`Capabilities, ${g.type}`, "k-capability", g.name), text("p", g.members[0].description), capabilityList(g.capabilities)];
  }
  if (kind === "p") {
    // The capabilities on this screen that the interface offers, each once.
    const caps = s.areas
      .flatMap((g) => g.members.flatMap((a) => a.capabilities))
      .filter((c, i, all) => c.via.includes(id) && all.findIndex((o) => o.name === c.name && o.via.includes(id)) === i);
    return [head("Interface", "k-interface", id), text("p", interfaceText.get(id)), caps.length > 0 && capabilityList(caps)];
  }
  if (kind === "c") {
    const c = capabilityById.get(id);
    const g = s.areas.find((x) => x.members.includes(c.area));
    return [
      g && el("button", { type: "button", class: "b-back", onclick: pick(`a:${g.name}`) }, `‹ ${g.name}`),
      head("Capability", "k-capability", c.name),
      el("h3", {}, "Takes"),
      el("p", {}, c.takes),
      el("h3", {}, "Gives"),
      el("p", {}, c.gives),
    ];
  }
  if (kind === "r") {
    const r = resourceByName.get(id);
    const hidden = keepersOf(id).flatMap((k) => {
      const at = [...s.kept].find(([b, rs]) => rs.includes(id) && subtree(b).includes(k))?.[0];
      return at && at !== k ? [`Kept by ${k}, inside ${at}.`] : [];
    });
    return [
      head("Resource", "k-resource", id),
      text("p", r.description),
      hidden.map((t) => el("p", { class: "b-note" }, t)),
      r.properties?.length > 0 && [el("h3", {}, "Properties"), el("ul", { class: "b-props" }, r.properties.map((x) => el("li", {}, x)))],
      el("h3", {}, "Capabilities that act on it"),
      // Two consumers may have the same capability, such as Start a run; list it once.
      capabilityList(actingOn(id).filter((c, i, all) => all.findIndex((o) => o.name === c.name) === i)),
    ];
  }
  const n = node(id);
  return [
    head(KIND_WORD[n.kind], kindClass(id), n.name),
    n.description && [n.kind === "consumer" ? null : el("h3", {}, "Responsibilities"), text("p", n.description)],
    opens(id) && id !== openBox && el("button", { type: "button", class: "b-go wide", onclick: () => go(id) }, el("span", {}, `Open ${id}`), el("span", {}, "›")),
  ];
}

function drawPanel() {
  const panel = document.getElementById("panel");
  panel.hidden = !selected;
  if (!selected) return;
  panel.replaceChildren(
    el("button", { type: "button", class: "b-close", "aria-label": "Close", onclick: clear }, "×"),
    ...[panelOf(selected)].flat(3).filter(Boolean),
  );
}

function clear() {
  if (!selected) return;
  selected = null;
  render();
}

// ---------- where you are ----------

function drawNav() {
  const crumbs = [["All providers", 0], ...trail.map((n, i) => [n, i + 1])];
  document.getElementById("nav").replaceChildren(
    el("button", { type: "button", class: "b-back-nav", disabled: !visited.length && !trail.length ? "" : null, onclick: back }, "‹ Back"),
    ...crumbs
      .flatMap(([label, depth], i) => [
        i > 0 && el("span", { class: "b-sep" }, "›"),
        i === crumbs.length - 1 ? el("strong", {}, label) : el("button", { type: "button", onclick: () => navigate(trail.slice(0, depth)) }, label),
      ])
      .filter(Boolean),
    el(
      "label",
      { class: "b-level" },
      el("input", { type: "checkbox", checked: levelOne ? "" : null, onchange: (e) => setLevel(e.target.checked) }),
      "Level 1 only",
    ),
  );
}

// Turns Level 1 alone on or off. Turned on inside a provider, it shows that provider.
function setLevel(on) {
  levelOne = on;
  const next = fit(trail);
  if (sameTrail(next, trail)) render();
  else navigate(next, { remember: false });
}

// The path to a box when nothing says how you came: its parents, or, for an outside service, the
// shallowest screen that shows a component calling it.
function trailFor(name) {
  if (name === TOP) return [];
  const n = node(name);
  if (n.kind !== "outside") return [...ancestors(name), name];
  const callers = boundaries
    .filter((b) => b.provider === name && nodes.has(b.consumer) && node(b.consumer).kind !== "consumer")
    .map((b) => b.consumer)
    .sort((a, b) => ancestors(a).length - ancestors(b).length);
  if (!callers.length) return [name];
  const at = node(callers[0]).parent;
  return [...trailFor(at ?? callers[0]), name];
}

// On Level 1 alone, a path ends at the last provider on it that opens, or at All providers.
const fit = (t) => (levelOne ? t.filter((x) => node(x).kind === "provider" && opens(x)).slice(-1) : t);

// Opening a box from the screen it is on adds it to the path you came by; a box elsewhere gets the
// path trailFor gives it.
function go(name) {
  if (name === TOP) return navigate([]);
  const i = trail.indexOf(name);
  if (i >= 0) return navigate(trail.slice(0, i + 1));
  navigate(screen.visible.has(name) || screen.boxes.includes(name) ? [...trail, name] : trailFor(name));
}

// Back returns to the previous screen as it was left: same scroll, same selection. On Level 1
// alone, it skips the screens that Level 1 shows as this one.
function back() {
  while (visited.length) {
    const earlier = visited.pop();
    if (!sameTrail(fit(earlier), trail)) return navigate(earlier, { remember: false, restore: true });
  }
  if (trail.length) navigate(trail.slice(0, -1), { remember: false, restore: true });
}

// Changes screen. Opening a box grows it into the new screen's frame; going back shrinks the frame
// into the box it came from. Everything else fades.
const addressOf = (t) => `#${t.length ? t.map(slugOf).join("/") : "all"}`;
const sameTrail = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function navigate(to, { remember = true, fromAddress = false, restore = false } = {}) {
  const next = fit(to);
  const before = trail;
  if (sameTrail(before, next)) return;
  if (remember) visited.push(before);
  const scroller = document.getElementById("scroll");
  memory.set(addressOf(before), { left: scroller.scrollLeft, top: scroller.scrollTop, selected });
  const kept = restore ? memory.get(addressOf(next)) : null;
  const deeper = next.length > before.length && before.every((x, i) => next[i] === x);
  const shallower = before.length > next.length && next.every((x, i) => before[i] === x);
  const frameEl = () => document.querySelector(".b-frame");
  // Only one element may carry the name at a time; the last landing still has it.
  for (const e of document.querySelectorAll(".b-frame, .b-box")) e.style.viewTransitionName = "";
  const grow = deeper ? reg.get(`b:${next[before.length]}`) : shallower ? frameEl() : null;
  if (grow) grow.style.viewTransitionName = "zoom";
  // A box on both screens travels from its place on this one to its place on the next, such as a
  // component that moves from Components to Used by when a component it calls opens.
  const nextOpen = next.at(-1) ?? TOP;
  const nextVisible = screenOf(nextOpen).visible;
  const travellers = [...screen.visible].filter((n) => n !== nextOpen && nextVisible.has(n));
  const travel = () => {
    for (const n of travellers) {
      const e = reg.get(`b:${n}`);
      if (e) e.style.viewTransitionName = `b-${cssName(n)}`;
    }
  };
  travel();
  if (!fromAddress) {
    const hash = addressOf(next);
    // A sandboxed viewer may refuse to change the address; the screen changes all the same.
    try {
      if (decodeURIComponent(location.hash) !== hash) history.pushState(null, "", hash);
    } catch {}
  }
  transition(() => {
    trail = next;
    openBox = next.at(-1) ?? TOP;
    selected = kept?.selected ?? null;
    render();
    scroller.scrollTo(kept?.left ?? 0, kept?.top ?? 0);
    const landing = deeper ? frameEl() : shallower ? reg.get(`b:${before[next.length]}`) : null;
    if (grow && landing) landing.style.viewTransitionName = "zoom";
    travel();
  });
}

function fromHash() {
  const parts = decodeURIComponent(location.hash.slice(1)).split("/").filter(Boolean);
  if (parts[0] === "all") return [];
  const names = parts.map((p) => bySlug.get(p));
  if (!names.length || names.some((n) => !n)) return HOME;
  return names.length === 1 ? trailFor(names[0]) : names;
}

// ---------- still images ----------

// Every screen once: All providers, then each box that opens, in the order the map lists them.
const screens = () => [[], ...[...nodes.keys()].filter(opens).map(trailFor)];

// A still image cannot be clicked, so it carries under the drawing what the panel would say about
// what the screen shows.
function legendOf(s) {
  const entry = (name, about) => el("li", { html: inline(`**${name}**: ${sentence(about ?? "")}`) });
  const section = (title, about, items) =>
    items.length > 0 && el("section", {}, el("h3", {}, title), about && text("p", about), el("ul", {}, items));
  const acts = (c) => c.acts.map((a) => `${MODE_WORD[a.mode]} ${a.resource}`).join(", ");
  return el(
    "div",
    { class: "b-legend" },
    section("On this screen", null, [...s.consumers, ...s.boxes, ...s.uses].map((n) => entry(n, node(n).description))),
    section("Interfaces", null, s.ports.map((p) => entry(p, interfaceText.get(p)))),
    s.areas.map((g) =>
      section(
        `${g.name} (${g.type})`,
        g.members[0].description,
        g.capabilities.map((c) => entry(c.name, `${onlyOn(c) ? `only on ${list(onlyOn(c))}; ` : ""}takes ${c.takes}; gives ${c.gives}; ${acts(c)}.`)),
      ),
    ),
    section("Resources", null, unique([...s.kept.values()].flat()).map((r) => entry(r, resourceByName.get(r).description))),
  );
}

// Writes the size the image needs, and the addresses of every screen, on the page for shoot-map.mjs.
function drawLegend(stage) {
  const legend = legendOf(screen);
  legend.style.width = `${Math.max(stage.offsetWidth, 1200)}px`;
  document.querySelector(".b-legend")?.remove();
  document.querySelector("main").after(legend);
  const right = Math.max(stage.getBoundingClientRect().right, legend.getBoundingClientRect().right) + 16;
  const bottom = legend.getBoundingClientRect().bottom + window.scrollY;
  document.documentElement.dataset.stillSize = `${Math.ceil(right)}x${Math.ceil(bottom)}`;
  document.documentElement.dataset.screens = screens().map(addressOf).join(" ");
}

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
window.addEventListener("popstate", () => navigate(fromHash(), { fromAddress: true, remember: false, restore: true }));
document.getElementById("scroll").addEventListener("click", clear);
document.addEventListener("keydown", (e) => e.key === "Escape" && clear());
window.addEventListener("resize", () => render());
trail = fit(fromHash());
openBox = trail.at(-1) ?? TOP;
render();
document.fonts?.ready.then(render);

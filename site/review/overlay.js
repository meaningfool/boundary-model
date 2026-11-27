// The review overlay. It lives in the shell, the artifact's main page, which alone gets the
// runtime's capabilities, and reaches into the same-origin frame that shows the site. Edit mode
// replaces a tagged line of text, Note mode leaves a note on anything. Each change is one document
// in the db collection "review-changes"; "Send" posts one comment to Claude naming the batch.
// Everything from the db or the sources is set with textContent, never as HTML.
(() => {
  "use strict";

  const COLLECTION = "review-changes";
  const LIVE = new Set(["pending", "sent", "applied"]);
  const STATUS_LABEL = { pending: "Pending", sent: "Sent", applied: "Applied", stale: "Stale", done: "Done" };
  const BLOCKS = new Set(["p", "ul", "ol", "div", "pre", "figure", "table", "blockquote", "aside", "section", "dl", "h1", "h2", "h3", "h4", "h5", "h6"]);
  const NAV = "header.header, nav.sidebar, .sl-skip-link";
  const MAX_TEXT = 4000;

  const $ = (id) => document.getElementById(id);
  const frame = $("rv-frame");
  const ui = {
    bar: $("rv-bar"),
    modes: $("rv-modes"),
    list: $("rv-list"),
    count: $("rv-count"),
    send: $("rv-send"),
    hide: $("rv-hide"),
    show: $("rv-show"),
    pillCount: $("rv-pill-count"),
    status: $("rv-status"),
    panel: $("rv-panel"),
    panelBody: $("rv-panel-body"),
    panelClose: $("rv-panel-close"),
    pop: $("rv-pop"),
  };

  const state = {
    mode: "browse",
    phase: "connecting", // connecting | absent | loading | ready | error
    dbError: null,
    slow: false,
    col: null,
    comments: null,
    canWrite: null, // what user.can("data.write") said: true, false or null for nothing
    readOnly: false, // a write was refused: no more writes this visit
    userId: null,
    changes: [],
    sources: null,
    sourcesFailed: false,
    sendState: "unknown", // the last canSendToClaude() answer, or "absent"
    sendBlocked: false, // a permanent refusal: no more sends this visit
    sending: false,
    flash: "",
    panelOpen: false,
    collapsed: false,
    pop: null,
    reveal: null,
    drafts: {}, // unsaved text, by draft key, kept on this device
    openDraft: null, // the key of the pop-up to reopen after a reload or a new version
    view: { doc: null, page: null, info: null, rendered: new Map(), originals: new Map(), hover: null, focusable: [] },
  };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const now = () => new Date().toISOString();
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const fileName = (path) => path.replace(/^src\/content\/docs\//, "");

  // ---------------------------------------------------------------------------------------------
  // Drafts: text typed in a pop-up is kept on this device at every keystroke, so a reload, a new
  // version of the page, Escape, a mode change or a click on a link never loses it. Only Save and
  // Discard clear it. The page that was open with a draft reopens it after a reload.

  const DRAFTS = "bm-review-drafts";
  const OPEN = "bm-review-open";
  function loadDrafts() {
    try {
      state.drafts = JSON.parse(localStorage.getItem(DRAFTS) || "{}") || {};
      state.openDraft = localStorage.getItem(OPEN) || null;
    } catch {}
    try {
      const hot = window.claude?.hot?.data;
      if (hot?.drafts) state.drafts = { ...hot.drafts, ...state.drafts };
      if (!state.openDraft && hot?.openDraft) state.openDraft = hot.openDraft;
    } catch {}
  }
  function storeDrafts() {
    try {
      localStorage.setItem(DRAFTS, JSON.stringify(state.drafts));
      localStorage.setItem(OPEN, state.openDraft ?? "");
    } catch {}
  }
  function keepDraft(key, draft) {
    if (draft) state.drafts[key] = draft;
    else {
      delete state.drafts[key];
      if (state.openDraft === key) state.openDraft = null;
    }
    storeDrafts();
    render();
  }
  function setOpenDraft(key) {
    if (state.openDraft === key) return;
    state.openDraft = key;
    storeDrafts();
  }
  try {
    window.claude?.hot?.snapshot?.(() => ({ drafts: state.drafts, openDraft: state.openDraft }));
  } catch {}

  /** Where an element sits under the page's body, as child positions, to find it again later. */
  function pathOf(el) {
    const parts = [];
    for (let e = el; e && e !== e.ownerDocument.body && e.parentElement; e = e.parentElement) parts.unshift([...e.parentElement.children].indexOf(e));
    return parts.join(".");
  }
  function atPath(doc, path) {
    let e = doc.body;
    for (const i of path ? path.split(".") : []) e = e?.children?.[Number(i)];
    return e ?? null;
  }

  /** A button that acts at once when there is nothing to lose, and asks once more when there is. */
  function twoStep(button, label, risky, act) {
    let armed = 0;
    button.addEventListener("click", () => {
      if (!risky() || armed) {
        clearTimeout(armed);
        armed = 0;
        act();
        return;
      }
      button.textContent = "Click again to discard";
      armed = setTimeout(() => {
        armed = 0;
        button.textContent = label;
      }, 4000);
    });
  }

  /** Build an element: attributes as properties or attributes, strings as text nodes. */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs ?? {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
    return el;
  }

  function errorCode(e) {
    return e && typeof e === "object" && typeof e.code === "string" ? e.code : "unknown";
  }

  // ---------------------------------------------------------------------------------------------
  // Text helpers

  /** A light rendering of a source line's text: Markdown and JSX marks stripped, not rendered. */
  function light(text) {
    const parts = text.split(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/);
    let out = "";
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 2) out += parts[i].replace(/^ (.*) $/, "$1");
      else if (i % 3 === 0) {
        const kept = [];
        out += parts[i]
          .replace(/\\([!-/:-@[-`{-~])/g, (_, c) => (kept.push(c), "\u{F0001}"))
          .replace(/<[A-Za-z][\w.:-]*\s[^>]*?\b(?:name|label|title)="([^"]*)"[^>]*\/>/g, "$1")
          .replace(/<\/?[A-Za-z][^>]*>/g, "")
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
          .replace(/\*+|~~/g, "")
          .replace(/(^|[^\p{L}\p{N}])_+|_+(?=[^\p{L}\p{N}]|$)/gu, "$1")
          .replace(/\u{F0001}/gu, () => kept.shift());
      }
    }
    return decodeEntities(out);
  }

  const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
  function decodeEntities(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    });
  }

  function excerpt(s, max = 90) {
    const t = (s ?? "").replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`;
  }

  // ---------------------------------------------------------------------------------------------
  // Changes: the chain of edits on one line, and what the frame shows

  const byCreated = (a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")) || String(a.id).localeCompare(String(b.id));

  /**
   * The text a tagged line has once its edits apply, starting from this build's line. An edit
   * applies when its `before` is the text so far. One whose `after` is already the text is in this
   * build. Returns the current line and the last edit that applied.
   */
  function chainFor(src) {
    const tag = state.sources?.tags?.[src];
    let cur = tag ? tag.before : null;
    let last = null;
    for (const c of state.changes.filter((c) => c.kind === "edit" && c.src === src && LIVE.has(c.status)).sort(byCreated)) {
      if (c.before === cur) {
        cur = c.after;
        last = c;
      }
    }
    return { cur, last };
  }

  function textOfLine(src, line) {
    const prefix = state.sources?.tags?.[src]?.prefix ?? "";
    return line.startsWith(prefix) ? line.slice(prefix.length) : line;
  }

  /** Show every live edit for the page in the frame, in place, after undoing the last showing. */
  function applyEdits() {
    const v = state.view;
    if (!v.doc) return;
    for (const el of [...v.rendered.keys()]) restore(el);
    if (!state.sources) return;
    const els = new Map();
    for (const el of v.doc.querySelectorAll("[data-src]")) {
      const list = els.get(el.dataset.src) ?? [];
      list.push(el);
      els.set(el.dataset.src, list);
    }
    const srcs = new Set(state.changes.filter((c) => c.kind === "edit" && LIVE.has(c.status) && els.has(c.src)).map((c) => c.src));
    for (const src of srcs) {
      const { cur, last } = chainFor(src);
      if (!last || cur === state.sources.tags[src]?.before) continue;
      for (const el of els.get(src)) show(el, light(textOfLine(src, cur)), last.status);
    }
  }

  function show(el, text, status) {
    const v = state.view;
    const own = [];
    let stop = null;
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 1 && BLOCKS.has(n.localName)) {
        stop = n;
        break;
      }
      own.push(n);
    }
    for (const n of own) n.remove();
    const span = v.doc.createElement("span");
    span.className = "bm-rv-edit";
    span.dataset.bmState = status;
    span.textContent = text;
    el.insertBefore(span, stop);
    v.originals.set(el, own);
    v.rendered.set(el, span);
  }

  function restore(el) {
    const v = state.view;
    const span = v.rendered.get(el);
    for (const n of v.originals.get(el) ?? []) el.insertBefore(n, span);
    span?.remove();
    v.rendered.delete(el);
    v.originals.delete(el);
  }

  // ---------------------------------------------------------------------------------------------
  // Writes: one at a time per document, retried once when the store is briefly unavailable

  const queues = new Map();
  function write(id, op) {
    const attempt = async () => {
      try {
        return await op(state.col.doc(id));
      } catch (e) {
        if (errorCode(e) !== "unavailable") throw e;
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 800));
        return await op(state.col.doc(id));
      }
    };
    const run = (queues.get(id) ?? Promise.resolve()).catch(() => {}).then(attempt);
    queues.set(id, run);
    return run;
  }

  /** Say why a write failed, and stop writing when this view may not. */
  function writeError(e) {
    const code = errorCode(e);
    if (code === "invalid_argument" || code === "not_granted" || code === "capability_disabled" || code === "capability_removed" || code === "revoked") {
      if (code !== "invalid_argument" || state.canWrite !== true) {
        state.readOnly = true;
        if (state.mode !== "browse") setMode("browse");
        render();
        return "Not saved. This view cannot save changes.";
      }
      return "Not saved. The change was refused.";
    }
    if (code === "quota_exceeded") return "Not saved. The review database is full. Ask Claude to clear finished changes.";
    if (code === "resource_exhausted") return "Not saved. Too many changes at once. Wait a moment, then try again.";
    if (code === "unavailable") return "Not saved. The database did not answer. Try again.";
    return "Not saved. Try again.";
  }

  // ---------------------------------------------------------------------------------------------
  // Capabilities

  async function connect() {
    const claude = window.claude;
    if (!claude || typeof claude.use !== "function") {
      state.phase = "absent";
      render();
      return;
    }
    const use = (name) => Promise.resolve(claude.use(name)).catch(() => null);
    use("user").then(async (user) => {
      if (!user) return;
      const [canWrite, id] = await Promise.all([user.can("data.write"), user.id()]);
      state.canWrite = canWrite;
      state.userId = id;
      if (canWrite === false && state.mode !== "browse") setMode("browse");
      render();
    });
    use("comments").then((comments) => {
      state.comments = comments;
      refreshSend();
    });
    const db = await use("db");
    if (!db) {
      state.phase = "absent";
      render();
      return;
    }
    state.col = db.collection(COLLECTION);
    subscribe();
  }

  let unsubscribe = null;
  function subscribe() {
    unsubscribe?.();
    state.phase = "loading";
    state.dbError = null;
    state.slow = false;
    render();
    let confirmed = false;
    const timer = setTimeout(() => {
      if (!confirmed) {
        state.slow = true;
        render();
      }
    }, 10000);
    unsubscribe = state.col.onSnapshot(
      (snap) => {
        state.changes = snap.docs.filter((d) => d.exists).map((d) => ({ ...d.data(), id: d.id }));
        if (!snap.metadata?.fromCache) {
          confirmed = true;
          state.slow = false;
          clearTimeout(timer);
        }
        state.phase = "ready";
        applyEdits();
        render();
        refreshSend();
        resumeDraft();
      },
      (e) => {
        clearTimeout(timer);
        unsubscribe = null;
        state.phase = "error";
        state.dbError = errorCode(e);
        if (state.mode !== "browse") setMode("browse");
        render();
      },
    );
  }

  let sendCheck = 0;
  async function refreshSend() {
    const ticket = ++sendCheck;
    let s;
    if (!state.comments) s = "absent";
    else {
      try {
        s = await state.comments.canSendToClaude();
      } catch {
        s = "off";
      }
    }
    if (ticket !== sendCheck) return;
    state.sendState = s;
    render();
  }

  async function loadSources() {
    try {
      const res = await fetch("sources.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      state.sources = await res.json();
    } catch {
      state.sourcesFailed = true;
    }
    if (state.view.doc) bindFrame();
    render();
  }

  // ---------------------------------------------------------------------------------------------
  // The frame: bind on every load, so navigation between pages keeps working

  const FRAME_CSS = `
    html[data-bm-mode="edit"] [data-src] { cursor: text; }
    html[data-bm-mode="note"] body { cursor: crosshair; }
    html[data-bm-mode] iframe { pointer-events: none; }
    [data-bm-hover], [data-bm-active], [data-bm-reveal] {
      outline: 2px solid var(--bm-fg, currentColor) !important;
      outline-offset: 3px;
      border-radius: 3px;
    }
    html[data-bm-mode="note"] [data-bm-hover] { outline-style: dashed !important; }
    [data-bm-active] { box-shadow: 0 0 0 7px color-mix(in srgb, var(--bm-fg, #888) 12%, transparent); }
    [data-bm-focus]:focus { outline: none; }
    [data-bm-focus]:focus-visible { outline: 2px solid var(--bm-fg, currentColor) !important; outline-offset: 3px; border-radius: 3px; }
    .bm-rv-edit {
      background: color-mix(in srgb, var(--bm-fg, #888) 9%, transparent);
      border-radius: 3px;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      text-decoration: underline dashed color-mix(in srgb, var(--bm-fg, #888) 55%, transparent);
      text-decoration-thickness: 1px;
      text-underline-offset: 4px;
    }
    .bm-rv-edit::after {
      content: "Pending edit";
      display: inline-block;
      margin-left: 0.5em;
      padding: 0 0.45em;
      border: 1px dashed var(--bm-line2, #999);
      border-radius: 4px;
      color: var(--bm-fg2, inherit);
      font: 500 10.5px/1.7 var(--__sl-font-mono, ui-monospace, monospace);
      letter-spacing: 0.02em;
      vertical-align: 0.2em;
      white-space: nowrap;
    }
    .bm-rv-edit[data-bm-state="sent"]::after { content: "Sent to Claude"; border-style: solid; }
    .bm-rv-edit[data-bm-state="applied"]::after { content: "Applied, not in this preview yet"; border-style: solid; }
  `;

  function pageOf(win) {
    try {
      const path = decodeURIComponent(win.location.pathname);
      const at = path.lastIndexOf("/site/");
      const inSite = at >= 0 ? path.slice(at + 6) : path.split("/").pop();
      return inSite === "" ? "index.html" : inSite;
    } catch {
      return null;
    }
  }

  function bindFrame() {
    const v = state.view;
    let doc = null;
    try {
      doc = frame.contentDocument;
    } catch {
      doc = null;
    }
    if (v.doc !== doc) {
      v.rendered.clear();
      v.originals.clear();
      v.hover = null;
      v.focusable = [];
    }
    if (state.pop && state.pop.el.ownerDocument !== doc) closePop(false);
    v.doc = doc && doc.documentElement && doc.body ? doc : null;
    v.page = v.doc ? pageOf(frame.contentWindow) : null;
    v.info = v.page ? (state.sources?.pages?.[v.page] ?? null) : null;
    if (v.doc && !v.doc.getElementById("bm-review-style")) {
      v.doc.head.append(Object.assign(v.doc.createElement("style"), { id: "bm-review-style", textContent: FRAME_CSS }));
      v.doc.addEventListener("click", onFrameClick, true);
      v.doc.addEventListener("pointerover", onFrameOver, true);
      v.doc.addEventListener("pointerout", onFrameOut, true);
      v.doc.addEventListener("keydown", onKey, true);
      frame.contentWindow.addEventListener("scroll", placePop, { passive: true });
      frame.contentWindow.addEventListener("resize", placePop);
    }
    applyMode();
    applyEdits();
    if (state.reveal && v.doc) {
      const src = state.reveal;
      state.reveal = null;
      revealIn(src);
    }
    render();
    resumeDraft();
  }

  function applyMode() {
    const v = state.view;
    if (!v.doc) return;
    const root = v.doc.documentElement;
    if (state.mode === "browse") delete root.dataset.bmMode;
    else root.dataset.bmMode = state.mode;
    setHover(null);
    for (const el of v.focusable) {
      el.removeAttribute("tabindex");
      delete el.dataset.bmFocus;
    }
    v.focusable = [];
    if (state.mode === "browse") return;
    const main = v.doc.querySelector("main") ?? v.doc.body;
    const targets = state.mode === "edit" ? main.querySelectorAll("[data-src]") : main.querySelectorAll("[data-src], figure, .not-content, .expressive-code, table, img");
    for (const el of targets) {
      if (el.hasAttribute("tabindex") || el.matches("a[href], button, input, select, textarea, summary")) continue;
      el.setAttribute("tabindex", "0");
      el.dataset.bmFocus = "";
      v.focusable.push(el);
    }
  }

  function setMode(mode) {
    if (mode !== "browse" && !canEditHere()) mode = "browse";
    if (state.pop) closeKeeping(false);
    state.mode = mode;
    applyMode();
    render();
  }

  /** Whether this view can make changes at all. */
  function canChange() {
    return state.phase === "ready" && !state.readOnly && state.canWrite !== false;
  }
  function canEditHere() {
    return canChange() && Boolean(state.view.doc);
  }

  // The frame's nodes come from another realm, so `instanceof Element` would be false for them.
  const elementOf = (t) => (t?.nodeType === 1 ? t : (t?.parentElement ?? null));

  /** In Note mode, the element a click on `t` is about: the tagged block, the figure, the box. */
  function noteTarget(t) {
    const v = state.view;
    const tagged = t.closest("[data-src]");
    if (tagged) return tagged;
    let el = t;
    for (let svg = el.closest("svg"); svg; svg = svg.parentElement?.closest("svg")) el = svg;
    const win = v.doc.defaultView;
    while (el && el.parentElement && el !== v.doc.body) {
      const d = win.getComputedStyle(el).display;
      if (d !== "inline" && d !== "contents") break;
      el = el.parentElement;
    }
    return el && el !== v.doc.body && el !== v.doc.documentElement ? el : t;
  }

  function targetFor(t) {
    if (state.mode === "edit") return t.closest("[data-src]");
    if (state.mode === "note") return noteTarget(t);
    return null;
  }

  function setHover(el) {
    const v = state.view;
    if (v.hover === el) return;
    if (v.hover) delete v.hover.dataset.bmHover;
    v.hover = el;
    if (el) el.dataset.bmHover = "";
  }

  function onFrameOver(ev) {
    if (state.mode === "browse") return;
    const t = elementOf(ev.target);
    if (!t || (state.mode === "edit" && t.closest(NAV))) return setHover(null);
    setHover(targetFor(t));
  }
  function onFrameOut(ev) {
    if (!ev.relatedTarget) setHover(null);
  }

  function onFrameClick(ev) {
    if (state.mode === "browse") return;
    const t = elementOf(ev.target);
    if (!t) return;
    // In Edit mode the site's own navigation still works, so you can move between pages.
    if (state.mode === "edit" && t.closest(NAV)) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    pick(t);
  }

  function pick(t) {
    if (state.pop?.dirty?.()) {
      flash("Save or cancel the open change first.");
      ui.pop.querySelector("textarea")?.focus();
      return;
    }
    if (state.mode === "edit") {
      const el = t.closest("[data-src]");
      if (el && state.sources?.tags?.[el.dataset.src]) openEdit(el);
      else if (el && !state.sources) openInfo(el, "The page sources did not load, so text cannot be edited here. You can still leave a note.");
      else openInfo(noteTarget(t), "This text does not come from one line of a page's source, so it cannot be edited here. You can leave a note about it instead.");
    } else if (state.mode === "note") openNote(noteTarget(t));
  }

  function onKey(ev) {
    if (ev.key === "Escape") {
      if (state.pop) closeKeeping();
      else if (state.panelOpen) togglePanel(false);
      else if (state.mode !== "browse") setMode("browse");
      else return;
      ev.preventDefault();
      return;
    }
    const t = elementOf(ev.target);
    if ((ev.key === "Enter" || ev.key === " ") && state.mode !== "browse" && t?.ownerDocument === state.view.doc && t.matches("[data-bm-focus]")) {
      ev.preventDefault();
      ev.stopPropagation();
      pick(t);
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Where an element is, in words

  function describe(el) {
    const v = state.view;
    const doc = v.doc;
    const info = v.info;
    const page = info?.path ?? `/${v.page ?? ""}`;
    const title = info?.title ?? doc.title;
    let heading = null;
    for (const hd of doc.querySelectorAll("main h1, main h2, main h3, main h4")) {
      if (hd === el) break;
      if (hd.contains(el) || hd.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) heading = hd;
      else break;
    }
    const headingText = heading ? excerpt(heading.textContent, 80) : null;
    const src = el.dataset?.src && state.sources?.tags?.[el.dataset.src] ? el.dataset.src : null;
    const label = (e) => `${e.localName}${e.classList?.[0] ? `.${e.classList[0]}` : ""}`;
    const root = el.closest?.(".not-content, figure");
    const element = src ? null : root && root !== el ? `${label(root)} > ${label(el)}` : label(el);
    const text =
      (el.localName === "iframe" ? el.title : (el.innerText ?? el.textContent).trim()) ||
      el.querySelector?.("iframe")?.title ||
      el.getAttribute("aria-label") ||
      el.getAttribute("alt") ||
      el.getAttribute("title") ||
      el.querySelector?.("title, img[alt]")?.textContent ||
      "";
    const quote = excerpt(text);
    const location = [`${title} (${page})`, headingText && `under "${headingText}"`, src ? fileName(src) : `in ${element}`, quote && `"${quote}"`].filter(Boolean).join(", ");
    return { page, file: info?.file ?? null, src, heading: headingText, excerpt: quote || null, element, location };
  }

  // ---------------------------------------------------------------------------------------------
  // Pop-ups

  function openPop(pop, content, focus) {
    closePop(false);
    state.pop = pop;
    pop.el.dataset.bmActive = "";
    ui.pop.replaceChildren(...content.filter(Boolean));
    ui.pop.hidden = false;
    const area = ui.pop.querySelector("textarea");
    if (area) {
      const fit = () => {
        area.style.height = "auto";
        area.style.height = `${area.scrollHeight + 2}px`;
      };
      area.addEventListener("input", () => {
        fit();
        placePop();
      });
      fit();
    }
    placePop();
    (focus ?? ui.pop.querySelector("textarea, button"))?.focus({ preventScroll: true });
  }

  function closePop(returnFocus) {
    const pop = state.pop;
    if (!pop) return;
    state.pop = null;
    delete pop.el.dataset.bmActive;
    ui.pop.hidden = true;
    ui.pop.replaceChildren();
    if (returnFocus) {
      if (pop.el.isConnected && pop.el.hasAttribute("tabindex")) pop.el.focus({ preventScroll: true });
      else ui.modes.querySelector(`[data-mode="${state.mode}"]`)?.focus();
    }
  }

  /** Close the open pop-up on purpose: its text stays as a draft, but it will not reopen by itself. */
  function closeKeeping(returnFocus = true) {
    const pop = state.pop;
    if (!pop) return;
    const kept = pop.dirty?.();
    if (pop.key && state.openDraft === pop.key) setOpenDraft(null);
    closePop(returnFocus);
    if (kept) flash("Your text is kept as a draft. Open the same spot again, or find it under Changes.");
  }

  /** Reopen the pop-up that was open with a draft before a reload, when its page is shown. */
  function resumeDraft() {
    const key = state.openDraft;
    const d = key ? state.drafts[key] : null;
    if (!d || state.pop || !state.view.doc || d.page !== state.view.page || !canChange()) return;
    if (d.kind === "edit" && !state.sources) return;
    const el = d.kind === "edit" ? [...state.view.doc.querySelectorAll("[data-src]")].find((e) => e.dataset.src === d.src) : atPath(state.view.doc, d.path);
    if (!el) return;
    if (state.mode !== d.kind) setMode(d.kind);
    if (state.mode !== d.kind) return;
    el.scrollIntoView({ block: "center" });
    if (d.kind === "edit") openEdit(el);
    else openNote(el);
    flash("Your unsaved text is back.");
  }

  /** Open a draft from the list: go to its page, then reopen it there. */
  function openDraftFromList(key) {
    const d = state.drafts[key];
    if (!d) return;
    setOpenDraft(key);
    togglePanel(false);
    if (state.view.page === d.page) resumeDraft();
    else frame.src = `site/${d.page}`;
  }

  function placePop() {
    const pop = state.pop;
    if (!pop) return;
    if (matchMedia("(max-width: 600px)").matches) {
      ui.pop.style.left = "";
      ui.pop.style.top = "";
      return;
    }
    const g = 16;
    const fr = frame.getBoundingClientRect();
    const r = pop.el.getBoundingClientRect();
    const w = ui.pop.offsetWidth;
    const ht = ui.pop.offsetHeight;
    let top = fr.top + r.bottom + 10;
    if (top + ht > innerHeight - g) top = fr.top + r.top - ht - 10;
    if (top < g) top = Math.max(g, innerHeight - ht - g);
    const left = Math.min(Math.max(g, fr.left + r.left), innerWidth - w - g);
    ui.pop.style.left = `${Math.round(left)}px`;
    ui.pop.style.top = `${Math.round(top)}px`;
  }

  function popHead(title, where) {
    return [h("h2", { id: "rv-pop-title", text: title }), h("p", { class: "rv-pop-where", text: where })];
  }

  function actions(...buttons) {
    return h("div", { class: "rv-actions" }, buttons);
  }

  function busy(buttons, on, label) {
    for (const b of buttons) b.disabled = on;
    if (label) buttons[0].textContent = label;
  }

  function openEdit(el) {
    const src = el.dataset.src;
    const tag = state.sources.tags[src];
    const { cur, last } = chainFor(src);
    const initial = textOfLine(src, cur);
    const where = src.includes("#") ? `${fileName(src.split("#")[0])}, frontmatter ${src.split("#")[1]}` : `${fileName(src.split(":")[0])}, line ${src.split(":")[1]}`;
    const key = `edit:${src}`;
    const draft = state.drafts[key];
    const area = h("textarea", { id: "rv-text", rows: 4, spellcheck: "true", maxlength: MAX_TEXT, "aria-describedby": "rv-hint" });
    area.value = draft?.text ?? initial;
    const err = h("p", { class: "rv-error", role: "alert" });
    const save = h("button", { class: "rv-btn rv-btn--solid", type: "button", text: "Save" });
    const close = h("button", { class: "rv-btn", type: "button", text: "Close", onclick: () => closeKeeping() });
    const discard = h("button", { class: "rv-btn rv-btn--quiet", type: "button", text: "Discard text" });
    twoStep(discard, "Discard text", () => area.value !== initial, () => {
      keepDraft(key, null);
      closePop(true);
      flash("Text discarded.");
    });
    const remove =
      last?.status === "pending"
        ? h("button", { class: "rv-btn rv-btn--quiet", type: "button", text: "Undo change", onclick: () => run(() => deleteChange(last.id), "Change removed.") })
        : null;
    const buttons = [save, close, discard, remove].filter(Boolean);
    const page = state.view.page;
    const loc = describe(el).location;
    const sync = () => {
      const changed = area.value !== initial;
      discard.hidden = !changed;
      if (changed) {
        keepDraft(key, { kind: "edit", page, src, where: loc, text: area.value, at: now() });
        setOpenDraft(key);
      } else if (state.drafts[key]) keepDraft(key, null);
    };
    area.addEventListener("input", sync);
    const content = [
      ...popHead("Edit text", where),
      draft ? h("p", { class: "rv-pop-text rv-restored", text: "Your unsaved text is back. Save it, or discard it to start over." }) : null,
      last
        ? h("p", { class: "rv-pop-text", text: last.status === "pending" ? "This line has a pending change. Saving replaces it." : `This line has a change that is ${STATUS_LABEL[last.status].toLowerCase()}. Saving adds a new one.` })
        : null,
      cur !== tag.before ? h("details", {}, h("summary", { text: "Text in this preview" }), h("p", { text: tag.text })) : null,
      h("label", { class: "rv-field", for: "rv-text", text: "Source text" }),
      area,
      h("p", { class: "rv-hint", id: "rv-hint", text: "Markdown marks stay as written. Enter saves. Escape or Close keeps your text as a draft." }),
      err,
      actions(save, close, h("span", { class: "rv-spacer" }), discard, remove),
    ];
    async function run(fn, done) {
      err.textContent = "";
      busy(buttons, true);
      try {
        const msg = await fn();
        closePop(true);
        flash(msg ?? done);
      } catch (e) {
        err.textContent = writeError(e);
        busy(buttons, false);
        save.textContent = "Save";
      }
    }
    const doSave = () => {
      const text = area.value.replace(/\s*[\r\n]+\s*/g, " ").trim();
      if (!text) {
        err.textContent = "The text cannot be empty. To remove it, leave a note instead.";
        return;
      }
      save.textContent = "Saving…";
      run(async () => {
        const msg = await saveEdit(el, src, text);
        keepDraft(key, null);
        return msg;
      });
    };
    save.addEventListener("click", doSave);
    area.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.isComposing) {
        ev.preventDefault();
        if (!ev.shiftKey) doSave();
      }
    });
    openPop({ kind: "edit", el, src, key, dirty: () => area.value !== initial }, content, area);
    discard.hidden = area.value === initial;
    area.setSelectionRange(area.value.length, area.value.length);
  }

  async function saveEdit(el, src, text) {
    const prefix = state.sources.tags[src].prefix;
    const after = src.includes("#") ? text : prefix + text;
    const { cur, last } = chainFor(src);
    if (after === cur) return "No change to save.";
    if (last?.status === "pending") {
      if (after === last.before) {
        await deleteChange(last.id);
        return "Change removed. The text is back as it was.";
      }
      await write(last.id, (ref) => ref.update({ after, updatedAt: now() }));
      return "Saved. The change is pending.";
    }
    const where = describe(el);
    await create({ kind: "edit", ...where, before: cur, after, note: null });
    return "Saved. The change is pending.";
  }

  async function create(fields) {
    const ref = state.col.doc();
    const id = ref.id;
    const t = now();
    const body = { id, ...fields, status: "pending", reply: null, createdAt: t, updatedAt: t, sentAt: null, createdBy: state.userId ?? null };
    await write(id, (r) => r.set(body));
  }

  function deleteChange(id) {
    return write(id, (ref) => ref.delete());
  }

  function openNote(el) {
    const where = describe(el);
    const path = pathOf(el);
    const key = `note:${state.view.page}:${path}`;
    const draft = state.drafts[key];
    const area = h("textarea", { id: "rv-text", rows: 5, maxlength: MAX_TEXT, placeholder: "What should change here?", "aria-describedby": "rv-hint" });
    area.value = draft?.text ?? "";
    const err = h("p", { class: "rv-error", role: "alert" });
    const save = h("button", { class: "rv-btn rv-btn--solid", type: "button", text: "Save note" });
    const cancel = h("button", { class: "rv-btn", type: "button", text: "Close", onclick: () => closeKeeping() });
    const discard = h("button", { class: "rv-btn rv-btn--quiet", type: "button", text: "Discard text" });
    twoStep(discard, "Discard text", () => area.value.trim() !== "", () => {
      keepDraft(key, null);
      closePop(true);
      flash("Text discarded.");
    });
    const sync = () => {
      const typed = area.value.trim() !== "";
      discard.hidden = !typed;
      if (typed) {
        keepDraft(key, { kind: "note", page: state.view.page, path, where: where.location, text: area.value, at: now() });
        setOpenDraft(key);
      } else if (state.drafts[key]) keepDraft(key, null);
    };
    area.addEventListener("input", sync);
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const doSave = async () => {
      const note = area.value.trim();
      if (!note) {
        err.textContent = "Write a note first.";
        area.focus();
        return;
      }
      err.textContent = "";
      busy([save, cancel], true, "Saving…");
      try {
        const before = where.src ? chainFor(where.src).cur : null;
        await create({ kind: "note", ...where, before, after: null, note });
        keepDraft(key, null);
        closePop(true);
        flash("Note saved. It is pending.");
      } catch (e) {
        err.textContent = writeError(e);
        busy([save, cancel], false, "Save note");
      }
    };
    save.addEventListener("click", doSave);
    area.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) {
        ev.preventDefault();
        doSave();
      }
    });
    openPop(
      { kind: "note", el, key, dirty: () => area.value.trim() !== "" },
      [
        ...popHead("Note", where.location),
        draft ? h("p", { class: "rv-pop-text rv-restored", text: "Your unsaved note is back. Save it, or discard it to start over." }) : null,
        h("label", { class: "rv-field", for: "rv-text", text: "Your note" }),
        area,
        h("p", { class: "rv-hint", id: "rv-hint", text: `${mac ? "Command" : "Ctrl"} and Enter saves. Escape or Close keeps your text as a draft.` }),
        err,
        actions(save, cancel, h("span", { class: "rv-spacer" }), discard),
      ],
      area,
    );
    discard.hidden = area.value.trim() === "";
  }

  function openInfo(el, text) {
    const note = h("button", { class: "rv-btn rv-btn--solid", type: "button", text: "Leave a note", onclick: () => openNote(el) });
    const cancel = h("button", { class: "rv-btn", type: "button", text: "Cancel", onclick: () => closePop(true) });
    openPop({ kind: "info", el }, [...popHead("Not editable here", describe(el).location), h("p", { class: "rv-pop-text", text }), actions(note, cancel)], note);
  }

  // ---------------------------------------------------------------------------------------------
  // The list of changes

  function togglePanel(open = !state.panelOpen) {
    state.panelOpen = open;
    if (open) refreshSend();
    render();
    if (open) ui.panelClose.focus();
    else ui.list.focus();
  }

  function renderPanel() {
    const groups = [
      ["Pending", state.changes.filter((c) => c.status === "pending")],
      ["Sent to Claude", state.changes.filter((c) => c.status === "sent")],
      ["Answered", state.changes.filter((c) => !["pending", "sent"].includes(c.status))],
    ];
    const body = [];
    const drafts = Object.entries(state.drafts).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)));
    if (drafts.length) {
      body.push(h("h3", { class: "rv-group", text: `Unsaved drafts (${drafts.length})` }));
      body.push(h("ul", { class: "rv-list" }, drafts.map(([key, d]) => draftItem(key, d))));
    }
    if (!state.changes.length && !drafts.length) body.push(h("p", { class: "rv-empty", text: "No changes yet. Choose Edit or Note, then click the page." }));
    for (const [title, list] of groups) {
      if (!list.length) continue;
      body.push(h("h3", { class: "rv-group", text: `${title} (${list.length})` }));
      body.push(h("ul", { class: "rv-list" }, list.sort(byCreated).reverse().map(item)));
    }
    ui.panelBody.replaceChildren(...body);
  }

  function draftItem(key, d) {
    const open = h("button", { class: "rv-btn", type: "button", text: "Open", onclick: () => openDraftFromList(key) });
    const discard = h("button", { class: "rv-btn rv-btn--quiet", type: "button", text: "Discard" });
    twoStep(discard, "Discard", () => true, () => {
      keepDraft(key, null);
      flash("Draft discarded.");
    });
    return h(
      "li",
      { class: "rv-item" },
      h("div", { class: "rv-item-head" }, h("span", { class: "rv-tag", text: d.kind === "note" ? "Note" : "Edit" }), h("span", { class: "rv-tag rv-tag--status", "data-status": "draft", text: "Not saved" })),
      h("p", { class: "rv-loc", text: String(d.where ?? d.page ?? "") }),
      h("p", { class: "rv-note", text: excerpt(light(String(d.text ?? "")), 200) }),
      h("div", { class: "rv-item-actions" }, canChange() ? open : null, discard),
    );
  }

  function item(c) {
    const text = (line) => (typeof line === "string" ? light(c.src ? textOfLine(c.src, line) : line) : "");
    const kind = c.kind === "note" ? "Note" : "Edit";
    const status = STATUS_LABEL[c.status] ?? String(c.status ?? "Unknown");
    const acts = [];
    const page = Object.entries(state.sources?.pages ?? {}).find(([, p]) => p.path === c.page)?.[0];
    if (page) acts.push(h("button", { class: "rv-btn", type: "button", text: "Show", onclick: () => reveal(page, c.src) }));
    if (c.status === "pending" && canChange()) {
      const del = h("button", { class: "rv-btn rv-btn--quiet", type: "button", text: "Delete" });
      let armed = 0;
      del.addEventListener("click", async () => {
        if (!armed) {
          del.textContent = "Confirm delete";
          armed = setTimeout(() => {
            armed = 0;
            del.textContent = "Delete";
          }, 4000);
          return;
        }
        clearTimeout(armed);
        del.disabled = true;
        try {
          await deleteChange(c.id);
          flash("Change deleted.");
        } catch (e) {
          del.disabled = false;
          flash(writeError(e));
        }
      });
      acts.push(del);
    }
    return h(
      "li",
      { class: "rv-item", "data-id": c.id },
      h("div", { class: "rv-item-head" }, h("span", { class: "rv-tag", text: kind }), h("span", { class: "rv-tag rv-tag--status", "data-status": c.status, text: status })),
      h("p", { class: "rv-loc", text: c.location ?? c.page ?? "" }),
      c.kind === "edit"
        ? h("dl", { class: "rv-diff" }, h("dt", { text: "Before" }), h("dd", { class: "rv-before", text: text(c.before) }), h("dt", { text: "After" }), h("dd", { text: text(c.after) }))
        : h("p", { class: "rv-note", text: String(c.note ?? "") }),
      c.reply ? h("p", { class: "rv-reply", text: String(c.reply) }) : null,
      acts.length ? h("div", { class: "rv-item-actions" }, acts) : null,
    );
  }

  /** Show a change's page in the frame, and its element when it has a tag. */
  function reveal(page, src) {
    if (state.view.page === page) {
      if (src) revealIn(src);
      return;
    }
    state.reveal = src ?? null;
    frame.src = `site/${page}`;
  }

  function revealIn(src) {
    const el = [...(state.view.doc?.querySelectorAll("[data-src]") ?? [])].find((e) => e.dataset.src === src);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduced.matches ? "auto" : "smooth" });
    el.dataset.bmReveal = "";
    setTimeout(() => delete el.dataset.bmReveal, 2000);
  }

  // ---------------------------------------------------------------------------------------------
  // Send the pending changes to Claude, in one comment

  function summary(list) {
    const edits = list.filter((c) => c.kind === "edit").length;
    const notes = list.length - edits;
    const parts = [edits && plural(edits, "edit"), notes && plural(notes, "note")].filter(Boolean).join(", ");
    const head = `Apply ${plural(list.length, "review change")}: ${parts}. They are rows with status sent in the db collection ${COLLECTION}.`;
    const tail = "Mark each row applied, stale or done, with a one-line reply.";
    const ids = ` Ids: ${list.map((c) => c.id).join(", ")}.`;
    const full = `${head}${ids} ${tail}`;
    return new TextEncoder().encode(full).length <= 3800 ? full : `${head} ${tail}`;
  }

  async function send() {
    const list = state.changes.filter((c) => c.status === "pending").sort(byCreated);
    if (!list.length || state.sending || state.sendState !== "available" || !state.comments) return;
    state.sending = true;
    render();
    try {
      const anchor = await state.comments.anchorFor(ui.send);
      await state.comments.sendToClaude({ anchor, text: summary(list) });
    } catch (e) {
      state.sending = false;
      flash(sendError(e), 12000);
      render();
      return;
    }
    const sentAt = now();
    let failed = 0;
    for (const c of list) {
      try {
        await write(c.id, (ref) => ref.update({ status: "sent", sentAt, updatedAt: sentAt }));
      } catch {
        failed++;
      }
    }
    state.sending = false;
    flash(
      failed
        ? `Sent to Claude, but ${plural(failed, "change")} could not be marked sent. Claude has their ids, so do not send them again.`
        : `Sent ${plural(list.length, "change")} to Claude. Replies show in the list of changes.`,
      12000,
    );
    render();
  }

  function sendError(e) {
    const code = errorCode(e);
    const kept = "Your changes are kept.";
    switch (code) {
      case "consent_required":
        return `Not sent. Allow this page to comment as you, then send again. ${kept}`;
      case "forbidden":
      case "not_granted":
      case "capability_disabled":
      case "capability_removed":
        state.sendBlocked = true;
        return `Not sent. You cannot send comments to Claude from this view. ${kept}`;
      case "claude_unavailable":
        return `Not sent. Claude cannot take requests right now. ${kept}`;
      case "rate_limited":
        return `Not sent. Too many requests. Wait a minute, then send again. ${kept}`;
      case "invalid":
      case "transform_error":
        return `Not sent. The comment was not accepted. ${kept}`;
      default:
        return `Sending failed. It may still have reached Claude: check the comments before you send again. ${kept}`;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // The toolbar

  let flashTimer = 0;
  function flash(text, ms = 5000) {
    state.flash = text;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      state.flash = "";
      render();
    }, ms);
    render();
  }

  function statusText() {
    if (state.flash) return state.flash;
    switch (state.phase) {
      case "connecting":
        return "Loading review tools…";
      case "absent":
        return "Editing is unavailable here. This view cannot save changes, so the site works for browsing only.";
      case "loading":
        return state.slow ? "Saved changes cannot be reached yet." : "Loading saved changes…";
      case "error":
        return state.dbError === "revoked" ? "Saved changes are no longer available in this view." : "Saved changes could not be loaded.";
    }
    if (state.readOnly || state.canWrite === false) return "You can read the changes here, but this view cannot save new ones.";
    if (state.slow) return "Saved changes may be out of date.";
    const pending = state.changes.filter((c) => c.status === "pending").length;
    if (pending && canChange()) {
      if (state.sendBlocked || state.sendState === "absent") return "Sending to Claude is unavailable in this view.";
      if (state.sendState === "writers_only") return "Only editors of this artifact can send changes to Claude.";
      if (state.sendState === "no_session") return "No Claude session can take the changes right now. Try again later.";
      if (state.sendState !== "available" && state.sendState !== "unknown") return "Sending to Claude is off in this view.";
    }
    if (!state.view.doc) return "This page is outside the preview, so it cannot be reviewed.";
    if (state.mode === "edit") return state.sourcesFailed ? "The page sources did not load, so only notes work." : "Edit mode: click text to change it.";
    if (state.mode === "note") return "Note mode: click anything to leave a note about it.";
    return "";
  }

  let panelKey = "";
  function render() {
    const changing = canChange();
    const pending = state.changes.filter((c) => c.status === "pending").length;
    const hasList = (state.phase === "ready" && (changing || state.changes.length > 0)) || Object.keys(state.drafts).length > 0;

    ui.bar.hidden = state.collapsed;
    ui.bar.classList.toggle("rv-bar--quiet", !changing && !hasList);
    ui.show.hidden = !state.collapsed;
    ui.pillCount.textContent = String(pending);
    ui.modes.hidden = !changing;
    for (const b of ui.modes.querySelectorAll("[data-mode]")) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
      b.disabled = b.dataset.mode !== "browse" && !state.view.doc;
    }
    ui.list.hidden = !hasList;
    ui.count.textContent = String(pending);
    ui.list.setAttribute("aria-expanded", String(state.panelOpen && hasList));
    ui.panel.hidden = !(state.panelOpen && hasList) || state.collapsed;
    // Rebuild the list only when what it shows changed, so focus and a pending "Confirm delete" stay.
    const key = ui.panel.hidden ? "" : JSON.stringify([state.changes, state.drafts, changing, Boolean(state.sources)]);
    if (key && key !== panelKey) renderPanel();
    panelKey = key;

    ui.send.hidden = !(changing && pending > 0);
    ui.send.textContent = state.sending ? "Sending…" : `Send ${plural(pending, "change")} to Claude`;
    ui.send.disabled = !state.sending && (state.sendBlocked || state.sendState !== "available");
    ui.send.setAttribute("aria-busy", String(state.sending));

    const text = statusText();
    const retry = state.phase === "error" && state.dbError !== "revoked" && !state.flash;
    if (ui.status.dataset.text !== text || ui.status.dataset.retry !== String(retry)) {
      ui.status.dataset.text = text;
      ui.status.dataset.retry = String(retry);
      ui.status.replaceChildren(text);
      if (retry) ui.status.append(h("button", { class: "rv-btn", type: "button", text: "Try again", onclick: subscribe }));
    }
    ui.status.hidden = !text;
    if (state.pop) placePop();
  }

  // ---------------------------------------------------------------------------------------------
  // Start

  ui.modes.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
  });
  ui.list.addEventListener("click", () => togglePanel());
  ui.panelClose.addEventListener("click", () => togglePanel(false));
  ui.send.addEventListener("click", send);
  const collapse = (on) => {
    if (on && state.mode !== "browse") setMode("browse");
    state.collapsed = on;
    try {
      localStorage.setItem("bm-review-collapsed", on ? "1" : "");
    } catch {}
    render();
    (on ? ui.show : ui.hide).focus();
  };
  ui.hide.addEventListener("click", () => collapse(true));
  ui.show.addEventListener("click", () => collapse(false));
  document.addEventListener("keydown", onKey);
  addEventListener("resize", placePop);
  addEventListener("focus", refreshSend);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refreshSend());
  try {
    state.collapsed = localStorage.getItem("bm-review-collapsed") === "1";
  } catch {}
  loadDrafts();
  {
    const d = state.openDraft ? state.drafts[state.openDraft] : null;
    if (d?.page && d.page !== "index.html") frame.src = `site/${d.page}`;
  }

  frame.addEventListener("load", bindFrame);
  try {
    if (frame.contentDocument?.readyState === "complete" && frame.contentWindow.location.href !== "about:blank") bindFrame();
  } catch {}
  render();
  loadSources();
  connect();
})();

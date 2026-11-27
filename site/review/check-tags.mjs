// After the review build: tag the text that comes from frontmatter, check every tag against its
// source, and collect the table of sources that the overlay's pop-ups show. The check fails loudly
// when a tagged element's text is not what its source line renders as.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readValue } from "./frontmatter.mjs";
import { decodeEntities, normalize, sourceMatches, splitLine } from "./source-text.mjs";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const BLOCKS = new Set(["p", "ul", "ol", "div", "pre", "figure", "table", "blockquote", "aside", "section", "dl", "h1", "h2", "h3", "h4", "h5", "h6"]);

/** A minimal parser for the well-formed HTML that Astro writes: elements, attributes and text. */
export function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!(?:doctype|DOCTYPE)[^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) {
    const top = stack.at(-1);
    if (m[2] === undefined) {
      if (!m[0].startsWith("<!")) top.children.push({ text: decodeEntities(m[0]) });
      continue;
    }
    const tag = m[2].toLowerCase();
    if (m[1]) {
      const at = stack.map((e) => e.tag).lastIndexOf(tag);
      if (at > 0) stack.length = at;
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? "");
    }
    const el = { tag, attrs, children: [] };
    top.children.push(el);
    if (RAW.has(tag)) {
      const end = html.indexOf(`</${tag}`, re.lastIndex);
      const stop = end < 0 ? html.length : end;
      el.children.push({ text: html.slice(re.lastIndex, stop) });
      re.lastIndex = stop;
      stack.push(el);
    } else if (!m[4] && !VOID.has(tag)) stack.push(el);
  }
  return root;
}

const textOf = (node) => (node.text !== undefined ? node.text : node.children.map(textOf).join(""));

/** An element's own text: everything before its first block child, as a list item's text. */
export function ownText(el) {
  let s = "";
  for (const c of el.children) {
    if (c.tag && BLOCKS.has(c.tag)) break;
    s += textOf(c);
  }
  return s;
}

function* walk(node) {
  for (const c of node.children ?? []) {
    if (!c.tag) continue;
    yield c;
    yield* walk(c);
  }
}

/** Add frontmatter tags to one built page: the title (or hero title) and the lede (or tagline). */
export function tagFrontmatter(html, file, isHero) {
  const one = (pattern, key) => {
    const found = html.match(new RegExp(pattern, "g")) ?? [];
    if (found.length !== 1) throw new Error(`review: expected one ${pattern} in the page of ${file}, found ${found.length}.`);
    html = html.replace(new RegExp(pattern), (m) => `${m} data-src="${file}#${key}"`);
  };
  one('<h1 id="_top"', isHero ? "hero.title" : "title");
  one('<p class="lede"', isHero ? "hero.tagline" : "description");
  return html;
}

/**
 * Check every tagged element of the built pages against its source, and return the table the
 * overlay reads: for each tag, the source line (or frontmatter value), its prefix and its text.
 * `pages` maps each built page to its MDX file, relative to `siteDir`.
 */
export function checkTags({ outSite, siteDir, pages }) {
  const files = new Map();
  const lines = (file) => {
    if (!files.has(file)) files.set(file, readFileSync(join(siteDir, file), "utf8").split(/\r?\n/));
    return files.get(file);
  };
  const tags = {};
  const failures = [];
  const counts = {};
  for (const [page, file] of Object.entries(pages)) {
    const tree = parseHtml(readFileSync(join(outSite, page), "utf8"));
    let n = 0;
    for (const el of walk(tree)) {
      const src = el.attrs["data-src"];
      if (src === undefined) continue;
      n++;
      const m = /^(.+?)(?::(\d+)|#([\w.]+))$/.exec(src);
      if (!m || m[1] !== file) {
        failures.push(`${page}: <${el.tag} data-src="${src}"> does not name ${file}.`);
        continue;
      }
      let entry;
      if (m[2]) {
        const line = lines(file)[Number(m[2]) - 1];
        if (line === undefined) {
          failures.push(`${page}: ${src} is past the end of the file.`);
          continue;
        }
        entry = { tag: el.tag, before: line, ...splitLine(line, el.tag) };
      } else {
        const v = readValue(lines(file), m[3]);
        if (!v) {
          failures.push(`${page}: ${src} names no single-line frontmatter value.`);
          continue;
        }
        entry = { tag: el.tag, before: v.value, prefix: "", text: v.value };
      }
      const rendered = ownText(el);
      if (!sourceMatches(rendered, entry.text, el.tag)) {
        failures.push(`${page}: <${el.tag} data-src="${src}"> reads\n    ${JSON.stringify(normalize(rendered))}\n  but its source is\n    ${JSON.stringify(entry.text)}`);
        continue;
      }
      if (tags[src] && tags[src].before !== entry.before) failures.push(`${page}: ${src} is tagged twice with different sources.`);
      tags[src] = entry;
    }
    counts[page] = n;
    if (n === 0) failures.push(`${page}: no tagged text at all.`);
  }
  if (failures.length) {
    throw new Error(`review: ${failures.length} source tag${failures.length === 1 ? "" : "s"} failed the check:\n  ${failures.join("\n  ")}`);
  }
  return { tags, counts };
}

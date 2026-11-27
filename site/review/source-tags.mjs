// Source tags for the review build: each block of page text that comes from one line of an MDX
// file gets data-src="<path from site/>:<line>", so the review overlay can show and replace that
// line. Tagged: p, h2 to h4, li, td and th, including paragraphs written as a component's children,
// such as a <MapFrame> caption. Not tagged: code blocks, Starlight's aside titles, a list item whose
// text sits in paragraphs (the paragraphs are tagged instead), and anything a .astro component
// renders, which never reaches the Markdown tree.
//
// Astro 7 renders Markdown and MDX with Sätteri, which runs hast plugins, not rehype plugins:
// `markdown.rehypePlugins` only reaches the unified processor from @astrojs/markdown-remark, which
// the site does not install. So the integration below adds the plugin to the processor that Astro
// resolved, as Starlight adds its own.
import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TAGS = ["p", "h2", "h3", "h4", "li", "td", "th"];
const BLOCKS = new Set(["p", "ul", "ol", "div", "pre", "figure", "table", "blockquote", "aside", "section", "dl", "h1", "h2", "h3", "h4", "h5", "h6"]);

/** An Astro integration that tags the pages in `docsDir`, with paths relative to `siteDir`. */
export function sourceTagsIntegration({ siteDir, docsDir }) {
  return {
    name: "review-source-tags",
    hooks: {
      "astro:config:setup": ({ config }) => {
        const processor = config.markdown.processor;
        if (processor?.name !== "satteri" || !Array.isArray(processor.options?.hastPlugins)) {
          throw new Error(`review: source tags need Astro's Sätteri Markdown processor, but the site uses "${processor?.name}".`);
        }
        processor.options.hastPlugins.unshift(sourceTags({ siteDir, docsDir }));
      },
    },
  };
}

/** The Sätteri hast plugin factory, called once per compiled document. */
export function sourceTags({ siteDir, docsDir }) {
  return ({ fileURL, source }) => {
    if (!fileURL) return;
    const path = fileURLToPath(fileURL);
    if (!path.startsWith(docsDir + sep) || !/\.mdx?$/.test(path)) return;
    const file = relative(siteDir, path).split(sep).join("/");
    const offset = lineOffset(source, readFileSync(path, "utf8"), file);
    return {
      name: "review-source-tags",
      options: { position: true },
      element: {
        filter: TAGS,
        visit(node, ctx) {
          const line = sourceLine(node, ctx, file);
          if (line) ctx.setProperty(node, "data-src", `${file}:${line + offset}`);
        },
      },
    };
  };
}

/**
 * How many lines the compiled source sits below the file on disk. Astro blanks the frontmatter
 * before MDX compiles, keeping every line where it was, but a loader that cuts the frontmatter out
 * shifts the rest up. Find the shift at which every non-blank compiled line equals the file's.
 */
export function lineOffset(source, real, file) {
  const s = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const r = real.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let k = 0; k <= r.length - s.length + 1; k++) {
    if (s.every((line, i) => !line.trim() || r[i + k] === line)) {
      if (k) console.log(`review: ${file} compiled without its frontmatter, so its lines are shifted by ${k}.`);
      return k;
    }
  }
  throw new Error(`review: the compiled source of ${file} does not line up with the file, so its lines cannot be tagged.`);
}

/** The compiled line that holds all of `node`'s own text, or 0 when it should not be tagged. */
function sourceLine(node, ctx, file) {
  const pos = node.position;
  if (!pos) return 0;
  for (let p = ctx.parent(node); p; p = ctx.parent(p)) {
    if (p.type === "root") break;
    if (p.type === "element" && (p.tagName === "pre" || p.tagName === "code")) return 0;
  }
  const cls = String(node.properties?.class ?? node.properties?.className ?? "");
  if (cls.includes("starlight-aside__title")) return 0;
  // A list item's own text is what comes before its first block child, such as a nested list.
  const own = [];
  for (const child of node.children ?? []) {
    if ((child.type === "element" && BLOCKS.has(child.tagName)) || child.type === "mdxJsxFlowElement") break;
    own.push(child);
  }
  if (!own.some((c) => c.type !== "text" || c.value.trim())) return 0;
  const lines = new Set([pos.start.line]);
  if (own.length === (node.children ?? []).length) lines.add(pos.end.line);
  for (const c of own) {
    if (c.type === "text" && !c.value.trim()) continue;
    if (c.position) lines.add(c.position.start.line).add(c.position.end.line);
  }
  if (lines.size > 1) {
    console.warn(`review: ${file}:${pos.start.line} spreads its <${node.tagName}> over several lines, so it is not tagged.`);
    return 0;
  }
  return pos.start.line;
}

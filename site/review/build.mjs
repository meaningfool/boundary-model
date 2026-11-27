#!/usr/bin/env node
// Build the site as a review preview, for publishing as one artifact: out/index.html is the shell,
// which shows out/site/index.html full size and carries the review overlay. The site is built with
// one HTML file per page and every link made relative, so it works from any folder, and its text is
// tagged with the source lines it comes from. The deployed build (`npm run build`) is not touched.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTags, tagFrontmatter } from "./check-tags.mjs";
import { readValue } from "./frontmatter.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const site = dirname(here);
const out = join(here, "out");
const build = join(out, "site");
const docs = join(site, "src", "content", "docs");
const posix = (p) => p.split(sep).join("/");

// A config that reuses the site's own, adds the source tags, and changes only the output format and
// folders. Its cache is separate, so nothing from this build reaches the deployed one.
const config = join(site, "review.config.mjs");
writeFileSync(
  config,
  `import base from "./astro.config.mjs";
import { sourceTagsIntegration } from "./review/source-tags.mjs";
export default {
  ...base,
  outDir: ${JSON.stringify(build)},
  cacheDir: ${JSON.stringify(join(here, ".cache"))},
  build: { ...base.build, format: "file" },
  integrations: [sourceTagsIntegration(${JSON.stringify({ siteDir: site, docsDir: docs })}), ...(base.integrations ?? [])],
};
`,
);
rmSync(out, { recursive: true, force: true });
try {
  execFileSync("npm", ["run", "maps"], { cwd: site, stdio: "inherit" });
  execFileSync("npx", ["astro", "build", "--config", "./review.config.mjs"], { cwd: site, stdio: "inherit" });
} finally {
  rmSync(config, { force: true });
}

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });

// Each page and the MDX file it is built from.
const pages = {};
for (const name of readdirSync(docs).filter((n) => /\.mdx?$/.test(n))) {
  const page = name.replace(/\.mdx?$/, ".html");
  if (!existsSync(join(build, page))) throw new Error(`review: ${name} has no built page ${page}.`);
  pages[page] = posix(relative(site, join(docs, name)));
}

// Tag the text that comes from frontmatter, then check every tag against its source.
for (const [page, file] of Object.entries(pages)) {
  const lines = readFileSync(join(site, file), "utf8").split(/\r?\n/);
  const html = readFileSync(join(build, page), "utf8");
  writeFileSync(join(build, page), tagFrontmatter(html, file, Boolean(readValue(lines, "hero.title"))));
}
const { tags, counts } = checkTags({ outSite: build, siteDir: site, pages });

// Rewrite root-relative URLs to paths relative to each file. A link to a page's folder, such as
// /install/, points at its file, install.html.
const pageFile = (p) => {
  const m = /^([^#?]*?)\/?([#?].*)?$/.exec(p);
  return m[1] && existsSync(join(build, `${m[1]}.html`)) ? `${m[1]}.html${m[2] ?? ""}` : p;
};
for (const file of files(build)) {
  if (!/\.(html|css)$/.test(file)) continue;
  if (file.includes(`${sep}maps${sep}`)) continue; // drawn maps are self-contained
  const up = posix(relative(dirname(file), build)) || ".";
  const rel = (p) => `${up}/${p}`;
  let s = readFileSync(file, "utf8");
  s = s
    .replace(/(href|src)="\/"/g, (_, a) => `${a}="${rel("index.html")}"`)
    .replace(/(href|src|content)="\/(?!\/)([^"]*)"/g, (_, a, p) => `${a}="${rel(a === "href" ? pageFile(p) : p)}"`)
    .replace(/url\(\/(?!\/)([^)]*)\)/g, (_, p) => `url(${rel(p)})`);
  writeFileSync(file, s);
}

// What the overlay's pop-ups show: each page's file and path, and each tag's source.
const title = (file) => readValue(readFileSync(join(site, file), "utf8").split(/\r?\n/), "title")?.value ?? file;
const sources = {
  builtAt: new Date().toISOString(),
  collection: "review-changes",
  pages: Object.fromEntries(
    Object.entries(pages).map(([page, file]) => [page, { file, path: page === "index.html" ? "/" : `/${page.replace(/\.html$/, "")}/`, title: title(file) }]),
  ),
  tags,
};
writeFileSync(join(out, "sources.json"), `${JSON.stringify(sources)}\n`);

// The shell, with the site's own Geist for the toolbar, and the overlay beside it.
const geist = readdirSync(join(build, "_astro")).find((n) => /^geist-latin-wght-normal\.[\w-]+\.woff2$/.test(n));
const font = geist
  ? `@font-face { font-family: "Geist Review"; font-style: normal; font-weight: 100 900; font-display: swap; src: url("site/_astro/${geist}") format("woff2"); }`
  : "";
writeFileSync(join(out, "index.html"), readFileSync(join(here, "shell.html"), "utf8").replace("/* review:font */", font));
copyFileSync(join(here, "overlay.js"), join(out, "overlay.js"));

// The `files` map to publish beside the shell, for the Artifact tool.
const types = { ".woff2": "font/woff2", ".woff": "font/woff" };
const map = {};
for (const file of files(out).sort()) {
  const key = posix(relative(out, file));
  if (key === "index.html" || key === "files.json") continue;
  const type = types[key.slice(key.lastIndexOf("."))];
  map[key] = type ? { from: file, contentType: type } : file;
}
writeFileSync(join(out, "files.json"), `${JSON.stringify(map, null, 2)}\n`);

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`\nreview: ${total} tags checked: ${Object.entries(counts).map(([p, n]) => `${p} ${n}`).join(", ")}`);
console.log(`review: ${out}/index.html is the shell; files.json lists the ${Object.keys(map).length} files to publish beside it.`);

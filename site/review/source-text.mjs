// How a tagged element's text relates to its source line, shared by the build's check and its
// table of sources. A line is split into its prefix (indentation, and a list, quote or heading
// marker) and its text, which is what the review overlay lets you edit. To compare an element with
// its line, both are reduced to plain text: Markdown and JSX marks go, inline code stays as written,
// and the typographic quotes and dashes of smart punctuation fold back to their ASCII forms.

const HEADING = /^(\s*#{1,6}[ \t]+)/;
const MARKERS = /^(\s*(?:(?:[-*+]|\d{1,9}[.)])[ \t]+|>[ \t]?)*)/;

/** Split a source line into { prefix, text } for an element of type `tag`. */
export function splitLine(line, tag) {
  if (tag === "td" || tag === "th") return { prefix: "", text: line };
  const m = (/^h[1-6]$/.test(tag) ? HEADING : MARKERS).exec(line);
  const prefix = m ? m[1] : "";
  return { prefix, text: line.slice(prefix.length) };
}

/** Stands for the text a self-closing component, such as <Skill name="slice" />, renders. */
export const ANY = "\u{F0000}";
const ESC = "\u{F0001}";

/** Reduce Markdown and MDX source text to the text it renders as. */
export function stripMarks(text) {
  // Inline code is literal: split it out before touching anything else.
  const parts = text.split(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/);
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) out += stripProse(parts[i]);
    else if (i % 3 === 2) out += parts[i].replace(/^ (.*) $/, "$1");
  }
  return out;
}

function stripProse(s) {
  const escaped = [];
  s = s.replace(/\\([!-/:-@[-`{-~])/g, (_, c) => (escaped.push(c), ESC));
  s = s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(https?:[^\s>]+)>/g, "$1")
    .replace(/<[A-Za-z][\w.:-]*(?:\s(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)?\/>/g, ANY)
    .replace(/<\/?[A-Za-z][\w.:-]*(?:\s(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)?>/g, "")
    .replace(/\{[^{}]*\}/g, ANY)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/\*+|~~/g, "")
    .replace(/(^|[^\p{L}\p{N}])_+|_+(?=[^\p{L}\p{N}]|$)/gu, "$1");
  let i = 0;
  return s.replace(new RegExp(ESC, "gu"), () => escaped[i++]);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decode the HTML character references that Astro and Markdown output. */
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Fold smart punctuation and whitespace so source and rendered text compare equal. */
export function normalize(s) {
  return decodeEntities(s)
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u201f\u2033]/g, '"')
    .replace(/\u2014/g, "---")
    .replace(/\u2013/g, "--")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Whether `rendered`, an element's own text, is what `sourceText` renders as. A table cell only
 * has to appear in its row.
 */
export function sourceMatches(rendered, sourceText, tag) {
  const want = normalize(stripMarks(sourceText));
  const got = normalize(rendered);
  if (!got) return false;
  const pattern = want
    .split(ANY)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*?");
  const whole = tag === "td" || tag === "th" ? pattern : `^${pattern}$`;
  return new RegExp(whole, "su").test(got);
}

// Read and replace single-line values in an MDX file's YAML frontmatter, such as `title` or
// `hero.tagline`, without a YAML library. The review build reads them to tag the page title, the
// lede and page 01's hero; apply-edits.mjs replaces them. Only single-line scalars are handled:
// plain, 'single-quoted' and "double-quoted". Anything else reads as unsupported (null).

/** The frontmatter's line range in `lines`: the indexes of its two `---` lines, or null. */
export function frontmatterRange(lines) {
  if (lines[0]?.trim() !== "---") return null;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === "---") return { start: 0, end: i };
  return null;
}

const indentOf = (line) => line.match(/^ */)[0].length;

/**
 * Find the line that holds `keyPath`, such as "title" or "hero.tagline", in the frontmatter of
 * `lines`. Returns { index, head, raw }: the line's index, the text up to and including the colon
 * and its space, and the raw value after it. Null when the key is missing.
 */
export function findKey(lines, keyPath) {
  const range = frontmatterRange(lines);
  if (!range) return null;
  const keys = keyPath.split(".");
  let from = range.start + 1;
  let to = range.end;
  let indent = 0;
  for (let k = 0; k < keys.length; k++) {
    let found = -1;
    let childIndent = -1;
    for (let i = from; i < to; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const n = indentOf(line);
      if (k > 0 && childIndent < 0) childIndent = n;
      const level = k === 0 ? indent : childIndent;
      if (n < level) break;
      if (n !== level) continue;
      const m = line.slice(n).match(/^([A-Za-z0-9_-]+):(?:\s|$)/);
      if (m && m[1] === keys[k]) {
        found = i;
        break;
      }
    }
    if (found < 0) return null;
    if (k === keys.length - 1) {
      const line = lines[found];
      const m = line.match(/^(\s*[A-Za-z0-9_-]+:\s?)(.*)$/);
      return { index: found, head: m[1], raw: m[2] };
    }
    // The children of this key are the more-indented lines below it.
    indent = indentOf(lines[found]);
    from = found + 1;
    let end = from;
    while (end < to && (!lines[end].trim() || indentOf(lines[end]) > indent)) end++;
    to = end;
  }
  return null;
}

/**
 * Parse a single-line YAML scalar. Returns { value, style } with style "plain", "single" or
 * "double", or null when the value is empty, a block scalar, or not a scalar on one line.
 */
export function parseScalar(raw) {
  const s = raw.trim();
  if (!s) return null;
  if (s[0] === "'") {
    let out = "";
    for (let i = 1; i < s.length; i++) {
      if (s[i] === "'") {
        if (s[i + 1] === "'") {
          out += "'";
          i++;
          continue;
        }
        return restIsEmpty(s.slice(i + 1)) ? { value: out, style: "single" } : null;
      }
      out += s[i];
    }
    return null;
  }
  if (s[0] === '"') {
    const escapes = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\", "/": "/", 0: "\0", " ": " " };
    let out = "";
    for (let i = 1; i < s.length; i++) {
      const c = s[i];
      if (c === "\\") {
        const e = s[i + 1];
        if (e === "u" || e === "x" || e === "U") {
          const len = e === "x" ? 2 : e === "u" ? 4 : 8;
          const hex = s.slice(i + 2, i + 2 + len);
          if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length !== len) return null;
          out += String.fromCodePoint(parseInt(hex, 16));
          i += 1 + len;
          continue;
        }
        if (!(e in escapes)) return null;
        out += escapes[e];
        i++;
        continue;
      }
      if (c === '"') return restIsEmpty(s.slice(i + 1)) ? { value: out, style: "double" } : null;
      out += c;
    }
    return null;
  }
  if (/^[|>&*!%@`{[]/.test(s)) return null;
  const value = s.replace(/\s+#.*$/, "").trim();
  return value ? { value, style: "plain" } : null;
}

const restIsEmpty = (rest) => !rest.trim() || /^\s+#/.test(rest);

/** Whether `value` can be written as a plain YAML scalar and read back unchanged. */
export function isPlainSafe(value) {
  if (!value || value !== value.trim()) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return false;
  if (/: |:$| #/.test(value)) return false;
  if (/^(true|false|yes|no|on|off|y|n|null|~)$/i.test(value)) return false;
  if (/^[-+]?(\d|\.\d|\.inf|\.nan|0x|0o)/i.test(value)) return false;
  return true;
}

/** Write `value` as a YAML scalar on one line, in `style` when that can hold it. */
export function formatScalar(value, style = "plain") {
  if (/[\r\n]/.test(value)) throw new Error("A frontmatter value must stay on one line.");
  if (style === "plain" && isPlainSafe(value)) return value;
  if (style === "double") return JSON.stringify(value);
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value)) return JSON.stringify(value);
  return `'${value.replace(/'/g, "''")}'`;
}

/** The value of `keyPath` in the frontmatter of `lines`, or null when missing or unsupported. */
export function readValue(lines, keyPath) {
  const at = findKey(lines, keyPath);
  if (!at) return null;
  const parsed = parseScalar(at.raw);
  return parsed ? { ...parsed, index: at.index } : null;
}

/** The line that holds `keyPath` with its value replaced by `value`, in the same quoting style. */
export function replaceValue(lines, keyPath, value) {
  const at = findKey(lines, keyPath);
  const parsed = at && parseScalar(at.raw);
  if (!parsed) return null;
  const formatted = formatScalar(value, parsed.style);
  const check = parseScalar(formatted);
  if (!check || check.value !== value) throw new Error(`Could not write ${JSON.stringify(value)} as YAML.`);
  return { index: at.index, line: at.head + formatted };
}

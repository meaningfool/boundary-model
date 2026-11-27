/** Escape text for HTML, and turn `code` spans into <code> elements. */
export const inline = (text: string) =>
  text
    .replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c)
    .replace(/`([^`]+)`/g, "<code>$1</code>");

/** Show the model's own name as code in a title, which holds no backticks of its own. */
export const titleTerms = (text: string) => inline(text.replace(/\bboundary model\b/g, "`$&`"));

/** Escape text for HTML, and turn `code` spans into <code> elements. */
export const inline = (text: string) =>
  text
    .replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c)
    .replace(/`([^`]+)`/g, "<code>$1</code>");

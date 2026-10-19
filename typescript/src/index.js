export { validateRegex } from "./validation.js";
export { parseUrlsCsv } from "./csv.js";

/** Generate a compact, anchored regex string from literal URLs or paths. */
export function urlsToRegex(values, { target = "input" } = {}) {
  if (!["input", "path"].includes(target)) throw new TypeError("target must be 'input' or 'path'");
  if (!Array.isArray(values)) throw new TypeError("values must be an array of strings");
  if (values.length === 0) throw new RangeError("values must contain at least one string");
  const prepared = new Set();
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (typeof value !== "string") throw new TypeError(`values[${index}] must be a string`);
    if (!value || value !== value.trim()) throw new RangeError(`values[${index}] must be nonempty without surrounding whitespace`);
    prepared.add(target === "path" ? extractPath(value) : value);
  }
  const root = new Map();
  const end = Symbol("end");
  for (const value of [...prepared].sort()) {
    let node = root;
    // Code units keep patterns usable without requiring the JavaScript 'u' flag.
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      if (!node.has(char)) node.set(char, new Map());
      node = node.get(char);
    }
    node.set(end, null);
  }
  const rendered = new Map();
  const stack = [[root, false]];
  while (stack.length) {
    const [node, visited] = stack.pop();
    const children = [...node].filter(([char]) => char !== end);
    if (!visited) {
      stack.push([node, true]);
      for (const [, child] of children) stack.push([child, false]);
      continue;
    }
    const alternatives = children.map(([char, child]) => escapeLiteral(char) + rendered.get(child));
    let body = alternatives.length > 1 ? `(?:${alternatives.join("|")})` : (alternatives[0] ?? "");
    if (node.has(end) && body) body = `(?:${body})?`;
    rendered.set(node, body);
  }
  return `^${rendered.get(root)}$`;
}

function escapeLiteral(char) {
  const controls = {"\n": "\\n", "\r": "\\r", "\t": "\\t", "\u2028": "\\u2028", "\u2029": "\\u2029"};
  return controls[char] ?? ("\\.^$*+?{}[]()|/".includes(char) ? `\\${char}` : char);
}

function extractPath(value) {
  // Preserve raw path text: new URL() would normalize dot segments/encoding.
  if (!value.startsWith("/") && value.includes("://")) {
    const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)([^?#]*)/i.exec(value);
    if (!match) throw new TypeError("Path extraction requires a URL with a scheme and host");
    try { new URL(`${match[1]}://${match[2]}/`); }
    catch { throw new TypeError("Cannot extract path from malformed URL"); }
    return match[3] || "/";
  }
  return value.split(/[?#]/, 1)[0] || "/";
}

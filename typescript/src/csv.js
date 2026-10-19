/** Parse comma-delimited CSV text and select a URL/path column. Browser-safe. */
export function parseUrlsCsv(text, options = {}) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
  let { header = "auto", column = null } = options;
  const automatic = header === "auto";
  if (!automatic && typeof header !== "boolean") throw new TypeError("header must be a boolean or 'auto'");
  if (!automatic && column !== null && (header ? typeof column !== "string" : !Number.isInteger(column))) {
    throw new TypeError(header ? "column must be a name when header=true" : "column must be a zero-based index when header=false");
  }

  if (automatic && column !== null && typeof column !== "string" && !Number.isInteger(column)) {
    throw new TypeError("column must be a name or zero-based index");
  }

  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  if (!rows.length) throw new RangeError("CSV file is empty");
  if (automatic) {
    header = column !== null ? typeof column === "string" : !rows[0].some(value => looksLikeLocation(value, false));
  }
  const width = rows[0].length;
  const names = header ? rows[0] : Array.from({ length: width }, (_, index) => index);
  const data = header ? rows.slice(1) : rows;
  for (let i = 0; i < data.length; i++) {
    if (data[i].length !== width) throw new RangeError(`CSV record ${i + (header ? 2 : 1)} has ${data[i].length} columns; expected ${width}`);
  }
  let selected;
  if (column !== null) {
    const matches = names.flatMap((name, index) => name === column ? [index] : []);
    if (matches.length !== 1) throw new RangeError(`Column ${JSON.stringify(column)} is missing or duplicated; available columns: ${JSON.stringify(names)}`);
    [selected] = matches;
  } else {
    const candidates = [];
    for (let index = 0; index < width; index++) {
      const cells = data.map(row => row[index]).filter(value => value.trim());
      const normalized = String(names[index]).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
      const named = LOCATION_HEADERS.has(normalized);
      if (cells.length && cells.every(value => looksLikeLocation(value, named))) candidates.push(index);
    }
    if (!candidates.length) throw new RangeError(`No URL/path column detected; specify column. Available columns: ${JSON.stringify(names)}`);
    if (candidates.length > 1) throw new RangeError(`Ambiguous URL/path columns: ${JSON.stringify(candidates.map(index => names[index]))}; specify column`);
    [selected] = candidates;
  }
  const values = data.map(row => row[selected]).filter(value => value.trim());
  if (!values.length) throw new RangeError("Selected column contains no nonblank values");
  return values;
}

const LOCATION_HEADERS = new Set([
  "url", "urls", "uri", "uris", "page", "pages", "path", "paths",
  "landingpage", "landingpageurl", "pageurl", "pagepath", "pagelocation",
]);

function looksLikeLocation(value, named) {
  const candidate = value.trim();
  if (candidate.startsWith("/")) return true;
  if (candidate.includes("://")) {
    const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(candidate);
    if (!match) return false;
    try { new URL(candidate); return true; } catch { return false; }
  }
  return named && candidate.includes("/") && !/\s/u.test(candidate);
}

function parseRows(text) {
  const rows = [];
  let row = [], field = "", state = "start", started = false;
  const finishRow = () => {
    if (started || row.length || field) rows.push([...row, field]);
    row = []; field = ""; state = "start"; started = false;
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === "quoted") {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else state = "afterQuote";
      } else field += char;
    } else if (char === ",") {
      row.push(field); field = ""; state = "start"; started = true;
    } else if (char === "\r" || char === "\n") {
      finishRow();
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else if (state === "afterQuote") {
      throw new RangeError("Malformed CSV: unexpected character after closing quote");
    } else if (state === "start" && char === '"') {
      state = "quoted"; started = true;
    } else {
      field += char; state = "field"; started = true;
    }
  }
  if (state === "quoted") throw new RangeError("Malformed CSV: unterminated quoted field");
  finishRow();
  return rows;
}

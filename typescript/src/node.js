import { readFile } from "node:fs/promises";
import { parseUrlsCsv } from "./csv.js";

/** Read a UTF-8 CSV from a filesystem path or file URL. File errors propagate. */
export async function readUrlsCsv(file, options = {}) {
  const bytes = await readFile(file);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return parseUrlsCsv(text, options);
}

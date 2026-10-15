// Run from the repository root: node examples/typescript/csv_input.mjs
// Installed consumers import from "url2regex" and "url2regex/node".
import { parseUrlsCsv, urlsToRegex } from "../../typescript/src/index.js";
import { readUrlsCsv } from "../../typescript/src/node.js";

const file = new URL("../urls.csv", import.meta.url);
const urls = await readUrlsCsv(file);
const selected = await readUrlsCsv(file, { column: "URL" });
console.log("URLs loaded:", urls.length);
console.log("Automatic and manual selection agree:", JSON.stringify(urls) === JSON.stringify(selected));
console.log("Pattern:", urlsToRegex(urls));

// Browser code can parse text from a selected File: parseUrlsCsv(await file.text()).
// No Node imports are needed for text parsing.
console.log("CSV text:", parseUrlsCsv("URL,Category\n/a,Example\n"));
console.log("Headerless:", parseUrlsCsv("1,/a\n2,/b\n", { header: false, column: 1 }));

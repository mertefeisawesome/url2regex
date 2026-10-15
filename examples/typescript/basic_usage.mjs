// Run from the repository root: node examples/typescript/basic_usage.mjs
// Installed consumers use: import { urlsToRegex } from "url2regex";
import { urlsToRegex } from "../../typescript/src/index.js";

const pattern = urlsToRegex(["/a", "/a/b"]);
console.log(pattern);
console.log(new RegExp(pattern).test("/a/b")); // true
console.log(new RegExp(pattern).test("/ab")); // false

import { mkdir, copyFile, readFile } from "node:fs/promises";

const dist = new URL("./dist/", import.meta.url);
await mkdir(new URL("lib/", dist), { recursive: true });
await mkdir(new URL("icons/", dist), { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await copyFile(new URL(`icons/icon${size}.png`, import.meta.url), new URL(`icons/icon${size}.png`, dist));
}
for (const file of ["manifest.json", "popup.html", "popup.js", "popup.css"]) {
  await copyFile(new URL(file, import.meta.url), new URL(file, dist));
}
await copyFile(new URL("../typescript/src/index.js", import.meta.url), new URL("lib/index.js", dist));
await copyFile(new URL("../LICENSE", import.meta.url), new URL("LICENSE", dist));
JSON.parse(await readFile(new URL("manifest.json", dist), "utf8"));
console.log("Built extension/dist for loading unpacked in Chrome.");

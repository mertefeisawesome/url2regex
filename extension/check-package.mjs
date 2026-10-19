/** Smoke-test built module imports and popup behavior without a browser. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dist = new URL("./dist/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", dist), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.permissions, undefined);
assert.equal(manifest.host_permissions, undefined);
for (const icon of Object.values(manifest.icons)) await readFile(new URL(icon, dist));
assert.equal(await readFile(new URL("LICENSE", dist), "utf8"), await readFile(new URL("../LICENSE", import.meta.url), "utf8"));

const controls = {
  "#generator": { addEventListener(type, handler) { assert.equal(type, "submit"); this.submit = handler; } },
  "#urls": { value: "/a\n/a/b" },
  "#paths": { checked: false },
  "#result": { value: "" },
  "#status": { textContent: "" },
};
globalThis.document = { querySelector: selector => controls[selector] };
await import(new URL("popup.js", dist));
const submit = () => controls["#generator"].submit({ preventDefault() {} });
submit();
assert.equal(controls["#result"].value, String.raw`^\/a(?:\/b)?$`);
controls["#urls"].value = "https://example.com/a?q=1";
controls["#paths"].checked = true;
submit();
assert.equal(controls["#result"].value, String.raw`^\/a$`);
controls["#urls"].value = " /a";
submit();
assert.equal(controls["#result"].value, "");
assert.match(controls["#status"].textContent, /whitespace/);
console.log("Built extension assets, popup imports, generation, path mode and errors passed.");

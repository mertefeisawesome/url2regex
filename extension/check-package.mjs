/** Smoke-test built module imports and popup behavior without a browser. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dist = new URL("./dist/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", dist), "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.permissions, undefined);
assert.equal(manifest.host_permissions, undefined);
for (const icon of Object.values(manifest.icons)) await readFile(new URL(icon, dist));
await readFile(new URL("branding/logo.png", dist));
assert.equal(await readFile(new URL("LICENSE", dist), "utf8"), await readFile(new URL("../LICENSE", import.meta.url), "utf8"));

const controls = {
  "#generator": { addEventListener(type, handler) { assert.equal(type, "submit"); this.submit = handler; } },
  "#urls": { value: "/a\n/a/b" },
  "#paths": { checked: false },
  "#result": { value: "" },
  "#status": { textContent: "" },
};
for (const control of Object.values(controls)) {
  control.dataset = {};
  control.addEventListener ??= function(type, handler) { this[type] = handler; };
}
controls["#copy"] = { disabled: true, addEventListener(type, handler) { this[type] = handler; } };
controls["#csv"] = { files: [], value: "", addEventListener(type, handler) { this[type] = handler; } };
let copied;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { async writeText(value) { copied = value; } } } });
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
assert.equal(controls["#copy"].disabled, true);
for (const text of ["https://example.com/a\nhttps://example.com/b\n", "URL\nhttps://example.com/a\nhttps://example.com/b\n"]) {
  controls["#csv"].files = [{ async text() { return text; } }];
  await controls["#csv"].change();
  assert.equal(controls["#urls"].value, "https://example.com/a\nhttps://example.com/b");
  submit();
  assert.equal(controls["#result"].value, String.raw`^\/(?:a|b)$`);
  await controls["#copy"].click();
  assert.equal(copied, controls["#result"].value);
}
controls["#urls"].input();
assert.equal(controls["#result"].value, "");
assert.equal(controls["#copy"].disabled, true);
controls["#csv"].files = [{ async text() { return "URL\n\"unterminated"; } }];
await controls["#csv"].change();
assert.equal(controls["#status"].dataset.error, "true");
assert.equal(controls["#result"].value, "");
controls["#csv"].files = [{ async text() { return 'URL\n"/line\nbreak"\n'; } }];
await controls["#csv"].change();
assert.match(controls["#status"].textContent, /one line/);
// A slow import must not replace text typed after the import began.
let finishRead;
controls["#csv"].files = [{ text() { return new Promise(resolve => { finishRead = resolve; }); } }];
const importing = controls["#csv"].change();
controls["#urls"].value = "/new-input";
controls["#urls"].input();
finishRead("URL\n/old-import\n");
await importing;
assert.equal(controls["#urls"].value, "/new-input");
submit();
controls["#paths"].change();
assert.equal(controls["#result"].value, "");
assert.equal(controls["#copy"].disabled, true);
submit();
let selected = false;
controls["#result"].focus = () => {};
controls["#result"].select = () => { selected = true; };
globalThis.navigator.clipboard.writeText = async () => { throw new Error("Clipboard unavailable"); };
await controls["#copy"].click();
assert.equal(selected, true);
assert.match(controls["#status"].textContent, /Ctrl\+C/);
console.log("Extension generation, escaped slashes, path mode, CSV headers, clipboard and errors passed.");

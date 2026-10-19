import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseUrlsCsv, urlsToRegex, validateRegex } from "../src/index.js";
import { readUrlsCsv } from "../src/node.js";

test("detects columns using values and indicative headers", () => {
  assert.deepEqual(parseUrlsCsv("\uFEFFResource,Clicks\r\nhttps://example.com/a,10\r\n/b,20\r\n"), ["https://example.com/a", "/b"]);
  assert.deepEqual(parseUrlsCsv("Landing Page,Clicks\nblog/post,2\n"), ["blog/post"]);
});

test("manual override resolves ambiguity and permits arbitrary literal values", () => {
  const text = "URL,Destination\n/a,/b\n";
  assert.throws(() => parseUrlsCsv(text), /Ambiguous.*URL.*Destination/);
  assert.deepEqual(parseUrlsCsv(text, { column: "Destination" }), ["/b"]);
  assert.deepEqual(parseUrlsCsv("Label\nhello\n", { column: "Label" }), ["hello"]);
});

test("quoted commas, escaped quotes, whitespace and duplicates are preserved", () => {
  const text = 'URL,Clicks\n"https://example.com/a,b?q=1",1\n"/say""hello",2\n /a ,3\n/a,4\n/a,5\n,6\n   ,7\n';
  assert.deepEqual(parseUrlsCsv(text), ["https://example.com/a,b?q=1", '/say"hello', " /a ", "/a", "/a"]);
});

test("quoted multiline fields, empty cells, and blank physical lines", () => {
  assert.deepEqual(parseUrlsCsv('URL,Notes\r\n/a,"first\r\nsecond"\r\n\r\n/b,last'), ["/a", "/b"]);
  assert.deepEqual(parseUrlsCsv('URL\n"/line\nbreak"\n""\n'), ["/line\nbreak"]);
  for (const separator of ["\r", "\n", "\r\n"]) {
    assert.deepEqual(parseUrlsCsv(`URL${separator}/a${separator}/b`), ["/a", "/b"]);
  }
});

test("headerless files preserve the first row with detection or explicit index", () => {
  const text = "1,/a\n2,/b\n";
  assert.deepEqual(parseUrlsCsv(text, { header: false }), ["/a", "/b"]);
  assert.deepEqual(parseUrlsCsv(text, { header: false, column: 1 }), ["/a", "/b"]);
});

test("automatic headers preserve first URLs and explicit overrides", () => {
  for (const [text, options, expected] of [
    ["https://example.com/a\n/b\n", {}, ["https://example.com/a", "/b"]],
    ["/only\n", {}, ["/only"]],
    ["\uFEFF1,/a\n2,/b\n", { header: "auto" }, ["/a", "/b"]],
    ["1,/a\n2,/b\n", { column: 1 }, ["/a", "/b"]],
    ["blog/one\nblog/two\n", { column: 0 }, ["blog/one", "blog/two"]],
    ["/heading\n/a\n", { header: true }, ["/a"]],
    ["/a,/b\n/c,/d\n", { column: 1 }, ["/b", "/d"]],
  ]) assert.deepEqual(parseUrlsCsv(text, options), expected);
  assert.throws(() => parseUrlsCsv("/a,/b\n/c,/d\n"), /Ambiguous/);
});

test("empty, unsuitable, missing and duplicated columns report errors", () => {
  for (const [text, options, error] of [
    ["", {}, /empty/], ["Title,Clicks\nHello,2\n", {}, /No URL\/path/],
    ["URL\n/a\n", { column: "Missing" }, /available columns/],
    ["URL,URL\n/a,/b\n", { column: "URL" }, /duplicated/],
    ["URL,Clicks\n,2\n", { column: "URL" }, /no nonblank/],
    ["/a\n", { header: false, column: -1 }, /available columns/],
    ["URL\n/a\ninvalid\n", {}, /No URL\/path/],
  ]) assert.throws(() => parseUrlsCsv(text, options), error);
});

test("malformed quoted CSV and inconsistent record widths are rejected", () => {
  for (const text of ['URL\n"unterminated\n', 'URL\n"/a"junk\n', 'URL,Clicks\n/a\n', 'URL\n/a,1\n']) {
    assert.throws(() => parseUrlsCsv(text), RangeError);
  }
});

test("invalid argument types are rejected", () => {
  for (const [text, options] of [[null, {}], [42, {}], ["URL\n/a", null], ["URL\n/a", []],
    ["URL\n/a", { header: "no" }], ["URL\n/a", { header: true, column: 0 }],
    ["/a", { header: false, column: "URL" }], ["/a", { header: false, column: true }],
    ["/a", { header: false, column: 0.5 }]]) {
    assert.throws(() => parseUrlsCsv(text, options), TypeError);
  }
});

test("Node reader supports filesystem paths/file URLs and propagates file/decode errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "url2regex-csv-"));
  try {
    const file = join(directory, "pages.csv");
    await writeFile(file, "\uFEFFURL\n/a\n/b\n");
    assert.deepEqual(await readUrlsCsv(file), ["/a", "/b"]);
    const { pathToFileURL } = await import("node:url");
    assert.deepEqual(await readUrlsCsv(pathToFileURL(file), { column: "URL" }), ["/a", "/b"]);
    await assert.rejects(readUrlsCsv(join(directory, "missing.csv")), { code: "ENOENT" });
    await writeFile(file, Buffer.from([0xff, 0xfe]));
    await assert.rejects(readUrlsCsv(file), TypeError);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("shared example and real-world files work end to end", async () => {
  const sample = new URL("../../examples/urls.csv", import.meta.url);
  const urls = await readUrlsCsv(sample);
  assert.equal(urls.length, 8);
  assert.ok(urls.includes("https://example.com/search?q=shoes,hats"));
  assert.deepEqual(urls, parseUrlsCsv(await readFile(sample, "utf8"), { column: "URL" }));
  const positives = await readUrlsCsv(new URL("../../fixtures/real-world/positives.csv", import.meta.url));
  const negatives = await readUrlsCsv(new URL("../../fixtures/real-world/negatives.csv", import.meta.url));
  assert.equal(validateRegex(urlsToRegex(positives), { positives, negatives }).passed, true);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { urlsToRegex, parseUrlsCsv } from "../src/index.js";

const fullmatch = (pattern, value) => new RegExp(pattern).exec(value)?.[0] === value;

test("forward slashes are escaped by default", () => {
  const cases = [
    [["/"], {}, String.raw`^\/$`, ["/"]],
    [["https://example.com/a/"], {}, String.raw`^https:\/\/example\.com\/a\/$`, ["https://example.com/a/"]],
    [["//a///b/"], {}, String.raw`^\/\/a\/\/\/b\/$`, ["//a///b/"]],
    [["/a", "/a/b"], {}, String.raw`^\/a(?:\/b)?$`, ["/a", "/a/b"]],
    [["https://example.com/a/?q=1"], { target: "path" }, String.raw`^\/a\/$`, ["/a/"]],
    [[String.raw`/a\/b`], {}, String.raw`^\/a\\\/b$`, [String.raw`/a\/b`]],
  ];
  for (const [values, options, expected, positives] of cases) {
    const pattern = urlsToRegex(values, options);
    assert.equal(pattern, expected);
    // Compile as JavaScript source too: an unescaped slash would end the literal.
    const literal = new Function(`return /${pattern}/;`)();
    for (const value of positives) {
      assert.ok(fullmatch(pattern, value), value);
      assert.equal(literal.exec(value)?.[0], value);
    }
    assert.ok(!fullmatch(pattern, "/unrelated"));
    assert.equal(literal.test("/unrelated"), false);
  }
});

test("literal inputs, optional suffixes and exact negatives", () => {
  const positives = ["/a", "/a/b", "/a.b", "/a?q=1#x", "/a/", "/café/猫", "/😀", "/😁", "/a(1)+[x]{2}"];
  const pattern = urlsToRegex(positives);
  for (const value of positives) assert.ok(fullmatch(pattern, value), value);
  for (const value of ["/ab", "/axb", "/a?q=1", "/a/b/c", "/😂", "/a\n"]) assert.ok(!fullmatch(pattern, value), value);
});

test("deterministic deduplication without input mutation", () => {
  const values = ["/b", "/a", "/a", "/a/b"];
  const original = [...values];
  assert.equal(urlsToRegex(values), urlsToRegex([...new Set(values)].reverse()));
  assert.deepEqual(values, original);
});

test("input and options errors", () => {
  for (const value of [null, "/a", [null], [1]]) assert.throws(() => urlsToRegex(value), TypeError);
  for (const value of [[], [""], [" /a"], ["/a\n"]]) assert.throws(() => urlsToRegex(value), RangeError);
  assert.throws(() => urlsToRegex(["/a"], {target: "guess"}), TypeError);
});

test("path extraction preserves raw paths and drops query/fragment", () => {
  const cases = [
    ["https://example.com", "/"],
    ["https://example.com/a?q=1#x", "/a"],
    ["https://example.com/a/", "/a/"],
    ["https://example.com/a/../b%2Fc", "/a/../b%2Fc"],
    ["/a;b?q=1", "/a;b"], ["//a///b/", "//a///b/"],
  ];
  for (const [input, expected] of cases) assert.equal(urlsToRegex([input], {target: "path"}), urlsToRegex([expected]));
  for (const value of ["https:///a", "https://[broken/a"]) assert.throws(() => urlsToRegex([value], {target: "path"}));
});

test("long URLs avoid recursion limits", () => {
  const values = ["/" + "a".repeat(3000) + "x", "/" + "a".repeat(3000) + "y"];
  const pattern = urlsToRegex(values);
  for (const value of values) assert.ok(fullmatch(pattern, value));
});

function readFixture(name) {
  const text = readFileSync(new URL(`../../fixtures/real-world/${name}.csv`, import.meta.url), "utf8");
  return parseUrlsCsv(text, { column: "URL" });
}

test("shared real-world full URLs and extracted paths", () => {
  const positives = readFixture("positives"), negatives = readFixture("negatives");
  assert.ok(positives.length && negatives.length);
  const pattern = urlsToRegex(positives);
  const compiled = new RegExp(pattern);
  for (const value of positives) assert.equal(compiled.exec(value)?.[0], value);
  for (const value of negatives) assert.notEqual(compiled.exec(value)?.[0], value);
  const paths = positives.map(value => new URL(value).pathname || "/");
  const selected = new Set(paths);
  const pathPattern = urlsToRegex(positives, {target: "path"});
  const pathRegex = new RegExp(pathPattern);
  for (const path of selected) assert.equal(pathRegex.exec(path)?.[0], path);
  const heldOut = negatives.map(value => new URL(value).pathname || "/").filter(path => !selected.has(path));
  assert.ok(heldOut.length);
  for (const path of heldOut) assert.notEqual(pathRegex.exec(path)?.[0], path);
  assert.equal(pathPattern, urlsToRegex(paths));
});

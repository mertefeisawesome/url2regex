import test from "node:test";
import assert from "node:assert/strict";
import { urlsToRegex, validateRegex } from "../src/index.js";

test("generated patterns pass with optional negatives", () => {
  const positives = ["/a", "/a/b", "https://example.com/a?q=1"];
  const pattern = urlsToRegex(positives);
  const report = validateRegex(pattern, { positives, negatives: ["/ab", "/a/", "/a\n"] });
  assert.deepEqual(report, { passed: true, missedPositives: [], matchedNegatives: [], syntaxError: null });
  assert.equal(validateRegex(pattern, { positives }).passed, true);
});

test("report preserves failing examples, order and duplicates without mutating input", () => {
  const positives = Object.freeze(["/a", "/b", "/b", "/c"]);
  const negatives = Object.freeze(["/a", "/x"]);
  const report = validateRegex("/a", { positives, negatives });
  assert.deepEqual(report, { passed: false, missedPositives: ["/b", "/b", "/c"], matchedNegatives: ["/a"], syntaxError: null });
  assert.deepEqual(positives, ["/a", "/b", "/b", "/c"]);
  assert.deepEqual(negatives, ["/a", "/x"]);
});

test("invalid regex syntax returns a report without checking examples", () => {
  for (const pattern of ["[", "(", ")("]) {
    const report = validateRegex(pattern, { positives: ["/a"], negatives: ["/b"] });
    assert.equal(report.passed, false);
    assert.equal(typeof report.syntaxError, "string");
    assert.ok(report.syntaxError.length);
    assert.deepEqual(report.missedPositives, []);
    assert.deepEqual(report.matchedNegatives, []);
  }
});

test("matching covers the complete string including line terminators", () => {
  assert.equal(validateRegex("^/a$", {
    positives: ["/a"], negatives: ["prefix/a", "/a/suffix", "/a\n", "/a\r\n", "/a\u2028"],
  }).passed, true);
  assert.equal(validateRegex("/a", { positives: [], negatives: ["prefix/a"] }).passed, true);
});

test("full matching backtracks alternatives and lazy quantifiers", () => {
  assert.equal(validateRegex("a|ab", { positives: ["a", "ab"], negatives: ["abc"] }).passed, true);
  assert.equal(validateRegex(".*?", { positives: ["", "abc"] }).passed, true);
  assert.equal(validateRegex("(a)\\1|ab", { positives: ["aa", "ab"] }).passed, true);
});

test("empty lists, empty strings, whitespace and repeated calls are supported", () => {
  assert.equal(validateRegex("", { positives: [] }).passed, true);
  assert.equal(validateRegex("", { positives: [""], negatives: [" ", "\n"] }).passed, true);
  const options = { positives: [" ", "\n"] };
  assert.deepEqual(validateRegex("[\\s\\S]", options), validateRegex("[\\s\\S]", options));
});

test("invalid argument types raise TypeError", () => {
  for (const [pattern, options] of [
    [null, { positives: [] }], [/a/, { positives: [] }], ["a", undefined],
    ["a", null], ["a", []], ["a", {}], ["a", { positives: "a" }],
    ["a", { positives: [1] }], ["a", { positives: new Array(1) }],
    ["a", { positives: [], negatives: null }], ["a", { positives: [], negatives: [false] }],
  ]) assert.throws(() => validateRegex(pattern, options), TypeError);
});

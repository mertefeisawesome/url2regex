# url2regex

<p align="center">
  <img src="https://raw.githubusercontent.com/mertefeisawesome/url2regex/main/assets/branding/logo-transparent-light.png" alt="url2regex" width="320">
</p>

Generate compact regular expressions from lists of URLs or paths. Shared
prefixes are grouped automatically, literal regex characters are escaped, and
duplicate inputs are removed without modifying your array.

Includes CSV column detection, explicit URL-to-path extraction, and validation
against positive and optional negative examples. Ships ESM JavaScript with
TypeScript declarations for Node.js 20+ and modern browsers, with no runtime
dependencies or compilation step.

## Installation

```sh
npm install url2regex
```

Use ESM imports in Node.js (`.mjs` or `"type": "module"` in `package.json`). Browser
applications can resolve npm imports through their build tool. The main export
is browser-safe; only `url2regex/node` imports Node filesystem APIs.

## Quick start

```js
import { urlsToRegex } from "url2regex";

const paths = ["/products/shoes", "/products/hats", "/about"];
const pattern = urlsToRegex(paths);
console.log(pattern);
// ^\/(?:about|products\/(?:hats|shoes))$

console.assert(new RegExp(pattern).test("/products/shoes"));
console.assert(!new RegExp(pattern).test("/products/bags"));
```

By default, strings are preserved exactly: full URLs produce full-URL patterns,
and paths produce path patterns. Mixed inputs are accepted. Queries, fragments,
case, percent encoding, and trailing slashes are retained. Grouping reduces
repetition but does not guarantee the shortest possible regex.

## Extract paths from full URLs

```js
import { urlsToRegex } from "url2regex";

const pattern = urlsToRegex(
  ["https://example.com/products/shoes?color=red#details"],
  { target: "path" },
);
console.log(pattern);
// ^\/products\/shoes$
```

`target: "path"` removes the origin, query, and fragment. Existing paths are also
accepted. Trailing slashes and percent encoding are preserved; URLs without a
path become `/`. Different domains may collapse to the same path.

## Read URLs from CSV

For a comma-delimited UTF-8 file such as:

```csv
URL,Category
https://example.com/products/shoes,Product
https://example.com/products/hats,Product
https://example.com/about,Company
```

In Node.js:

```js
import { readUrlsCsv } from "url2regex/node";
import { urlsToRegex } from "url2regex";

const urls = await readUrlsCsv("pages.csv"); // Detect the URL/path column
const selected = await readUrlsCsv("pages.csv", { column: "URL" });
const pattern = urlsToRegex(selected);
```

`readUrlsCsv()` accepts a filesystem path or file URL and returns a promise.
In a browser, parse text from a user-selected `File` instead:

```js
import { parseUrlsCsv } from "url2regex";

async function urlsFromFile(file) {
  return parseUrlsCsv(await file.text());
}
```

`parseUrlsCsv(text, options)` is synchronous and also works in Node.js.
Header detection defaults to `header: "auto"`: a URL or leading-slash path in
the first row identifies it as data; otherwise that row is treated as headers.
A column name implies headers, and a column index implies headerless input.
Use `header: true` or `header: false` to override detection. Headerless relative
paths such as `blog/post` need `header: false` or an explicit column index:
`{ column: 0 }` selects the first column and keeps its first row.
BOMs, quoted commas, escaped quotes, multiline
fields, and CRLF/LF/CR record endings are supported.

Automatic detection examines headers and nonblank values. All nonblank values
in a candidate column must resemble URLs or paths; indicative headers also
allow relative paths containing slashes. Ambiguous detection requires manual
selection. Blank cells are skipped, while other values, including duplicates
and surrounding whitespace, remain unchanged.

Try the [shared sample CSV](https://github.com/mertefeisawesome/url2regex/blob/main/examples/urls.csv)
with the [CSV example](https://github.com/mertefeisawesome/url2regex/blob/main/examples/typescript/csv_input.mjs).

## Validate a pattern

```js
import { urlsToRegex, validateRegex } from "url2regex";

const paths = ["/a", "/a/b"];
const report = validateRegex(urlsToRegex(paths), {
  positives: paths,
  negatives: ["/ab", "/a/c"],
});
console.assert(report.passed);
console.log(report.missedPositives);  // []
console.log(report.matchedNegatives); // []
console.log(report.syntaxError);      // null
```

The returned report uses strict whole-string JavaScript matching without flags.
Negatives are optional. Invalid regex syntax returns a failed report with
`syntaxError`, without checking examples. Passing establishes behavior only for
supplied examples. With no examples, it confirms compilation only. Validate
path patterns against paths, not full URLs. TypeScript consumers can import the
`ValidationOptions` and `ValidationReport` types.

## Output format

`urlsToRegex()` returns plain regex text ready for `new RegExp(pattern)`, with
no surrounding quotes, `/…/` delimiters, or flags. Unlike the Python API, this
API does not provide a source-literal output option.

## Errors

- Generation requires a nonempty array of strings. Empty strings and surrounding
  whitespace throw `RangeError`; invalid types throw `TypeError`. Values are not
  silently trimmed or checked for complete URL standards compliance.
- Unknown `target` values and malformed full URLs in path mode throw `TypeError`.
- CSV detection failures, malformed records, missing/duplicate selected columns,
  and columns without values throw `RangeError`. Invalid CSV argument types
  throw `TypeError`. The Node reader propagates file errors and rejects invalid
  UTF-8 with `TypeError`.
- Validation throws `TypeError` for invalid arguments; empty strings and
  whitespace are allowed as validation examples.

## Compatibility

Generated patterns use a common subset of Python, JavaScript, and RE2 syntax:
escaped literals, groups, alternatives, optional groups, and `^`/`$` anchors.
This package's validator executes the JavaScript engine only. Consumer flags
can change matching behavior. Use `validateRegex()` for strict whole-string
checks rather than assuming arbitrary patterns use full matching.

[Google Analytics](https://support.google.com/analytics/answer/1034324?hl=en-uk)
documents full matching and case sensitivity by default.
[Search Console](https://support.google.com/webmasters/answer/17011165?hl=en)
documents partial matching and case-insensitive matching by default. Anchors
do not override case sensitivity. Search Console supports the case-sensitive
prefix `(?-i)`, which is not portable to JavaScript.

Choose a URL or path dimension consistent with your pattern. Product-specific
length limits are not enforced, and live analytics-product testing has not
been performed. Unusual URL parsing edge cases can differ between Python and
JavaScript.

## Examples and development

- [Basic usage](https://github.com/mertefeisawesome/url2regex/blob/main/examples/typescript/basic_usage.mjs)
- [CSV import](https://github.com/mertefeisawesome/url2regex/blob/main/examples/typescript/csv_input.mjs)
- [Validation](https://github.com/mertefeisawesome/url2regex/blob/main/examples/typescript/validation.mjs)
- [Development setup and tests](https://github.com/mertefeisawesome/url2regex#install-for-development)
- [Report an issue](https://github.com/mertefeisawesome/url2regex/issues)

Run `npm test` from `typescript/`. Tests include the shared real-world fixtures.
`npm pack` runs tests and creates an inspectable package tarball. TypeScript
declarations are included; they do not require compilation to use the library.
Run `npm run check:package` after `npm ci` to verify the installed tarball's
runtime tests, examples, TypeScript declarations, and browser-safe import graph.

## License

[MIT](https://github.com/mertefeisawesome/url2regex/blob/main/LICENSE).

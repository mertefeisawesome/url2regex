# url2regex

Compact regex generation from URL or path lists, for Node.js and browsers.
This minimal ESM prerelease ships JavaScript with TypeScript declarations and
no dependencies or build step. Includes generation, path extraction, and
validation reports, and CSV import.

```sh
npm install url2regex@alpha
```

```js
import { urlsToRegex } from "url2regex";

const pattern = urlsToRegex(["/a", "/a/b"]);
const regex = new RegExp(pattern);
console.log(regex.test("/a/b")); // true
console.log(regex.test("/ab")); // false

const paths = urlsToRegex(["https://example.com/a?q=1"], { target: "path" });
```

Default mode preserves literal inputs, including queries, fragments, and trailing
slashes. Path mode drops origins, queries and fragments, with `/` for URLs with
no path. Inputs must be a nonempty array of nonempty strings without surrounding
whitespace. Duplicates are removed without changing the array. Type errors throw
`TypeError`; empty/whitespace input throws `RangeError`.

Patterns use `^`/`$` anchors; JavaScript `$` can also match before a final line
terminator. For strict checks, ensure the match covers the entire input. Flags
can change behavior. Grouping does not guarantee the shortest possible pattern.

## Validate a pattern

```js
import { urlsToRegex, validateRegex } from "url2regex";

const positives = ["/a", "/a/b"];
const report = validateRegex(urlsToRegex(positives), {
  positives,
  negatives: ["/ab", "/a/c"], // Optional
});
console.log(report.passed); // true
console.log(report.missedPositives); // []
console.log(report.matchedNegatives); // []
console.log(report.syntaxError); // null
```

The validator accepts plain pattern text and uses strict whole-string JavaScript
matching without flags. Syntax failures return a failed report and skip example
checks; invalid argument types throw `TypeError`. Empty arrays, empty strings,
and whitespace examples are allowed. With no examples, passing confirms syntax
only. Results apply to supplied examples and do not establish compatibility with
other regex engines. Use paths as examples when validating path-only output.

## Import CSV

In Node.js, read a UTF-8 CSV file asynchronously:

```js
import { readUrlsCsv } from "url2regex/node";
import { urlsToRegex } from "url2regex";

const urls = await readUrlsCsv("pages.csv"); // Automatic column detection
const selected = await readUrlsCsv("pages.csv", { column: "Landing Page" });
const pattern = urlsToRegex(urls);
```

In a browser, pass CSV text from a selected file:

```js
import { parseUrlsCsv } from "url2regex";

// file is a File selected by the user through an <input type="file">.
const urls = parseUrlsCsv(await file.text());
```

`parseUrlsCsv(text, options)` is synchronous and uses no Node APIs. The Node-only
`readUrlsCsv(file, options)` accepts a filesystem path or file URL and returns a
promise. The file reader rejects invalid UTF-8 and propagates filesystem errors.

Both support comma-delimited CSV with headers by default, optional BOMs, quoted
commas, escaped quotes, and multiline fields. Use `{ header: false, column: 0 }`
for a headerless file's first column. Automatic selection requires exactly one
column whose nonblank values all look like URLs or paths; indicative headers
also allow relative paths containing slashes.

Blank cells are skipped, while other values (including whitespace and duplicate
entries) are preserved. Invalid argument types throw `TypeError`. Malformed CSV,
inconsistent column counts, empty input, missing/duplicate selected columns, and
failed or ambiguous detection throw `RangeError`. The generator separately
rejects surrounding whitespace rather than silently trimming it.

See the [shared sample CSV](https://github.com/mertefeisawesome/url2regex/blob/main/examples/urls.csv)
and [runnable Node example](https://github.com/mertefeisawesome/url2regex/blob/main/examples/typescript/csv_input.mjs).

Development: run `npm test` from this directory. Tests use the shared real-world
fixtures. `npm pack` tests and packages the distribution for inspection.
Publish deliberately with `npm publish --tag alpha`; the configured default tag
is also `alpha`. This does not claim exclusive use of a Chrome extension name.

MIT license. [Source](https://github.com/mertefeisawesome/url2regex).

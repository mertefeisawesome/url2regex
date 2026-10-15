# url2regex

<p align="center">
  <img src="assets/branding/logo-transparent-light.png" alt="url2regex" width="320">
</p>

Turn a list of URLs or paths into a compact regular expression. Shared prefixes
are grouped, literal regex characters are escaped, and duplicates are removed
without modifying your data.

```text
/products/shoes
/products/hats
/about

→ ^/(?:about|products/(?:hats|shoes))$
```

## Use cases

- Build a filter for selected pages in Google Analytics or Search Console.
- Convert a CSV export of landing pages into a pattern without writing alternatives by hand.
- Extract paths from URLs when the destination tool uses a page-path dimension.
- Check whether a regex includes intended pages and excludes supplied negatives.
- Generate patterns in Python scripts, Node.js tools, browser applications, or
  the Chrome toolbar popup.

The project began as a Colab notebook for analytics filters. It now provides a
Python package, a JavaScript package with TypeScript declarations, and a Chrome
extension using the same JavaScript generator.

## Platforms and availability

| Platform | Availability | Features |
| --- | --- | --- |
| [Python / PyPI](https://pypi.org/project/url2regex/) | Stable `0.1.0`; Python 3.10+ | Generation, path extraction, CSV loading, validation |
| [JavaScript / npm](https://www.npmjs.com/package/url2regex) | ESM, Node.js 20+ and modern browsers | Generation, path extraction, CSV import, validation |
| TypeScript | Declarations included in the npm package | Typed JavaScript API; no compiler required at runtime |
| Chrome extension | Submitted to Chrome Web Store; review pending confirmation | Pasted lists, optional path extraction, output selection/copy |

Both libraries have no third-party runtime dependencies. The extension processes
input locally, with no accounts, network requests, or requested permissions.
CSV import and validation are not yet exposed in the extension popup.

## Installation

### Python

```sh
python -m pip install url2regex
```

### JavaScript / TypeScript

```sh
npm install url2regex
```

Use ESM imports in Node (`.mjs` or `"type": "module"` in `package.json`). Browser
applications can resolve npm imports with their build tool.

### Chrome

To try the extension before store approval, clone the repository and build it:

```sh
node extension/build.mjs
```

Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**,
and choose `extension/dist`. Pin the extension, paste one URL or path per line,
and select **Generate regex**. See the [extension guide](extension/README.md).

## Quick start

Python:

```python
import re
from url2regex import urls_to_regex

pattern = urls_to_regex(["/a", "/a/b"])
assert re.fullmatch(pattern, "/a/b") is not None
assert re.fullmatch(pattern, "/ab") is None
```

JavaScript / TypeScript:

```js
import { urlsToRegex } from "url2regex";

const pattern = urlsToRegex(["/a", "/a/b"]);
console.assert(new RegExp(pattern).test("/a/b"));
console.assert(!new RegExp(pattern).test("/ab"));
```

Both return `^/a(?:/b)?$`. Default mode preserves supplied strings, including
queries, fragments, case, percent encoding, and trailing slashes. Full URLs stay
full URLs; paths stay paths. Mixed input is allowed. This generates patterns,
not shortened URLs, and does not guarantee the shortest possible regex.

## Paths, CSV input, and validation

| Task | Python | JavaScript / TypeScript |
| --- | --- | --- |
| Preserve input | `urls_to_regex(values)` | `urlsToRegex(values)` |
| Extract paths | `urls_to_regex(urls, target="path")` | `urlsToRegex(urls, { target: "path" })` |
| Read CSV file | `read_urls_csv(file, column="URL")` | `await readUrlsCsv(file, { column: "URL" })` from `url2regex/node` |
| Parse CSV text | Use the file loader | `parseUrlsCsv(text, { column: "URL" })` from `url2regex` |
| Validate | `validate_regex(pattern, positives=values, negatives=others)` | `validateRegex(pattern, { positives: values, negatives: others })` |

Full API guides: [Python](python/README.md) and [JavaScript / TypeScript](typescript/README.md).

Path extraction drops origins, queries, and fragments, preserves trailing
slashes and percent encoding, and uses `/` for URLs without paths. Different
domains can collapse to the same path.

CSV loaders detect URL/path columns or accept manual selection, support headers
and explicit headerless input, and handle quoted fields and BOMs. They skip blank
cells and preserve other values. Ambiguous columns require selection.

Validators report missed positives, matched negatives, and syntax errors.
Negatives are optional. They require whole-string matches in their own language's
engine; passing confirms only supplied examples. Use paths as validation examples
when generating path-only patterns.

Generation rejects empty input, non-string entries, empty strings, and surrounding
whitespace instead of silently cleaning values. See the package guides for error
types and Python's optional source-literal output format.

## Analytics and regex compatibility

Generated patterns use escaped literals, groups, alternatives, optional groups,
and anchors intended for a common Python/JavaScript/RE2 subset. Both language
implementations test the shared real-world fixtures. Validators execute their
own engine; unusual URL parsing cases can differ between languages.

[Google Analytics](https://support.google.com/analytics/answer/1034324?hl=en-uk)
documents full matching and case sensitivity by default.
[Search Console](https://support.google.com/webmasters/answer/17011165?hl=en)
documents partial matching and case-insensitive matching by default. Anchors
restrict the match, but do not override case sensitivity. Search Console's
`(?-i)` prefix can force case sensitivity there; it is not portable to JavaScript.

Match the generated representation to the destination field: full URLs for a
full-URL field, paths for a path field. Product-specific length limits are not
enforced. Live analytics-product verification has not been performed.

## Examples

| Example | Python | JavaScript / TypeScript |
| --- | --- | --- |
| Basic generation | [basic_usage.py](examples/python/basic_usage.py) | [basic_usage.mjs](examples/typescript/basic_usage.mjs) |
| CSV import | [csv_input.py](examples/python/csv_input.py) | [csv_input.mjs](examples/typescript/csv_input.mjs) |
| Path extraction | [path_extraction.py](examples/python/path_extraction.py) | Demonstrated in the [package guide](typescript/README.md#extract-paths-from-full-urls) |
| Validation | [validation.py](examples/python/validation.py) | [validation.mjs](examples/typescript/validation.mjs) |

CSV examples use the same synthetic [urls.csv](examples/urls.csv). Run Python
examples with the development environment active and JavaScript examples with
Node.js, from the repository root.

## Install for development

Clone the repository. Python setup from its root:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ./python
python -m unittest discover -s python/tests -v
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1` instead. Select
the environment's interpreter in your editor. Editable installation uses the
working source without `PYTHONPATH` overrides.

JavaScript setup and tests from the repository root:

```sh
npm --prefix typescript ci
npm --prefix typescript test
npm --prefix typescript run check:package
node examples/typescript/basic_usage.mjs
node examples/typescript/csv_input.mjs
node examples/typescript/validation.mjs
```

The examples import working source. To test package-name imports locally, run
`npm pack` in `typescript/` and install the resulting tarball in a consuming
project. The main export is browser-safe; filesystem loading is isolated in
`url2regex/node`.

Python CI builds distributions, checks metadata and license consistency, and
tests the installed wheel. JavaScript CI checks Node 20, 22, 24, and 26 against
the packed npm artifact, runs TypeScript consumer checks, and verifies extension
packaging and popup behavior. Shared [real-world fixtures](fixtures/README.md)
support both language suites. Run the Python benchmark separately:

```sh
python python/tests/benchmark_generator.py --repeats 5
```

It measures full-URL generation, compilation, matching, allocation, and pattern
length. Timing budgets are optional and machine-dependent.

## License

[MIT](LICENSE). [Report an issue](https://github.com/mertefeisawesome/url2regex/issues).

# url2regex

<p align="center">
  <img src="https://raw.githubusercontent.com/mertefeisawesome/url2regex/main/assets/branding/logo-transparent-light.png" alt="url2regex" width="320">
</p>

Generate compact regular expressions from lists of URLs or paths. Shared
prefixes are grouped automatically, literal regex characters are escaped, and
duplicate inputs are removed without modifying your list.

Includes CSV column detection, explicit URL-to-path extraction, and validation
against positive and optional negative examples. Requires Python 3.10+ and has
no third-party runtime dependencies.

## Installation

```sh
python -m pip install url2regex
```

Using a virtual environment is recommended.

## Quick start

```python
import re
from url2regex import urls_to_regex

paths = ["/products/shoes", "/products/hats", "/about"]
pattern = urls_to_regex(paths)
print(pattern)
# ^\/(?:about|products\/(?:hats|shoes))$

assert re.fullmatch(pattern, "/products/shoes") is not None
assert re.fullmatch(pattern, "/products/bags") is None
```

By default, strings are preserved exactly: full URLs produce full-URL patterns,
and paths produce path patterns. Mixed inputs are accepted. Queries, fragments,
case, percent encoding, and trailing slashes are retained. Grouping reduces
repetition but does not guarantee the shortest possible regex.

## Extract paths from full URLs

```python
from url2regex import urls_to_regex

pattern = urls_to_regex(
    ["https://example.com/products/shoes?color=red#details"],
    target="path",
)
print(pattern)
# ^\/products\/shoes$
```

`target="path"` removes the origin, query, and fragment. Existing paths are also
accepted. Trailing slashes and percent encoding are preserved; URLs without a
path become `\/`. Different domains may collapse to the same path.

## Read URLs from CSV

For a comma-delimited UTF-8 file such as:

```csv
URL,Category
https://example.com/products/shoes,Product
https://example.com/products/hats,Product
https://example.com/about,Company
```

```python
from url2regex import read_urls_csv, urls_to_regex

urls = read_urls_csv("pages.csv")  # Detect the URL/path column
urls = read_urls_csv("pages.csv", column="URL")  # Or select it explicitly
pattern = urls_to_regex(urls)
```

Headers are expected by default. For headerless files, use
`read_urls_csv("pages.csv", header=False, column=0)` to select the first column.
UTF-8 BOMs and quoted CSV fields are supported.

Automatic detection examines headers and nonblank values. All nonblank values
in a candidate column must resemble URLs or paths; indicative headers also
allow relative paths containing slashes. Ambiguous detection requires manual
selection. Blank cells are skipped, while other values remain unchanged.

Try the [shared sample CSV](https://github.com/mertefeisawesome/url2regex/blob/main/examples/urls.csv)
with the [CSV example](https://github.com/mertefeisawesome/url2regex/blob/main/examples/python/csv_input.py).

## Validate a pattern

```python
from url2regex import urls_to_regex, validate_regex

paths = ["/a", "/a/b"]
report = validate_regex(
    urls_to_regex(paths),
    positives=paths,
    negatives=["/ab", "/a/c"],
)
assert report.passed
print(report.missed_positives)   # []
print(report.matched_negatives)  # []
print(report.syntax_error)       # None
```

The returned `ValidationReport` checks Python whole-string matching with
`re.fullmatch()`. Negatives are optional. Invalid regex syntax returns a failed
report with `syntax_error`, without checking examples. Passing establishes
behavior only for supplied examples. With no examples, it confirms compilation
only. Validate path patterns against paths, not full URLs.

## Output formats

`output="pattern"` is the default: a string ready for `re.compile()` or
`re.fullmatch()`, with no surrounding quotes or `/…/` delimiters.

For source text to paste into Python code:

```python
from url2regex import urls_to_regex

source = urls_to_regex(["/a"], output="python_literal")
print(source)
# r"^\/a$"
```

This is a representation of the pattern, not a pattern to compile directly.
An escaped regular string literal is used when a raw literal cannot safely
represent the result.

## Errors

- Generation requires a nonempty list of strings. Empty strings and surrounding
  whitespace raise `ValueError`; invalid types raise `TypeError`. Values are not
  silently trimmed or checked for complete URL standards compliance.
- Unknown `target` or `output` values raise `ValueError`.
- CSV detection failures, malformed records, missing/duplicate selected columns,
  and columns without values raise `ValueError`. File errors such as
  `FileNotFoundError` propagate.
- Validation raises `TypeError` for invalid arguments; empty strings and
  whitespace are allowed as validation examples.

## Compatibility

Patterns use a common subset of Python, JavaScript, and RE2 syntax: escaped
literals, groups, alternatives, optional groups, and `^`/`$` anchors. Current
automated validation executes Python only. Use `re.fullmatch()` for strict
Python checks because `$` may also match before a final newline during search.
Consumer flags can change matching behavior.

[Google Analytics](https://support.google.com/analytics/answer/1034324?hl=en-uk)
documents full matching and case sensitivity by default.
[Search Console](https://support.google.com/webmasters/answer/17011165?hl=en)
documents partial matching and case-insensitive matching by default. Anchors
do not override case sensitivity. Search Console supports the case-sensitive
prefix `(?-i)`, which is not portable to JavaScript.

Choose a URL or path dimension consistent with your pattern. Product-specific
length limits are not enforced, and live analytics-product testing has not
been performed.

## Examples and development

- [Basic usage](https://github.com/mertefeisawesome/url2regex/blob/main/examples/python/basic_usage.py)
- [CSV import](https://github.com/mertefeisawesome/url2regex/blob/main/examples/python/csv_input.py)
- [Path extraction](https://github.com/mertefeisawesome/url2regex/blob/main/examples/python/path_extraction.py)
- [Validation](https://github.com/mertefeisawesome/url2regex/blob/main/examples/python/validation.py)
- [Development setup and tests](https://github.com/mertefeisawesome/url2regex#install-for-development)
- [Report an issue](https://github.com/mertefeisawesome/url2regex/issues)

## License

[MIT](https://github.com/mertefeisawesome/url2regex/blob/main/LICENSE).

# url2regex

Generate compact regular expressions from lists of URLs or paths by grouping
shared prefixes. Useful for building page filters and checking selected URL sets.

The Python library is in development, with generation, path extraction, CSV
loading, and validation implemented. It has not been published to PyPI yet.
TypeScript/npm support and a Chrome extension are planned.

## Install for development

Requires Python 3.10 or newer. From a clone of this repository:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ./python
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1` instead.
Select this environment's Python interpreter in your editor. The editable
installation uses your working source, so changes take effect without reinstalling.
There are no third-party runtime dependencies.

## Quick start

```python
import re
from url2regex import urls_to_regex

paths = ["/products/shoes", "/products/hats", "/about"]
pattern = urls_to_regex(paths)

print(pattern)
# ^/(?:about|products/(?:hats|shoes))$

assert re.fullmatch(pattern, "/products/shoes") is not None
assert re.fullmatch(pattern, "/products/bags") is None
```

By default, the pattern matches inputs as supplied. Full URLs remain full URLs;
paths remain paths. Query strings, fragments, percent encoding, case, and trailing
slashes are preserved. Duplicate inputs are removed without modifying your list.
Grouping makes patterns compact but does not guarantee the shortest possible regex.

## Generate paths from URLs

```python
from url2regex import urls_to_regex

pattern = urls_to_regex(
    ["https://example.com/products/shoes?color=red#details"],
    target="path",
)
# ^/products/shoes$
```

Path mode drops the origin, query, and fragment. It accepts existing paths,
preserves trailing slashes and percent encoding, and uses `/` for a URL with no
path. URLs on different domains may become the same path.

## Load a CSV

The [shared sample CSV](examples/urls.csv) has a `URL` column and a category column.
Run this snippet from the repository root:

```python
from url2regex import read_urls_csv, urls_to_regex

urls = read_urls_csv("examples/urls.csv")  # Automatic column detection
# Or select explicitly:
urls = read_urls_csv("examples/urls.csv", column="URL")
pattern = urls_to_regex(urls)
```

The loader supports comma-delimited UTF-8 files with optional BOMs and quoted
fields. Headers are expected by default. For headerless files, use
`header=False, column=0` to select the first column.

Automatic detection examines column names and nonblank values. It requires one
unambiguous candidate; specify `column` if detection fails or finds multiple
candidates. Empty and whitespace-only cells are skipped. Other values are
preserved, including surrounding whitespace that the generator will reject.

## Validate a pattern

```python
from url2regex import urls_to_regex, validate_regex

paths = ["/a", "/a/b"]
pattern = urls_to_regex(paths)
report = validate_regex(pattern, positives=paths, negatives=["/ab", "/a/c"])

assert report.passed
print(report.missed_positives)   # []
print(report.matched_negatives)  # []
print(report.syntax_error)       # None
```

`negatives` is optional. Validation uses Python's `re.fullmatch()` and returns a
`ValidationReport`. Invalid regex syntax produces a failed report with
`syntax_error`; example checks are skipped in that case. Passing confirms only
the supplied examples, not exclusion of every possible unwanted string. With no
examples, it only confirms successful compilation.

For a path-only pattern, supply paths as validation examples, not full URLs.

## Output formats and errors

- `output="pattern"` (default) returns regex text ready for Python's regex engine.
- `output="python_literal"` returns source text, such as `r"^/a$"`, for pasting
  into Python code. Do not pass that quoted source text directly to `re.compile()`.
  Regular escaped literals are used when needed to represent the pattern safely.

The generator accepts a nonempty Python list of strings. Empty strings and
surrounding whitespace raise `ValueError`; wrong argument types raise
`TypeError`. Unknown target/output options raise `ValueError`. It does not
silently trim values or validate every input as a standards-compliant URL.

The CSV loader raises `ValueError` for malformed records, missing/duplicate
selected columns, failed detection, or a selected column with no values. Standard
file errors, such as `FileNotFoundError`, propagate. The validator raises
`TypeError` for invalid argument types and permits empty strings as examples.

## Regex compatibility

Patterns use literals, escaping, non-capturing groups, alternatives, optional
groups, and `^`/`$` anchors. They contain no surrounding `/…/` delimiters.
The syntax is intended for a common Python, JavaScript, and RE2 subset; current
automated validation executes Python only.

Use `re.fullmatch()` for strict Python checks: `$` can also match before a final
newline when used with search. Consumer flags, including case-insensitive or
multiline matching, can change behavior.

[Google Analytics](https://support.google.com/analytics/answer/1034324?hl=en-uk)
documents full matching and case sensitivity by default.
[Search Console](https://support.google.com/webmasters/answer/17011165?hl=en)
documents partial matching and case-insensitive matching by default. Anchors
restrict the match, but do not change case sensitivity. Search Console's
`(?-i)` prefix can force case sensitivity there; it is not portable to JavaScript.
Select a full-URL or path dimension consistent with the generated pattern.

No product-specific regex length limits are enforced. Generated patterns have
not been verified inside either analytics product.

## Examples and tests

Runnable Python examples:

- [Basic generation and Python-literal output](examples/python/basic_usage.py)
- [CSV import](examples/python/csv_input.py)
- [Path extraction](examples/python/path_extraction.py)
- [Validation reports](examples/python/validation.py)

With the development environment active, run from the repository root:

```sh
python -m unittest discover -s python/tests -v
python python/tests/benchmark_generator.py --repeats 5
```

The benchmark uses [shared real-world fixtures](fixtures/README.md), reports
timing, Python allocation, and pattern length, and checks positive/negative
matching. It currently benchmarks full-URL mode. Timing limits are optional and
machine-dependent; ordinary tests have no speed threshold.

## License

[MIT](LICENSE).

# Examples

## Shared CSV

[urls.csv](urls.csv) contains synthetic URLs on `example.com`, including query
strings, a fragment, trailing slashes, and a quoted comma. Its `URL` column can
be detected automatically or selected explicitly. This file is shared by Python
examples and future TypeScript examples.

## Python

Follow the development installation in [the Python README](../python/README.md)
and activate the project virtual environment. Run from the repository root:

```sh
python examples/python/basic_usage.py
python examples/python/csv_input.py
python examples/python/path_extraction.py
python examples/python/validation.py
```

- [Basic usage](python/basic_usage.py): generation, Python matching, and source-literal output.
- [CSV input](python/csv_input.py): automatic detection and manual column selection.
- [Path extraction](python/path_extraction.py): full URLs versus paths and preserved trailing slashes.
- [Validation](python/validation.py): positive/negative examples and syntax errors.

All examples use synthetic data, not the real-world benchmark fixtures.

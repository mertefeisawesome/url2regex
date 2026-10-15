# Python package

The Python 3.10+ library lives in `src/url2regex` and provides pattern generation,
explicit path extraction, CSV loading, and Python regex validation.

From the repository root, create and activate a development environment, then
install the local source in editable mode once:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ./python
```

With that environment active, imports work without `PYTHONPATH`; source edits
take effect immediately:

```sh
python -m unittest discover -s python/tests -v
python python/tests/benchmark_generator.py
```

Select `.venv/bin/python` as the Python interpreter in your editor too.
The benchmark uses the shared fixtures under `fixtures/real-world/`.

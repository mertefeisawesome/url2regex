"""Run from the repository root:

python python/tests/benchmark_generator.py

Use the project's virtual environment after installing with pip install -e ./python.

Options: --repeats 10 --max-generation-seconds 1.0

Uses shared anonymized fixtures. Reports timings, never URL content. Optional performance
budgets are machine-specific and are not part of the ordinary test suite.
Only full-URL generation is timed. CSV loading is excluded; peak traced Python
allocation is measured separately from speed and is not total process memory.
Compilation uses a cold regex cache; validation uses a warm cache.
"""

import argparse
import json
from pathlib import Path
import platform
import re
import statistics
from time import perf_counter
import tracemalloc

from url2regex import read_urls_csv, urls_to_regex, validate_regex


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repeats", type=int, default=5)
    parser.add_argument("--max-generation-seconds", type=float)
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error("--repeats must be positive")
    data = Path(__file__).resolve().parents[2] / "fixtures" / "real-world"
    positives = read_urls_csv(data / "positives.csv", column="URL")
    negatives = read_urls_csv(data / "negatives.csv", column="URL")
    print(json.dumps({"python": platform.python_version(), "platform": platform.platform(),
                      "positives": len(positives), "negatives": len(negatives)}))
    timings = []
    for _ in range(args.repeats):
        start = perf_counter()
        pattern = urls_to_regex(positives)
        timings.append(perf_counter() - start)
    # Measure allocations separately: tracemalloc would distort speed timings.
    tracemalloc.start()
    urls_to_regex(positives)
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    re.purge()
    start = perf_counter()
    compiled = re.compile(pattern)
    compile_seconds = perf_counter() - start
    start = perf_counter()
    missed = sum(compiled.fullmatch(value) is None for value in positives)
    unwanted = sum(compiled.fullmatch(value) is not None for value in negatives)
    matching_seconds = perf_counter() - start
    start = perf_counter()
    report = validate_regex(pattern, positives=positives, negatives=negatives)
    validation_seconds = perf_counter() - start
    median = statistics.median(timings)
    print(json.dumps({"generation_median_seconds": median,
                      "generation_min_seconds": min(timings),
                      "generation_max_seconds": max(timings),
                      "generation_peak_python_bytes": peak,
                      "compile_seconds": compile_seconds,
                      "matching_seconds": matching_seconds,
                      "validation_seconds_warm_regex_cache": validation_seconds,
                      "pattern_characters": len(pattern),
                      "naive_pattern_characters": len("^(?:" + "|".join(re.escape(v) for v in positives) + ")$"),
                      "missed_positives": missed, "matched_negatives": unwanted}, indent=2))
    if not report.passed or missed or unwanted:
        raise SystemExit("Matching correctness check failed")
    if args.max_generation_seconds is not None and median > args.max_generation_seconds:
        raise SystemExit("Generation exceeded the requested performance budget")


if __name__ == "__main__":
    main()

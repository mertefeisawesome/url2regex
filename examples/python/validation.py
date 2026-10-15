"""Inspect successful validation, matching failures, and invalid regex syntax."""

from url2regex import urls_to_regex, validate_regex


def main():
    paths = ["/products/shoes", "/products/hats"]
    pattern = urls_to_regex(paths)
    report = validate_regex(pattern, positives=paths, negatives=["/products/bags"])
    print("Generated pattern passes:", report.passed)

    # Without negatives, validate coverage of the supplied inputs only.
    print("Positive-only check passes:", validate_regex(pattern, positives=paths).passed)

    failing = validate_regex(
        r"/products/(shoes|bags)",
        positives=paths,
        negatives=["/products/bags"],
    )
    print("Incorrect pattern passes:", failing.passed)
    print("Missed positives:", failing.missed_positives)
    print("Matched negatives:", failing.matched_negatives)

    invalid = validate_regex("[", positives=paths)
    print("Syntax error:", invalid.syntax_error)
    # Validation checks the supplied strings with Python fullmatch; it does not
    # prove exclusion of every other string or compatibility with other engines.


if __name__ == "__main__":
    main()

"""Exercise agreed input errors and preservation before regex implementation."""

import unittest

from url2regex import urls_to_regex
from url2regex.generator import _prepare_values


class GeneratorInputTests(unittest.TestCase):
    def test_invalid_inputs_report_the_problem(self):
        cases = [
            ("/a", TypeError, "list of strings"),
            ([], ValueError, "at least one"),
            (["/a", None], TypeError, r"values\[1\]"),
            ([""], ValueError, "empty"),
            ([" /a"], ValueError, "whitespace"),
            (["/a\n"], ValueError, "whitespace"),
        ]
        for values, error, message in cases:
            with self.subTest(values=values):
                with self.assertRaisesRegex(error, message):
                    urls_to_regex(values)

    def test_deduplication_preserves_literals_and_leaves_input_unchanged(self):
        values = ["https://example.com/a?q=1#x", "/a/", "/a/", "/a b"]
        original = values.copy()
        self.assertEqual(_prepare_values(values), [values[0], "/a/", "/a b"])
        self.assertEqual(values, original)

    def test_unknown_options_are_rejected(self):
        for options in ({"target": "guess"}, {"output": "human"}):
            with self.subTest(options=options):
                with self.assertRaises(ValueError):
                    urls_to_regex(["/a"], **options)

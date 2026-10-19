"""Matching behavior and source formatting for generated patterns."""

import ast
import itertools
import re
import unittest

from url2regex import urls_to_regex


class GeneratorTests(unittest.TestCase):
    def assert_matches_only(self, values, negatives):
        pattern = re.compile(urls_to_regex(values))
        for value in values:
            self.assertIsNotNone(pattern.fullmatch(value), value)
        for value in negatives:
            self.assertIsNone(pattern.fullmatch(value), value)

    def test_notebook_regressions(self):
        self.assert_matches_only(
            ["https://example.com/a.b", "https://example.com/c"],
            ["https://example.com/axb", "https://exampleXcom/c"],
        )
        self.assert_matches_only(
            ["https://example.com/a?q=1&x=2#section", "https://example.com/a/"],
            ["https://example.com/a", "https://example.com/a?q=1&x=2"],
        )
        self.assert_matches_only(["/a", "/a/b"], ["/ab", "/a/", "/a/b/c"])

    def test_mixed_inputs_roots_and_special_characters(self):
        self.assert_matches_only(
            ["/", "https://example.com", "/a(1)+[x]{2}?", r"/a\b", "/café/猫", "/a b"],
            ["", "https://example.com/", "/a1xx", "/ab", "/cafe/猫"],
        )

    def test_forward_slashes_are_escaped_by_default(self):
        cases = [
            (["/"], {}, r"^\/$"),
            (["https://example.com/a/"], {}, r"^https:\/\/example\.com\/a\/$"),
            (["//a///b/"], {}, r"^\/\/a\/\/\/b\/$"),
            (["/a", "/a/b"], {}, r"^\/a(?:\/b)?$"),
            (["https://example.com/a/?q=1"], {"target": "path"}, r"^\/a\/$"),
            ([r"/a\/b"], {}, r"^\/a\\\/b$"),
        ]
        for values, options, expected in cases:
            with self.subTest(values=values, options=options):
                pattern = urls_to_regex(values, **options)
                self.assertEqual(pattern, expected)
                literal = urls_to_regex(values, output="python_literal", **options)
                self.assertEqual(ast.literal_eval(literal), expected)
                positives = ["/a/"] if options else values
                for value in positives:
                    self.assertIsNotNone(re.fullmatch(pattern, value))
                self.assertIsNone(re.fullmatch(pattern, "/unrelated"))

    def test_order_duplicates_and_input_preservation(self):
        values = ["/b", "/a/b", "/a", "/b"]
        original = values.copy()
        self.assertEqual(urls_to_regex(values), urls_to_regex(list(reversed(values))))
        self.assertEqual(urls_to_regex(values), urls_to_regex(sorted(set(values))))
        self.assertEqual(values, original)

    def test_shared_prefix_shortens_a_representative_pattern(self):
        values = ["https://example.com/blog/python", "https://example.com/blog/javascript"]
        naive = "^(?:" + "|".join(re.escape(value).replace("/", r"\/") for value in values) + ")$"
        self.assertLess(len(urls_to_regex(values)), len(naive))

    def test_python_literal_round_trip(self):
        cases = [["/a", "/a/b"], ['/both"and\'quotes'], [r"/back\slash"], ["/line\nbreak"], ["/null\x00byte"]]
        for values in cases:
            with self.subTest(values=values):
                pattern = urls_to_regex(values)
                literal = urls_to_regex(values, output="python_literal")
                self.assertEqual(ast.literal_eval(literal), pattern)
                self.assertIsNotNone(re.fullmatch(ast.literal_eval(literal), values[0]))

    def test_long_input_does_not_hit_recursion_limit(self):
        values = ["/" + "a" * 3000 + "x", "/" + "a" * 3000 + "y"]
        self.assert_matches_only(values, ["/" + "a" * 3000 + "z"])

    def test_small_alphabet_exhaustively(self):
        candidates = ["".join(chars) for length in range(1, 5) for chars in itertools.product("a/.", repeat=length)]
        values = ["a", "a/", "a/a", "a.", "/a", "/."]
        self.assert_matches_only(values, [value for value in candidates if value not in values])

    def test_path_extraction(self):
        cases = [
            ("https://example.com/a?q=1#section", "/a"),
            ("https://example.com", "/"),
            ("https://example.com?q=1", "/"),
            ("https://example.com/a/", "/a/"),
            ("/a/b", "/a/b"),
            ("/a/b?q=1#section", "/a/b"),
            ("https://example.com/a%2Fb;param", "/a%2Fb;param"),
            ("//a///b/", "//a///b/"),
            ("/redirect/https://other.example/a", "/redirect/https://other.example/a"),
        ]
        for value, expected in cases:
            with self.subTest(value=value):
                self.assertEqual(
                    urls_to_regex([value], target="path"), urls_to_regex([expected])
                )

    def test_path_extraction_collapses_domains_without_mutating_input(self):
        values = ["https://one.example/a?q=1", "https://two.example/a#x", "/a"]
        original = values.copy()
        self.assertEqual(urls_to_regex(values, target="path"), urls_to_regex(["/a"]))
        self.assertEqual(values, original)

    def test_path_extraction_supports_python_literal_output(self):
        literal = urls_to_regex(["https://example.com/a/"], target="path", output="python_literal")
        self.assertEqual(ast.literal_eval(literal), urls_to_regex(["/a/"]))

    def test_path_extraction_reports_malformed_urls(self):
        for value in ["https:///a", "https://[broken/a"]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    urls_to_regex([value], target="path")

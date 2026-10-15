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

    def test_order_duplicates_and_input_preservation(self):
        values = ["/b", "/a/b", "/a", "/b"]
        original = values.copy()
        self.assertEqual(urls_to_regex(values), urls_to_regex(list(reversed(values))))
        self.assertEqual(urls_to_regex(values), urls_to_regex(sorted(set(values))))
        self.assertEqual(values, original)

    def test_shared_prefix_shortens_a_representative_pattern(self):
        values = ["https://example.com/blog/python", "https://example.com/blog/javascript"]
        naive = "^(?:" + "|".join(re.escape(value) for value in values) + ")$"
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

    def test_path_extraction_remains_explicitly_unimplemented(self):
        with self.assertRaises(NotImplementedError):
            urls_to_regex(["https://example.com/a"], target="path")

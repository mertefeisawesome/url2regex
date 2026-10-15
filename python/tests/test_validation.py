"""Validation reports for positive, negative, and malformed patterns."""

import unittest

from url2regex import ValidationReport, urls_to_regex, validate_regex


class ValidationTests(unittest.TestCase):
    def test_generated_pattern_passes_with_optional_negatives(self):
        values = ["/a", "/a/b", "https://example.com/a?q=1"]
        pattern = urls_to_regex(values)
        for negatives in (None, ["/ab", "/a/", "https://example.com/a?q=2"]):
            with self.subTest(negatives=negatives):
                report = validate_regex(pattern, positives=values, negatives=negatives)
                self.assertIsInstance(report, ValidationReport)
                self.assertTrue(report.passed)
                self.assertEqual(report.missed_positives, [])
                self.assertEqual(report.matched_negatives, [])
                self.assertIsNone(report.syntax_error)

    def test_reports_both_failure_kinds_without_mutating_inputs(self):
        positives = ["/a", "/b", "/c"]
        negatives = ["/a", "/x"]
        report = validate_regex(r"/a", positives=positives, negatives=negatives)
        self.assertFalse(report.passed)
        self.assertEqual(report.missed_positives, ["/b", "/c"])
        self.assertEqual(report.matched_negatives, ["/a"])
        self.assertEqual(positives, ["/a", "/b", "/c"])
        self.assertEqual(negatives, ["/a", "/x"])

    def test_syntax_failure_returns_report(self):
        report = validate_regex("[", positives=["/a"], negatives=["/b"])
        self.assertFalse(report.passed)
        self.assertTrue(report.syntax_error)
        self.assertEqual(report.missed_positives, [])
        self.assertEqual(report.matched_negatives, [])

    def test_whole_string_matching_includes_final_newline(self):
        report = validate_regex(r"^/a$", positives=["/a"], negatives=["/a\n", "prefix/a", "/a/suffix"])
        self.assertTrue(report.passed)

    def test_empty_lists_and_literal_whitespace_are_allowed(self):
        self.assertTrue(validate_regex("", positives=[]).passed)
        report = validate_regex("", positives=[""], negatives=[" ", "\n"])
        self.assertTrue(report.passed)

    def test_wrong_argument_types_raise(self):
        cases = [
            {"pattern": None, "positives": []},
            {"pattern": "/a", "positives": "/a"},
            {"pattern": "/a", "positives": [1]},
            {"pattern": "/a", "positives": [], "negatives": "/b"},
            {"pattern": "/a", "positives": [], "negatives": [None]},
        ]
        for options in cases:
            with self.subTest(options=options):
                with self.assertRaises(TypeError):
                    validate_regex(**options)

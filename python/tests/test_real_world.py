"""Integration tests using shared anonymized fixtures; never print URL values."""

from pathlib import Path
from urllib.parse import urlsplit
import unittest

from url2regex import read_urls_csv, urls_to_regex, validate_regex

DATA = Path(__file__).resolve().parents[2] / "fixtures" / "real-world"


@unittest.skipUnless(
    (DATA / "positives.csv").is_file() and (DATA / "negatives.csv").is_file(),
    "Real-world dataset is not present",
)
class RealWorldTests(unittest.TestCase):
    def setUp(self):
        self.positives = read_urls_csv(DATA / "positives.csv", column="URL")
        self.negatives = read_urls_csv(DATA / "negatives.csv", column="URL")

    def test_real_world_selection_matches_only_positives(self):
        positives = read_urls_csv(DATA / "positives.csv", column="URL")
        negatives = read_urls_csv(DATA / "negatives.csv", column="URL")
        self.assertEqual(len(positives), len(set(positives)))
        self.assertEqual(len(negatives), len(set(negatives)))
        self.assertFalse(set(positives) & set(negatives))
        report = validate_regex(urls_to_regex(positives), positives=positives, negatives=negatives)
        self.assertIsNone(report.syntax_error)
        self.assertEqual(len(report.missed_positives), 0)
        self.assertEqual(len(report.matched_negatives), 0)

    def test_path_extraction_matches_expected_paths_only(self):
        # Derive expected paths independently of the generator's private helper.
        paths = sorted({urlsplit(value).path or "/" for value in self.positives})
        held_out = {urlsplit(value).path or "/" for value in self.negatives}
        # Distinct full URLs can intentionally collapse to the same path.
        negatives = sorted(held_out - set(paths))
        self.assertTrue(negatives, "Dataset must include held-out distinct paths")
        pattern = urls_to_regex(self.positives, target="path")
        report = validate_regex(pattern, positives=paths, negatives=negatives)
        self.assertIsNone(report.syntax_error)
        self.assertEqual(len(report.missed_positives), 0)
        self.assertEqual(len(report.matched_negatives), 0)
        self.assertEqual(pattern, urls_to_regex(paths))
        # A path-only pattern must not retain the original URL origins.
        self.assertEqual(
            len(validate_regex(pattern, positives=[], negatives=self.positives).matched_negatives),
            0,
        )

    def test_path_extraction_accepts_mixed_urls_and_existing_paths(self):
        paths = [urlsplit(value).path or "/" for value in self.positives]
        expected = urls_to_regex(sorted(set(paths)))
        mixed = self.positives[::2] + paths[1::2]
        self.assertEqual(urls_to_regex(mixed, target="path"), expected)
        self.assertEqual(urls_to_regex(paths, target="path"), expected)

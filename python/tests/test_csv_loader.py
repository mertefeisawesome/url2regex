"""CSV detection, explicit selection, preservation, and error behavior."""

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from url2regex import read_urls_csv


class CsvLoaderTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "pages.csv"

    def read(self, text, **options):
        self.path.write_text(text, encoding="utf-8")
        return read_urls_csv(self.path, **options)

    def test_detects_values_with_unfamiliar_header_and_bom(self):
        self.assertEqual(
            self.read('\ufeffResource,Clicks\nhttps://example.com/a,10\n/b,20\n'),
            ["https://example.com/a", "/b"],
        )

    def test_header_supports_relative_paths(self):
        self.assertEqual(self.read("Landing Page,Clicks\nblog/post,2\n"), ["blog/post"])

    def test_ambiguous_columns_require_override(self):
        text = "URL,Destination\n/a,/b\n"
        with self.assertRaisesRegex(ValueError, "Ambiguous.*URL.*Destination"):
            self.read(text)
        self.assertEqual(self.read(text, column="Destination"), ["/b"])

    def test_preserves_quoted_commas_whitespace_and_duplicates(self):
        self.assertEqual(
            self.read('URL,Clicks\n"https://example.com/a,b?q=1",1\n /a ,2\n/a,3\n/a,4\n,5\n   ,6\n'),
            ["https://example.com/a,b?q=1", " /a ", "/a", "/a"],
        )

    def test_headerless_auto_and_manual_selection_keep_first_row(self):
        text = "1,/a\n2,/b\n"
        self.assertEqual(self.read(text, header=False), ["/a", "/b"])
        self.assertEqual(self.read(text, header=False, column=1), ["/a", "/b"])

    def test_clear_errors_for_missing_or_unsuitable_columns(self):
        cases = [
            ("", {}, "empty"),
            ("Title,Clicks\nHello,2\n", {}, "No URL/path"),
            ("URL\n/a\n", {"column": "Missing"}, "available columns"),
            ("URL,URL\n/a,/b\n", {"column": "URL"}, "duplicated"),
            ("URL,Clicks\n,2\n", {"column": "URL"}, "no nonblank"),
            ("/a\n", {"header": False, "column": -1}, "available columns"),
        ]
        for text, options, message in cases:
            with self.subTest(text=text, options=options):
                with self.assertRaisesRegex(ValueError, message):
                    self.read(text, **options)

    def test_malformed_csv_is_rejected(self):
        for text in ['URL,Clicks\n/a\n', 'URL\n"unterminated\n']:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    self.read(text)

    def test_option_type_errors(self):
        for options in [{"header": "no"}, {"column": 0}, {"header": False, "column": "URL"}]:
            with self.subTest(options=options):
                with self.assertRaises(TypeError):
                    self.read("URL\n/a\n", **options)

    def test_missing_file_error_propagates(self):
        with self.assertRaises(FileNotFoundError):
            read_urls_csv(self.path)

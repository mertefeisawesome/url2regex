"""CSV input adapter, separate from regex generation."""

from os import PathLike
import csv
from urllib.parse import urlsplit


def _looks_like_location(value: str, *, named_column: bool) -> bool:
    """Recognize absolute URLs and paths conservatively, without changing them."""
    candidate = value.strip()
    if not candidate:
        return False
    if candidate.startswith("/"):
        return True
    if "://" in candidate:
        try:
            parsed = urlsplit(candidate)
            return bool(parsed.scheme and parsed.netloc)
        except ValueError:
            return False
    # Relative paths are ambiguous; require an indicative header as well.
    return named_column and "/" in candidate and not any(c.isspace() for c in candidate)


def read_urls_csv(
    file: str | PathLike[str],
    *,
    column: str | int | None = None,
    header: bool = True,
) -> list[str]:
    """Read URL/path values from an explicit or automatically detected column.

    Read a comma-delimited UTF-8 file (with optional BOM). With headers, select
    by exact column name; with ``header=False``, select by zero-based index.
    Omitting ``column`` detects columns whose nonblank values all resemble URLs
    or paths. Indicative headers also allow relative paths containing slashes.

    Empty and whitespace-only cells are skipped. Other values are returned
    unchanged, including surrounding whitespace. Malformed/empty CSVs, missing
    columns, and ambiguous detection raise ValueError. File errors propagate.
    """
    if not isinstance(header, bool):
        raise TypeError("header must be a bool")
    if column is not None:
        if header and not isinstance(column, str):
            raise TypeError("column must be a name when header=True")
        if not header and (not isinstance(column, int) or isinstance(column, bool)):
            raise TypeError("column must be a zero-based index when header=False")

    try:
        with open(file, encoding="utf-8-sig", newline="") as stream:
            rows = [row for row in csv.reader(stream, strict=True) if row]
    except csv.Error as error:
        raise ValueError(f"Malformed CSV: {error}") from error
    if not rows:
        raise ValueError("CSV file is empty")

    width = len(rows[0])
    names = rows[0] if header else list(range(width))
    data = rows[1:] if header else rows
    for number, row in enumerate(data, start=2 if header else 1):
        if len(row) != width:
            raise ValueError(f"CSV record {number} has {len(row)} columns; expected {width}")
    if column is not None:
        matches = [index for index, name in enumerate(names) if name == column]
        if len(matches) != 1:
            raise ValueError(f"Column {column!r} is missing or duplicated; available columns: {names!r}")
        selected = matches[0]
    else:
        candidates = []
        for index, name in enumerate(names):
            cells = [row[index] for row in data if row[index].strip()]
            normalized = "".join(c for c in str(name).casefold() if c.isalnum())
            named = normalized in {
                "url", "urls", "uri", "uris", "page", "pages", "path", "paths",
                "landingpage", "landingpageurl", "pageurl", "pagepath", "pagelocation",
            }
            if cells and all(_looks_like_location(cell, named_column=named) for cell in cells):
                candidates.append(index)
        if not candidates:
            raise ValueError(f"No URL/path column detected; specify column. Available columns: {names!r}")
        if len(candidates) > 1:
            labels = [names[index] for index in candidates]
            raise ValueError(f"Ambiguous URL/path columns: {labels!r}; specify column")
        selected = candidates[0]

    values = [row[selected] for row in data if row[selected].strip()]
    if not values:
        raise ValueError("Selected column contains no nonblank values")
    return values

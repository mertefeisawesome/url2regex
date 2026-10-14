"""CSV input adapter, separate from regex generation."""

from os import PathLike


def read_urls_csv(file: str | PathLike[str], *, column: str | None = None) -> list[str]:
    """Read URL/path values from an explicit or automatically detected column.

    Detection and CSV parsing will be implemented in milestone 2.
    """
    raise NotImplementedError("CSV loading is planned for milestone 2")

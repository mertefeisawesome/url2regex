"""Validation entry point; report shape and engine remain to be agreed."""


def validate_regex(
    pattern: str, *, positives: list[str], negatives: list[str] | None = None
):
    """Check positive coverage and optional negatives.

    The report will identify missed positives, matched negatives, and syntax
    errors. Validation will be implemented in milestone 2.
    """
    raise NotImplementedError("Regex validation is planned for milestone 2")

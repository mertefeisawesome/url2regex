"""Validate supplied examples using Python's whole-string matching."""

from dataclasses import dataclass
import re


@dataclass
class ValidationReport:
    """Results for supplied examples, not proof about all possible strings.

    On syntax failure, example checks are not run and both result lists are
    empty. Check ``syntax_error`` before interpreting those lists.
    """

    missed_positives: list[str]
    matched_negatives: list[str]
    syntax_error: str | None = None

    @property
    def passed(self) -> bool:
        """Whether compilation and every supplied example check succeeded."""
        return (
            self.syntax_error is None
            and not self.missed_positives
            and not self.matched_negatives
        )


def _check_examples(values: list[str], name: str) -> None:
    if not isinstance(values, list):
        raise TypeError(f"{name} must be a list of strings")
    for index, value in enumerate(values):
        if not isinstance(value, str):
            raise TypeError(f"{name}[{index}] must be a string")


def validate_regex(
    pattern: str, *, positives: list[str], negatives: list[str] | None = None
) -> ValidationReport:
    """Check positive coverage and optional negatives.

    Accept plain regex text, not Python source-literal text. Compile once and
    use ``fullmatch`` for each example. Syntax errors are returned in the report;
    invalid argument types raise TypeError. Empty example lists are allowed, as
    are empty strings and whitespace, which may be useful negative examples.
    Inputs are not transformed or modified. Only Python engine behavior is
    checked; no RE2 or JavaScript compatibility is implied.
    """
    if not isinstance(pattern, str):
        raise TypeError("pattern must be a string")
    _check_examples(positives, "positives")
    if negatives is None:
        negatives = []
    _check_examples(negatives, "negatives")
    try:
        compiled = re.compile(pattern)
    except re.error as error:
        return ValidationReport([], [], syntax_error=str(error))
    return ValidationReport(
        missed_positives=[value for value in positives if compiled.fullmatch(value) is None],
        matched_negatives=[value for value in negatives if compiled.fullmatch(value) is not None],
    )

"""Input contract and entry point for pattern generation."""


def _prepare_values(values: list[str]) -> list[str]:
    """Validate strings and deduplicate without modifying the caller's list."""
    if not isinstance(values, list):
        raise TypeError("values must be a list of strings")
    if not values:
        raise ValueError("values must contain at least one string")

    unique = []
    seen = set()
    for index, value in enumerate(values):
        if not isinstance(value, str):
            raise TypeError(f"values[{index}] must be a string")
        if not value:
            raise ValueError(f"values[{index}] must not be empty")
        if value != value.strip():
            raise ValueError(f"values[{index}] must not have surrounding whitespace")
        if value not in seen:
            seen.add(value)
            unique.append(value)
    return unique


def urls_to_regex(
    values: list[str], *, target: str = "input", output: str = "pattern"
) -> str:
    """Generate a pattern for literal URLs or paths.

    The default target preserves each input string. ``target="path"`` will
    explicitly extract paths from full URLs. ``output="python_literal"`` will
    format the result as Python source rather than plain regex text.

    Raises TypeError for non-list input or non-string entries, and ValueError
    for empty input, empty strings, surrounding whitespace, or unknown options.
    Pattern generation is not implemented in this initial scaffold.
    """
    if target not in ("input", "path"):
        raise ValueError("target must be 'input' or 'path'")
    if output not in ("pattern", "python_literal"):
        raise ValueError("output must be 'pattern' or 'python_literal'")
    _prepare_values(values)
    raise NotImplementedError("Pattern generation is the next implementation step")

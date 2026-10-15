"""Generate literal patterns by factoring shared character prefixes."""

from urllib.parse import urlsplit


def _extract_path(value: str) -> str:
    """Drop URL origins, queries, and fragments without decoding path text."""
    if not value.startswith("/") and "://" in value:
        try:
            parsed = urlsplit(value)
        except ValueError as error:
            raise ValueError("Cannot extract path from malformed URL") from error
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Path extraction requires a URL with a scheme and host")
        return parsed.path or "/"
    # Existing paths can contain colons, repeated slashes, and semicolons.
    # Splitting directly avoids interpreting them as a scheme or authority.
    return value.split("#", 1)[0].split("?", 1)[0] or "/"


def _escape(value: str) -> str:
    """Escape regex syntax, without adding source-code slash delimiters."""
    special = frozenset(r"\.^$*+?{}[]()|")
    controls = {"\n": r"\n", "\r": r"\r", "\t": r"\t"}
    return "".join(
        controls.get(char, "\\" + char if char in special else char)
        for char in value
    )


def _build_pattern(values: list[str]) -> str:
    """Render a prefix tree iteratively so long URLs do not exhaust recursion."""
    root = {}
    for value in sorted(values):
        node = root
        for char in value:
            node = node.setdefault(char, {})
        node[None] = None  # This input ends here; descendants may still exist.

    rendered = {}
    stack = [(root, False)]
    while stack:
        node, visited = stack.pop()
        children = [(char, child) for char, child in node.items() if char is not None]
        if not visited:
            stack.append((node, True))
            stack.extend((child, False) for _, child in children)
            continue
        alternatives = [_escape(char) + rendered[id(child)] for char, child in children]
        if not alternatives:
            body = ""
        elif len(alternatives) == 1:
            body = alternatives[0]
        else:
            body = "(?:" + "|".join(alternatives) + ")"
        if None in node and body:
            body = "(?:" + body + ")?"
        rendered[id(node)] = body
    return "^" + rendered[id(root)] + "$"


def _python_literal(pattern: str) -> str:
    """Prefer a raw literal; fall back to repr for awkward quotes/controls."""
    for quote in ('"', "'"):
        if quote not in pattern and all(ord(char) >= 32 for char in pattern):
            return "r" + quote + pattern + quote
    return repr(pattern)


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

    The default target preserves each input string. ``target="path"`` extracts
    paths from full URLs or accepts existing paths, dropping queries and
    fragments. URLs with no path become ``/``; trailing slashes and encoded
    characters are preserved. ``output="python_literal"`` will
    format the result as Python source rather than plain regex text.

    Raises TypeError for non-list input or non-string entries, and ValueError
    for empty input, empty strings, surrounding whitespace, or unknown options.
    Patterns use start/end anchors and a shared subset of Python, JavaScript,
    and RE2 syntax. Use Python ``re.fullmatch`` for strict whole-string checks;
    Python's ``$`` can also match before a final newline when using search.
    """
    if target not in ("input", "path"):
        raise ValueError("target must be 'input' or 'path'")
    if output not in ("pattern", "python_literal"):
        raise ValueError("output must be 'pattern' or 'python_literal'")
    prepared = _prepare_values(values)
    if target == "path":
        prepared = list(dict.fromkeys(_extract_path(value) for value in prepared))
    pattern = _build_pattern(prepared)
    return _python_literal(pattern) if output == "python_literal" else pattern

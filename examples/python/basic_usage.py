"""Generate a pattern, use it in Python, and format it as Python source."""

import re

from url2regex import urls_to_regex


def main():
    paths = ["/products/shoes", "/products/hats", "/about"]
    pattern = urls_to_regex(paths)
    print("Pattern:", pattern)
    print("Listed path matches:", re.fullmatch(pattern, "/products/shoes") is not None)
    print("Unlisted path matches:", re.fullmatch(pattern, "/products/bags") is not None)

    # Source text for pasting into Python code, rather than a pattern to compile.
    print("Python literal:", urls_to_regex(paths, output="python_literal"))


if __name__ == "__main__":
    main()

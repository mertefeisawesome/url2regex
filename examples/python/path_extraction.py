"""Compare exact full-URL matching with explicit path-only matching."""

import re

from url2regex import urls_to_regex


def main():
    urls = [
        "https://example.com/products/shoes?color=red#details",
        "https://example.com/blog/",
        "https://example.com",
    ]
    full_pattern = urls_to_regex(urls)
    path_pattern = urls_to_regex(urls, target="path")
    print("Full-URL pattern:", full_pattern)
    print("Path-only pattern:", path_pattern)

    # Path extraction drops queries/fragments, preserves trailing slashes,
    # and converts a URL with no path to '/'.
    for path in ["/products/shoes", "/blog/", "/"]:
        print(path, "matches:", re.fullmatch(path_pattern, path) is not None)
    print("Missing trailing slash matches:", re.fullmatch(path_pattern, "/blog") is not None)


if __name__ == "__main__":
    main()

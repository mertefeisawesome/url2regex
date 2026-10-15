"""Read the shared sample CSV using automatic and explicit column selection."""

from pathlib import Path

from url2regex import read_urls_csv, urls_to_regex


def main():
    # Resolve relative to this script, so any working directory works.
    csv_file = Path(__file__).resolve().parents[1] / "urls.csv"
    urls = read_urls_csv(csv_file)
    explicitly_selected = read_urls_csv(csv_file, column="URL")
    print("URLs loaded:", len(urls))
    print("Automatic and manual selection agree:", urls == explicitly_selected)
    print("Pattern:", urls_to_regex(urls))

    # For a headerless file, select a column by zero-based index:
    # urls = read_urls_csv("headerless.csv", header=False, column=0)


if __name__ == "__main__":
    main()

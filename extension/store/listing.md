# Chrome Web Store listing draft

Name: url2regex

Short description:
Turn a list of URLs or paths into a compact regular expression.

Category: Developer Tools

Language: English

## Detailed description

Turn a list of URLs or paths into a compact regular expression, right from your
browser toolbar.

Paste one URL or path per line, or import a CSV. Choose whether to extract
paths only, select Generate regex, then Copy pattern to use it in your workflow.

Features:
- Group shared prefixes to reduce repetition.
- Escape literal regex characters, including forward slashes, automatically.
- Import CSV files with automatic header and URL/path column detection.
- Copy generated patterns with one click.
- Follow your light or dark theme.
- Preserve full input strings by default, including queries and fragments.
- Optionally extract paths, dropping origins, queries, and fragments.
- Process everything locally, without an account or server connection.

Regex validation reports are not included in the popup. For CSV import, use
a single URL/path column if automatic detection reports ambiguity. Check
case-sensitivity, matching mode, and length limits in
the tool where you use the generated pattern.

Open source under the MIT license:
https://github.com/mertefeisawesome/url2regex

## Privacy form

Single purpose: Convert user-pasted or CSV-imported URL or path lists into compact regular
expressions, optionally extracting paths.

Permissions: None requested.

Remote code: No; all JavaScript is included in the ZIP.

Data collection: The extension does not collect or transmit user data. Entered
URLs are processed locally in the popup, without persistence or analytics.

Privacy policy URL (must be publicly accessible before submission):
https://github.com/mertefeisawesome/url2regex/blob/main/extension/PRIVACY.md

Support URL:
https://github.com/mertefeisawesome/url2regex/issues

## Reviewer test instructions

No account or login is needed. Open the toolbar popup and paste:

```text
https://example.com/a
https://example.com/a/b
```

Generate a regex. Enable Extract paths only and generate again; the output
should be `^\/a(?:\/b)?$`. Select Copy pattern to copy it. No active page access
or special permissions are required.

## Upload materials

- ZIP: run `python3 extension/package.py` from the repository root.
- Icon: `extension/icons/icon128.png`.
- Small promotional tile: `extension/store/promo440.png`.
- Screenshots: `extension/store/screenshot-full-urls.png` and
  `extension/store/screenshot-paths.png` (1280x800). Each shows the actual built
  popup rendered in Chrome with synthetic input, surrounded by explanatory
  presentation text and the shared project logo. The screenshots show light and
  dark themes.

Full-URL generation, path extraction, and error handling passed browser checks
against the built popup page. Before submission, load `extension/dist` unpacked and verify the actual popup,
path toggle, headered and headerless CSV import, error handling, and copying. Commit and push the privacy policy
so its public URL resolves. Check the listing fields against the final package.

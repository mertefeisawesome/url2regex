# Chrome Web Store listing draft

Name: url2regex

Short description:
Turn a list of URLs or paths into a compact regular expression.

Category: Developer Tools

Language: English

## Detailed description

Turn a list of URLs or paths into a compact regular expression, right from your
browser toolbar.

Paste one URL or path per line, choose whether to extract paths only, and select
Generate regex. Select and copy the resulting pattern into your workflow.

Features:
- Group shared prefixes to reduce repetition.
- Escape literal regex characters automatically.
- Preserve full input strings by default, including queries and fragments.
- Optionally extract paths, dropping origins, queries, and fragments.
- Process everything locally, without an account or server connection.

CSV import and regex validation reports are not included in this initial
extension release. Check case-sensitivity, matching mode, and length limits in
the tool where you use the generated pattern.

Open source under the MIT license:
https://github.com/mertefeisawesome/url2regex

## Privacy form

Single purpose: Convert user-pasted URL or path lists into compact regular
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
should be `^/a(?:/b)?$`. Select the output text to copy it. No active page access
or special permissions are required.

## Upload materials

- ZIP: run `python3 extension/package.py` from the repository root.
- Icon: `extension/icons/icon128.png`.
- Small promotional tile: `extension/store/promo440.png`.
- Screenshots: `extension/store/screenshot-full-urls.png` and
  `extension/store/screenshot-paths.png` (1280x800). Each shows the actual built
  popup rendered in Chrome with synthetic input, surrounded by explanatory
  presentation text. No logo is included, so a separate logo can be supplied.

Full-URL generation, path extraction, and error handling passed browser checks
against the built popup page. Before submission, load `extension/dist` unpacked and verify the actual popup,
path toggle, error handling, and manual copy. Commit and push the privacy policy
so its public URL resolves. Check the listing fields against the final package.

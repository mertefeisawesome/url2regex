# Chrome extension

A Manifest V3 popup uses the same generator and CSV parser as the npm package.
Paste one URL or path per line, or import a CSV with automatic header and column
detection. Optionally extract paths, generate a pattern, and select **Copy pattern**.
Slashes are escaped by default. The popup follows your light or dark theme.
Input is processed locally; no permissions,
storage, analytics, network requests, or external scripts are used.

Build from the repository root:

```sh
node extension/build.mjs
```

In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load
unpacked**, and select `extension/dist`. Open the toolbar popup to try it.

Create the Chrome Web Store upload ZIP with `python3 extension/package.py`.
Store copy, privacy form answers, and reviewer instructions are in
[store/listing.md](store/listing.md); the privacy policy is in
[PRIVACY.md](PRIVACY.md). Test the unpacked popup in Chrome before submission.
Uploading a draft establishes an extension ID, not an exclusive display name.

Run the built-popup checks with `node extension/check-package.mjs` after building.
They cover escaped slashes, path extraction, headered and headerless CSV import,
copying, stale-result clearing, and error handling. If automatic CSV column
selection is ambiguous, use a single URL/path column. CSV values must each fit
on one line. Closing the popup clears its contents.

Branding uses the shared `assets/branding/logo-transparent-light.png` wordmark
and `assets/branding/extension-icon.png` emblem. Store screenshots show the
built popup in light and dark themes with synthetic example URLs.

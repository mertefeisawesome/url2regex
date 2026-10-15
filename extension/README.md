# Chrome extension

A minimal Manifest V3 popup uses the same generator as the npm package. Paste
one URL or path per line, optionally extract paths, and generate a pattern.
Select the output to copy it. Input is processed locally; no permissions,
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

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

This is a local prototype, not a submitted store release. It still needs manual
Chrome testing, store assets, and listing preparation. Uploading a draft can
establish an extension ID but does not reserve an exclusive display name.

# url2regex

Compact regex generation from URL or path lists, for Node.js and browsers.
This minimal ESM prerelease ships JavaScript with TypeScript declarations and
no dependencies or build step. CSV loading and validation reports are not yet
part of the JavaScript API.

```sh
npm install url2regex@alpha
```

```js
import { urlsToRegex } from "url2regex";

const pattern = urlsToRegex(["/a", "/a/b"]);
const regex = new RegExp(pattern);
console.log(regex.test("/a/b")); // true
console.log(regex.test("/ab")); // false

const paths = urlsToRegex(["https://example.com/a?q=1"], { target: "path" });
```

Default mode preserves literal inputs, including queries, fragments, and trailing
slashes. Path mode drops origins, queries and fragments, with `/` for URLs with
no path. Inputs must be a nonempty array of nonempty strings without surrounding
whitespace. Duplicates are removed without changing the array. Type errors throw
`TypeError`; empty/whitespace input throws `RangeError`.

Patterns use `^`/`$` anchors; JavaScript `$` can also match before a final line
terminator. For strict checks, ensure the match covers the entire input. Flags
can change behavior. Grouping does not guarantee the shortest possible pattern.

Development: run `npm test` from this directory. Tests use the shared real-world
fixtures. `npm pack` tests and packages the distribution for inspection.
Publish deliberately with `npm publish --tag alpha`; the configured default tag
is also `alpha`. This does not claim exclusive use of a Chrome extension name.

MIT license. [Source](https://github.com/mertefeisawesome/url2regex).

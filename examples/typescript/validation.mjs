// Run from the repository root: node examples/typescript/validation.mjs
// Installed consumers import from "url2regex".
import { urlsToRegex, validateRegex } from "../../typescript/src/index.js";

const paths = ["/products/shoes", "/products/hats"];
const report = validateRegex(urlsToRegex(paths), {
  positives: paths,
  negatives: ["/products/bags"],
});
console.log("Generated pattern passes:", report.passed);

const failed = validateRegex("/products/(shoes|bags)", {
  positives: paths,
  negatives: ["/products/bags"],
});
console.log("Missed positives:", failed.missedPositives);
console.log("Matched negatives:", failed.matchedNegatives);

const invalid = validateRegex("[", { positives: paths });
console.log("Syntax error:", invalid.syntaxError);

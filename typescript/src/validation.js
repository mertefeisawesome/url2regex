/**
 * Check supplied examples using strict whole-string JavaScript matching.
 * This does not establish RE2/Python compatibility or exclude every other input.
 */
export function validateRegex(pattern, options) {
  if (typeof pattern !== "string") throw new TypeError("pattern must be a string");
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must contain a positives array");
  }
  const { positives, negatives = [] } = options;
  checkExamples(positives, "positives");
  checkExamples(negatives, "negatives");

  let compiled;
  try {
    // Compile independently first so wrapping cannot accidentally repair syntax.
    new RegExp(pattern);
    // The noncapturing wrapper lets alternatives/lazy quantifiers backtrack to
    // a full match; merely checking the first exec() result would miss those.
    // No flags are applied. The final assertion requires absolute end of input.
    compiled = new RegExp(`^(?:${pattern})(?![\\s\\S])`);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { passed: false, missedPositives: [], matchedNegatives: [], syntaxError: error.message };
  }

  const missedPositives = positives.filter(value => !compiled.test(value));
  const matchedNegatives = negatives.filter(value => compiled.test(value));
  return {
    passed: missedPositives.length === 0 && matchedNegatives.length === 0,
    missedPositives,
    matchedNegatives,
    syntaxError: null,
  };
}

function checkExamples(values, name) {
  if (!Array.isArray(values)) throw new TypeError(`${name} must be an array of strings`);
  for (let index = 0; index < values.length; index++) {
    if (typeof values[index] !== "string") throw new TypeError(`${name}[${index}] must be a string`);
  }
}

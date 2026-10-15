export interface RegexOptions {
  /** Preserve the input, or extract paths and drop origins, queries and fragments. */
  target?: "input" | "path";
}
/** Return anchored regex text, without slash delimiters. Throws on invalid input. */
export function urlsToRegex(values: string[], options?: RegexOptions): string;

export interface ValidationOptions {
  positives: string[];
  negatives?: string[];
}

export interface ValidationReport {
  passed: boolean;
  missedPositives: string[];
  matchedNegatives: string[];
  /** Non-null on syntax failure; example checks are skipped in that case. */
  syntaxError: string | null;
}

/** Validate plain pattern text using whole-string matching without flags.
 * Syntax errors return a failed report; invalid argument types throw TypeError.
 */
export function validateRegex(pattern: string, options: ValidationOptions): ValidationReport;

export type CsvOptions =
  | { header?: true; column?: string | null }
  | { header: false; column?: number | null };

/** Parse comma-delimited CSV text. Detect the URL/path column unless selected.
 * Supports UTF-8 BOMs, quoted fields, and embedded newlines. Skips blank cells;
 * preserves other values. TypeError for invalid arguments; RangeError for bad CSV
 * or ambiguous/missing columns. No filesystem or Node APIs are imported.
 */
export function parseUrlsCsv(text: string, options?: CsvOptions): string[];

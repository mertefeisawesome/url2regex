import {
  urlsToRegex, parseUrlsCsv, validateRegex,
  type CsvOptions, type RegexOptions, type ValidationReport,
} from "url2regex";
import { readUrlsCsv } from "url2regex/node";

const regexOptions: RegexOptions = { target: "path" };
const csvOptions: CsvOptions = { header: false, column: 0 };
const values: string[] = parseUrlsCsv("URL\n/a\n");
const pattern: string = urlsToRegex(values, regexOptions);
const report: ValidationReport = validateRegex(pattern, { positives: values, negatives: ["/b"] });
const passed: boolean = report.passed;
const error: string | null = report.syntaxError;
const missed: string[] = report.missedPositives;
const pending: Promise<string[]> = readUrlsCsv(new URL("file:///pages.csv"), csvOptions);

// These assertions fail if declaration resolution degrades to `any`.
// @ts-expect-error Values must be strings.
urlsToRegex([123]);
// @ts-expect-error Target must be a known representation.
urlsToRegex(values, { target: "guess" });
// @ts-expect-error Headered CSV columns are selected by name.
parseUrlsCsv("URL\n/a\n", { column: 0 });
// @ts-expect-error Headerless CSV columns are selected by index.
readUrlsCsv("pages.csv", { header: false, column: "URL" });
// @ts-expect-error Positives are required.
validateRegex(pattern, { negatives: [] });
// @ts-expect-error The reader is asynchronous.
const immediate: string[] = readUrlsCsv("pages.csv");

void [passed, error, missed, pending, immediate];

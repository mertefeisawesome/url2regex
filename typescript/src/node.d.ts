import type { CsvOptions } from "./index.js";

/** Read UTF-8 CSV from a filesystem path or file URL. File errors propagate. */
export function readUrlsCsv(file: string | URL, options?: CsvOptions): Promise<string[]>;

export interface RegexOptions {
  /** Preserve the input, or extract paths and drop origins, queries and fragments. */
  target?: "input" | "path";
}
/** Return anchored regex text, without slash delimiters. Throws on invalid input. */
export function urlsToRegex(values: string[], options?: RegexOptions): string;

/**
 * Represents a custom error specific to flag-related operations within the application.
 * Extends the built-in `Error` class and sets the error name to `"FlagsError"`.
 *
 * @example
 * ```typescript
 * throw new FlagsError("Invalid flag value");
 * ```
 */
export class FlagsError extends Error {
  name = "FlagsError";
}

import { FlagsParseError } from "./FlagsParseError.js";

const formatValue = (value: unknown): string => {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

/**
 * Thrown when a value is rejected by a `.validate()` refiner.
 */
export class ValidationError extends FlagsParseError {
  constructor(
    /** Human readable name of the flag, command or argument being validated */
    public target: string,
    /** The value rejected by the validation function */
    public value: unknown,
    message?: string,
  ) {
    super(message ?? `Invalid value for ${target}: ${formatValue(value)}`);
    this.name = "ValidationError";
  }
}

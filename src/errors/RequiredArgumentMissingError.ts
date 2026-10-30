import { FlagsParseError } from "./FlagsParseError.js";

export class RequiredArgumentMissingError extends FlagsParseError {
  constructor(public argumentName?: string) {
    super(
      argumentName
        ? `Required argument missing: ${argumentName}`
        : `Required argument missing`,
    );
    this.name = "RequiredArgumentMissingError";
  }
}

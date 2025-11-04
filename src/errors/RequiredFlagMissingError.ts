import { FlagsParseError } from "./FlagsParseError.js";

export class RequiredFlagMissingError extends FlagsParseError {
  constructor(public flagName: string) {
    super(`Required flag missing: ${flagName}`);
    this.name = "RequiredFlagMissingError";
  }
}

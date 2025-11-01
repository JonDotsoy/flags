import { FlagsParseError } from "./FlagsParseError.js";

export class RequiredArgumentMissingError extends FlagsParseError {
  constructor() {
    super(`Required argument missing`);
    this.name = "RequiredArgumentMissingError";
  }
}

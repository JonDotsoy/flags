import { FlagsParseError } from "./FlagsParseError.js";

export class UnexpectedArgumentError extends FlagsParseError {
  constructor(public argument: string) {
    super(`Unexpected argument: ${argument}`);
    this.name = "UnexpectedArgumentError";
  }
}

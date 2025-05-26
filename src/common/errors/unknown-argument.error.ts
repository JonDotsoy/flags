import { FlagsError } from "./flags.error.js";

/**
 * Error thrown when an unknown argument is encountered while parsing flags.
 *
 * @extends FlagsError
 * @example
 * throw new UnknownArgumentError('--invalidFlag');
 */
export class UnknownArgumentError extends FlagsError {
  name = "UnknownArgumentError";
  constructor(arg: string) {
    super(`Unknown argument: ${arg}`);
  }
}

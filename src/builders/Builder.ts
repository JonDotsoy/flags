import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import {
  validateRefine,
  type ValidateFn,
  type ValidateMessage,
} from "./refiners/validateRefine.js";
import type {
  ParseResultType,
  RedefineInitialValue,
  RedefineParseResult,
  Spec,
} from "./Spec.js";

type BuilderInstance<T extends Spec<any, any>> = { spec: T };

export abstract class Builder<T extends Spec<any, any>> {
  constructor(readonly spec: T) {}

  abstract initial<U>(initial: U): BuilderInstance<RedefineInitialValue<T, U>>;
  abstract accumulate(accumulate: Accumulate): BuilderInstance<T>;
  abstract refine<U>(
    refine: Refine,
  ): BuilderInstance<RedefineParseResult<T, U>>;
  abstract metadata(values: Record<string, any>): BuilderInstance<T>;

  abstract describe(description: string): BuilderInstance<T>;

  abstract required(): BuilderInstance<T>;

  /**
   * Validates the parsed value. When `validateFn` returns `false` the parse
   * fails with a `ValidationError`.
   *
   * @param validateFn - Receives the parsed value and returns `true` when valid
   * @param customMessage - Optional message, or a function returning the
   * message or the `Error` to throw. When omitted a message is generated.
   *
   * @example
   * ```ts
   * flag("--port", "-p")
   *   .number()
   *   .validate((n) => n >= 3_000 && n < 60_000, "The port is not valid");
   * ```
   */
  validate(
    validateFn: ValidateFn<ParseResultType<T>>,
    customMessage?: ValidateMessage<ParseResultType<T>>,
  ): this {
    return this.refine(
      validateRefine(validateFn, customMessage),
    ) as unknown as this;
  }

  parse(startIndex: number, args: string[], prevValue?: { current: any }) {
    return this.spec.parse(startIndex, args, prevValue, this);
  }
}

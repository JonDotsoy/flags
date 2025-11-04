import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import type {
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

  parse(startIndex: number, args: string[], prevValue?: { current: any }) {
    return this.spec.parse(startIndex, args, prevValue, this);
  }
}

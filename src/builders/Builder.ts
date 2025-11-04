import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import type {
  RedefineInitialValue,
  RedefineParseResult,
  Spec,
} from "./Spec.js";

export class Builder<T extends Spec<any, any>> {
  constructor(readonly spec: T) {}

  initial<U>(initial: U) {
    return new Builder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new Builder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new Builder(this.spec.refine(refine) as RedefineParseResult<T, U>);
  }

  metadata(values: Record<string, any>) {
    return new Builder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  parse(startIndex: number, args: string[], prevValue?: { current: any }) {
    return this.spec.parse(startIndex, args, prevValue, this);
  }
}

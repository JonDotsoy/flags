import {
  Spec,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { Builder } from "./Builder.js";

export class StringsArgumentBuilder<
  T extends Spec<any, any>,
> extends Builder<T> {
  initial<U>(initial: U) {
    return new StringsArgumentBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new StringsArgumentBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new StringsArgumentBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new StringsArgumentBuilder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }
}

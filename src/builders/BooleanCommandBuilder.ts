import { Builder } from "./Builder.js";
import {
  Spec,
  type InitialType,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";

export class BooleanCommandBuilder<
  T extends Spec<any, any>,
> extends Builder<T> {
  initial<U>(initial: U) {
    return new BooleanCommandBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new BooleanCommandBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new BooleanCommandBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new BooleanCommandBuilder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }
}

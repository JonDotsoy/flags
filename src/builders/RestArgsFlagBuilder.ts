import { Builder } from "./Builder.js";
import {
  Spec,
  type InitialType,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { transformRefine } from "./refiners/transformRefine.js";

export class RestArgsFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<U>(initial: U) {
    return new RestArgsFlagBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new RestArgsFlagBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new RestArgsFlagBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new RestArgsFlagBuilder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new RestArgsFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }
}

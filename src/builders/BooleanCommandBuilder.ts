import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";

export class BooleanCommandBuilder<
  T extends Spec<any, any>,
> extends Builder<T> {
  initial<T>(initial: T) {
    return new BooleanCommandBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new BooleanCommandBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new BooleanCommandBuilder(this.spec.refine(refine));
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  metadata(values: Record<string, any>) {
    return new BooleanCommandBuilder(this.spec.metadata(values));
  }
}

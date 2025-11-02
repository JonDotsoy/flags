import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { Builder } from "./Builder.js";

export class StringsArgumentBuilder<
  T extends Spec<any, any>,
> extends Builder<T> {
  initial<T>(initial: T) {
    return new StringsArgumentBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new StringsArgumentBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new StringsArgumentBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new StringsArgumentBuilder(this.spec.metadata(values));
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }
}

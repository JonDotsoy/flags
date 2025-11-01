import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { StringsArgumentBuilder } from "./StringsArgumentBuilder.js";
import { toListRefine } from "./refiners/toListRefine.js";
import { listAccumulate } from "./accumulates/listAccumulate.js";
import { NumberArgumentBuilder } from "./NumberArgumentBuilder.js";
import { toNumberRefine } from "./refiners/toNumberRefine.js";

export class ArgumentBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new ArgumentBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new ArgumentBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new ArgumentBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new ArgumentBuilder(this.spec.metadata(values));
  }

  string() {
    return this;
  }

  strings() {
    return new StringsArgumentBuilder(
      this.spec.refine(toListRefine).accumulate(listAccumulate),
    );
  }

  number() {
    return new NumberArgumentBuilder(
      this.spec.initial(null).refine<number>(toNumberRefine),
    );
  }

  static create() {
    return new ArgumentBuilder(Spec.create()).refine((arg, index, args) => {
      return {
        args: args.slice(0, index + 1),
        index: index,
        value: arg,
      };
    });
  }
}

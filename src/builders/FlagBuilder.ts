import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { StringFlagBuilder } from "./StringFlagBuilder.js";
import { stringFlagRefine } from "./refiners/stringFlagRefine.js";
import { NumberFlagBuilder } from "./NumberFlagBuilder.js";
import { numberFlagRefine } from "./refiners/numberFlagRefine.js";

export class FlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new FlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new FlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new FlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new FlagBuilder(this.spec.metadata(values));
  }

  string() {
    return new StringFlagBuilder(this.spec.refine(stringFlagRefine));
  }

  number() {
    return new NumberFlagBuilder(this.spec.refine(numberFlagRefine));
  }

  static create(...aliases: string[]) {
    const spec = Spec.create().metadata({ matches: aliases });
    return new FlagBuilder(spec.refine(flagMatchRefine));
  }
}

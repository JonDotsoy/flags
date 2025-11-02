import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { booleanFlagRefine } from "./refiners/booleanFlagRefine.js";

export class BooleanFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new BooleanFlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new BooleanFlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new BooleanFlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new BooleanFlagBuilder(this.spec.metadata(values));
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  delimiter(delimiter: string) {
    // Get the matches from metadata
    const matches = this.spec.hasMetadata("matches")
      ? this.spec.getMetadata<string[]>("matches")
      : [];

    // Re-create the builder with new delimiter
    const newSpec = Spec.create().metadata({ delimiter, matches });
    const specWithFlag = newSpec.refine(flagMatchRefine);
    return new BooleanFlagBuilder(specWithFlag.refine(booleanFlagRefine));
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new BooleanFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }
}

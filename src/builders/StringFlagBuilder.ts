import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { stringFlagRefine } from "./refiners/stringFlagRefine.js";

export class StringFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new StringFlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new StringFlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new StringFlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new StringFlagBuilder(this.spec.metadata(values));
  }

  delimiter(delimiter: string) {
    // Get the matches from metadata
    const matches = this.spec.hasMetadata("matches")
      ? this.spec.getMetadata<string[]>("matches")
      : [];

    // Re-create the builder with new delimiter
    const newSpec = Spec.create().metadata({ delimiter, matches });
    const specWithFlag = newSpec.refine(flagMatchRefine);
    return new StringFlagBuilder(specWithFlag.refine(stringFlagRefine));
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new StringFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }
}

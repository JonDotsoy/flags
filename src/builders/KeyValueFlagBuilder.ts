import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { keyValueFlagRefine } from "./refiners/keyValueFlagRefine.js";
import { keyValueAccumulate } from "./accumulates/keyValueAccumulate.js";

export class KeyValueFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new KeyValueFlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new KeyValueFlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new KeyValueFlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new KeyValueFlagBuilder(this.spec.metadata(values));
  }

  delimiter(delimiter: string) {
    // Get the matches from metadata
    const matches = this.spec.hasMetadata("matches")
      ? this.spec.getMetadata<string[]>("matches")
      : [];

    // Re-create the builder with new delimiter
    const newSpec = Spec.create().metadata({ delimiter, matches });
    const specWithFlag = newSpec.refine(flagMatchRefine);
    const specWithKeyValue = specWithFlag.refine(keyValueFlagRefine);
    return new KeyValueFlagBuilder(
      specWithKeyValue.accumulate(keyValueAccumulate),
    );
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new KeyValueFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }
}

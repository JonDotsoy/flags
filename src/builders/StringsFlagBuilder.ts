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
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { stringsFlagRefine } from "./refiners/stringsFlagRefine.js";
import { stringsAccumulate } from "./accumulates/stringsAccumulate.js";

export class StringsFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<U>(initial: U) {
    return new StringsFlagBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new StringsFlagBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new StringsFlagBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new StringsFlagBuilder(this.spec.metadata(values) as T);
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
    const specWithStrings = specWithFlag.refine(stringsFlagRefine);
    return new StringsFlagBuilder(
      specWithStrings.accumulate(stringsAccumulate),
    );
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new StringsFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }
}

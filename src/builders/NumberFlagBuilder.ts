import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { numberFlagRefine } from "./refiners/numberFlagRefine.js";
import { notNaNRefine } from "./refiners/notNaNRefine.js";
import { numberMultipleOfRefine } from "./refiners/numberMultipleOfRefine.js";
import { numberNegativeRefine } from "./refiners/numberNegativeRefine.js";
import { numberPositiveRefine } from "./refiners/numberPositiveRefine.js";
import { numberLessThanOrEqualRefine } from "./refiners/numberLessThanOrEqualRefine.js";
import { numberLessThanRefine } from "./refiners/numberLessThanRefine.js";
import { numberGreaterThanOrEqualRefine } from "./refiners/numberGreaterThanOrEqualRefine.js";
import { numberGreaterThanRefine } from "./refiners/numberGreaterThanRefine.js";

export class NumberFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new NumberFlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new NumberFlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new NumberFlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new NumberFlagBuilder(this.spec.metadata(values));
  }

  delimiter(delimiter: string) {
    // Get the matches from metadata
    const matches =
      this.spec.getMetadata<string[] | undefined>("matches") ?? [];

    // Re-create the builder with new delimiter
    const newSpec = Spec.create().metadata({ delimiter, matches });
    const specWithFlag = newSpec.refine(flagMatchRefine);
    return new NumberFlagBuilder(specWithFlag.refine(numberFlagRefine));
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new NumberFlagBuilder(
      this.spec.refine<T>(transformRefine(transform)),
    );
  }

  default(value: number) {
    return new NumberFlagBuilder(this.spec.initial(value));
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  notNaN = () => new NumberFlagBuilder(this.spec.refine(notNaNRefine));

  gt = (greaterThan: number) => this.greaterThan(greaterThan);
  gte = (greaterThanOrEqual: number) =>
    this.greaterThanOrEqual(greaterThanOrEqual);
  lt = (lessThan: number) => this.lessThan(lessThan);
  lte = (lessThanOrEqual: number) => this.lessThanOrEqual(lessThanOrEqual);

  greaterThan = (greaterThan: number) =>
    this.refine(numberGreaterThanRefine(greaterThan));
  greaterThanOrEqual = (greaterThanOrEqual: number) =>
    this.refine(numberGreaterThanOrEqualRefine(greaterThanOrEqual));
  lessThan = (lessThan: number) => this.refine(numberLessThanRefine(lessThan));
  lessThanOrEqual = (lessThanOrEqual: number) =>
    this.refine(numberLessThanOrEqualRefine(lessThanOrEqual));
  positive = () => this.refine(numberPositiveRefine);
  negative = () => this.refine(numberNegativeRefine);
  multipleOf = (multipleOf: number) =>
    this.refine(numberMultipleOfRefine(multipleOf));
}

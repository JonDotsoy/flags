import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { notNaNRefine } from "./refiners/notNaNRefine.js";
import { numberGreaterThanRefine } from "./refiners/numberGreaterThanRefine.js";
import { numberGreaterThanOrEqualRefine } from "./refiners/numberGreaterThanOrEqualRefine.js";
import { numberLessThanRefine } from "./refiners/numberLessThanRefine.js";
import { numberLessThanOrEqualRefine } from "./refiners/numberLessThanOrEqualRefine.js";
import { numberMultipleOfRefine } from "./refiners/numberMultipleOfRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { listAccumulate } from "./accumulates/listAccumulate.js";

// Forward declare for circular dependency resolution
let ListFlagBuilder: any;

/**
 * NumberFlagBuilder - Specialized builder for numeric flags
 * 
 * Features:
 * - Automatic number conversion
 * - Validation methods (gt, gte, lt, lte, multipleOf)
 * - Support for negative numbers
 * - Can be chained with .list() to create number[]
 */
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

  /**
   * Validate that the value is not NaN
   */
  notNaN() {
    return new NumberFlagBuilder(this.spec.refine(notNaNRefine));
  }

  /**
   * Validate that the number is greater than the given value
   */
  gt(greaterThan: number) {
    return this.refine(numberGreaterThanRefine(greaterThan));
  }

  /**
   * Validate that the number is greater than or equal to the given value
   */
  gte(greaterThanOrEqual: number) {
    return this.refine(numberGreaterThanOrEqualRefine(greaterThanOrEqual));
  }

  /**
   * Validate that the number is less than the given value
   */
  lt(lessThan: number) {
    return this.refine(numberLessThanRefine(lessThan));
  }

  /**
   * Validate that the number is less than or equal to the given value
   */
  lte(lessThanOrEqual: number) {
    return this.refine(numberLessThanOrEqualRefine(lessThanOrEqual));
  }

  /**
   * Validate that the number is a multiple of the given value
   */
  multipleOf(multipleOf: number) {
    return this.refine(numberMultipleOfRefine(multipleOf));
  }

  /**
   * Apply a regex match refiner
   */
  match(regex: RegExp, message?: string) {
    return this.refine((arg, index, args, context) => {
      if (!context) return null;
      const value = String(context.value);
      if (regex.test(value)) {
        return context;
      }
      return null;
    });
  }

  /**
   * Apply a transformation function
   */
  transform<U>(transformFn: (value: number) => U) {
    return new NumberFlagBuilder(this.spec.refine(transformRefine(transformFn)));
  }

  /**
   * Convert to list of numbers
   * This allows chaining like: .number().list() → number[]
   */
  list(separator: string = ","): any {
    return this.toList(separator);
  }

  toList(separator: string = ","): any {
    if (!ListFlagBuilder) {
      ListFlagBuilder = require("./ListFlagBuilder.js").ListFlagBuilder;
    }
    return new ListFlagBuilder(
      this.spec
        .refine(transformRefine((value: any) => {
          // If already an array, return as-is
          if (Array.isArray(value)) return value;
          // Wrap single number in array
          return [value];
        }))
        .accumulate(listAccumulate)
    );
  }
}

import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { NumberFlagBuilder } from "./NumberFlagBuilder.js";
import { toNumberRefine } from "./refiners/toNumberRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";

/**
 * ListFlagBuilder - Specialized builder for list/array flags
 * 
 * Features:
 * - Splits comma-separated values (or custom separator)
 * - Accumulates repeated flags
 * - Can be chained with .number() to convert each element to number
 */
export class ListFlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new ListFlagBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new ListFlagBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new ListFlagBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new ListFlagBuilder(this.spec.metadata(values));
  }

  /**
   * Apply a regex match refiner to each element
   */
  match(regex: RegExp, message?: string) {
    return this.refine((arg, index, args, context) => {
      if (!context) return null;
      const value = context.value;
      if (Array.isArray(value)) {
        const allMatch = value.every((item) => regex.test(String(item)));
        if (allMatch) return context;
      }
      return null;
    });
  }

  /**
   * Apply a transformation function to each element
   */
  transform<U>(transformFn: (value: any) => U) {
    return new ListFlagBuilder(
      this.spec.refine(transformRefine((value: any[]) => {
        if (Array.isArray(value)) {
          return value.map(transformFn);
        }
        return value;
      }))
    );
  }

  /**
   * Convert each element in the list to a number
   * This allows chaining like: .list().number() → number[]
   */
  number() {
    return this.toNumber();
  }

  toNumber() {
    return new NumberFlagBuilder(
      this.spec.refine(transformRefine((value: any) => {
        if (Array.isArray(value)) {
          return value.map((item) => Number(item));
        }
        return Number(value);
      }))
    );
  }
}

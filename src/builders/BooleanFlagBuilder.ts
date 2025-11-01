import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";

/**
 * BooleanFlagBuilder - Specialized builder for boolean flags
 * 
 * Behavior:
 * - Flag presence → true
 * - No flag → false (via initial value)
 */
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
}

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

  /**
   * Transforms the argument value using a custom function.
   */
  transform<U>(transform: (value: any, index: number, args: string[]) => U) {
    return new ArgumentBuilder(
      this.spec.refine<U>((arg, index, args, context) => {
        if (!context) return null;
        return {
          ...context,
          value: transform(context.value, index, args),
        };
      })
    );
  }

  /**
   * Matches the argument value against a regular expression.
   * Returns the match groups if available, otherwise the full match.
   */
  match(pattern: RegExp) {
    return new ArgumentBuilder(
      this.spec.refine((arg, index, args, context) => {
        if (!context) return null;
        const match = String(context.value).match(pattern);
        if (!match) return null;
        return {
          ...context,
          value: match.groups || match[0],
        };
      })
    );
  }

  /**
   * Adds a description for this argument (used in help messages).
   */
  describe(description: string) {
    return new ArgumentBuilder(this.spec.metadata({ description }));
  }

  /**
   * Marks this argument as required.
   */
  required() {
    return new ArgumentBuilder(this.spec.metadata({ isRequired: true }));
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

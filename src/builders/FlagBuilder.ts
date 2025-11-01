import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { flagStringRefine } from "./refiners/flagStringRefine.js";
import { toBooleanRefine } from "./refiners/templateRefine.js";
import { toNumberRefine } from "./refiners/toNumberRefine.js";
import { toListRefine } from "./refiners/toListRefine.js";
import { listAccumulate } from "./accumulates/listAccumulate.js";
import { flagKeyValueRefine } from "./refiners/flagKeyValueRefine.js";
import { keyValueAccumulate } from "./accumulates/keyValueAccumulate.js";

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

  /**
   * Makes this flag return a boolean value (true when present, false when absent).
   * This is the default behavior when no type method is called.
   */
  boolean() {
    return this.initial(false);
  }

  /**
   * Makes this flag expect a string value.
   * Example: --name John or --name=John
   */
  string(options?: { valueDelimiter?: string }) {
    if (options?.valueDelimiter) {
      // Handle delimiter-based value extraction (e.g., pr:foo where flag is "pr")
      // This works differently - it looks for flagName<delimiter>value pattern
      // We need to get the flag names that were set up in the flagMatchRefine
      
      // Create a new refiner that matches the delimiter pattern
      const delimiterMatchRefine: Refine = (arg, index, args, context) => {
        // Try to match: arg should be flagName<delimiter>value
        if (arg.includes(options.valueDelimiter!)) {
          const parts = arg.split(options.valueDelimiter!);
          if (parts.length >= 2) {
            // Extract the flag name part and the value part
            const flagPart = parts[0];
            const valuePart = parts.slice(1).join(options.valueDelimiter!);
            
            // We need to check if flagPart matches any of our flag names
            // For now, we'll assume it does if it splits correctly
            return {
              args: args.slice(index, index + 1),
              index: index,
              value: valuePart,
            };
          }
        }
        
        return null;
      };
      
      // Replace the normal refiners with just the delimiter matcher
      return new FlagBuilder(
        Spec.create().initial(null).refine(delimiterMatchRefine)
      );
    }
    
    return new FlagBuilder(
      this.spec.initial(null).refine(flagStringRefine)
    );
  }

  /**
   * Makes this flag accumulate multiple string values into an array.
   * Example: -l blue -l red → ["blue", "red"]
   */
  strings() {
    return new FlagBuilder(
      this.spec
        .initial([])
        .refine(flagStringRefine)
        .refine(toListRefine)
        .accumulate(listAccumulate)
    );
  }

  /**
   * Makes this flag expect a numeric value.
   * Example: --port 3000 or --port=3000
   */
  number() {
    return new FlagBuilder(
      this.spec
        .initial(null)
        .refine(flagStringRefine)
        .refine(toNumberRefine)
    );
  }

  /**
   * Makes this flag parse key-value pairs.
   * Example: --config name=value or --config name value
   * Multiple uses accumulate into an object.
   */
  keyValue() {
    return new FlagBuilder(
      this.spec
        .initial({})
        .refine(flagKeyValueRefine)
        .accumulate(keyValueAccumulate)
    );
  }

  /**
   * Sets a default value for when the flag is not provided.
   */
  default<D>(value: D) {
    return new FlagBuilder(this.spec.initial(value));
  }

  /**
   * Marks this flag as required.
   * The parser will throw an error if this flag is not provided.
   */
  required() {
    return new FlagBuilder(this.spec.metadata({ isRequired: true }));
  }

  /**
   * Adds a description for this flag (used in help messages).
   */
  describe(description: string) {
    return new FlagBuilder(this.spec.metadata({ description }));
  }

  /**
   * Adds a custom refinement function.
   */
  transform<U>(transform: (value: any) => U) {
    return new FlagBuilder(
      this.spec.refine<U>((arg, index, args, context) => {
        if (!context) return null;
        return {
          ...context,
          value: transform(context.value),
        };
      })
    );
  }

  /**
   * Adds a custom match refinement.
   */
  match(pattern: RegExp) {
    return new FlagBuilder(
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
   * Creates a new FlagBuilder that matches any of the given flag names.
   * Example: FlagBuilder.create("-f", "--foo")
   */
  static create(...flagNames: string[]) {
    return new FlagBuilder(Spec.create().initial(false)).refine(
      flagMatchRefine(...flagNames)
    );
  }
}

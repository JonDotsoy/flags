import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { BooleanFlagBuilder } from "./BooleanFlagBuilder.js";
import { NumberFlagBuilder } from "./NumberFlagBuilder.js";
import { ListFlagBuilder } from "./ListFlagBuilder.js";
import { toNumberRefine } from "./refiners/toNumberRefine.js";
import { toListRefine } from "./refiners/toListRefine.js";
import { listAccumulate } from "./accumulates/listAccumulate.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";

/**
 * FlagBuilder - Base builder for CLI flags with alias support
 * 
 * Supports:
 * - Multiple aliases (e.g., '-p', '--port')
 * - Inline values (--flag=value)
 * - Separated values (--flag value)
 * - Type conversions (.boolean(), .number(), .list())
 * - Chainable refiners/validators
 */
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
   * Convert flag to boolean type
   * Flag presence without value → true
   */
  boolean() {
    return new BooleanFlagBuilder(
      this.spec.refine((arg, index, args, context) => {
        if (!context) return null;
        
        // For boolean flags, presence means true
        return {
          ...context,
          value: true,
        };
      })
    );
  }

  /**
   * Convert flag value to number type
   */
  number() {
    return this.toNumber();
  }

  toNumber() {
    // Apply a refiner that converts context.value to number
    return new NumberFlagBuilder(
      this.spec.refine((arg, index, args, context) => {
        if (!context) return null;
        return {
          ...context,
          value: Number(context.value),
        };
      })
    );
  }

  /**
   * Convert flag value to list/array type
   * Splits comma-separated values by default
   */
  list(separator: string = ",") {
    return this.toList(separator);
  }

  toList(separator: string = ",") {
    return new ListFlagBuilder(
      this.spec
        .refine(transformRefine((value: any) => {
          if (Array.isArray(value)) return value;
          if (typeof value === "string") {
            return value.split(separator);
          }
          return [value];
        }))
        .accumulate(listAccumulate)
    );
  }

  /**
   * Keep as string type (default)
   */
  string() {
    return this;
  }

  /**
   * Apply a regex match refiner
   */
  match(regex: RegExp, message?: string) {
    return this.refine((arg, index, args, context) => {
      if (!context) return null;
      const value = context.value;
      if (typeof value === "string" && regex.test(value)) {
        return context;
      }
      return null;
    });
  }

  /**
   * Apply a transformation function
   */
  transform<U>(transformFn: (value: any) => U) {
    return new FlagBuilder(this.spec.refine(transformRefine(transformFn)));
  }

  /**
   * Create a FlagBuilder with one or more aliases
   * 
   * @example
   * FlagBuilder.create('-p', '--port')
   * FlagBuilder.create('--verbose', '-v')
   */
  static create(...aliases: string[]) {
    if (aliases.length === 0) {
      throw new Error("FlagBuilder.create requires at least one alias");
    }

    // Store aliases in metadata
    const spec = Spec.create().metadata({ names: aliases });

    // Create a refiner that matches any of the aliases and handles inline values
    const flagRefiner: Refine = (arg, index, args, context) => {
      // Check if the argument matches any alias
      let matchedAlias: string | null = null;
      let value: string | undefined = undefined;
      let consumedArgs: string[] = [];

      for (const alias of aliases) {
        // Check for inline value (e.g., --flag=value)
        if (arg.startsWith(alias + "=")) {
          matchedAlias = alias;
          value = arg.substring(alias.length + 1);
          consumedArgs = [arg];
          break;
        }
        // Check for exact match (flag without value)
        if (arg === alias) {
          matchedAlias = alias;
          // For flags expecting values, look at the next argument
          // Don't consume the next arg yet - let type-specific refiners decide
          consumedArgs = [arg];
          break;
        }
      }

      if (!matchedAlias) {
        return null;
      }

      // If we found an inline value, use it
      if (value !== undefined) {
        return {
          args: consumedArgs,
          index: index,
          value: value,
          used: matchedAlias,
        };
      }

      // For separated values, check if there's a next argument
      // The next argument is the value, even if it looks like a flag
      const nextArg = args[index + 1];
      if (nextArg !== undefined) {
        return {
          args: [arg, nextArg],
          index: index,
          value: nextArg,
          used: matchedAlias,
        };
      }

      // No value available (will be handled by type-specific refiners)
      return {
        args: consumedArgs,
        index: index,
        value: undefined,
        used: matchedAlias,
      };
    };

    return new FlagBuilder(spec.refine(flagRefiner));
  }
}

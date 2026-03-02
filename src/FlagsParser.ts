import type { Builder } from "./builders/Builder.js";
import type { Spec } from "./builders/Spec.js";
import { UnexpectedArgumentError } from "./errors/UnexpectedArgumentError.js";
import { helpMessage, type HelpMessageOptions } from "./utils/help-message.js";

// Type helper to extract the result type from a Builder
type ExtractBuilderResult<B> =
  B extends Builder<Spec<infer I, infer P>>
    ? I extends never
      ? P
      : I | P
    : never;

// NewFlagsParser implementation

export class FlagsParser<T extends Record<string, Builder<any>>> {
  constructor(
    private schema: T,
    readonly metadata: {
      readonly program: string;
      readonly description?: string;
      readonly version?: string;
      readonly combineShortFlags?: boolean;
    } = {
      program: "cli",
    },
  ) {}

  program(name: string) {
    return new FlagsParser(this.schema, {
      ...this.metadata,
      program: name,
    });
  }

  describe(description: string) {
    return new FlagsParser(this.schema, {
      ...this.metadata,
      description,
    });
  }

  version(version: string) {
    return new FlagsParser(this.schema, {
      ...this.metadata,
      version,
    });
  }

  combineShortFlags() {
    return new FlagsParser(this.schema, {
      ...this.metadata,
      combineShortFlags: true,
    });
  }

  helpMessage = (options?: HelpMessageOptions) =>
    helpMessage(this, this.schema, options);

  parse(args: string[]): {
    [K in keyof T]: ExtractBuilderResult<T[K]>;
  } {
    // Expand combined short flags if option is enabled
    const expandedArgs = this.metadata.combineShortFlags
      ? this.expandCombinedShortFlags(args)
      : args;

    const result: any = {};
    const usedIndices = new Set<number>();

    // Initialize result with initial values from each builder's spec
    for (const [key, builder] of Object.entries(this.schema)) {
      result[key] = builder.spec.getInitial();
    }

    // Try to parse each flag in the schema
    for (const [key, builder] of Object.entries(this.schema)) {
      let parsedValue: any = null;
      let currentValue: any = undefined;

      // Try to parse at each index in expandedArgs
      for (let i = 0; i < expandedArgs.length; i++) {
        if (usedIndices.has(i)) continue;

        const parseResult = builder.parse(
          i,
          expandedArgs,
          currentValue !== undefined ? { current: currentValue } : undefined,
        );

        if (parseResult !== null) {
          // Mark consumed indices as used
          const consumedCount = parseResult.args.length;
          for (let j = 0; j < consumedCount; j++) {
            usedIndices.add(i + j);
          }

          parsedValue = parseResult.value;
          currentValue = parseResult.value;

          // If there's an accumulate function, continue looking for more matches
          if (!builder.spec.getAccumulate()) {
            break;
          }
        }
      }

      // Set the result: use parsed value if found
      if (parsedValue !== null) {
        result[key] = parsedValue;
      }
    }

    // Check for unrecognized arguments
    for (let i = 0; i < expandedArgs.length; i++) {
      if (!usedIndices.has(i)) {
        throw new UnexpectedArgumentError(expandedArgs[i]);
      }
    }

    return result;
  }

  safeParse(args: string[]): [ok: boolean, error: unknown, output: { [K in keyof T]: ExtractBuilderResult<T[K]> } | undefined] {
    try {
      const output = this.parse(args);
      return [true, undefined, output];
    } catch (error) {
      return [false, error, undefined];
    }
  }

  private expandCombinedShortFlags(args: string[]): string[] {
    const expanded: string[] = [];

    // Collect all short flag aliases from the schema
    const shortFlags = new Set<string>();
    for (const builder of Object.values(this.schema)) {
      if (builder.spec.hasMetadata("matches")) {
        const matches = builder.spec.getMetadata("matches") as string[];
        for (const match of matches) {
          // Short flags are single dash followed by single character
          if (
            match.startsWith("-") &&
            !match.startsWith("--") &&
            match.length === 2
          ) {
            shortFlags.add(match[1]); // Store just the character
          }
        }
      }
    }

    for (const arg of args) {
      // Check if this looks like combined short flags: starts with single dash,
      // not followed by another dash, and has multiple characters
      if (
        arg.startsWith("-") &&
        !arg.startsWith("--") &&
        arg.length > 2 &&
        !arg.includes("=")
      ) {
        // Check if all characters after the dash are valid short flags
        const chars = arg.slice(1);
        const allAreShortFlags = chars
          .split("")
          .every((c) => shortFlags.has(c));

        if (allAreShortFlags) {
          // Expand into individual flags
          for (const char of chars) {
            expanded.push(`-${char}`);
          }
          continue;
        }
      }

      // Not a combined short flag, keep as is
      expanded.push(arg);
    }

    return expanded;
  }
}

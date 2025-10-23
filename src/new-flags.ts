type FlagConfig<
  T = "boolean" | "string" | "strings" | "number",
  R extends boolean = boolean,
  D = any,
> = {
  names: string[];
  type: T;
  required?: R;
  description?: string;
  default?: D;
};

type InferFlagType<T> = T extends {
  type: infer U;
  required?: infer R;
  default?: infer D;
}
  ? U extends "boolean"
    ? boolean
    : U extends "string"
      ? R extends true
        ? string
        : D extends string
          ? string
          : string | null
      : U extends "strings"
        ? string[]
        : U extends "number"
          ? R extends true
            ? number
            : D extends number
              ? number
              : number | null
          : never
  : never;

class FlagBuilder {
  private config: FlagConfig;

  constructor(...names: string[]) {
    this.config = {
      names,
      type: "boolean",
    };
  }

  boolean() {
    this.config.type = "boolean";
    const config = this.config;
    return {
      names: config.names,
      type: "boolean" as const,
      description: config.description,
      describe: (desc: string) => ({
        names: config.names,
        type: "boolean" as const,
        description: desc,
        required: () => ({
          names: config.names,
          type: "boolean" as const,
          description: desc,
          required: true as const,
        }),
      }),
      required: () => ({
        names: config.names,
        type: "boolean" as const,
        description: config.description,
        required: true as const,
        describe: (desc: string) => ({
          names: config.names,
          type: "boolean" as const,
          description: desc,
          required: true as const,
        }),
      }),
    };
  }

  string() {
    this.config.type = "string";
    const config = this.config;
    return {
      names: config.names,
      type: "string" as const,
      description: config.description,
      describe: (desc: string) => ({
        names: config.names,
        type: "string" as const,
        description: desc,
        required: () => ({
          names: config.names,
          type: "string" as const,
          description: desc,
          required: true as const,
        }),
        default: <D extends string>(value: D) => ({
          names: config.names,
          type: "string" as const,
          description: desc,
          default: value,
          describe: (desc2: string) => ({
            names: config.names,
            type: "string" as const,
            description: desc2,
            default: value,
          }),
        }),
      }),
      required: () => ({
        names: config.names,
        type: "string" as const,
        description: config.description,
        required: true as const,
        describe: (desc: string) => ({
          names: config.names,
          type: "string" as const,
          description: desc,
          required: true as const,
        }),
      }),
      default: <D extends string>(value: D) => ({
        names: config.names,
        type: "string" as const,
        description: config.description,
        default: value,
        describe: (desc: string) => ({
          names: config.names,
          type: "string" as const,
          description: desc,
          default: value,
        }),
      }),
    };
  }

  strings() {
    this.config.type = "strings";
    const config = this.config;
    return {
      names: config.names,
      type: "strings" as const,
      description: config.description,
      describe: (desc: string) => ({
        names: config.names,
        type: "strings" as const,
        description: desc,
        required: () => ({
          names: config.names,
          type: "strings" as const,
          description: desc,
          required: true as const,
        }),
      }),
      required: () => ({
        names: config.names,
        type: "strings" as const,
        description: config.description,
        required: true as const,
        describe: (desc: string) => ({
          names: config.names,
          type: "strings" as const,
          description: desc,
          required: true as const,
        }),
      }),
    };
  }

  number() {
    this.config.type = "number";
    const config = this.config;
    return {
      names: config.names,
      type: "number" as const,
      description: config.description,
      describe: (desc: string) => ({
        names: config.names,
        type: "number" as const,
        description: desc,
        required: () => ({
          names: config.names,
          type: "number" as const,
          description: desc,
          required: true as const,
        }),
        default: <D extends number>(value: D) => ({
          names: config.names,
          type: "number" as const,
          description: desc,
          default: value,
          describe: (desc2: string) => ({
            names: config.names,
            type: "number" as const,
            description: desc2,
            default: value,
          }),
        }),
      }),
      required: () => ({
        names: config.names,
        type: "number" as const,
        description: config.description,
        required: true as const,
        describe: (desc: string) => ({
          names: config.names,
          type: "number" as const,
          description: desc,
          required: true as const,
        }),
      }),
      default: <D extends number>(value: D) => ({
        names: config.names,
        type: "number" as const,
        description: config.description,
        default: value,
        describe: (desc: string) => ({
          names: config.names,
          type: "number" as const,
          description: desc,
          default: value,
        }),
      }),
    };
  }

  toConfig(): FlagConfig<"boolean"> {
    return this.config as FlagConfig<"boolean">;
  }
}

export function flag(...names: string[]): FlagBuilder & FlagConfig<"boolean"> {
  const builder = new FlagBuilder(...names);
  const config = builder.toConfig();

  return new Proxy(builder, {
    get(target, prop) {
      if (prop in target) {
        return (target as any)[prop];
      }
      if (prop in config) {
        return (config as any)[prop];
      }
      return undefined;
    },
  }) as FlagBuilder & FlagConfig<"boolean">;
}

type ParseResult<T extends Record<string, any>> = {
  [K in keyof T]: InferFlagType<T[K]>;
};

class FlagsParser<T extends Record<string, any>> {
  private _programName: string = "cli";
  private _description?: string;

  constructor(private schema: T) {}

  programName(name: string): this {
    this._programName = name;
    return this;
  }

  describe(description: string): this {
    this._description = description;
    return this;
  }

  helpMessage(): string {
    const lines: string[] = [];

    // Usage line
    lines.push(`Usage: ${this._programName}`);
    lines.push("");

    // Description if provided
    if (this._description) {
      lines.push(this._description);
      lines.push("");
    }

    // Options header
    lines.push("Options:");

    // Flag details
    for (const [key, config] of Object.entries(this.schema)) {
      const names = config.names.join(", ");
      const type = config.type === "boolean" ? "" : `<${config.type}>`;
      const required = config.required === true ? "(required)" : "";
      const description = config.description || "";

      const flagLine = `${names}${type ? " " + type : ""}`;
      const padding = " ".repeat(Math.max(25 - flagLine.length, 2));

      const requiredPart = required ? `${required} ` : "";
      lines.push(`  ${flagLine}${padding}${requiredPart}${description}`);
    }

    return lines.join("\n");
  }

  parse(args: string[]): ParseResult<T> {
    const result: any = {};
    const flagMap = new Map<string, { key: keyof T; config: any }>();

    // Build flag map
    for (const [key, config] of Object.entries(this.schema)) {
      for (const name of config.names) {
        flagMap.set(name, { key, config });
      }

      // Initialize default values
      if (config.type === "boolean") {
        result[key] = false;
      } else if (config.type === "string") {
        result[key] = null;
      } else if (config.type === "strings") {
        result[key] = [];
      } else if (config.type === "number") {
        result[key] = null;
      }
    }

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // Check if it's a flag
      if (arg.startsWith("-")) {
        const [flagName, value] = arg.includes("=")
          ? arg.split("=", 2)
          : [arg, null];
        const flagInfo = flagMap.get(flagName);

        if (!flagInfo) {
          throw new Error(`Unknown flag: ${flagName}`);
        }

        const { key, config } = flagInfo;

        if (config.type === "boolean") {
          result[key] = true;
        } else if (config.type === "string") {
          if (value !== null) {
            result[key] = value;
          } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
            result[key] = args[++i];
          } else {
            result[key] = null;
          }
        } else if (config.type === "strings") {
          if (value !== null) {
            result[key].push(value);
          } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
            result[key].push(args[++i]);
          }
        } else if (config.type === "number") {
          let numValue: string | null = null;
          if (value !== null) {
            numValue = value;
          } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
            numValue = args[++i];
          }
          result[key] = numValue !== null ? Number(numValue) : null;
        }
      } else {
        // Non-flag argument
        throw new Error(`Unexpected argument: ${arg}`);
      }
    }

    // Apply default values and validate required flags
    for (const [key, config] of Object.entries(this.schema)) {
      // Apply default value if result is null/undefined
      // Check if default is not a function (it's an actual value)
      if (
        config.default !== undefined &&
        typeof config.default !== "function"
      ) {
        if (config.type === "string" && result[key] === null) {
          result[key] = config.default;
        } else if (config.type === "number" && result[key] === null) {
          result[key] = config.default;
        }
      }

      // Validate required flags
      if (config.required === true) {
        if (config.type === "boolean" && result[key] === false) {
          throw new Error(`Required flag missing: ${config.names[0]}`);
        } else if (
          (config.type === "string" || config.type === "number") &&
          result[key] === null
        ) {
          throw new Error(`Required flag missing: ${config.names[0]}`);
        } else if (config.type === "strings" && result[key].length === 0) {
          throw new Error(`Required flag missing: ${config.names[0]}`);
        }
      }
    }

    return result as ParseResult<T>;
  }
}

export function flags<T extends Record<string, any>>(
  schema: T,
): FlagsParser<T> {
  return new FlagsParser(schema);
}

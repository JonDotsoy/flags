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

type CommandConfig<T = "boolean" | "restArgs"> = {
  kind: "command";
  name: string;
  type: T;
  description?: string;
};

type ArgumentConfig<T = "string", R extends boolean = boolean, D = any> = {
  kind: "argument";
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
          : U extends "restArgs"
            ? string[]
            : never
  : never;

class FlagBuilder<T extends FlagConfig = FlagConfig<"boolean">> {
  constructor(private config: T) {}

  get names() {
    return this.config.names;
  }

  get type() {
    return this.config.type;
  }

  boolean(): FlagBuilder<FlagConfig<"boolean">> {
    return new FlagBuilder({
      ...this.config,
      type: "boolean",
    } as FlagConfig<"boolean">);
  }

  string(): FlagBuilder<FlagConfig<"string">> {
    return new FlagBuilder({
      ...this.config,
      type: "string",
    } as FlagConfig<"string">);
  }

  strings(): FlagBuilder<FlagConfig<"strings">> {
    return new FlagBuilder({
      ...this.config,
      type: "strings",
    } as FlagConfig<"strings">);
  }

  number(): FlagBuilder<FlagConfig<"number">> {
    return new FlagBuilder({
      ...this.config,
      type: "number",
    } as FlagConfig<"number">);
  }

  describe(desc: string): FlagBuilder<T> {
    return new FlagBuilder({ ...this.config, description: desc } as T);
  }

  required<R extends true = true>(): FlagBuilder<
    FlagConfig<T["type"], R, T["default"]>
  > {
    return new FlagBuilder({
      ...this.config,
      required: true as R,
    } as FlagConfig<T["type"], R, T["default"]>);
  }

  default<
    D extends T["type"] extends "number"
      ? number
      : T["type"] extends "string"
        ? string
        : never,
  >(
    value: D,
  ): FlagBuilder<
    FlagConfig<
      T["type"],
      T["required"] extends boolean ? T["required"] : false,
      D
    >
  > {
    return new FlagBuilder({
      ...this.config,
      default: value,
    } as FlagConfig<
      T["type"],
      T["required"] extends boolean ? T["required"] : false,
      D
    >);
  }

  toConfig(): T {
    return this.config;
  }
}

export function flag(...names: string[]): FlagBuilder<FlagConfig<"boolean">> {
  return new FlagBuilder({
    names,
    type: "boolean",
  });
}

class CommandBuilder<T extends CommandConfig = CommandConfig<"boolean">> {
  constructor(private config: T) {}

  get name() {
    return this.config.name;
  }

  get type() {
    return this.config.type;
  }

  boolean(): CommandBuilder<CommandConfig<"boolean">> {
    return new CommandBuilder({
      ...this.config,
      type: "boolean",
    } as CommandConfig<"boolean">);
  }

  restArgs(): CommandBuilder<CommandConfig<"restArgs">> {
    return new CommandBuilder({
      ...this.config,
      type: "restArgs",
    } as CommandConfig<"restArgs">);
  }

  describe(desc: string): CommandBuilder<T> {
    return new CommandBuilder({ ...this.config, description: desc } as T);
  }

  toConfig(): T {
    return this.config;
  }
}

export function command(
  name: string,
): CommandBuilder<CommandConfig<"boolean">> {
  return new CommandBuilder({
    kind: "command",
    name,
    type: "boolean",
  });
}

class ArgumentBuilder<T extends ArgumentConfig = ArgumentConfig<"string">> {
  constructor(private config: T) {}

  get type() {
    return this.config.type;
  }

  string(): ArgumentBuilder<ArgumentConfig<"string">> {
    return new ArgumentBuilder({
      ...this.config,
      type: "string",
    } as ArgumentConfig<"string">);
  }

  describe(desc: string): ArgumentBuilder<T> {
    return new ArgumentBuilder({ ...this.config, description: desc } as T);
  }

  required<R extends true = true>(): ArgumentBuilder<
    ArgumentConfig<T["type"], R, T["default"]>
  > {
    return new ArgumentBuilder({
      ...this.config,
      required: true as R,
    } as ArgumentConfig<T["type"], R, T["default"]>);
  }

  toConfig(): T {
    return this.config;
  }
}

export function argument(): ArgumentBuilder<ArgumentConfig<"string">> {
  return new ArgumentBuilder({
    kind: "argument",
    type: "string",
  });
}

type ExtractConfig<T> =
  T extends FlagBuilder<infer C>
    ? C
    : T extends CommandBuilder<infer C>
      ? C
      : T extends ArgumentBuilder<infer C>
        ? C
        : T;

type ParseResult<T extends Record<string, any>> = {
  [K in keyof T]: InferFlagType<ExtractConfig<T[K]>>;
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
    for (const [key, flagBuilder] of Object.entries(this.schema)) {
      const config =
        flagBuilder instanceof FlagBuilder
          ? flagBuilder.toConfig()
          : flagBuilder;

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
    const commandMap = new Map<string, { key: keyof T; config: any }>();
    const argumentKeys: Array<{ key: keyof T; config: any }> = [];

    // Build maps and initialize values
    for (const [key, builder] of Object.entries(this.schema)) {
      let config: any;

      if (builder instanceof FlagBuilder) {
        config = builder.toConfig();
        for (const name of config.names) {
          flagMap.set(name, { key, config });
        }
        // Initialize flag defaults
        if (config.type === "boolean") {
          result[key] = false;
        } else if (config.type === "string") {
          result[key] = null;
        } else if (config.type === "strings") {
          result[key] = [];
        } else if (config.type === "number") {
          result[key] = null;
        }
      } else if (builder instanceof CommandBuilder) {
        config = builder.toConfig();
        commandMap.set(config.name, { key, config });
        // Initialize command defaults
        if (config.type === "boolean") {
          result[key] = false;
        } else if (config.type === "restArgs") {
          result[key] = [];
        }
      } else if (builder instanceof ArgumentBuilder) {
        config = builder.toConfig();
        argumentKeys.push({ key, config });
        // Initialize argument defaults
        result[key] = null;
      }
    }

    // Parse arguments
    let currentArgumentIndex = 0;
    let captureRestArgs: keyof T | null = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // If we're capturing rest args, add everything
      if (captureRestArgs !== null) {
        result[captureRestArgs].push(arg);
        continue;
      }

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
        // Check if it's a command
        const commandInfo = commandMap.get(arg);
        if (commandInfo) {
          const { key, config } = commandInfo;
          if (config.type === "boolean") {
            result[key] = true;
          } else if (config.type === "restArgs") {
            result[key] = args.slice(i + 1);
            captureRestArgs = key;
            break; // Stop processing after capturing rest args
          }
        } else {
          // It's a positional argument
          if (currentArgumentIndex < argumentKeys.length) {
            const { key } = argumentKeys[currentArgumentIndex];
            result[key] = arg;
            currentArgumentIndex++;
          } else {
            throw new Error(`Unexpected argument: ${arg}`);
          }
        }
      }
    }

    // Apply default values and validate required
    for (const [key, builder] of Object.entries(this.schema)) {
      let config: any;

      if (builder instanceof FlagBuilder) {
        config = builder.toConfig();

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
      } else if (builder instanceof ArgumentBuilder) {
        config = builder.toConfig();

        if (config.required === true && result[key] === null) {
          throw new Error(`Required argument missing`);
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

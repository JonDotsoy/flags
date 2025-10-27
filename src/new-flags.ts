type BaseConfig = {
  description?: string;
};

type BuilderConfig<
  T = "boolean" | "string" | "strings" | "number" | "keyValue",
  R extends boolean = boolean,
  D = any,
> = BaseConfig & {
  names: string[];
  type: T;
  required?: R;
  default?: D;
};

type CommandConfig<T = "boolean" | "restArgs"> = BaseConfig & {
  kind: "command";
  name: string;
  type: T;
};

type ArgumentConfig<
  T = "string",
  R extends boolean = boolean,
  D = any,
> = BaseConfig & {
  kind: "argument";
  type: T;
  required?: R;
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
          : U extends "keyValue"
            ? Record<string, string>
            : U extends "restArgs"
              ? string[] | null
              : never
  : never;

type InferParseResult<T> = T extends {
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
        ? string | null
        : U extends "number"
          ? R extends true
            ? number
            : D extends number
              ? number
              : number | null
          : U extends "keyValue"
            ? Record<string, string>
            : U extends "restArgs"
              ? string[] | null
              : never
  : never;

export abstract class Builder<InitialValue, ParseResult> {
  constructor(protected config: BaseConfig) {}

  abstract toConfig(): BaseConfig;
  abstract initialValue(): InitialValue;
  abstract test(
    arg: string,
    index: number,
    args: string[],
  ): null | { index: number; args: string[]; parsed: ParseResult };
  abstract accumulate(current: InitialValue, parsed: ParseResult): InitialValue;
  abstract shouldStopParsing(): boolean;
  abstract isPositionalArgument(): boolean;
  abstract builderKind(): "flag" | "command" | "argument";
  abstract applyDefault(result: any, key: string | number | symbol): void;
  abstract validateRequired(result: any, key: string | number | symbol): void;

  describe(desc: string): this {
    const newConfig = { ...this.config, description: desc };
    return new (this.constructor as any)(newConfig);
  }
}

export class FlagBuilder<InitialValue, ParseResult> extends Builder<
  InitialValue,
  ParseResult
> {
  constructor(protected config: BuilderConfig) {
    super(config);
  }

  get names() {
    return this.config.names;
  }

  get type() {
    return this.config.type;
  }

  initialValue(): InitialValue {
    const config = this.config;

    if (config.default !== undefined && typeof config.default !== "function") {
      return config.default as InitialValue;
    }

    if (config.type === "boolean") {
      return false as InitialValue;
    } else if (config.type === "string") {
      return null as InitialValue;
    } else if (config.type === "strings") {
      return [] as InitialValue;
    } else if (config.type === "number") {
      return null as InitialValue;
    } else if (config.type === "keyValue") {
      return {} as InitialValue;
    }

    return null as InitialValue;
  }

  test(
    arg: string,
    index: number,
    args: string[],
  ): null | { index: number; args: string[]; parsed: ParseResult } {
    const config = this.config;

    // Check if arg matches any of the flag names
    for (const name of config.names) {
      if (arg === name || arg.startsWith(name + "=")) {
        // Parse the value and determine consumed arguments
        const parsed = this.parse(arg, index, args);
        let consumedArgs: string[] = [arg];

        if (config.type === "boolean") {
          // Boolean flags only consume 1 argument
          consumedArgs = [arg];
        } else if (arg.includes("=")) {
          // Flags with = syntax consume 1 argument
          consumedArgs = [arg];
        } else if (
          config.type === "string" ||
          config.type === "strings" ||
          config.type === "number"
        ) {
          // Check if there's a next argument that's not a flag
          if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
            consumedArgs = [arg, args[index + 1]];
          } else {
            consumedArgs = [arg];
          }
        } else if (config.type === "keyValue") {
          // KeyValue can consume 1, 2, or 3 arguments
          if (arg.includes("=")) {
            // --config=name=value (1 arg)
            consumedArgs = [arg];
          } else if (
            index + 1 < args.length &&
            !args[index + 1].startsWith("-")
          ) {
            const nextArg = args[index + 1];
            if (nextArg.includes("=")) {
              // --config name=value (2 args)
              consumedArgs = [arg, nextArg];
            } else if (
              index + 2 < args.length &&
              !args[index + 2].startsWith("-")
            ) {
              // --config name value (3 args)
              consumedArgs = [arg, nextArg, args[index + 2]];
            } else {
              // --config name (2 args, value will be empty)
              consumedArgs = [arg, nextArg];
            }
          } else {
            consumedArgs = [arg];
          }
        }

        return { index, args: consumedArgs, parsed };
      }
    }

    return null;
  }

  private parse(arg: string, index: number, args: string[]): ParseResult {
    const config = this.config;

    // Extract flag name and value
    let value: string | null;

    if (arg.includes("=")) {
      const equalIndex = arg.indexOf("=");
      value = arg.substring(equalIndex + 1);
    } else {
      value = null;
    }

    if (config.type === "boolean") {
      return true as ParseResult;
    } else if (config.type === "string") {
      if (value !== null) {
        return value as ParseResult;
      } else if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
        return args[index + 1] as ParseResult;
      } else {
        return null as ParseResult;
      }
    } else if (config.type === "strings") {
      // For strings type, return single value to be accumulated
      if (value !== null) {
        return value as ParseResult;
      } else if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
        return args[index + 1] as ParseResult;
      }
      return null as ParseResult;
    } else if (config.type === "number") {
      let numValue: string | null = null;
      if (value !== null) {
        numValue = value;
      } else if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
        numValue = args[index + 1];
      }
      return (numValue !== null ? Number(numValue) : null) as ParseResult;
    } else if (config.type === "keyValue") {
      let kvPair: string | null = null;

      if (value !== null) {
        kvPair = value;
      } else if (index + 1 < args.length && !args[index + 1].startsWith("-")) {
        kvPair = args[index + 1];
      }

      const result: Record<string, string> = {};

      if (kvPair !== null) {
        if (kvPair.includes("=")) {
          const equalIndex = kvPair.indexOf("=");
          const k = kvPair.substring(0, equalIndex);
          const v = kvPair.substring(equalIndex + 1);
          result[k] = v;
        } else {
          const k = kvPair;
          if (index + 2 < args.length && !args[index + 2].startsWith("-")) {
            const v = args[index + 2];
            result[k] = v;
          } else {
            result[k] = "";
          }
        }
      }

      return result as ParseResult;
    }

    return null as ParseResult;
  }

  boolean(): FlagBuilder<boolean, boolean> {
    return new FlagBuilder({
      ...this.config,
      type: "boolean",
    });
  }

  string(): FlagBuilder<string | null, string | null> {
    return new FlagBuilder({
      ...this.config,
      type: "string",
    });
  }

  strings(): FlagBuilder<string[], string | null> {
    return new FlagBuilder({
      ...this.config,
      type: "strings",
    });
  }

  number(): FlagBuilder<number | null, number | null> {
    return new FlagBuilder({
      ...this.config,
      type: "number",
    });
  }

  keyValue(): FlagBuilder<Record<string, string>, Record<string, string>> {
    return new FlagBuilder({
      ...this.config,
      type: "keyValue",
    });
  }

  required(): FlagBuilder<InitialValue, Exclude<ParseResult, null>> {
    return new FlagBuilder({
      ...this.config,
      required: true,
    });
  }

  default(
    value: Exclude<InitialValue, null>,
  ): FlagBuilder<Exclude<InitialValue, null>, ParseResult> {
    return new FlagBuilder({
      ...this.config,
      default: value,
    });
  }

  accumulate(current: InitialValue, parsed: ParseResult): InitialValue {
    const config = this.config;

    if (config.type === "strings") {
      // Accumulate strings into array
      if (parsed !== null) {
        (current as string[]).push(parsed as string);
      }
      return current;
    } else if (config.type === "keyValue") {
      // Merge key-value pairs
      Object.assign(current as object, parsed);
      return current;
    } else {
      // Direct assignment for other types
      return parsed as unknown as InitialValue;
    }
  }

  shouldStopParsing(): boolean {
    return false;
  }

  isPositionalArgument(): boolean {
    return false;
  }

  builderKind(): "flag" | "command" | "argument" {
    return "flag";
  }

  applyDefault(result: any, key: string | number | symbol): void {
    const config = this.config;
    if (config.default !== undefined && typeof config.default !== "function") {
      result[key] = config.default;
    }
  }

  validateRequired(result: any, key: string | number | symbol): void {
    const config = this.config;
    if (config.required === true) {
      throw new Error(`Required flag missing: ${config.names[0]}`);
    }
  }

  toConfig(): BuilderConfig {
    return this.config;
  }
}

export function flag(...names: string[]): FlagBuilder<boolean, boolean> {
  return new FlagBuilder({
    names,
    type: "boolean",
  });
}

class CommandBuilder<InitialValue, ParseResult> extends Builder<
  InitialValue,
  ParseResult
> {
  constructor(protected config: CommandConfig) {
    super(config);
  }

  get name() {
    return this.config.name;
  }

  get type() {
    return this.config.type;
  }

  initialValue(): InitialValue {
    const config = this.config;

    if (config.type === "boolean") {
      return false as InitialValue;
    } else if (config.type === "restArgs") {
      return null as InitialValue;
    }

    return null as InitialValue;
  }

  test(
    arg: string,
    index: number,
    args: string[],
  ): null | { index: number; args: string[]; parsed: ParseResult } {
    if (arg !== this.config.name) {
      return null;
    }

    const config = this.config;
    const parsed = this.parse(arg, index, args);

    if (config.type === "boolean") {
      // Boolean commands consume 1 argument
      return { index, args: [arg], parsed };
    } else if (config.type === "restArgs") {
      // restArgs commands consume all remaining arguments
      const consumedArgs = args.slice(index);
      return { index, args: consumedArgs, parsed };
    }

    return { index, args: [arg], parsed };
  }

  private parse(arg: string, index: number, args: string[]): ParseResult {
    const config = this.config;

    if (config.type === "boolean") {
      return true as ParseResult;
    } else if (config.type === "restArgs") {
      const restArgs = args.slice(index + 1);
      return (restArgs.length > 0 ? restArgs : []) as ParseResult;
    }

    return null as ParseResult;
  }

  boolean(): CommandBuilder<boolean, boolean> {
    return new CommandBuilder({
      ...this.config,
      type: "boolean",
    });
  }

  restArgs(): CommandBuilder<string[] | null, string[] | null> {
    return new CommandBuilder({
      ...this.config,
      type: "restArgs",
    });
  }

  accumulate(current: InitialValue, parsed: ParseResult): InitialValue {
    // Commands always replace the value
    return parsed as unknown as InitialValue;
  }

  shouldStopParsing(): boolean {
    // Stop parsing if this is a restArgs command
    return this.config.type === "restArgs";
  }

  isPositionalArgument(): boolean {
    return false;
  }

  builderKind(): "flag" | "command" | "argument" {
    return "command";
  }

  applyDefault(result: any, key: string | number | symbol): void {
    // Commands don't have default values
  }

  validateRequired(result: any, key: string | number | symbol): void {
    // Commands don't have required validation
  }

  toConfig(): CommandConfig {
    return this.config;
  }
}

export function command(name: string): CommandBuilder<boolean, boolean> {
  return new CommandBuilder({
    kind: "command",
    name,
    type: "boolean",
  });
}

class ArgumentBuilder<InitialValue, ParseResult> extends Builder<
  InitialValue,
  ParseResult
> {
  constructor(protected config: ArgumentConfig) {
    super(config);
  }

  get type() {
    return this.config.type;
  }

  initialValue(): InitialValue {
    return null as InitialValue;
  }

  test(
    arg: string,
    index: number,
    args: string[],
  ): null | { index: number; args: string[]; parsed: ParseResult } {
    // Arguments match any non-flag, non-command value
    if (arg.startsWith("-")) {
      return null;
    }

    // Positional arguments consume 1 argument
    const parsed = this.parse(arg, index, args);
    return { index, args: [arg], parsed };
  }

  private parse(arg: string, index: number, args: string[]): ParseResult {
    return arg as ParseResult;
  }

  string(): ArgumentBuilder<string | null, string | null> {
    return new ArgumentBuilder({
      ...this.config,
      type: "string",
    });
  }

  required(): ArgumentBuilder<InitialValue, Exclude<ParseResult, null>> {
    return new ArgumentBuilder({
      ...this.config,
      required: true,
    });
  }

  accumulate(current: InitialValue, parsed: ParseResult): InitialValue {
    // Arguments always replace the value
    return parsed as unknown as InitialValue;
  }

  shouldStopParsing(): boolean {
    return false;
  }

  isPositionalArgument(): boolean {
    return true;
  }

  builderKind(): "flag" | "command" | "argument" {
    return "argument";
  }

  applyDefault(result: any, key: string | number | symbol): void {
    // Arguments don't have default values
  }

  validateRequired(result: any, key: string | number | symbol): void {
    const config = this.config;
    if (config.required === true) {
      throw new Error(`Required argument missing`);
    }
  }

  toConfig(): ArgumentConfig {
    return this.config;
  }
}

export function argument(): ArgumentBuilder<string | null, string | null> {
  return new ArgumentBuilder({
    kind: "argument",
    type: "string",
  });
}

type ExtractFinalType<T> =
  T extends Builder<infer IV, infer PR> ? (IV extends null ? PR : IV) : never;

type ParseResultType<T extends Record<string, any>> = {
  [K in keyof T]: ExtractFinalType<T[K]>;
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

    // Separate flags and commands
    const flags: Array<[string, any]> = [];
    const commands: Array<[string, any]> = [];

    for (const [key, builder] of Object.entries(this.schema)) {
      const kind = builder.builderKind();
      if (kind === "flag") {
        flags.push([key, builder]);
      } else if (kind === "command") {
        commands.push([key, builder]);
      }
      // Skip arguments in help for now
    }

    // Options header and details
    if (flags.length > 0) {
      lines.push("Options:");
      for (const [_key, flagBuilder] of flags) {
        const config = flagBuilder.toConfig();
        const names = config.names.join(", ");
        const type = config.type === "boolean" ? "" : `<${config.type}>`;
        const required = config.required === true ? "(required)" : "";
        const description = config.description || "";

        const flagLine = `${names}${type ? " " + type : ""}`;
        const padding = " ".repeat(Math.max(25 - flagLine.length, 2));

        const requiredPart = required ? `${required} ` : "";
        lines.push(`  ${flagLine}${padding}${requiredPart}${description}`);
      }
    }

    // Commands header and details
    if (commands.length > 0) {
      if (flags.length > 0) {
        lines.push("");
      }
      lines.push("Commands:");
      for (const [_key, commandBuilder] of commands) {
        const config = commandBuilder.toConfig();
        const name = config.name;
        const description = config.description || "";

        const padding = " ".repeat(Math.max(25 - name.length, 2));
        lines.push(`  ${name}${padding}${description}`);
      }
    }

    return lines.join("\n");
  }

  parse(args: string[]): ParseResultType<T> {
    const result: any = {};
    const builders: Array<{
      key: keyof T;
      builder: Builder<any, any>;
      used: boolean;
    }> = [];

    // Initialize values using builder.initialValue()
    for (const [key, builder] of Object.entries(this.schema)) {
      result[key] = builder.initialValue();
      builders.push({ key, builder, used: false });
    }

    // Parse arguments using builder.test()
    let i = 0;
    let currentArgumentIndex = 0;
    const argumentBuilders = builders.filter(({ builder }) =>
      builder.isPositionalArgument(),
    );

    while (i < args.length) {
      const arg = args[i];
      let matched = false;

      // Try to match with each builder
      for (const builderEntry of builders) {
        const { key, builder } = builderEntry;
        const match = builder.test(arg, i, args);

        if (match !== null) {
          // Special handling for positional arguments - only match in order
          if (builder.isPositionalArgument()) {
            if (
              currentArgumentIndex < argumentBuilders.length &&
              argumentBuilders[currentArgumentIndex].key === key
            ) {
              result[key] = builder.accumulate(result[key], match.parsed);
              currentArgumentIndex++;
              builderEntry.used = true;
              matched = true;
            }
            // If not the right position, continue to next builder
          } else {
            // Use accumulate method for all other builders
            result[key] = builder.accumulate(result[key], match.parsed);
            builderEntry.used = true;
            matched = true;

            // Check if we should stop parsing (e.g., restArgs commands)
            if (builder.shouldStopParsing()) {
              i = args.length; // Exit loop
              break;
            }
          }

          // Advance index by consumed args if matched
          if (matched) {
            i += match.args.length;
            break;
          }
        }
      }

      if (!matched) {
        throw new Error(`Unexpected argument: ${arg}`);
      }
    }

    // Apply default values and validate required
    for (const builderEntry of builders) {
      const { key, builder, used } = builderEntry;

      if (!used) {
        builder.applyDefault(result, key);
        builder.validateRequired(result, key);
      }
    }

    return result as ParseResultType<T>;
  }
}

export function flags<T extends Record<string, any>>(
  schema: T,
): FlagsParser<T> {
  return new FlagsParser(schema);
}

// Error classes
export class FlagsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlagsParseError";
  }
}

export class UnexpectedArgumentError extends FlagsParseError {
  constructor(public argument: string) {
    super(`Unexpected argument: ${argument}`);
    this.name = "UnexpectedArgumentError";
  }
}

export class RequiredFlagMissingError extends FlagsParseError {
  constructor(public flagName: string) {
    super(`Required flag missing: ${flagName}`);
    this.name = "RequiredFlagMissingError";
  }
}

export class RequiredArgumentMissingError extends FlagsParseError {
  constructor() {
    super(`Required argument missing`);
    this.name = "RequiredArgumentMissingError";
  }
}

type BaseConfig = {
  description?: string;
};

type BuilderConfig<
  T = "boolean" | "string" | "strings" | "number" | "keyValue" | "restArgs",
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
  T = "string" | "restArgs",
  R extends boolean = boolean,
  D = any,
> = BaseConfig & {
  kind: "argument";
  type: T;
  required?: R;
  default?: D;
};

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

    const initialValues: Record<string, any> = {
      boolean: false,
      string: null,
      strings: [],
      number: null,
      keyValue: {},
      restArgs: null,
    };

    return (initialValues[config.type] ?? null) as InitialValue;
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
        } else if (config.type === "restArgs") {
          // restArgs flags consume all remaining arguments
          consumedArgs = args.slice(index);
        } else if (arg.includes("=")) {
          // Flags with = syntax consume 1 argument
          consumedArgs = [arg];
        } else if (
          config.type === "string" ||
          config.type === "strings" ||
          config.type === "number"
        ) {
          // Check if there's a next argument
          // Accept any value, even if it starts with "-"
          if (index + 1 < args.length) {
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
    } else if (config.type === "restArgs") {
      const restArgs = args.slice(index + 1);
      return (restArgs.length > 0 ? restArgs : []) as ParseResult;
    } else if (config.type === "string") {
      if (value !== null) {
        return value as ParseResult;
      } else if (index + 1 < args.length) {
        return args[index + 1] as ParseResult;
      } else {
        return null as ParseResult;
      }
    } else if (config.type === "strings") {
      // For strings type, return single value to be accumulated
      if (value !== null) {
        return value as ParseResult;
      } else if (index + 1 < args.length) {
        return args[index + 1] as ParseResult;
      }
      return null as ParseResult;
    } else if (config.type === "number") {
      let numValue: string | null = null;
      if (value !== null) {
        numValue = value;
      } else if (index + 1 < args.length) {
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

  restArgs(): FlagBuilder<string[] | null, string[] | null> {
    return new FlagBuilder({
      ...this.config,
      type: "restArgs",
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
    // Stop parsing if this is a restArgs flag
    return this.config.type === "restArgs";
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
      throw new RequiredFlagMissingError(config.names[0]);
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

    const config = this.config;
    const parsed = this.parse(arg, index, args);

    if (config.type === "restArgs") {
      // restArgs arguments consume all remaining non-flag arguments
      const consumedArgs: string[] = [];
      for (let i = index; i < args.length; i++) {
        if (!args[i].startsWith("-")) {
          consumedArgs.push(args[i]);
        } else {
          break;
        }
      }
      return { index, args: consumedArgs, parsed };
    }

    // Positional arguments consume 1 argument
    return { index, args: [arg], parsed };
  }

  private parse(arg: string, index: number, args: string[]): ParseResult {
    const config = this.config;

    if (config.type === "restArgs") {
      const restArgs: string[] = [];
      for (let i = index; i < args.length; i++) {
        if (!args[i].startsWith("-")) {
          restArgs.push(args[i]);
        } else {
          break;
        }
      }
      return (restArgs.length > 0 ? restArgs : []) as ParseResult;
    }

    return arg as ParseResult;
  }

  string(): ArgumentBuilder<string | null, string | null> {
    return new ArgumentBuilder({
      ...this.config,
      type: "string",
    });
  }

  restArgs(): ArgumentBuilder<string[] | null, string[] | null> {
    return new ArgumentBuilder({
      ...this.config,
      type: "restArgs",
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
    // Stop parsing if this is a restArgs argument
    return this.config.type === "restArgs";
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
      throw new RequiredArgumentMissingError();
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

  helpMessage({
    terminalWidth,
    noColor,
  }: { terminalWidth?: number; noColor?: boolean } = {}): string {
    const lines: string[] = [];

    // Get terminal width (default to 80 if not available)
    const width =
      terminalWidth ??
      (typeof process !== "undefined" && process.stdout?.columns
        ? process.stdout.columns
        : 80);

    // Helper function to strip ANSI codes for length calculation
    const stripAnsi = (str: string): string => {
      return str.replace(/\x1b\[[0-9;]*m/g, "");
    };

    // Helper function to remove ANSI codes if noColor is true
    const processText = (text: string): string => {
      return noColor ? stripAnsi(text) : text;
    };

    // Helper function to wrap text
    const wrapText = (text: string, width: number): string[] => {
      if (!text) return [""];

      const words = text.split(/\s+/);
      const wrappedLines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const currentLineVisible = stripAnsi(currentLine).length;
        const wordVisible = stripAnsi(word).length;

        if (currentLine.length === 0) {
          currentLine = word;
        } else if (currentLineVisible + 1 + wordVisible <= width) {
          currentLine += " " + word;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine.length > 0) {
        wrappedLines.push(currentLine);
      }

      return wrappedLines.length > 0 ? wrappedLines : [""];
    };

    // Usage line
    lines.push(`Usage: ${this._programName}`);
    lines.push("");

    // Description if provided
    if (this._description) {
      const wrappedDescription = wrapText(
        processText(this._description),
        width,
      );
      for (const line of wrappedDescription) {
        lines.push(line);
      }
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

    // Calculate the maximum length for both flags and commands
    let maxLength = 22; // Minimum width

    // Check flags
    for (const [_key, flagBuilder] of flags) {
      const config = flagBuilder.toConfig();
      const names = config.names.join(", ");
      const type = config.type === "boolean" ? "" : `<${config.type}>`;
      const flagLine = `${names}${type ? " " + type : ""}`;
      maxLength = Math.max(maxLength, flagLine.length);
    }

    // Check commands
    for (const [_key, commandBuilder] of commands) {
      const config = commandBuilder.toConfig();
      maxLength = Math.max(maxLength, config.name.length);
    }

    // Calculate description column width
    const leftColumnWidth = 2 + maxLength + 3; // indent + maxLength + padding
    const descriptionWidth = Math.max(width - leftColumnWidth, 30);

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
        const padding = " ".repeat(
          Math.max(maxLength - flagLine.length + 3, 3),
        );

        const requiredPart = required ? `${required} ` : "";
        const fullDescription = `${requiredPart}${processText(description)}`;

        // Wrap description text
        const wrappedLines = wrapText(fullDescription, descriptionWidth);

        // First line with flag
        lines.push(`  ${flagLine}${padding}${wrappedLines[0]}`);

        // Subsequent lines with proper indentation
        for (let i = 1; i < wrappedLines.length; i++) {
          const indent = " ".repeat(leftColumnWidth);
          lines.push(`${indent}${wrappedLines[i]}`);
        }
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

        const padding = " ".repeat(Math.max(maxLength - name.length + 3, 3));

        // Wrap description text
        const wrappedLines = wrapText(
          processText(description),
          descriptionWidth,
        );

        // First line with command
        lines.push(`  ${name}${padding}${wrappedLines[0]}`);

        // Subsequent lines with proper indentation
        for (let i = 1; i < wrappedLines.length; i++) {
          const indent = " ".repeat(leftColumnWidth);
          lines.push(`${indent}${wrappedLines[i]}`);
        }
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

    // Build a map of single-letter boolean flags for expansion
    const singleLetterBooleanFlags = new Map<string, boolean>();
    for (const { builder } of builders) {
      if (builder.builderKind() === "flag") {
        const flagBuilder = builder as FlagBuilder<any, any>;
        if (flagBuilder.type === "boolean") {
          for (const name of flagBuilder.names) {
            // Only consider single-letter flags (e.g., -a, -b, not --all)
            if (name.length === 2 && name.startsWith("-") && name[1] !== "-") {
              singleLetterBooleanFlags.set(name[1], true);
            }
          }
        }
      }
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

      // Try to expand combined flags before matching
      const expandedFlags = this.tryExpandCombinedFlag(
        arg,
        singleLetterBooleanFlags,
      );

      if (expandedFlags.length > 1) {
        // This is a combined flag that was expanded
        // Process each expanded flag
        for (const expandedFlag of expandedFlags) {
          for (const builderEntry of builders) {
            const { key, builder } = builderEntry;
            const match = builder.test(expandedFlag, i, [expandedFlag]);

            if (match !== null && !builder.isPositionalArgument()) {
              result[key] = builder.accumulate(result[key], match.parsed);
              builderEntry.used = true;
              break;
            }
          }
        }
        matched = true;
        i++;
      } else {
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
      }

      if (!matched) {
        throw new UnexpectedArgumentError(arg);
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

  private tryExpandCombinedFlag(
    arg: string,
    singleLetterBooleanFlags: Map<string, boolean>,
  ): string[] {
    // Check if this is a potential combined flag: starts with single dash,
    // has multiple characters, no equals sign, and not a double dash
    if (
      arg.startsWith("-") &&
      !arg.startsWith("--") &&
      !arg.includes("=") &&
      arg.length > 2
    ) {
      // Try to expand as combined flags
      const letters = arg.slice(1); // Remove the leading dash
      let canExpand = true;

      // Check if all letters are single-letter boolean flags
      for (const letter of letters) {
        if (!singleLetterBooleanFlags.has(letter)) {
          canExpand = false;
          break;
        }
      }

      if (canExpand) {
        // Expand into individual flags
        const expanded: string[] = [];
        for (const letter of letters) {
          expanded.push(`-${letter}`);
        }
        return expanded;
      }
    }

    // Cannot expand or not a combined flag, return as single element array
    return [arg];
  }
}

export function flags<T extends Record<string, any>>(
  schema: T,
): FlagsParser<T> {
  return new FlagsParser(schema);
}

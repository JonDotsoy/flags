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

export function flag(...names: string[]): FlagBuilder<boolean, boolean> {
  return FlagBuilder.createFlag(...names);
}

export function argument(): ArgumentBuilder<string | null, string | null> {
  return ArgumentBuilder.create().string();
}

export function flags<
  T extends Record<
    string,
    ArgumentBuilder<any, any> | FlagBuilder<any, any> | CommandBuilder<any, any>
  >,
>(schema: T): FlagsParser<T> {
  return new FlagsParser(schema);
}

// NewArgumentBuilder types and implementation
export type RefineContext = {
  args: string[];
  index: number;
  value: any;
} | null;

export type Refine = (
  arg: string,
  index: number,
  args: string[],
  context: RefineContext,
) => RefineContext;

export type ResultParser<ParseResult> = {
  args: string[];
  index: number;
  value: ParseResult;
};

export class ArgumentBuilder<InitialValue, ParseResult> {
  private refiners: Refine[];
  private initial: InitialValue;
  protected metadata: Record<string, any> = {};

  constructor(initial: InitialValue, refiners: Refine[]) {
    this.initial = initial;
    this.refiners = refiners;
  }

  setInitial<T>(initial: T): ArgumentBuilder<T, ParseResult> {
    return new ArgumentBuilder<T, ParseResult>(initial, this.refiners);
  }

  getInitial() {
    return this.initial;
  }

  refine<U>(refine: Refine): ArgumentBuilder<InitialValue, U> {
    return new ArgumentBuilder<InitialValue, U>(this.initial, [
      ...this.refiners,
      refine,
    ]);
  }

  string(): ArgumentBuilder<string | null, string | null> {
    const refiner: Refine = (arg, index, args, context) => {
      // Arguments match any non-flag value
      if (arg.startsWith("-")) {
        return null;
      }

      return {
        args: [arg],
        index: index + 1,
        value: arg,
      };
    };

    return new ArgumentBuilder<string | null, string | null>(null, [refiner]);
  }

  restArgs(): ArgumentBuilder<string[] | null, string[] | null> {
    const refiner: Refine = (arg, index, args, context) => {
      // Arguments match any non-flag value
      if (arg.startsWith("-")) {
        return null;
      }

      // restArgs arguments consume all remaining non-flag arguments
      const consumedArgs: string[] = [];
      for (let i = index; i < args.length; i++) {
        if (!args[i].startsWith("-")) {
          consumedArgs.push(args[i]);
        } else {
          break;
        }
      }

      return {
        args: consumedArgs,
        index: index + consumedArgs.length,
        value: consumedArgs.length > 0 ? consumedArgs : [],
      };
    };

    return new ArgumentBuilder<string[] | null, string[] | null>(null, [
      refiner,
    ]);
  }

  match(
    pattern: RegExp,
  ): ArgumentBuilder<
    Record<string, string> | null,
    Record<string, string> | null
  > {
    const refiner: Refine = (arg, index, args, context) => {
      const match = arg.match(pattern);
      if (match && match.groups) {
        return {
          args: [arg],
          index: index + 1,
          value: match.groups,
        };
      }
      return null;
    };

    return new ArgumentBuilder<
      Record<string, string> | null,
      Record<string, string> | null
    >(null, [refiner]);
  }

  transform<T>(
    fn: (arg: string, index: number, args: string[]) => T,
  ): ArgumentBuilder<T | null, T | null> {
    const refiner: Refine = (arg, index, args, context) => {
      if (arg.startsWith("-")) {
        return null;
      }

      const transformed = fn(arg, index, args);
      return {
        args: [arg],
        index: index + 1,
        value: transformed,
      };
    };

    return new ArgumentBuilder<T | null, T | null>(null, [refiner]);
  }

  required(): ArgumentBuilder<InitialValue, Exclude<ParseResult, null>> {
    // For now, just return the same builder
    // Required validation would need to be handled in the parser
    return this as any;
  }

  describe(desc: string): this {
    this.setMetadata("description", desc);
    return this;
  }

  setMetadata(key: string, value: any): this {
    this.metadata[key] = value;
    return this;
  }

  getMetadata<T>(key: string): T {
    return this.metadata[key];
  }

  hasMetadata(key: string): boolean {
    return key in this.metadata;
  }

  initialValue(): InitialValue {
    return this.initial;
  }

  test(
    arg: string,
    index: number,
    args: string[],
  ): null | { index: number; args: string[]; parsed: ParseResult } {
    const result = this.parse(index, args);
    if (result === null) {
      return null;
    }
    return {
      index: result.index,
      args: result.args,
      parsed: result.value,
    };
  }

  toConfig(): any {
    return {
      kind: "argument",
      type: "string",
      metadata: this.metadata,
    };
  }

  parse(startIndex: number, args: string[]): null | ResultParser<ParseResult> {
    if (args.length === 0 || startIndex >= args.length) {
      return null;
    }

    let context: RefineContext = null;
    const arg = args[startIndex];

    // Apply each refiner in sequence
    for (const refiner of this.refiners) {
      const result = refiner(arg, startIndex, args, context);

      if (result === null) {
        return null;
      }

      context = result;
    }

    // If no refiners or all passed, return the final context
    if (context) {
      // Extract the consumed args from the original args array
      const consumedArgs = args.slice(startIndex, context.index);

      return {
        args: consumedArgs,
        index: startIndex,
        value: context.value,
      };
    }

    return null;
  }

  static create() {
    return new ArgumentBuilder(null, []);
  }
}

// NewFlagBuilder implementation
export class FlagBuilder<InitialValue, ParseResult> extends ArgumentBuilder<
  InitialValue,
  ParseResult
> {
  private flagNames: string[];

  constructor(names: string[], initial: InitialValue, refiners: Refine[]) {
    super(initial, refiners);
    this.flagNames = names;
  }

  getNames() {
    return this.flagNames;
  }

  override setInitial<T>(initial: T): FlagBuilder<T, ParseResult> {
    const builder = new FlagBuilder<T, ParseResult>(
      this.flagNames,
      initial,
      (this as any).refiners,
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  override refine<U>(refine: Refine): FlagBuilder<InitialValue, U> {
    const builder = new FlagBuilder<InitialValue, U>(
      this.flagNames,
      this.getInitial(),
      [...(this as any).refiners, refine],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  override describe(desc: string): this {
    this.setMetadata("description", desc);
    return this;
  }

  override toConfig(): any {
    const initial = this.getInitial();
    let type = "boolean";

    // Determine type by testing with the first flag name
    const testFlagName = this.flagNames[0] || "--test";

    if (Array.isArray(initial)) {
      type = "strings";
    } else if (typeof initial === "object" && initial !== null) {
      type = "keyValue";
    } else if (typeof initial === "number") {
      type = "number";
    } else if (typeof initial === "string") {
      type = "string";
    } else if (initial === null && (this as any).refiners?.length > 0) {
      // Test the refiners to determine type
      const testResult = this.parse(0, [testFlagName, "123"]);
      if (testResult && typeof testResult.value === "number") {
        type = "number";
      } else if (testResult && typeof testResult.value === "string") {
        type = "string";
      } else if (testResult && Array.isArray(testResult.value)) {
        type = "strings";
      } else if (
        testResult &&
        typeof testResult.value === "object" &&
        testResult.value !== null
      ) {
        type = "keyValue";
      }
    }

    return {
      names: this.flagNames,
      type,
      metadata: this.metadata,
    };
  }

  boolean() {
    return this.refine<boolean>((arg, index, args, context) => {
      // Check if arg matches any of the flag names
      for (const name of this.flagNames) {
        if (arg === name) {
          return {
            args: [arg],
            index: index + 1,
            value: true,
          };
        }
      }
      return null;
    });
  }

  string(options?: {
    valueDelimiter?: string;
  }): FlagBuilder<string | null, string | null> {
    const builder = new FlagBuilder<string | null, string | null>(
      this.flagNames,
      null,
      [],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });

    return builder.refine<string | null>((arg, index, args, context) => {
      for (const name of this.flagNames) {
        // Check for valueDelimiter match
        if (
          options?.valueDelimiter &&
          arg.startsWith(name + options.valueDelimiter)
        ) {
          const value = arg.substring(
            name.length + options.valueDelimiter.length,
          );
          return {
            args: [arg],
            index: index + 1,
            value: value || null,
          };
        }

        // Check for = syntax
        if (arg.startsWith(name + "=")) {
          const value = arg.substring(name.length + 1);
          return {
            args: [arg],
            index: index + 1,
            value: value || null,
          };
        }

        // Check for flag name followed by value
        if (arg === name) {
          if (index + 1 < args.length) {
            return {
              args: [arg, args[index + 1]],
              index: index + 2,
              value: args[index + 1],
            };
          }
          return {
            args: [arg],
            index: index + 1,
            value: null,
          };
        }
      }
      return null;
    });
  }

  strings(): FlagBuilder<string[], string | null> {
    const builder = new FlagBuilder<string[], string | null>(
      this.flagNames,
      [],
      [],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });

    return builder.refine<string | null>((arg, index, args, context) => {
      for (const name of this.flagNames) {
        let value: string | null = null;

        // Check for = syntax
        if (arg.startsWith(name + "=")) {
          value = arg.substring(name.length + 1);
        } else if (arg === name && index + 1 < args.length) {
          value = args[index + 1];
        }

        if (arg === name || arg.startsWith(name + "=")) {
          const consumedArgs = arg.startsWith(name + "=")
            ? [arg]
            : [arg, args[index + 1]];

          // Return the single value, not the accumulated array
          // The parser will handle accumulation
          return {
            args: consumedArgs,
            index: index + consumedArgs.length,
            value: value !== null ? [value] : [],
          };
        }
      }
      return null;
    });
  }

  number(): FlagBuilder<number | null, number | null> {
    const builder = new FlagBuilder<number | null, number | null>(
      this.flagNames,
      null,
      [],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });

    return builder.refine<number | null>((arg, index, args, context) => {
      for (const name of this.flagNames) {
        let numValue: string | null = null;

        // Check for = syntax
        if (arg.startsWith(name + "=")) {
          numValue = arg.substring(name.length + 1);
        } else if (arg === name && index + 1 < args.length) {
          numValue = args[index + 1];
        }

        if (arg === name || arg.startsWith(name + "=")) {
          const consumedArgs = arg.startsWith(name + "=")
            ? [arg]
            : [arg, args[index + 1]];

          return {
            args: consumedArgs,
            index: index + consumedArgs.length,
            value: numValue !== null ? Number(numValue) : null,
          };
        }
      }
      return null;
    });
  }

  keyValue(): FlagBuilder<Record<string, string>, Record<string, string>> {
    const refiner: Refine = (arg, index, args, context) => {
      for (const name of this.flagNames) {
        if (arg === name || arg.startsWith(name + "=")) {
          let kvPair: string | null = null;

          // Check for = syntax
          if (arg.startsWith(name + "=")) {
            kvPair = arg.substring(name.length + 1);
          } else if (index + 1 < args.length) {
            kvPair = args[index + 1];
          }

          const currentObj = context?.value || {};
          const result: Record<string, string> = { ...currentObj };

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

          const consumedArgs = arg.startsWith(name + "=")
            ? [arg]
            : kvPair && kvPair.includes("=")
              ? [arg, kvPair]
              : index + 2 < args.length && !args[index + 2].startsWith("-")
                ? [arg, kvPair!, args[index + 2]]
                : kvPair !== null
                  ? [arg, kvPair]
                  : [arg];

          return {
            args: consumedArgs,
            index: index + consumedArgs.length,
            value: result,
          };
        }
      }
      return null;
    };

    const builder = new FlagBuilder<
      Record<string, string>,
      Record<string, string>
    >(this.flagNames, {}, [refiner]);
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  restArgs(): FlagBuilder<string[] | null, string[] | null> {
    const refiner: Refine = (arg, index, args, context) => {
      for (const name of this.flagNames) {
        if (arg === name) {
          const restArgs = args.slice(index + 1);
          return {
            args: args.slice(index),
            index: args.length,
            value: restArgs.length > 0 ? restArgs : [],
          };
        }
      }
      return null;
    };

    const builder = new FlagBuilder<string[] | null, string[] | null>(
      this.flagNames,
      null,
      [refiner],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  required(): FlagBuilder<InitialValue, Exclude<ParseResult, null>> {
    const builder = new FlagBuilder<InitialValue, Exclude<ParseResult, null>>(
      this.flagNames,
      this.getInitial() as InitialValue,
      (this as any).refiners,
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    builder.setMetadata("isRequired", true);
    return builder as any;
  }

  default(
    value: Exclude<InitialValue, null>,
  ): FlagBuilder<Exclude<InitialValue, null>, ParseResult> {
    const builder = new FlagBuilder<Exclude<InitialValue, null>, ParseResult>(
      this.flagNames,
      value,
      (this as any).refiners,
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  static createFlag(...names: string[]) {
    const builder = new FlagBuilder<boolean, boolean>(names, false, []);
    return builder.boolean();
  }
}

// NewCommandBuilder implementation
export class CommandBuilder<InitialValue, ParseResult> extends ArgumentBuilder<
  InitialValue,
  ParseResult
> {
  private commandName: string;

  constructor(name: string, initial: InitialValue, refiners: Refine[]) {
    super(initial, refiners);
    this.commandName = name;
  }

  getName() {
    return this.commandName;
  }

  override setInitial<T>(initial: T): CommandBuilder<T, ParseResult> {
    const builder = new CommandBuilder<T, ParseResult>(
      this.commandName,
      initial,
      (this as any).refiners,
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  override refine<U>(refine: Refine): CommandBuilder<InitialValue, U> {
    const builder = new CommandBuilder<InitialValue, U>(
      this.commandName,
      this.getInitial(),
      [...(this as any).refiners, refine],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  override describe(desc: string): this {
    this.setMetadata("description", desc);
    return this;
  }

  override toConfig(): any {
    return {
      kind: "command",
      name: this.commandName,
      type: "boolean",
      metadata: this.metadata,
    };
  }

  boolean(): CommandBuilder<boolean, boolean> {
    const refiner: Refine = (arg, index, args, context) => {
      // Commands should not start with dashes
      if (arg.startsWith("-")) {
        return null;
      }

      if (arg !== this.commandName) {
        return null;
      }

      return {
        args: [arg],
        index: index + 1,
        value: true,
      };
    };

    const builder = new CommandBuilder<boolean, boolean>(
      this.commandName,
      false,
      [refiner],
    );
    const self = this;
    Object.keys(self.metadata).forEach(key => {
      builder.setMetadata(key, self.getMetadata(key));
    });
    return builder;
  }

  restArgs(): CommandBuilder<string[] | null, string[] | null> {
    const refiner: Refine = (arg, index, args, context) => {
      // Commands should not start with dashes
      if (arg.startsWith("-")) {
        return null;
      }

      if (arg !== this.commandName) {
        return null;
      }

      const restArgs = args.slice(index + 1);
      return {
        args: args.slice(index),
        index: args.length,
        value: restArgs.length > 0 ? restArgs : [],
      };
    };

    const builder = new CommandBuilder<string[] | null, string[] | null>(
      this.commandName,
      null,
      [refiner],
    );
    Object.keys(this.metadata).forEach(key => {
      builder.setMetadata(key, this.getMetadata(key));
    });
    return builder;
  }

  static createCommand(name: string) {
    const builder = new CommandBuilder<boolean, boolean>(name, false, []);
    return builder.boolean();
  }
}

export function command(name: string): CommandBuilder<boolean, boolean> {
  return CommandBuilder.createCommand(name);
}

// NewFlagsParser implementation
export class FlagsParser<T extends Record<string, ArgumentBuilder<any, any>>> {
  private _programName: string = "cli";
  private _description?: string;

  constructor(private schema: T) { }

  programName(name: string): this {
    this._programName = name;
    return this;
  }

  describe(description: string): this {
    this._description = description;
    return this;
  }

  helpMessage({
    terminalWidth = 80,
    noColor = false,
  }: { terminalWidth?: number; noColor?: boolean } = {}): string {
    const stripAnsi = (str: string) => {
      return str.replace(/\x1b\[[0-9;]*m/g, "");
    };

    const wrapText = (
      text: string,
      width: number,
      indent: number = 0,
    ): string => {
      const indentStr = " ".repeat(indent);
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = indentStr;

      for (const word of words) {
        const cleanWord = stripAnsi(word);
        const cleanLine = stripAnsi(currentLine);

        if (cleanLine.length + cleanWord.length + 1 <= width) {
          currentLine += (currentLine === indentStr ? "" : " ") + word;
        } else {
          if (currentLine !== indentStr) {
            lines.push(currentLine);
          }
          currentLine = indentStr + word;
        }
      }

      if (currentLine !== indentStr) {
        lines.push(currentLine);
      }

      return lines.join("\n");
    };

    let help = `Usage: ${this._programName}\n\n`;

    if (this._description) {
      const desc = noColor ? stripAnsi(this._description) : this._description;
      help += wrapText(desc, terminalWidth) + "\n\n";
    }

    // Separate flags and commands
    const flags: Array<[string, any]> = [];
    const commands: Array<[string, any]> = [];

    for (const [key, builder] of Object.entries(this.schema)) {
      const config = builder.toConfig();
      if (config.kind === "command") {
        commands.push([key, config]);
      } else if (builder instanceof FlagBuilder) {
        flags.push([key, config]);
      }
    }

    // Generate flags section
    if (flags.length > 0) {
      help += "Options:\n";

      for (const [key, config] of flags) {
        const names = config.names?.join(", ") || "";
        const typeStr =
          config.type === "string"
            ? " <string>"
            : config.type === "number"
              ? " <number>"
              : config.type === "strings"
                ? " <strings>"
                : "";
        const requiredStr = config.metadata?.isRequired ? " (required)" : "";
        const desc = config.metadata?.description || "";

        const flagLine = `  ${names}${typeStr}`;
        const descIndent = 28;

        // Build the full description with required marker
        const fullDesc =
          requiredStr + (desc ? (requiredStr ? " " : "") + desc : "");

        if (fullDesc) {
          const cleanFlagLine = stripAnsi(flagLine);
          const cleanDesc = noColor ? stripAnsi(fullDesc) : fullDesc;

          if (cleanFlagLine.length < descIndent) {
            const padding = " ".repeat(descIndent - cleanFlagLine.length);

            // Wrap description text
            const descWords = cleanDesc.split(/\s+/);
            const descLines: string[] = [];
            let currentLine = "";

            for (const word of descWords) {
              const testLine = currentLine ? currentLine + " " + word : word;
              if (stripAnsi(testLine).length <= terminalWidth - descIndent) {
                currentLine = testLine;
              } else {
                if (currentLine) {
                  descLines.push(currentLine);
                }
                currentLine = word;
              }
            }
            if (currentLine) {
              descLines.push(currentLine);
            }

            help += flagLine + padding + descLines[0] + "\n";
            for (let i = 1; i < descLines.length; i++) {
              help += " ".repeat(descIndent) + descLines[i] + "\n";
            }
          } else {
            help += flagLine + "\n";

            // Wrap description on new lines
            const descWords = cleanDesc.split(/\s+/);
            const descLines: string[] = [];
            let currentLine = "";

            for (const word of descWords) {
              const testLine = currentLine ? currentLine + " " + word : word;
              if (stripAnsi(testLine).length <= terminalWidth - descIndent) {
                currentLine = testLine;
              } else {
                if (currentLine) {
                  descLines.push(currentLine);
                }
                currentLine = word;
              }
            }
            if (currentLine) {
              descLines.push(currentLine);
            }

            for (const line of descLines) {
              help += " ".repeat(descIndent) + line + "\n";
            }
          }
        } else {
          help += flagLine + "\n";
        }
      }

      help += "\n";
    }

    // Generate commands section
    if (commands.length > 0) {
      help += "Commands:\n";

      for (const [key, config] of commands) {
        const name = config.name || key;
        const desc = config.metadata?.description || "";

        const cmdLine = `  ${name}`;
        const descIndent = 28;

        if (desc) {
          const cleanCmdLine = stripAnsi(cmdLine);
          if (cleanCmdLine.length < descIndent) {
            const padding = " ".repeat(descIndent - cleanCmdLine.length);
            const wrappedDesc = wrapText(
              noColor ? stripAnsi(desc) : desc,
              terminalWidth - descIndent,
              descIndent,
            );
            const descLines = wrappedDesc.split("\n");
            help += cmdLine + padding + descLines[0].trim() + "\n";
            for (let i = 1; i < descLines.length; i++) {
              help += descLines[i] + "\n";
            }
          } else {
            help += cmdLine + "\n";
            help +=
              wrapText(
                noColor ? stripAnsi(desc) : desc,
                terminalWidth - descIndent,
                descIndent,
              ) + "\n";
          }
        } else {
          help += cmdLine + "\n";
        }
      }

      help += "\n";
    }

    return help.trimEnd();
  }

  parse(args: string[]): {
    [K in keyof T]: T[K] extends ArgumentBuilder<infer I, infer P>
    ? I extends null
    ? P
    : I
    : never;
  } {
    const result: any = {};
    const usedIndices = new Set<number>();
    const requiredFlags: Map<string, string[]> = new Map();

    // Initialize all values with their initial values and track required flags
    for (const [key, builder] of Object.entries(this.schema)) {
      const initial = builder.getInitial();
      result[key] = initial;

      // Track required flags
      if (builder instanceof FlagBuilder && builder.getMetadata('isRequired')) {
        requiredFlags.set(key, builder.getNames());
      }
    }

    // Expand combined short flags (e.g., -ti -> -t -i)
    // But only if we're not inside a restArgs context
    const expandedArgs: string[] = [];
    let insideRestArgs = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // Check if previous arg was a command/flag with restArgs
      if (i > 0 && !insideRestArgs) {
        for (const builder of Object.values(this.schema)) {
          if (builder instanceof CommandBuilder) {
            const config = builder.toConfig();
            if (args[i - 1] === config.name) {
              // Check if this command has restArgs by trying to parse
              const testResult = builder.parse(i - 1, args);
              if (
                testResult &&
                testResult.value &&
                Array.isArray(testResult.value)
              ) {
                insideRestArgs = true;
                break;
              }
            }
          }
        }
      }

      if (
        !insideRestArgs &&
        arg.startsWith("-") &&
        !arg.startsWith("--") &&
        arg.length > 2 &&
        !arg.includes("=")
      ) {
        // Check if all flags are single-letter boolean flags
        const letters = arg.slice(1).split("");
        let allBoolean = true;

        for (const letter of letters) {
          const flagName = `-${letter}`;
          let found = false;

          for (const builder of Object.values(this.schema)) {
            if (builder instanceof FlagBuilder) {
              const names = builder.getNames();
              if (names.includes(flagName)) {
                // Check if it's a boolean flag by checking initial value
                if (builder.getInitial() === false) {
                  found = true;
                  break;
                } else {
                  allBoolean = false;
                  break;
                }
              }
            }
          }

          if (!found) {
            allBoolean = false;
            break;
          }
        }

        if (allBoolean) {
          // Expand combined flags
          for (const letter of letters) {
            expandedArgs.push(`-${letter}`);
          }
        } else {
          expandedArgs.push(arg);
        }
      } else {
        expandedArgs.push(arg);
      }
    }

    // Try to parse each argument with each builder in schema order
    for (let i = 0; i < expandedArgs.length; i++) {
      if (usedIndices.has(i)) {
        continue;
      }

      let matched = false;

      // Try each builder in the order they were defined in the schema
      for (const [key, builder] of Object.entries(this.schema)) {
        // Skip arguments that already have a value (unless they're arrays or objects that accumulate)
        if (
          !(builder instanceof FlagBuilder) &&
          result[key] !== null &&
          result[key] !== builder.getInitial() &&
          !Array.isArray(result[key])
        ) {
          continue;
        }

        const parseResult = builder.parse(i, expandedArgs);

        if (parseResult !== null) {
          // Mark all consumed indices as used
          for (
            let j = parseResult.index;
            j < parseResult.index + parseResult.args.length;
            j++
          ) {
            usedIndices.add(j);
          }

          // For arrays, accumulate instead of replace
          if (Array.isArray(result[key]) && Array.isArray(parseResult.value)) {
            result[key] = [...result[key], ...parseResult.value];
          } else if (
            typeof result[key] === "object" &&
            result[key] !== null &&
            !Array.isArray(result[key]) &&
            typeof parseResult.value === "object" &&
            parseResult.value !== null &&
            !Array.isArray(parseResult.value)
          ) {
            // For objects (like keyValue), merge instead of replace
            result[key] = { ...result[key], ...parseResult.value };
          } else {
            result[key] = parseResult.value;
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        throw new UnexpectedArgumentError(expandedArgs[i]);
      }
    }

    // Validate required flags
    for (const [key, flagNames] of requiredFlags.entries()) {
      const value = result[key];
      const initial = this.schema[key].getInitial();

      // Check if the value is still the initial value (meaning it wasn't set)
      if (value === initial || value === null) {
        throw new RequiredFlagMissingError(flagNames[0]);
      }
    }

    return result;
  }
}

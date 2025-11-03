import type { Builder } from "./builders/Builder.js";
import type { Spec } from "./builders/Spec.js";
import { UnexpectedArgumentError } from "./errors/UnexpectedArgumentError.js";

// Type helper to extract the result type from a Builder
type ExtractBuilderResult<B> = B extends Builder<Spec<infer I, infer P>>
  ? P extends never
    ? I
    : P extends null
      ? I
      : P
  : never;

// NewFlagsParser implementation

export class FlagsParser<T extends Record<string, Builder<any>>> {
  helpMessage(arg0?: { terminalWidth?: number; noColor?: boolean }): string {
    throw new Error("Method not implemented.");
  }
  constructor(
    private schema: T,
    readonly metadata: {
      readonly program: string;
      readonly description?: string;
      readonly version?: string;
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

  // helpMessage({
  //   terminalWidth = 80,
  //   noColor = false,
  // }: { terminalWidth?: number; noColor?: boolean } = {}): string {
  //   const stripAnsi = (str: string) => {
  //     return str.replace(/\x1b\[[0-9;]*m/g, "");
  //   };
  //   const wrapText = (
  //     text: string,
  //     width: number,
  //     indent: number = 0,
  //   ): string => {
  //     const indentStr = " ".repeat(indent);
  //     const words = text.split(/\s+/);
  //     const lines: string[] = [];
  //     let currentLine = indentStr;
  //     for (const word of words) {
  //       const cleanWord = stripAnsi(word);
  //       const cleanLine = stripAnsi(currentLine);
  //       if (cleanLine.length + cleanWord.length + 1 <= width) {
  //         currentLine += (currentLine === indentStr ? "" : " ") + word;
  //       } else {
  //         if (currentLine !== indentStr) {
  //           lines.push(currentLine);
  //         }
  //         currentLine = indentStr + word;
  //       }
  //     }
  //     if (currentLine !== indentStr) {
  //       lines.push(currentLine);
  //     }
  //     return lines.join("\n");
  //   };
  //   let help = `Usage: ${this._programName}\n\n`;
  //   if (this._description) {
  //     const desc = noColor ? stripAnsi(this._description) : this._description;
  //     help += wrapText(desc, terminalWidth) + "\n\n";
  //   }
  //   // Separate flags and commands
  //   const flags: Array<[string, any]> = [];
  //   const commands: Array<[string, any]> = [];
  //   for (const [key, builder] of Object.entries(this.schema)) {
  //     const config = builder.toConfig();
  //     if (config.kind === "command") {
  //       commands.push([key, config]);
  //     } else if (builder instanceof FlagBuilder) {
  //       flags.push([key, config]);
  //     }
  //   }
  //   // Generate flags section
  //   if (flags.length > 0) {
  //     help += "Options:\n";
  //     for (const [key, config] of flags) {
  //       const names = config.names?.join(", ") || "";
  //       const typeStr =
  //         config.type === "string"
  //           ? " <string>"
  //           : config.type === "number"
  //             ? " <number>"
  //             : config.type === "strings"
  //               ? " <strings>"
  //               : "";
  //       const requiredStr = config.metadata?.isRequired ? " (required)" : "";
  //       const desc = config.metadata?.description || "";
  //       const flagLine = `  ${names}${typeStr}`;
  //       const descIndent = 28;
  //       // Build the full description with required marker
  //       const fullDesc =
  //         requiredStr + (desc ? (requiredStr ? " " : "") + desc : "");
  //       if (fullDesc) {
  //         const cleanFlagLine = stripAnsi(flagLine);
  //         const cleanDesc = noColor ? stripAnsi(fullDesc) : fullDesc;
  //         if (cleanFlagLine.length < descIndent) {
  //           const padding = " ".repeat(descIndent - cleanFlagLine.length);
  //           // Wrap description text
  //           const descWords = cleanDesc.split(/\s+/);
  //           const descLines: string[] = [];
  //           let currentLine = "";
  //           for (const word of descWords) {
  //             const testLine = currentLine ? currentLine + " " + word : word;
  //             if (stripAnsi(testLine).length <= terminalWidth - descIndent) {
  //               currentLine = testLine;
  //             } else {
  //               if (currentLine) {
  //                 descLines.push(currentLine);
  //               }
  //               currentLine = word;
  //             }
  //           }
  //           if (currentLine) {
  //             descLines.push(currentLine);
  //           }
  //           help += flagLine + padding + descLines[0] + "\n";
  //           for (let i = 1; i < descLines.length; i++) {
  //             help += " ".repeat(descIndent) + descLines[i] + "\n";
  //           }
  //         } else {
  //           help += flagLine + "\n";
  //           // Wrap description on new lines
  //           const descWords = cleanDesc.split(/\s+/);
  //           const descLines: string[] = [];
  //           let currentLine = "";
  //           for (const word of descWords) {
  //             const testLine = currentLine ? currentLine + " " + word : word;
  //             if (stripAnsi(testLine).length <= terminalWidth - descIndent) {
  //               currentLine = testLine;
  //             } else {
  //               if (currentLine) {
  //                 descLines.push(currentLine);
  //               }
  //               currentLine = word;
  //             }
  //           }
  //           if (currentLine) {
  //             descLines.push(currentLine);
  //           }
  //           for (const line of descLines) {
  //             help += " ".repeat(descIndent) + line + "\n";
  //           }
  //         }
  //       } else {
  //         help += flagLine + "\n";
  //       }
  //     }
  //     help += "\n";
  //   }
  //   // Generate commands section
  //   if (commands.length > 0) {
  //     help += "Commands:\n";
  //     for (const [key, config] of commands) {
  //       const name = config.name || key;
  //       const desc = config.metadata?.description || "";
  //       const cmdLine = `  ${name}`;
  //       const descIndent = 28;
  //       if (desc) {
  //         const cleanCmdLine = stripAnsi(cmdLine);
  //         if (cleanCmdLine.length < descIndent) {
  //           const padding = " ".repeat(descIndent - cleanCmdLine.length);
  //           const wrappedDesc = wrapText(
  //             noColor ? stripAnsi(desc) : desc,
  //             terminalWidth - descIndent,
  //             descIndent,
  //           );
  //           const descLines = wrappedDesc.split("\n");
  //           help += cmdLine + padding + descLines[0].trim() + "\n";
  //           for (let i = 1; i < descLines.length; i++) {
  //             help += descLines[i] + "\n";
  //           }
  //         } else {
  //           help += cmdLine + "\n";
  //           help +=
  //             wrapText(
  //               noColor ? stripAnsi(desc) : desc,
  //               terminalWidth - descIndent,
  //               descIndent,
  //             ) + "\n";
  //         }
  //       } else {
  //         help += cmdLine + "\n";
  //       }
  //     }
  //     help += "\n";
  //   }
  //   return help.trimEnd();
  // }
  parse(args: string[]): {
    [K in keyof T]: ExtractBuilderResult<T[K]>;
  } {
    const result: any = {};
    const usedIndices = new Set<number>();

    // Try to parse each flag in the schema
    for (const [key, builder] of Object.entries(this.schema)) {
      let parsedValue: any = null;
      let currentValue: any = undefined;

      // Try to parse at each index in args
      for (let i = 0; i < args.length; i++) {
        if (usedIndices.has(i)) continue;

        const parseResult = builder.parse(i, args, currentValue);

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

      // Set the result: use parsed value, or initial value, or null
      if (parsedValue !== null) {
        result[key] = parsedValue;
      } else {
        const initial = builder.spec.getInitial();
        result[key] = initial;
      }
    }

    // Check for unrecognized arguments
    for (let i = 0; i < args.length; i++) {
      if (!usedIndices.has(i)) {
        throw new UnexpectedArgumentError(args[i]);
      }
    }

    return result;
  }
}

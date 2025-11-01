import { FlagBuilder } from "./builders/FlagBuilder.js";
import { CommandBuilder } from "./builders/CommandBuilder.js";
import { ArgumentBuilder } from "./builders/ArgumentBuilder.js";
import { FlagsParser } from "./FlagsParser.js";
import type { Builder } from "./builders/Builder.js";

/**
 * Creates a flag builder that matches the given flag names.
 * 
 * @param flagNames - One or more flag names to match (e.g., "-v", "--verbose")
 * @returns A FlagBuilder instance that defaults to boolean behavior
 * 
 * @example
 * flag("--verbose", "-v")                    // Boolean flag
 * flag("--name", "-n").string()              // String flag
 * flag("--port", "-p").number()              // Number flag
 * flag("--include").strings()                // Array of strings
 * flag("--config").keyValue()                // Key-value pairs
 */
export function flag(...flagNames: string[]) {
  return FlagBuilder.create(...flagNames);
}

/**
 * Creates a command builder that matches the given command name.
 * Commands default to boolean behavior (return true when present).
 * 
 * @param commandName - The command name to match
 * @returns A BooleanCommandBuilder instance
 * 
 * @example
 * command("build")                           // Boolean command (returns true when present)
 * command("serve").restArgs()                // Command with rest args - note restArgs() must be added to BooleanCommandBuilder
 */
export function command(commandName: string) {
  return CommandBuilder.create(commandName).boolean();
}

/**
 * Creates an argument builder for positional arguments.
 * Arguments are matched in order.
 * 
 * @returns An ArgumentBuilder instance
 * 
 * @example
 * argument().string()                        // String argument
 * argument().string().required()             // Required argument
 * argument().number()                        // Number argument
 */
export function argument() {
  return ArgumentBuilder.create();
}

/**
 * Creates a parser with the given schema.
 * 
 * @param schema - An object mapping keys to builder instances
 * @returns A FlagsParser instance
 * 
 * @example
 * const parser = flags({
 *   verbose: flag("--verbose", "-v").boolean(),
 *   name: flag("--name", "-n").string(),
 *   port: flag("--port", "-p").number().default(3000),
 * });
 * 
 * const result = parser.parse(process.argv.slice(2));
 */
export function flags<T extends Record<string, Builder<any>>>(schema: T) {
  return new FlagsParser(schema);
}

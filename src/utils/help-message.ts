import type { Builder } from "../builders/Builder";
import type { FlagsParser } from "../FlagsParser";

export type HelpMessageOptions = {
  terminalWidth?: number;
  noColor?: boolean;
};

export const helpMessage = (
  flagsParser: FlagsParser<any>,
  schema: Record<string, Builder<any>>,
  options?: HelpMessageOptions,
): string => {
  const terminalWidth = options?.terminalWidth ?? process.stdout.columns ?? 80;
  const noColor = options?.noColor ?? false;

  const lines: string[] = [];

  // Usage line
  lines.push(`Usage: ${flagsParser.metadata.program}`);
  lines.push("");

  // Description
  if (flagsParser.metadata.description) {
    lines.push(flagsParser.metadata.description);
    lines.push("");
  }

  // Collect flags and commands
  const flags: Array<{
    names: string[];
    type: string;
    description?: string;
    hasDefault: boolean;
  }> = [];
  const commands: Array<{ name: string; description?: string }> = [];

  for (const [key, builder] of Object.entries(schema)) {
    const spec = builder.spec;
    const description = spec.hasMetadata("description")
      ? (spec.getMetadata("description") as string)
      : undefined;

    // Check if it's a command by checking the builder type
    const builderName = builder.constructor.name;
    const isCommand = builderName.includes("Command");

    if (isCommand) {
      // For commands, we need to extract the command name from the refiners
      // Commands use argumentMatchRefine which checks for exact string match
      const refiners = spec.getRefiners();
      let commandName = key;

      // Try to extract command name from the refiner
      if (refiners.length > 0) {
        // The argumentMatchRefine stores the match string in its closure
        // We'll use the key as fallback
        commandName = key;
      }

      commands.push({
        name: commandName,
        description,
      });
    } else {
      // It's a flag
      const matches = spec.hasMetadata("matches")
        ? (spec.getMetadata("matches") as string[])
        : [];

      if (matches.length > 0) {
        const initial = spec.getInitial();
        let type = "boolean";
        let hasDefault = false;

        // Determine type based on initial value
        if (initial === null) {
          type = "string"; // Could be number or string, default to string
        } else if (typeof initial === "number") {
          type = "number";
          hasDefault = true;
        } else if (typeof initial === "string") {
          type = "string";
          hasDefault = true;
        } else if (typeof initial === "boolean") {
          type = "boolean";
        } else if (Array.isArray(initial)) {
          type = "array";
        }

        flags.push({
          names: matches,
          type,
          description,
          hasDefault,
        });
      }
    }
  }

  // Print Options section
  if (flags.length > 0) {
    lines.push("Options:");
    for (const flag of flags) {
      // Sort names: short flags first (single dash), then long flags (double dash)
      const sortedNames = [...flag.names].sort((a, b) => {
        const aIsShort = a.startsWith("-") && !a.startsWith("--");
        const bIsShort = b.startsWith("-") && !b.startsWith("--");
        if (aIsShort && !bIsShort) return -1;
        if (!aIsShort && bIsShort) return 1;
        return 0;
      });

      // Check if there's a short flag
      const hasShortFlag = sortedNames.some(
        (name) => name.startsWith("-") && !name.startsWith("--"),
      );

      const namesStr = sortedNames.join(", ");

      // For boolean flags, add a period instead of type
      // For flags with defaults, show the type
      // For flags without defaults (null initial), don't show type
      let flagPart: string;
      if (flag.type === "boolean") {
        flagPart = `${namesStr}.`;
      } else if (flag.hasDefault) {
        flagPart = `${namesStr} <${flag.type}>`;
      } else {
        flagPart = namesStr;
      }

      const descStr = flag.description || "";

      // If there's no short flag, add extra padding to align with flags that have short flags
      // Short flags are typically "-X, " which is 4 characters
      const indent = hasShortFlag ? "  " : "      ";
      const totalFlagLength = indent.length + flagPart.length;
      const padding = " ".repeat(Math.max(1, 27 - totalFlagLength));
      lines.push(`${indent}${flagPart}${padding}${descStr}`);
    }
    lines.push("");
  }

  // Print Commands section
  if (commands.length > 0) {
    lines.push("Commands:");
    for (const cmd of commands) {
      const nameStr = cmd.name;
      const descStr = cmd.description || "";
      const padding = " ".repeat(Math.max(1, 25 - nameStr.length));
      lines.push(`  ${nameStr}${padding}${descStr}`);
    }
  }

  return lines.join("\n") + "\n";
};

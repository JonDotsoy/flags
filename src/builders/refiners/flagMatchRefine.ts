import type { Refine } from "../../flags";
import type { Spec } from "../Spec";

export const flagMatchRefine =
  (matches: string[], spec?: Spec<any, any>): Refine =>
  (_arg, index, args, _context) => {
    const delimiter = spec?.hasMetadata("delimiter")
      ? spec.getMetadata<string>("delimiter")
      : "=";

    // Check if current arg matches any of the aliases
    for (const match of matches) {
      // Check for exact match (e.g., "--verbose" or "foo-taz")
      if (args[index] === match) {
        // No value provided, return empty string
        return {
          args: args.slice(index, index + 1),
          index,
          value: "",
        };
      }

      // Check for flag{delimiter}value format (e.g., "--verbose=foo" or "foo-taz:bar")
      if (args[index].startsWith(`${match}${delimiter}`)) {
        const value = args[index].substring(match.length + delimiter.length);
        return {
          args: args.slice(index, index + 1),
          index,
          value,
        };
      }
    }

    return null;
  };

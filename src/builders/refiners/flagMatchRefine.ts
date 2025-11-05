import type { Refine } from "../../flags.js";

export const flagMatchRefine: Refine = (
  _arg,
  index,
  args,
  _context,
  builder,
) => {
  const matches =
    builder.spec.getMetadata<string[] | undefined>("matches") ?? [];
  const delimiter = builder.spec.getMetadata<string>("delimiter") ?? "=";

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

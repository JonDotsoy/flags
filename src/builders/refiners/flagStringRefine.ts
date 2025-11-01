import type { Refine } from "../../flags";

/**
 * Refiner that consumes the next argument as a string value for a flag.
 * This is used for flags with .string() type.
 */
export const flagStringRefine: Refine = (arg, index, args, context) => {
  if (!context) return null;
  
  // If the value is already a string (from --flag=value syntax), return it
  if (typeof context.value === "string") {
    return context;
  }
  
  // Otherwise (value is boolean true from flag match), consume the next argument as the value
  if (index + 1 < args.length) {
    return {
      args: args.slice(index, index + 2),
      index: index,
      value: args[index + 1],
    };
  }
  
  // No value available, return null for string flags
  return null;
};

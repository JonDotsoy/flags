import type { Refine } from "../../flags";

/**
 * Creates a refiner that matches flag names and extracts their values.
 * This version only matches the flag, it doesn't consume the value.
 * The value consumption is handled by subsequent refiners based on the flag type.
 */
export const flagMatchRefine =
  (...flagNames: string[]): Refine =>
  (arg, index, args, context) => {
    // Check if current arg matches any of the flag names
    for (const flagName of flagNames) {
      // Handle --flag=value syntax
      if (arg.startsWith(`${flagName}=`)) {
        const value = arg.slice(flagName.length + 1);
        return {
          args: args.slice(index, index + 1),
          index: index,
          value: value,
        };
      }
      
      // Handle --flag (matched, but value will be determined by next refiner)
      if (arg === flagName) {
        return {
          args: args.slice(index, index + 1),
          index: index,
          value: true,
        };
      }
    }
    
    return null;
  };

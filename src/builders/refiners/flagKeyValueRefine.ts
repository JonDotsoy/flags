import type { Refine } from "../../flags";

/**
 * Refiner that parses key-value pairs for flags.
 * Supports:
 * - --flag key value
 * - --flag key=value
 * - --flag=key=value
 */
export const flagKeyValueRefine: Refine = (arg, index, args, context) => {
  if (!context) return null;
  
  // If the value from flagMatchRefine contains '=' (from --flag=key=value syntax), parse it
  if (typeof context.value === "string" && context.value.includes("=")) {
    const [key, ...valueParts] = context.value.split("=");
    const value = valueParts.join("=");
    return {
      args: context.args,
      index: index,
      value: { [key]: value },
    };
  }
  
  // Check if next argument is key=value format
  if (index + 1 < args.length) {
    const keyValue = args[index + 1];
    if (keyValue.includes("=")) {
      const [key, ...valueParts] = keyValue.split("=");
      const value = valueParts.join("=");
      return {
        args: args.slice(index, index + 2),
        index: index,
        value: { [key]: value },
      };
    }
  }
  
  // Otherwise, consume next two arguments as key and value
  if (index + 2 < args.length) {
    const key = args[index + 1];
    const value = args[index + 2];
    return {
      args: args.slice(index, index + 3),
      index: index,
      value: { [key]: value },
    };
  }
  
  return null;
};

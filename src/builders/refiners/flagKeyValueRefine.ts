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
  
  // If the value contains '=', it's already in key=value format
  if (typeof context.value === "string" && context.value.includes("=")) {
    const [key, ...valueParts] = context.value.split("=");
    const value = valueParts.join("=");
    return {
      args: context.args,
      index: index,
      value: { [key]: value },
    };
  }
  
  // Otherwise, we need to consume the next two arguments as key and value
  if (index + 2 < args.length) {
    const key = args[index + 1];
    const value = args[index + 2];
    return {
      args: args.slice(index, index + 3),
      index: index,
      value: { [key]: value },
    };
  }
  
  // Fallback: consume next argument as key=value string
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
  
  return null;
};

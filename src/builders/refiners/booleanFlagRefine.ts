import type { Refine } from "../../flags";

export const booleanFlagRefine: Refine = (
  _arg,
  _index,
  _args,
  context,
  _builder,
) => {
  if (!context) {
    return null;
  }

  // Boolean flags don't consume additional arguments
  // If value is already set from flagMatchRefine (e.g., "--verbose=true"), parse it
  if (context.value !== "") {
    const lowerValue = context.value.toLowerCase();
    if (lowerValue === "true" || lowerValue === "1") {
      return { ...context, value: true };
    }
    if (lowerValue === "false" || lowerValue === "0") {
      return { ...context, value: false };
    }
    // Invalid boolean value
    return null;
  }

  // No explicit value means the flag presence is true
  return {
    args: context.args,
    index: context.index,
    value: true,
  };
};

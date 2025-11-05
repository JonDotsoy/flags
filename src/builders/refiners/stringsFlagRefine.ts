import type { Refine } from "../../flags.js";

export const stringsFlagRefine: Refine = (
  _arg,
  index,
  args,
  context,
  _builder,
) => {
  if (!context) {
    return null;
  }

  // If value is already set from flagMatchRefine (e.g., "--foo=bar"), convert to array
  if (context.value !== "") {
    return {
      ...context,
      value: [context.value],
    };
  }

  // Check if next arg exists
  const nextArg = args[index + 1];
  if (!nextArg) {
    // No value provided, return null
    return null;
  }

  // Consume next argument as value and convert to array
  return {
    args: [...context.args, nextArg],
    index: context.index,
    value: [nextArg],
  };
};

import type { Refine } from "../../flags";

export const keyValueFlagRefine: Refine = (
  _arg,
  index,
  args,
  context,
  _builder,
) => {
  if (!context) {
    return null;
  }

  let keyValueString = context.value;

  // If value is empty, try to get from next argument
  if (keyValueString === "") {
    const nextArg = args[index + 1];
    if (!nextArg) {
      return null;
    }
    keyValueString = nextArg;
  }

  // Check if it's key=value format
  const delimiterIndex = keyValueString.indexOf("=");

  if (delimiterIndex !== -1) {
    // Parse key=value format
    const key = keyValueString.substring(0, delimiterIndex);
    const value = keyValueString.substring(delimiterIndex + 1);

    if (!key) {
      return null;
    }

    // If we consumed next argument, include it in args
    const consumedArgs =
      context.value === "" && args[index + 1]
        ? [...context.args, args[index + 1]]
        : context.args;

    return {
      args: consumedArgs,
      index: context.index,
      value: { [key]: value },
    };
  }

  // Try to parse as separate key and value (3 args: flag key value)
  if (context.value === "" && args[index + 1] && args[index + 2]) {
    const key = args[index + 1];
    const value = args[index + 2];

    return {
      args: [...context.args, args[index + 1], args[index + 2]],
      index: context.index,
      value: { [key]: value },
    };
  }

  return null;
};

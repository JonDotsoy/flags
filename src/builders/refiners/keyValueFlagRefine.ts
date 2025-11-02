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

  // Parse key=value format
  const delimiterIndex = keyValueString.indexOf("=");
  if (delimiterIndex === -1) {
    return null;
  }

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
};

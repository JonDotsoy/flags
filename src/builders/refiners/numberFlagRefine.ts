import type { Refine } from "../../flags";
import type { Spec } from "../Spec";

export const numberFlagRefine =
  (spec: Spec<any, any>): Refine =>
  (_arg, index, args, context) => {
    if (!context) {
      return null;
    }

    let value = context.value;

    // If value is empty, try to get from next argument
    if (value === "") {
      const nextArg = args[index + 1];
      if (!nextArg) {
        return null;
      }
      value = nextArg;
    }

    // Try to parse as number
    const numValue = Number(value);
    if (isNaN(numValue)) {
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
      value: numValue,
    };
  };

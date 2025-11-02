import type { Refine } from "../../flags";
import type { Spec } from "../Spec";

export const stringFlagRefine =
  (spec: Spec<any, any>): Refine =>
  (_arg, index, args, context) => {
    if (!context) {
      return null;
    }

    // If value is already set from flagMatchRefine (e.g., "--foo=bar"), keep it
    if (context.value !== "") {
      return context;
    }

    // Check if next arg exists
    const nextArg = args[index + 1];
    if (!nextArg) {
      // No value provided, return null
      return null;
    }

    // Consume next argument as value
    return {
      args: [...context.args, nextArg],
      index: context.index,
      value: nextArg,
    };
  };

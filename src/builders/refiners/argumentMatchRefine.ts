import type { Refine } from "../../flags.js";

export const argumentMatchRefine =
  (argumentMatch: string): Refine =>
  (arg, index, args, context) => {
    if (args[index] === argumentMatch) {
      return {
        args: context?.args ?? args.slice(index, index + 1),
        index: context?.index ?? index,
        value: arg,
      };
    }
    return null;
  };

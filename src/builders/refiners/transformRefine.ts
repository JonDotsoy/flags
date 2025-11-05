import type { Refine } from "../../flags.js";

export const transformRefine =
  <T>(transform: (value: any) => T): Refine =>
  (arg, index, args, context) => {
    return {
      args: context?.args ?? args.slice(index, index + 1),
      index: context?.index ?? index,
      value: transform(context?.value),
    };
  };

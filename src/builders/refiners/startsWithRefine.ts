import type { Refine } from "../../flags.js";

export const startsWithRefine =
  (prefix: string): Refine =>
  (arg, index, args, context) => {
    if (!arg.startsWith(prefix)) {
      return null;
    }

    return {
      args: context?.args ?? args.slice(index, index + 1),
      index: context?.index ?? index,
      value: context?.value ?? arg,
    };
  };

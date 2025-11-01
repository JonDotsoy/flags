import type { Refine } from "../../dtos/Refine";

export const templateRefine: Refine = (arg, index, args, context) => ({
  args: args.slice(index, index + 1),
  index,
  value: Array.isArray(arg) ? arg : [arg],
});

export const toBooleanRefine: Refine = (arg, index, args, context) => ({
  args: context?.args ?? args.slice(index, index + 1),
  index,
  value: true,
});

import type { Refine } from "../../flags";

export const toListRefine: Refine = (
  currentValue: string,
  index: number,
  args: string[],
) => ({
  args: args.slice(index, index + 1),
  index,
  value: Array.isArray(currentValue) ? currentValue : [currentValue],
});

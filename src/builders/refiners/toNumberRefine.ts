import type { Refine } from "../../flags";

export const toNumberRefine: Refine = (
  currentValue: string,
  index: number,
  args: string[],
) => ({
  args: args.slice(index, index + 1),
  index,
  value: Number(currentValue),
});

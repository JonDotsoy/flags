import type { Refine } from "../../flags";

export const toListRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context,
) => {
  const value = context?.value ?? arg;
  return {
    args: context?.args ?? args.slice(index, index + 1),
    index,
    value: Array.isArray(value) ? value : [value],
  };
};

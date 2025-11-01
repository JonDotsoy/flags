import type { Refine } from "../../flags";

export const toNumberRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context,
) => {
  const value = context?.value ?? arg;
  return {
    args: context?.args ?? args.slice(index, index + 1),
    index,
    value: Number(value),
  };
};

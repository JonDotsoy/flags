import type { RefineContext } from "../flags";

export const notNaNRefine = (
  value: string,
  index: number,
  args: string[],
  context: RefineContext,
): RefineContext => {
  if (typeof context?.value === "number" && isNaN(context.value)) return null;
  return context;
};

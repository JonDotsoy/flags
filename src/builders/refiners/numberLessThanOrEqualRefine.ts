import type { Refine } from "../../flags.js";

export const numberLessThanOrEqualRefine =
  (lessThan: number): Refine =>
  (value, index, args, current) => {
    if (typeof current?.value === "number" && current.value <= lessThan)
      return current;
    return null;
  };

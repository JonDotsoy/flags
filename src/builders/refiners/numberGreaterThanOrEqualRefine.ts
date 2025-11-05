import type { Refine } from "../../flags.js";

export const numberGreaterThanOrEqualRefine =
  (greaterThan: number): Refine =>
  (value, index, args, current) => {
    if (typeof current?.value === "number" && current.value >= greaterThan)
      return current;
    return null;
  };

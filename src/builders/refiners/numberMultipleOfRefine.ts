import type { Refine } from "../../flags.js";

export const numberMultipleOfRefine =
  (multipleOf: number): Refine =>
  (value, index, args, current) => {
    if (typeof current?.value === "number" && current.value % multipleOf === 0)
      return current;
    return null;
  };

import type { Accumulate } from "../../flags.js";

export const keyValueAccumulate: Accumulate = (prev, current) => {
  const prevObj = typeof prev === "object" && prev !== null ? prev : {};
  const currentObj =
    typeof current === "object" && current !== null ? current : {};

  return {
    ...prevObj,
    ...currentObj,
  };
};

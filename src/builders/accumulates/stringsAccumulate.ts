import type { Accumulate } from "../../flags.js";

export const stringsAccumulate: Accumulate = (prev, current) => {
  const prevArray = Array.isArray(prev) ? prev : [prev];
  const currentArray = Array.isArray(current) ? current : [current];
  return [...prevArray, ...currentArray];
};

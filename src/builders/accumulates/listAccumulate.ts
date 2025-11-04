import type { Accumulate } from "../../flags";

export const listAccumulate: Accumulate = (prev, current) => {
  return [
    ...(Array.isArray(prev) ? prev : [prev]),
    ...(Array.isArray(current) ? current : [current]),
  ];
};

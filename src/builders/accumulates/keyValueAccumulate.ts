import type { Accumulate } from "../../dtos/Accumulate";

/**
 * Accumulates key-value pairs into a single object.
 */
export const keyValueAccumulate: Accumulate = (prev, current) => {
  const prevObj = prev && typeof prev === "object" ? prev : {};
  const currentObj = current && typeof current === "object" ? current : {};
  
  return {
    ...prevObj,
    ...currentObj,
  };
};

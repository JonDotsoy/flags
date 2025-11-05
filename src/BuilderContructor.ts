import type { Accumulate } from "./dtos/Accumulate.js";
import type { Refine } from "./dtos/Refine.js";

export type BuilderContructor<T> = new (
  initial: any,
  refiners: Refine[],
  accumulate?: Accumulate,
  metadata?: Record<string, any>,
) => T;

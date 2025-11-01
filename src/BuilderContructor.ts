import type { Accumulate } from "./dtos/Accumulate";
import type { Refine } from "./dtos/Refine";

export type BuilderContructor<T> = new (
  initial: any,
  refiners: Refine[],
  accumulate?: Accumulate,
  metadata?: Record<string, any>,
) => T;

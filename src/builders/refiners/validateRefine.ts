import type { Refine } from "../../dtos/Refine.js";
import { ValidationError } from "../../errors/ValidationError.js";

export type ValidateFn<T> = (value: T) => boolean;

/**
 * Custom message for a failed validation. It can be a fixed message or a
 * function that receives the rejected value and returns either a message or
 * the error to be thrown.
 */
export type ValidateMessage<T> = string | ((value: T) => Error | string);

const describeTarget = (
  arg: string,
  metadata: { matches?: string[]; positional?: boolean },
): string => {
  if (Array.isArray(metadata.matches) && metadata.matches.length > 0)
    return metadata.matches.join(", ");
  if (metadata.positional === true) return "argument";
  return arg;
};

/**
 * Runs `validateFn` with the value refined so far. If it returns `false` the
 * parse is aborted throwing a `ValidationError` (or the error returned by
 * `customMessage`).
 */
export const validateRefine =
  <T>(validateFn: ValidateFn<T>, customMessage?: ValidateMessage<T>): Refine =>
  (arg, index, args, context, builder) => {
    if (context === null) return null;

    const value = context.value as T;
    if (validateFn(value)) return context;

    const target = describeTarget(arg, {
      matches: builder?.spec.getMetadata<string[] | undefined>("matches"),
      positional: builder?.spec.getMetadata<boolean | undefined>("positional"),
    });

    if (typeof customMessage === "function") {
      const result = customMessage(value);
      if (result instanceof Error) throw result;
      throw new ValidationError(target, value, result);
    }

    throw new ValidationError(target, value, customMessage);
  };

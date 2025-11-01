import type { RefineContext } from "./RefineContext.js";

/**
 * Refinement function that allows validating and transforming arguments during processing.
 *
 * This method is used to:
 * - Validate declared arguments
 * - Declare from which argument the value is being obtained
 * - Get the value from the next argument position
 * - Transform the value if necessary
 *
 * @param arg - The argument value at position `index`. Can also be read from `args[index]`
 * @param index - Immutable position indicating which argument is being read at that moment. Used to inform the current position
 * @param args - Complete array of arguments available for reading
 * @param context - The previously processed value. Always `null` when called for the first time
 * @returns The new refined context with processed and transformed values, or `null` to block refinement when transformation is not possible
 *
 * @example
 * ```ts
 * // Basic transformation example
 * const refine: Refine = (arg, index, args, context) => {
 *   // Get the next argument to designate the value
 *   const nextArg = args[index + 1];
 *
 *   // Transform the value if necessary
 *   const transformedValue = arg.toUpperCase();
 *
 *   return {
 *     ...context,
 *     value: transformedValue
 *   };
 * };
 *
 * // Example with refinement blocking
 * const uppercaseRefine: Refine = (arg, index, args, context) => {
 *   if (typeof context?.value === "string") {
 *     return {
 *       ...context,
 *       value: context.value.toUpperCase(),
 *     };
 *   }
 *   // Returning null blocks refinement when transformation is not possible
 *   return null;
 * };
 * ```
 */
export type Refine = (
  arg: string,
  index: number,
  args: string[],
  context: RefineContext,
) => RefineContext;

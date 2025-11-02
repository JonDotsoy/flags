import type { Refine, Accumulate, ResultParser, RefineContext } from "../flags";

export type InitialType<T extends Spec<any, any>> =
  T extends Spec<infer U, any> ? U : never;

/** Inmutable class */
export class Spec<InitialValue, ParseResult> {
  #refiners: Refine[];
  #initial: InitialValue;
  #accumulate?: Accumulate;
  #metadata: Record<string, any>;

  constructor(
    initial: InitialValue,
    refiners: Refine[],
    accumulate?: Accumulate,
    metadata?: Record<string, any>,
  ) {
    this.#initial = initial;
    this.#refiners = refiners;
    this.#accumulate = accumulate;
    this.#metadata = metadata ?? {};
  }

  initial<T>(initial: T) {
    return new Spec<T, ParseResult>(
      initial,
      this.#refiners,
      this.#accumulate,
      this.#metadata,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new Spec(this.#initial, this.#refiners, accumulate, this.#metadata);
  }
  refine<U>(refine: Refine) {
    return new Spec<InitialValue, U>(
      this.#initial,
      [...this.#refiners, refine],
      this.#accumulate,
      this.#metadata,
    );
  }

  metadata(values: Record<string, any>) {
    return new Spec(this.#initial, this.#refiners, this.#accumulate, {
      ...this.#metadata,
      ...values,
    });
  }

  getMetadata<T>(key: string): T {
    return this.#metadata[key] as T;
  }

  hasMetadata(key: string): boolean {
    return key in this.#metadata;
  }

  copyMetadata(): Record<string, any> {
    return { ...this.#metadata };
  }

  getInitial() {
    return this.#initial;
  }

  getAccumulate() {
    return this.#accumulate;
  }

  getRefiners() {
    return this.#refiners;
  }

  parse(
    startIndex: number,
    args: string[],
    prevValue: { current: any } | undefined,
    builder: Builder<any>,
  ): null | ResultParser<ParseResult> {
    if (args.length === 0 || startIndex >= args.length) {
      return null;
    }

    let context: RefineContext = null;
    const arg = args[startIndex];

    // Apply each refiner in sequence
    for (const refiner of this.#refiners) {
      const result = refiner(arg, startIndex, args, context, builder);

      if (result === null) {
        return null;
      }

      context = {
        args: result.args,
        index: startIndex,
        value: result.value,
      };
    }

    // If no refiners or all passed, return the final context
    if (context) {
      // Extract the consumed args from the original args array
      const consumedArgs = args.slice(
        startIndex,
        startIndex + context.args.length,
      );

      // Apply accumulate function if it exists
      let finalValue = context.value;
      if (this.#accumulate && prevValue) {
        // Use prevValue if provided, otherwise use initial value
        finalValue = this.#accumulate(
          prevValue?.current,
          context.value,
          startIndex,
          args,
        );
      }

      return {
        args: consumedArgs,
        index: startIndex,
        value: finalValue,
      };
    }

    return null;
  }

  static create() {
    return new Spec<null, null>(null, []);
  }
}

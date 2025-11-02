import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import type { Spec } from "./Spec.js";

export class Builder<T extends Spec<any, any>> {
  constructor(readonly spec: T) {}

  initial<T>(initial: T) {
    return new Builder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new Builder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new Builder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new Builder(this.spec.metadata(values));
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  parse(startIndex: number, args: string[], prevValue?: { current: any }) {
    return this.spec.parse(startIndex, args, prevValue, this);
  }
}

import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { BooleanCommandBuilder } from "./BooleanCommandBuilder.js";
import { toBooleanRefine } from "./refiners/templateRefine.js";

export class CommandBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new CommandBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new CommandBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new CommandBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new CommandBuilder(this.spec.metadata(values));
  }

  string() {
    return this;
  }

  boolean() {
    return new BooleanCommandBuilder<Spec<any, boolean>>(this.spec.refine(toBooleanRefine));
  }

  transform<T>(transform: (value: InitialType<this["spec"]>) => T) {
    return new CommandBuilder(this.spec.refine<T>(transformRefine(transform)));
  }

  static create(argumentMatch: string) {
    return new CommandBuilder(Spec.create()).refine(
      argumentMatchRefine(argumentMatch),
    );
  }
}

import { Builder } from "./Builder.js";
import {
  Spec,
  type InitialType,
  type ParseResultType,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { BooleanCommandBuilder } from "./BooleanCommandBuilder.js";
import { toBooleanRefine } from "./refiners/templateRefine.js";
import { restArgsRefine } from "./refiners/restArgsRefine.js";

export class CommandBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<U>(initial: U) {
    return new CommandBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new CommandBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new CommandBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new CommandBuilder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  string() {
    return this;
  }

  boolean() {
    return new BooleanCommandBuilder<Spec<boolean, boolean>>(
      this.spec.initial(false).refine(toBooleanRefine),
    );
  }

  transform<T>(transform: (value: ParseResultType<this["spec"]>) => T) {
    return new CommandBuilder(this.spec.refine<T>(transformRefine(transform)));
  }

  restArgs() {
    return this.refine<string[]>(restArgsRefine);
  }

  static create(argumentMatch: string) {
    return new CommandBuilder<Spec<null, string>>(
      Spec.create().refine<string>(argumentMatchRefine(argumentMatch)),
    );
  }
}

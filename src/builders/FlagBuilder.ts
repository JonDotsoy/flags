import { Builder } from "./Builder.js";
import {
  Spec,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { flagMatchRefine } from "./refiners/flagMatchRefine.js";
import { StringFlagBuilder } from "./StringFlagBuilder.js";
import { stringFlagRefine } from "./refiners/stringFlagRefine.js";
import { NumberFlagBuilder } from "./NumberFlagBuilder.js";
import { numberFlagRefine } from "./refiners/numberFlagRefine.js";
import { KeyValueFlagBuilder } from "./KeyValueFlagBuilder.js";
import { keyValueFlagRefine } from "./refiners/keyValueFlagRefine.js";
import { keyValueAccumulate } from "./accumulates/keyValueAccumulate.js";
import { BooleanFlagBuilder } from "./BooleanFlagBuilder.js";
import { booleanFlagRefine } from "./refiners/booleanFlagRefine.js";
import { StringsFlagBuilder } from "./StringsFlagBuilder.js";
import { stringsFlagRefine } from "./refiners/stringsFlagRefine.js";
import { stringsAccumulate } from "./accumulates/stringsAccumulate.js";
import { restArgsRefine } from "./refiners/restArgsRefine.js";
import { RestArgsFlagBuilder } from "./RestArgsFlagBuilder.js";

export class FlagBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<U>(initial: U) {
    return new FlagBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new FlagBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new FlagBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new FlagBuilder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }

  string() {
    return new StringFlagBuilder(
      this.spec.initial<string | null>(null).refine<string>(stringFlagRefine),
    );
  }

  strings() {
    const specWithRefine = this.spec
      .initial<string[]>([])
      .refine<string[]>(stringsFlagRefine);
    return new StringsFlagBuilder(specWithRefine.accumulate(stringsAccumulate));
  }

  number() {
    return new NumberFlagBuilder(
      this.spec.initial<number | null>(null).refine<number>(numberFlagRefine),
    );
  }

  boolean() {
    return new BooleanFlagBuilder(
      this.spec.initial(false).refine<boolean>(booleanFlagRefine),
    );
  }

  keyValue() {
    return new KeyValueFlagBuilder(
      this.spec
        .refine<Record<string, string>>(keyValueFlagRefine)
        .initial(null)
        .accumulate(keyValueAccumulate),
    );
  }

  restArgs() {
    return new RestArgsFlagBuilder(
      this.spec.initial<null>(null).refine<string[]>(restArgsRefine),
    );
  }

  static create(...aliases: string[]) {
    const spec = Spec.create().metadata({ matches: aliases });
    return new FlagBuilder(spec.refine(flagMatchRefine));
  }
}

import { Builder } from "./Builder.js";
import { Spec } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { StringsArgumentBuilder } from "./StringsArgumentBuilder.js";
import { toListRefine } from "./refiners/toListRefine.js";
import { listAccumulate } from "./accumulates/listAccumulate.js";
import { NumberArgumentBuilder } from "./NumberArgumentBuilder.js";
import { toNumberRefine } from "./refiners/toNumberRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import type {
  InitialType,
  ParseResultType,
  RedefineInitialValue,
  RedefineParseResult,
} from "./Spec.js";
import { regexMatchRefine } from "./refiners/regexMatchRefine.js";
import { RestArgsArgumentBuilder } from "./RestArgsArgumentBuilder.js";
import { restArgsRefine } from "./refiners/restArgsRefine.js";

export class ArgumentBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<U>(initial: U) {
    return new ArgumentBuilder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new ArgumentBuilder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new ArgumentBuilder(
      this.spec.refine(refine) as RedefineParseResult<T, U>,
    );
  }

  metadata(values: Record<string, any>) {
    return new ArgumentBuilder(this.spec.metadata(values) as T);
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

  strings() {
    return new StringsArgumentBuilder(
      this.spec.refine(toListRefine).accumulate(listAccumulate),
    );
  }

  number() {
    return new NumberArgumentBuilder(
      this.spec.initial(null).refine<number>(toNumberRefine),
    );
  }

  transform<U>(transform: (value: ParseResultType<T>) => U) {
    return new ArgumentBuilder(this.spec.refine<U>(transformRefine(transform)));
  }

  match(regex: RegExp) {
    return new ArgumentBuilder(this.spec.refine(regexMatchRefine(regex)));
  }

  restArgs() {
    return new RestArgsArgumentBuilder(
      this.spec.initial(null).refine<string[]>(restArgsRefine),
    );
  }

  static create() {
    return new ArgumentBuilder<Spec<null, string>>(
      Spec.create().refine<string>((arg, index, args) => {
        return {
          args: args.slice(0, index + 1),
          index: index,
          value: arg,
        };
      }),
    );
  }
}

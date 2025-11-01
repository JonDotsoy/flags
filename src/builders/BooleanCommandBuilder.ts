import { Builder } from "./Builder.js";
import { Spec, type InitialType } from "./Spec.js";
import type { Accumulate } from "../dtos/Accumulate.js";
import type { Refine } from "../dtos/Refine.js";
import { argumentMatchRefine } from "./refiners/argumentMatchRefine.js";
import { transformRefine } from "./refiners/transformRefine.js";
import { CommandBuilder } from "./CommandBuilder.js";

export class BooleanCommandBuilder<T extends Spec<any, any>> extends Builder<T> {
  initial<T>(initial: T) {
    return new BooleanCommandBuilder(this.spec.initial(initial));
  }

  accumulate(accumulate: Accumulate) {
    return new BooleanCommandBuilder(this.spec.accumulate(accumulate));
  }

  refine<U>(refine: Refine) {
    return new BooleanCommandBuilder(this.spec.refine(refine));
  }

  metadata(values: Record<string, any>) {
    return new BooleanCommandBuilder(this.spec.metadata(values));
  }

  /**
   * Captures all remaining arguments after this command.
   * This overrides the boolean behavior to return an array of strings.
   */
  restArgs() {
    const restArgsRefine: Refine = (arg, index, args, context) => {
      if (!context) return null;
      
      // Capture all remaining arguments after the command
      const remainingArgs = args.slice(index + 1);
      return {
        args: args.slice(index),
        index: index,
        value: remainingArgs,
      };
    };
    
    return new CommandBuilder(
      this.spec.initial(null).refine(restArgsRefine)
    );
  }
}

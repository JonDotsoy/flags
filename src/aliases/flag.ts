import { FlagBuilder } from "../builders/FlagBuilder.js";

export { FlagBuilder } from "../builders/FlagBuilder.js";
export { NumberFlagBuilder as numberFlag } from "../builders/NumberFlagBuilder.js";
export { StringFlagBuilder as stringFlag } from "../builders/StringFlagBuilder.js";
export { BooleanFlagBuilder as booleanFlag } from "../builders/BooleanFlagBuilder.js";

export const flag = (...aliases: string[]) => ({
  string: () => FlagBuilder.create(...aliases).string(),
  strings: () => FlagBuilder.create(...aliases).strings(),
  restArgs: () => FlagBuilder.create(...aliases).restArgs(),
  boolean: () => FlagBuilder.create(...aliases).boolean(),
  number: () => FlagBuilder.create(...aliases).number(),
  keyValue: () => FlagBuilder.create(...aliases).keyValue(),
});

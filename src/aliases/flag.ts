import { FlagBuilder } from "../builders/FlagBuilder.js";

export { FlagBuilder } from "../builders/FlagBuilder.js";
export { NumberFlagBuilder as numberFlag } from "../builders/NumberFlagBuilder.js";
export { StringFlagBuilder as stringFlag } from "../builders/StringFlagBuilder.js";

export const flag = (...aliases: string[]) => FlagBuilder.create();

import { ArgumentBuilder } from "../builders/ArgumentBuilder.js";

export { ArgumentBuilder } from "../builders/ArgumentBuilder.js";
export { NumberArgumentBuilder } from "../builders/NumberArgumentBuilder.js";
export { StringsArgumentBuilder } from "../builders/StringsArgumentBuilder.js";

export const argument = () => ArgumentBuilder.create();

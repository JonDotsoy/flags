import { CommandBuilder } from "../builders/CommandBuilder.js";

export { CommandBuilder } from "../builders/CommandBuilder.js";
export { BooleanCommandBuilder } from "../builders/BooleanCommandBuilder.js";

export const command = (argumentMatch: string) =>
  CommandBuilder.create(argumentMatch);

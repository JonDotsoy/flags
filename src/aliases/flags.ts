import type { Builder } from "../builders/Builder.js";
import { FlagsParser } from "../FlagsParser.js";

export { FlagsParser } from "../FlagsParser.js";

export const flags = <T extends Record<string, Builder<any>>>(schema: T) =>
  new FlagsParser(schema, { program: "cli" });

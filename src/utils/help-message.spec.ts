import { describe, test, expect } from "bun:test";
import { flags, FlagsParser } from "../aliases/flags";
import { flag } from "../aliases/flag";
import { command } from "../aliases/command";
import { untab } from "./untab.spec";
import type { Builder } from "../builders/Builder";

type HelpMessageScenario<T extends FlagsParser<Record<string, Builder<any>>>> =
  {
    "given a flags parser configured with a schema": T;
    "when the help message is requested with arguments": Parameters<
      T["helpMessage"]
    >;
    "then the expected help message should be returned": string;
  };

const isHelpMessageScenario = (value: any): value is HelpMessageScenario<any> =>
  typeof value === "object" &&
  value !== null &&
  "given a flags parser configured with a schema" in value &&
  "when the help message is requested with arguments" in value &&
  "then the expected help message should be returned" in value;

const gherkinScenario = <T extends FlagsParser<Record<string, Builder<any>>>>(
  obj: HelpMessageScenario<T>,
) => {
  if (isHelpMessageScenario(obj)) {
    const given = obj["given a flags parser configured with a schema"];
    const then = obj["then the expected help message should be returned"];
    const helpMessage = given.helpMessage();
    expect(helpMessage).toEqual(then);
  }
};

describe("test", () => {
  test("should generate help message with program, description, flags and commands", () => {
    gherkinScenario({
      "given a flags parser configured with a schema": flags({
        verbose: flag("--verbose", "-v")
          .boolean()
          .describe("Enable verbose output"),
        port: flag("--port", "-p")
          .number()
          .default(3000)
          .describe("Server port"),
        ip: flag("--ip")
          .string()
          .describe("IPv4 address (e.g., 172.30.100.104)"),
        build: command("build").boolean().describe("Build the project"),
      })
        .program("mycli")
        .describe("My awesome CLI tool"),
      "when the help message is requested with arguments": [],
      "then the expected help message should be returned": untab`\
        Usage: mycli

        My awesome CLI tool

        Options:
          -v, --verbose.           Enable verbose output
          -p, --port <number>      Server port
              --ip                 IPv4 address (e.g., 172.30.100.104)

        Commands:
          build                    Build the project
      `,
    });
  });
});

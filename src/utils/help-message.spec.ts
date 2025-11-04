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

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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
      "when the help message is requested with arguments": [
        {
          terminalWidth: Infinity,
        },
      ],
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
  test("test3", () => {
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
          .describe(
            "allows you to specify the IP address on which the " +
              "server should run. With this parameter, the user can " +
              "define whether the server will be accessible only " +
              "locally or available to other devices on the " +
              "network. For example, using `--ip 127.0.0.1` " +
              "restricts access to the local machine, while " +
              "`--ip 0.0.0.0` enables the server to accept external " +
              "connections. This flag provides flexibility for " +
              "development, testing, or production environments, " +
              "allowing you to adjust the server's accessibility " +
              "and security based on your needs.",
          ),
        build: command("build").boolean().describe("Build the project"),
      })
        .program("mycli")
        .describe(
          "This software is designed to automatically launch and manage a server with " +
            "minimal user intervention. It provides a streamlined setup process that " +
            "configures all required components and dependencies, ensuring that the server is " +
            "ready to operate within minutes. Once running, the software monitors server " +
            "performance, handles incoming requests, and maintains stable connectivity. It " +
            "includes built-in tools for logging, error handling, and security to safeguard " +
            "data and support reliable operation. Ideal for development and production " +
            "environments, this solution simplifies server deployment, reduces manual " +
            "configuration tasks, and helps users focus on building applications rather than " +
            "managing infrastructure.",
        ),
      "when the help message is requested with arguments": [
        {
          terminalWidth: 80,
        },
      ],
      "then the expected help message should be returned": untab`\
        Usage: mycli

        This software is designed to automatically launch and manage a server with
        minimal user intervention. It provides a streamlined setup process that
        configures all required components and dependencies, ensuring that the server
        is ready to operate within minutes. Once running, the software monitors
        server performance, handles incoming requests, and maintains stable
        connectivity. It includes built-in tools for logging, error handling, and
        security to safeguard data and support reliable operation. Ideal for
        development and production environments, this solution simplifies server
        deployment, reduces manual configuration tasks, and helps users focus on
        building applications rather than managing infrastructure.

        Options:
          -v, --verbose.           Enable verbose output
          -p, --port <number>      Server port
              --ip                 allows you to specify the IP address on which the
                                   server should run. With this parameter, the user
                                   can define whether the server will be accessible
                                   only locally or available to other devices on the
                                   network. For example, using \`--ip 127.0.0.1\`
                                   restricts access to the local machine, while \`--ip
                                   0.0.0.0\` enables the server to accept external
                                   connections. This flag provides flexibility for
                                   development, testing, or production environments,
                                   allowing you to adjust the server's accessibility
                                   and security based on your needs.

        Commands:
          build                    Build the project
      `,
    });
  });
  test("test2", () => {
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
        .describe(
          "This software is designed to automatically launch and manage a server with " +
            "minimal user intervention. It provides a streamlined setup process that " +
            "configures all required components and dependencies, ensuring that the server is " +
            "ready to operate within minutes. Once running, the software monitors server " +
            "performance, handles incoming requests, and maintains stable connectivity. It " +
            "includes built-in tools for logging, error handling, and security to safeguard " +
            "data and support reliable operation. Ideal for development and production " +
            "environments, this solution simplifies server deployment, reduces manual " +
            "configuration tasks, and helps users focus on building applications rather than " +
            "managing infrastructure.",
        ),
      "when the help message is requested with arguments": [
        {
          terminalWidth: 80,
        },
      ],
      "then the expected help message should be returned": untab`\
        Usage: mycli

        This software is designed to automatically launch and manage a server with
        minimal user intervention. It provides a streamlined setup process that
        configures all required components and dependencies, ensuring that the server
        is ready to operate within minutes. Once running, the software monitors
        server performance, handles incoming requests, and maintains stable
        connectivity. It includes built-in tools for logging, error handling, and
        security to safeguard data and support reliable operation. Ideal for
        development and production environments, this solution simplifies server
        deployment, reduces manual configuration tasks, and helps users focus on
        building applications rather than managing infrastructure.

        Options:
          -v, --verbose.           Enable verbose output
          -p, --port <number>      Server port
              --ip                 IPv4 address (e.g., 172.30.100.104)

        Commands:
          build                    Build the project
      `,
    });
  });

  test("test4", () => {
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
          .describe(
            "allows you to specify the IP address on which the " +
              "server should run. With this parameter, the user can " +
              "define whether the server will be accessible only " +
              "locally or available to other devices on the " +
              "network. For example, using \x1b[31m`--ip 127.0.0.1`\x1b[0m " +
              "restricts access to the local machine, while " +
              "\x1b[31m`--ip 0.0.0.0`\x1b[0m enables the server to accept external " +
              "connections. This flag provides flexibility for " +
              "development, testing, or production environments, " +
              "allowing you to adjust the server's accessibility " +
              "and security based on your needs.",
          ),
        build: command("build").boolean().describe("Build the project"),
      })
        .program("mycli")
        .describe(
          "This software is designed to automatically launch and manage a server with " +
            "minimal user intervention. It provides a streamlined setup process that " +
            "configures all required components and dependencies, ensuring that the server is " +
            "ready to operate within minutes. Once running, the software monitors server " +
            "performance, handles incoming requests, and maintains stable connectivity. It " +
            "includes built-in tools for logging, error handling, and security to safeguard " +
            "data and support reliable operation. Ideal for development and production " +
            "environments, this solution simplifies server deployment, reduces manual " +
            "configuration tasks, and helps users focus on building applications rather than " +
            "managing infrastructure.",
        ),
      "when the help message is requested with arguments": [
        {
          terminalWidth: 80,
        },
      ],
      "then the expected help message should be returned": untab`\
        Usage: mycli

        This software is designed to automatically launch and manage a server with
        minimal user intervention. It provides a streamlined setup process that
        configures all required components and dependencies, ensuring that the server
        is ready to operate within minutes. Once running, the software monitors
        server performance, handles incoming requests, and maintains stable
        connectivity. It includes built-in tools for logging, error handling, and
        security to safeguard data and support reliable operation. Ideal for
        development and production environments, this solution simplifies server
        deployment, reduces manual configuration tasks, and helps users focus on
        building applications rather than managing infrastructure.

        Options:
          -v, --verbose.           Enable verbose output
          -p, --port <number>      Server port
              --ip                 allows you to specify the IP address on which the
                                   server should run. With this parameter, the user
                                   can define whether the server will be accessible
                                   only locally or available to other devices on the
                                   network. For example, using \x1b[31m\`--ip 127.0.0.1\`\x1b[0m
                                   restricts access to the local machine, while \x1b[31m\`--ip
                                   0.0.0.0\`\x1b[0m enables the server to accept external
                                   connections. This flag provides flexibility for
                                   development, testing, or production environments,
                                   allowing you to adjust the server's accessibility
                                   and security based on your needs.

        Commands:
          build                    Build the project
      `,
    });
  });
});

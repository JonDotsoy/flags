import { describe, it, expect, expectTypeOf } from "bun:test";
import { flags, flag, command, argument } from "./flags";

describe("new-flags", () => {
  describe("Builder with two templates", () => {
    it("should have initialValue method that returns initial value type", () => {
      // Given: A flag builder for a boolean flag
      const booleanFlag = flag("--verbose").boolean();

      // When: Getting the initial value
      const initialValue = booleanFlag.getInitial();

      // Then: The initial value should be false for boolean flags
      expect(initialValue).toBe(false);
      expectTypeOf(initialValue).toEqualTypeOf<boolean>();
    });

    it("should have test method that validates if argument can be parsed", () => {
      // Given: A flag builder for a string flag
      const stringFlag = flag("--name").string();

      // When: Testing if an argument matches the flag with space syntax
      const matchSpace = stringFlag.test("--name", 0, ["--name", "value"]);

      // Then: test should return match info with args consumed and parsed value
      expect(matchSpace).toEqual({
        index: 0,
        args: ["--name", "value"],
        parsed: "value",
      });

      // When: Testing if an argument matches the flag with = syntax
      const matchEquals = stringFlag.test("--name=value", 0, ["--name=value"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchEquals).toEqual({
        index: 0,
        args: ["--name=value"],
        parsed: "value",
      });

      // When: Testing if an argument does not match
      const noMatch = stringFlag.test("--other", 0, ["--other", "value"]);

      // Then: test should return null for non-matching flag
      expect(noMatch).toBe(null);
    });

    it("should have test method that returns parsed value directly", () => {
      // Given: A flag builder for a string flag
      const stringFlag = flag("--name").string();

      // When: Testing an argument
      const match = stringFlag.test("--name", 0, ["--name", "john"]);

      // Then: The match should contain the parsed value
      expect(match).not.toBe(null);
      expect(match?.parsed).toBe("john");
      expectTypeOf(match?.parsed).toEqualTypeOf<string | null | undefined>();
    });

    it("should return correct initial value for string flags", () => {
      // Given: A string flag
      const stringFlag = flag("--host").string();

      // When: Getting initial value
      const initialValue = stringFlag.getInitial();

      // Then: Initial value should be null
      expect(initialValue).toBe(null);
      expectTypeOf(initialValue).toEqualTypeOf<string | null>();
    });

    it("should return correct initial value for number flags", () => {
      // Given: A number flag
      const numberFlag = flag("--port").number();

      // When: Getting initial value
      const initialValue = numberFlag.getInitial();

      // Then: Initial value should be null
      expect(initialValue).toBe(null);
      expectTypeOf(initialValue).toEqualTypeOf<number | null>();
    });

    it("should return correct initial value for strings array flags", () => {
      // Given: A strings array flag
      const stringsFlag = flag("--label").strings();

      // When: Getting initial value
      const initialValue = stringsFlag.getInitial();

      // Then: Initial value should be empty array
      expect(initialValue).toEqual([]);
      expectTypeOf(initialValue).toEqualTypeOf<string[]>();
    });

    it("should return correct initial value for keyValue flags", () => {
      // Given: A keyValue flag
      const kvFlag = flag("--config").keyValue();

      // When: Getting initial value
      const initialValue = kvFlag.getInitial();

      // Then: Initial value should be empty object
      expect(initialValue).toEqual({});
      expectTypeOf(initialValue).toEqualTypeOf<Record<string, string>>();
    });

    it("should return default value as initial value when default is set", () => {
      // Given: A number flag with default value
      const numberFlag = flag("--port").number().default(3000);

      // When: Getting initial value
      const initialValue = numberFlag.getInitial();

      // Then: Initial value should be the default value
      expect(initialValue).toBe(3000);
      expectTypeOf(initialValue).toEqualTypeOf<number>();
    });

    it("should parse strings array flag correctly", () => {
      // Given: A strings array flag
      const stringsFlag = flag("--label").strings();

      // When: Getting initial value
      const initialValue = stringsFlag.getInitial();

      // Then: Initial value should be empty array
      expect(initialValue).toEqual([]);
      expectTypeOf(initialValue).toEqualTypeOf<string[]>();

      // Note: Individual parse calls return string values that get accumulated into the array
      // The actual accumulation logic is handled by the FlagsParser
    });

    it("should test command arguments correctly", () => {
      // Given: A command builder with restArgs
      const runCommand = command("run").restArgs();

      // When: Testing if argument matches command
      const match = runCommand.test("run", 0, ["run", "arg1", "arg2"]);

      // Then: test should return match info consuming all remaining args
      expect(match).toEqual({
        index: 0,
        args: ["run", "arg1", "arg2"],
        parsed: ["arg1", "arg2"],
      });

      // When: Testing if argument does not match
      const noMatch = runCommand.test("other", 0, ["other", "arg1"]);

      // Then: test should return null for non-matching command
      expect(noMatch).toBe(null);
    });

    it("should test argument correctly", () => {
      // Given: An argument builder
      const arg = argument().string();

      // When: Testing if argument can be parsed (not a flag or command)
      const match = arg.test("value", 0, ["value"]);

      // Then: test should return match info with 1 argument consumed
      expect(match).toEqual({
        index: 0,
        args: ["value"],
        parsed: "value",
      });

      // When: Testing if argument is a flag
      const noMatch = arg.test("--flag", 0, ["--flag"]);

      // Then: test should return null for flags
      expect(noMatch).toBe(null);
    });

    it("should test boolean flag correctly", () => {
      // Given: A boolean flag
      const verboseFlag = flag("--verbose", "-v").boolean();

      // When: Testing with long flag
      const matchLong = verboseFlag.test("--verbose", 0, ["--verbose"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchLong).toEqual({
        index: 0,
        args: ["--verbose"],
        parsed: true,
      });

      // When: Testing with short flag
      const matchShort = verboseFlag.test("-v", 0, ["-v"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchShort).toEqual({
        index: 0,
        args: ["-v"],
        parsed: true,
      });
    });

    it("should test number flag with different syntaxes", () => {
      // Given: A number flag
      const portFlag = flag("--port").number();

      // When: Testing with space syntax
      const matchSpace = portFlag.test("--port", 0, ["--port", "3000"]);

      // Then: test should return match info with 2 arguments consumed
      expect(matchSpace).toEqual({
        index: 0,
        args: ["--port", "3000"],
        parsed: 3000,
      });

      // When: Testing with = syntax
      const matchEquals = portFlag.test("--port=3000", 0, ["--port=3000"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchEquals).toEqual({
        index: 0,
        args: ["--port=3000"],
        parsed: 3000,
      });

      // When: Testing flag without value
      const matchNoValue = portFlag.test("--port", 0, ["--port"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchNoValue).toEqual({
        index: 0,
        args: ["--port"],
        parsed: null,
      });
    });

    it("should test keyValue flag with different syntaxes", () => {
      // Given: A keyValue flag
      const configFlag = flag("--config").keyValue();

      // When: Testing with name value syntax (3 args total)
      const matchNameValue = configFlag.test("--config", 0, [
        "--config",
        "host",
        "localhost",
      ]);

      // Then: test should return match info with 3 arguments consumed
      expect(matchNameValue).toEqual({
        index: 0,
        args: ["--config", "host", "localhost"],
        parsed: { host: "localhost" },
      });

      // When: Testing with name=value syntax (2 args total)
      const matchNameEquals = configFlag.test("--config", 0, [
        "--config",
        "host=localhost",
      ]);

      // Then: test should return match info with 2 arguments consumed
      expect(matchNameEquals).toEqual({
        index: 0,
        args: ["--config", "host=localhost"],
        parsed: { host: "localhost" },
      });

      // When: Testing with --flag=name=value syntax (1 arg total)
      const matchAllEquals = configFlag.test("--config=host=localhost", 0, [
        "--config=host=localhost",
      ]);

      // Then: test should return match info with 1 argument consumed
      expect(matchAllEquals).toEqual({
        index: 0,
        args: ["--config=host=localhost"],
        parsed: { host: "localhost" },
      });
    });

    it("should test boolean command correctly", () => {
      // Given: A boolean command
      const userCommand = command("user").boolean();

      // When: Testing if argument matches command
      const match = userCommand.test("user", 0, ["user"]);

      // Then: test should return match info with 1 argument consumed
      expect(match).toEqual({
        index: 0,
        args: ["user"],
        parsed: true,
      });
    });
  });

  describe("Builder inheritance", () => {
    it("should verify FlagBuilder, CommandBuilder, and ArgumentBuilder extend Builder with correct generic types", () => {
      // Given: A boolean flag builder
      const booleanFlag = flag("--test");

      // Then: It should extend Builder<boolean, boolean>
      expectTypeOf(booleanFlag.getInitial()).toEqualTypeOf<boolean>();

      // Given: A string flag builder
      const stringFlag = flag("--name").string();

      // Then: It should extend Builder<string | null, string | null>
      expectTypeOf(stringFlag.getInitial()).toEqualTypeOf<string | null>();

      // Given: A required string flag builder
      const requiredStringFlag = flag("--name").string().required();

      // Then: It should extend Builder<string | null, string> (ParseResult changes to non-null)
      expectTypeOf(requiredStringFlag.getInitial()).toEqualTypeOf<
        string | null
      >();
      const testResult = requiredStringFlag.test("--name", 0, [
        "--name",
        "value",
      ]);
      if (testResult) {
        expectTypeOf(testResult.parsed).toEqualTypeOf<string>();
      }
    });

    it("should verify FlagBuilder, CommandBuilder, and ArgumentBuilder extend Builder", () => {
      // Given: Instances of each builder type
      const flagBuilder = flag("--test");
      const commandBuilder = command("test");
      const argumentBuilder = argument();

      // Then: All builders should have the describe method from the base Builder class
      expect(typeof flagBuilder.describe).toBe("function");
      expect(typeof commandBuilder.describe).toBe("function");
      expect(typeof argumentBuilder.describe).toBe("function");

      // Then: All builders should have the toConfig method
      expect(typeof flagBuilder.toConfig).toBe("function");
      expect(typeof commandBuilder.toConfig).toBe("function");
      expect(typeof argumentBuilder.toConfig).toBe("function");
    });

    it("should allow describe() to be called on all builder types", () => {
      // Given: Builders with descriptions
      const flagWithDesc = flag("--test").describe("Test flag");
      const commandWithDesc = command("test").describe("Test command");
      const argumentWithDesc = argument().describe("Test argument");

      // When: Getting configs
      const flagConfig = flagWithDesc.toConfig();
      const commandConfig = commandWithDesc.toConfig();
      const argumentConfig = argumentWithDesc.toConfig();

      // Then: All configs should have descriptions in metadata
      expect(flagConfig.metadata.description).toBe("Test flag");
      expect(commandConfig.metadata.description).toBe("Test command");
      expect(argumentConfig.metadata.description).toBe("Test argument");
    });

    it("should maintain fluent API after describe() for all builders", () => {
      // Given: Builders with chained methods including describe
      const flagBuilder = flag("--port")
        .number()
        .describe("Port number")
        .required();

      const commandBuilder = command("run").restArgs().describe("Run command");

      const argumentBuilder = argument()
        .string()
        .describe("Input file")
        .required();

      // When: Getting configs
      const flagConfig = flagBuilder.toConfig();
      const commandConfig = commandBuilder.toConfig();
      const argumentConfig = argumentBuilder.toConfig();

      // Then: All configs should have descriptions and other properties in metadata
      expect(flagConfig.metadata.description).toBe("Port number");
      expect(flagConfig.type).toBe("number");
      expect(flagConfig.metadata.isRequired).toBe(true);

      expect(commandConfig.metadata.description).toBe("Run command");

      expect(argumentConfig.metadata.description).toBe("Input file");
      expect(argumentConfig.type).toBe("string");
      // expect(argumentConfig.required).toBe(true);
    });
  });

  it("should parse boolean flag with --version", () => {
    // Given: A parser with a boolean version flag
    const parser = flags({ version: flag("--version", "-v") });

    // When: Parsing arguments with --version
    const result = parser.parse(["--version"]);

    // Then: The result type should be { version: boolean }
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();

    // Then: The version should be true
    expect(result).toEqual({ version: true });
  });

  it("should parse explicit boolean flag with --version", () => {
    // Given: A parser with an explicit boolean version flag
    const parser = flags({ version: flag("--version", "-v").boolean() });

    // When: Parsing arguments with --version
    const result = parser.parse(["--version"]);

    // Then: The result type should be { version: boolean }
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();

    // Then: The version should be true
    expect(result).toEqual({ version: true });
  });

  it("should return false when boolean flag is not provided", () => {
    // Given: A parser with a boolean version flag
    const parser = flags({ version: flag("--version", "-v") });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { version: boolean }
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();

    // Then: The version should be false
    expect(result).toEqual({ version: false });
  });

  it("should return null when string flag is not provided", () => {
    // Given: A parser with a string name flag
    const parser = flags({ name: flag("--name", "-n").string() });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { name: string | null }
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();

    // Then: The name should be null
    expect(result).toEqual({ name: null });
  });

  it("should parse string flag with = syntax", () => {
    // Given: A parser with a string name flag
    const parser = flags({ name: flag("--name", "-n").string() });

    // When: Parsing arguments with --name=july cesar
    const result = parser.parse(["--name=july cesar"]);

    // Then: The result type should be { name: string | null }
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();

    // Then: The name should be "july cesar"
    expect(result).toEqual({ name: "july cesar" });
  });

  it("should parse string flag with space syntax", () => {
    // Given: A parser with a string name flag
    const parser = flags({ name: flag("--name", "-n").string() });

    // When: Parsing arguments with --name "july cesar"
    const result = parser.parse(["--name", "july cesar"]);

    // Then: The result type should be { name: string | null }
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();

    // Then: The name should be "july cesar"
    expect(result).toEqual({ name: "july cesar" });
  });

  it("should parse single string array flag", () => {
    // Given: A parser with a strings array flag
    const parser = flags({ labels: flag("--label", "-l").strings() });

    // When: Parsing arguments with a single --label
    const result = parser.parse(["--label", "blue"]);

    // Then: The result type should be { labels: string[] }
    expectTypeOf(result).toEqualTypeOf<{ labels: string[] }>();

    // Then: The labels should contain ["blue"]
    expect(result).toEqual({ labels: ["blue"] });
  });

  it("should parse multiple string array flags", () => {
    // Given: A parser with a strings array flag
    const parser = flags({ labels: flag("--label", "-l").strings() });

    // When: Parsing arguments with multiple --label flags
    const result = parser.parse(["--label", "blue", "--label", "red"]);

    // Then: The result type should be { labels: string[] }
    expectTypeOf(result).toEqualTypeOf<{ labels: string[] }>();

    // Then: The labels should contain ["blue", "red"]
    expect(result).toEqual({ labels: ["blue", "red"] });
  });

  it("should throw error for unexpected argument", () => {
    // Given: A parser with no flags configured
    const parser = flags({});

    // When/Then: Parsing an unexpected argument should throw
    expect(() => {
      parser.parse(["foo"]);
    }).toThrow("Unexpected argument: foo");
  });
});

it("should parse number flag with space syntax", () => {
  // Given: A parser with a number port flag
  const parser = flags({ port: flag("--port", "-p").number() });

  // When: Parsing arguments with --port 3000
  const result = parser.parse(["--port", "3000"]);

  // Then: The result type should be { port: number | null }
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();

  // Then: The port should be 3000
  expect(result).toEqual({ port: 3000 });
});

it("should parse number flag with = syntax", () => {
  // Given: A parser with a number port flag
  const parser = flags({ port: flag("--port", "-p").number() });

  // When: Parsing arguments with --port=3000
  const result = parser.parse(["--port=3000"]);

  // Then: The result type should be { port: number | null }
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();

  // Then: The port should be 3000
  expect(result).toEqual({ port: 3000 });
});

it("should return null when number flag has no value", () => {
  // Given: A parser with a number port flag
  const parser = flags({ port: flag("--port", "-p").number() });

  // When: Parsing arguments with --port but no value
  const result = parser.parse(["--port"]);

  // Then: The result type should be { port: number | null }
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();

  // Then: The port should be null
  expect(result).toEqual({ port: null });
});

it("should return null when number flag is not provided", () => {
  // Given: A parser with a number port flag
  const parser = flags({ port: flag("--port", "-p").number() });

  // When: Parsing empty arguments
  const result = parser.parse([]);

  // Then: The result type should be { port: number | null }
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();

  // Then: The port should be null
  expect(result).toEqual({ port: null });
});

it("should throw when required number flag is not provided", () => {
  // Given: A parser with a required number port flag
  const parser = flags({ port: flag("--port", "-p").number().required() });

  // When/Then: Parsing empty arguments should throw
  expect(() => {
    parser.parse([]);
  }).toThrow("Required flag missing: --port");
});

it("should return number when optional number flag is provided", () => {
  // Given: A parser with an optional number port flag
  const parser = flags({ port: flag("--port", "-p").number() });

  // When: Parsing arguments with --port 3000
  const result = parser.parse(["--port", "3000"]);

  // Then: The result type should be { port: number | null }
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();

  // Then: The port should be 3000
  expect(result).toEqual({ port: 3000 });
});

it("should return number when required number flag is provided", () => {
  // Given: A parser with a required number port flag
  const parser = flags({ port: flag("--port", "-p").number().required() });

  // When: Parsing arguments with --port 3000
  const result = parser.parse(["--port", "3000"]);

  // Then: The result type should be { port: number }
  expectTypeOf(result).toEqualTypeOf<{ port: number }>();

  // Then: The port should be 3000
  expect(result).toEqual({ port: 3000 });
});

describe("helpMessage", () => {
  it("should generate help message with default format", () => {
    // Given: A parser with a required port flag
    const parser = flags({
      port: flag("--port", "-p").number().required(),
    });

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate help message with custom program name using programName()", () => {
    // Given: A parser with a required port flag and custom program name
    const parser = flags({
      port: flag("--port", "-p").number().required(),
    }).programName("myapp");

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate help message with description using describe()", () => {
    // Given: A parser with program name and description
    const parser = flags({
      verbose: flag("--verbose", "-v").boolean(),
    })
      .programName("myapp")
      .describe("A simple CLI tool");

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate help message with flag descriptions using describe()", () => {
    // Given: A parser with flags that have descriptions
    const parser = flags({
      port: flag("--port", "-p")
        .number()
        .required()
        .describe("Port number to listen on"),
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe("Enable verbose output"),
    });

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should support describe() before required()", () => {
    // Given: A parser with describe() called before required()
    const parser = flags({
      port: flag("--port", "-p").number().describe("Port number").required(),
    });

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate help message for multiple flags", () => {
    // Given: A parser with multiple flags of different types
    const parser = flags({
      port: flag("--port", "-p").number().required(),
      name: flag("--name", "-n").string(),
      verbose: flag("--verbose", "-v").boolean(),
    });

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate complete help message with all features", () => {
    // Given: A parser with all features configured
    const parser = flags({
      port: flag("--port", "-p")
        .number()
        .required()
        .describe("Port number to listen on"),
      name: flag("--name", "-n").string().describe("Application name"),
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe("Enable verbose output"),
      labels: flag("--label", "-l").strings().describe("Add labels"),
    })
      .programName("myapp")
      .describe("A simple CLI application");

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should support fluent API with programName, describe and parse", () => {
    // Given: A parser configured with fluent API
    const parser = flags({
      port: flag("--port", "-p").number().required().describe("Port number"),
    })
      .programName("myapp")
      .describe("A simple CLI tool");

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();

    // When: Parsing arguments
    const result = parser.parse(["--port", "3000"]);

    // Then: The port should be 3000
    expect(result).toEqual({ port: 3000 });
  });

  it("should support fluent API with extremely long description containing ASCII colors", () => {
    // Given: A parser configured with fluent API and an extremely long flag description with colors
    const parser = flags({
      port: flag("--port", "-p")
        .number()
        .required()
        .describe(
          "This is an \x1b[32mextremely comprehensive\x1b[0m and \x1b[35mdetailed\x1b[0m port number configuration flag that allows you to specify the \x1b[33mnetwork port\x1b[0m on which the application server will listen for incoming connections. " +
            "The port number must be a \x1b[36mvalid integer\x1b[0m between 1 and 65535, representing a TCP/IP port. " +
            "Common port numbers include \x1b[34m80\x1b[0m for HTTP, \x1b[34m443\x1b[0m for HTTPS, \x1b[34m3000\x1b[0m for development servers, and \x1b[34m8080\x1b[0m for alternative HTTP services. " +
            "This flag is \x1b[31mrequired\x1b[0m and must be provided when starting the application. " +
            "The port selection is \x1b[33mcritical\x1b[0m for proper network communication and should be chosen carefully to avoid conflicts with other running services. " +
            "Make sure the selected port is not already in use by another application and that you have the necessary \x1b[32mpermissions\x1b[0m to bind to it (ports below 1024 typically require elevated privileges on Unix-like systems). " +
            "The application will \x1b[35mautomatically\x1b[0m validate the port number and throw an error if it's invalid or unavailable.",
        ),
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe("\x1b[31mEnable verbose output\x1b[0m for detailed logging"),
    })
      .programName("myapp")
      .describe("A simple CLI tool");

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();

    // When: Parsing arguments
    const result = parser.parse(["--port", "3000", "--verbose"]);

    // Then: The result should contain all parsed values
    expect(result).toEqual({ port: 3000, verbose: true });
  });

  it("should wrap long CLI description text", () => {
    // Given: A parser with a very long CLI description and long flag descriptions
    const parser = flags({
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe(
          "Enable \x1b[32mverbose output mode\x1b[0m which provides \x1b[36mdetailed information\x1b[0m about the execution process, including step-by-step progress updates, " +
            "internal state changes, \x1b[33mconfiguration values\x1b[0m being used, \x1b[34mnetwork requests\x1b[0m being made, and any \x1b[33mwarnings\x1b[0m or informational messages. " +
            "This is particularly useful for \x1b[35mdebugging issues\x1b[0m, understanding application behavior, \x1b[36mmonitoring performance\x1b[0m, and troubleshooting problems " +
            "in \x1b[32mdevelopment\x1b[0m and \x1b[32mstaging environments\x1b[0m. The verbose output includes \x1b[34mtimestamps\x1b[0m, \x1b[34mlog levels\x1b[0m, and contextual information to help trace execution flow.",
        ),
      debug: flag("--debug", "-d").boolean().describe("Enable debug mode"),
    })
      .programName("myapp")
      .describe(
        "This is a comprehensive command-line interface tool designed to help developers manage and deploy their applications efficiently. " +
          "It provides a wide range of features including configuration management, deployment automation, monitoring capabilities, and much more. " +
          "The tool is built with modern best practices in mind and supports multiple environments including development, staging, and production.",
      );

    // When: Generating help message
    const help = parser.helpMessage({ terminalWidth: 80 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should strip ANSI colors when noColor option is true", () => {
    // Given: A parser with colored descriptions
    const parser = flags({
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe(
          "Enable \x1b[32mverbose output\x1b[0m with \x1b[36mdetailed information\x1b[0m",
        ),
      debug: flag("--debug", "-d")
        .boolean()
        .describe("Enable \x1b[31mdebug mode\x1b[0m"),
    })
      .programName("myapp")
      .describe("A \x1b[33mcommand-line interface\x1b[0m tool for developers");

    // When: Generating help message with noColor option
    const help = parser.helpMessage({ terminalWidth: 80, noColor: true });

    // Then: The help message should not contain ANSI codes
    expect(help).not.toContain("\x1b[");
    expect(help).toContain("verbose output");
    expect(help).toContain("detailed information");
    expect(help).toContain("debug mode");
    expect(help).toContain("command-line interface");

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should preserve ANSI colors when noColor option is false or undefined", () => {
    // Given: A parser with colored descriptions
    const parser = flags({
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe("Enable \x1b[32mverbose output\x1b[0m"),
    }).programName("myapp");

    // When: Generating help message without noColor option
    const helpDefault = parser.helpMessage({ terminalWidth: 80 });
    const helpFalse = parser.helpMessage({ terminalWidth: 80, noColor: false });

    // Then: Both should contain ANSI codes
    expect(helpDefault).toContain("\x1b[32m");
    expect(helpDefault).toContain("\x1b[0m");
    expect(helpFalse).toContain("\x1b[32m");
    expect(helpFalse).toContain("\x1b[0m");
  });
});

describe("default values", () => {
  it("should validate that default method only accepts number type for number flags", () => {
    // Given: A number flag with default method
    const defaultMethod = flag("--port", "-p").number().default;

    // Then: The default method should only accept number parameters
    expectTypeOf(defaultMethod).parameters.toEqualTypeOf<[number]>();
  });

  it("should validate that default method only accepts string type for string flags", () => {
    // Given: A string flag with default method
    const defaultMethod = flag("--host", "-h").string().default;

    // Then: The default method should only accept string parameters
    expectTypeOf(defaultMethod).parameters.toEqualTypeOf<[string]>();
  });

  it("should return default value when number flag is not provided", () => {
    // Given: A parser with a number flag with default value 3000
    const parser = flags({
      port: flag("--port", "-p").number().default(3000),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { port: number }
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();

    // Then: The port should be 3000
    expect(result).toEqual({ port: 3000 });
  });

  it("should return default value when string flag is not provided", () => {
    // Given: A parser with a string flag with default value "localhost"
    const parser = flags({
      host: flag("--host", "-h").string().default("localhost"),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { host: string }
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();

    // Then: The host should be "localhost"
    expect(result).toEqual({ host: "localhost" });
  });

  it("should override default value when number flag is provided", () => {
    // Given: A parser with a number flag with default value 3000
    const parser = flags({
      port: flag("--port", "-p").number().default(3000),
    });

    // When: Parsing arguments with --port 8080
    const result = parser.parse(["--port", "8080"]);

    // Then: The result type should be { port: number }
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();

    // Then: The port should be 8080
    expect(result).toEqual({ port: 8080 });
  });

  it("should override default value when string flag is provided", () => {
    // Given: A parser with a string flag with default value "localhost"
    const parser = flags({
      host: flag("--host", "-h").string().default("localhost"),
    });

    // When: Parsing arguments with --host 0.0.0.0
    const result = parser.parse(["--host", "0.0.0.0"]);

    // Then: The result type should be { host: string }
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();

    // Then: The host should be "0.0.0.0"
    expect(result).toEqual({ host: "0.0.0.0" });
  });

  it("should support default with describe for number flags", () => {
    // Given: A parser with a number flag with describe and default
    const parser = flags({
      port: flag("--port", "-p").number().describe("Port number").default(3000),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { port: number }
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();

    // Then: The port should be 3000
    expect(result).toEqual({ port: 3000 });
  });

  it("should support default with describe for string flags", () => {
    // Given: A parser with a string flag with describe and default
    const parser = flags({
      host: flag("--host", "-h")
        .string()
        .describe("Host address")
        .default("localhost"),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { host: string }
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();

    // Then: The host should be "localhost"
    expect(result).toEqual({ host: "localhost" });
  });

  it("should support describe after default for number flags", () => {
    // Given: A parser with a number flag with default and describe
    const parser = flags({
      port: flag("--port", "-p").number().default(3000).describe("Port number"),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { port: number }
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();

    // Then: The port should be 3000
    expect(result).toEqual({ port: 3000 });
  });

  it("should support describe after default for string flags", () => {
    // Given: A parser with a string flag with default and describe
    const parser = flags({
      host: flag("--host", "-h")
        .string()
        .default("localhost")
        .describe("Host address"),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { host: string }
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();

    // Then: The host should be "localhost"
    expect(result).toEqual({ host: "localhost" });
  });

  it("should handle multiple flags with different default values", () => {
    // Given: A parser with multiple flags with different default values
    const parser = flags({
      port: flag("--port", "-p").number().default(3000),
      host: flag("--host", "-h").string().default("localhost"),
      verbose: flag("--verbose", "-v").boolean(),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should match expected types
    expectTypeOf(result).toEqualTypeOf<{
      port: number;
      host: string;
      verbose: boolean;
    }>();

    // Then: All values should be their defaults
    expect(result).toEqual({
      port: 3000,
      host: "localhost",
      verbose: false,
    });
  });

  it("should handle partial override of default values", () => {
    // Given: A parser with multiple flags with default values
    const parser = flags({
      port: flag("--port", "-p").number().default(3000),
      host: flag("--host", "-h").string().default("localhost"),
    });

    // When: Parsing arguments with only --port
    const result = parser.parse(["--port", "8080"]);

    // Then: The result type should be { port: number; host: string }
    expectTypeOf(result).toEqualTypeOf<{ port: number; host: string }>();

    // Then: Port should be overridden, host should be default
    expect(result).toEqual({ port: 8080, host: "localhost" });
  });

  it("should infer non-nullable type when default is provided for number", () => {
    // Given: A parser with a number flag with default value
    const parser = flags({
      port: flag("--port", "-p").number().default(3000),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The port type should be number, not number | null
    expectTypeOf(result.port).toEqualTypeOf<number>();
  });

  it("should infer non-nullable type when default is provided for string", () => {
    // Given: A parser with a string flag with default value
    const parser = flags({
      host: flag("--host", "-h").string().default("localhost"),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The host type should be string, not string | null
    expectTypeOf(result.host).toEqualTypeOf<string>();
  });

  it("should infer nullable type when default is NOT provided for number", () => {
    // Given: A parser with a number flag without default value
    const parser = flags({
      port: flag("--port", "-p").number(),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The port type should be number | null
    expectTypeOf(result.port).toEqualTypeOf<number | null>();
  });

  it("should infer nullable type when default is NOT provided for string", () => {
    // Given: A parser with a string flag without default value
    const parser = flags({
      host: flag("--host", "-h").string(),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The host type should be string | null
    expectTypeOf(result.host).toEqualTypeOf<string | null>();
  });
});

describe("commands", () => {
  it("should parse command with restArgs", () => {
    // Given: A parser with a user command that captures rest args
    const parser = flags({
      user: command("user").restArgs(),
    });

    // When: Parsing arguments with user command and additional args
    const parsed = parser.parse([
      "user",
      "export",
      "-u",
      "123",
      "-o",
      "./export",
    ]);

    // Then: The result type should be { user: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ user: string[] | null }>();

    // Then: The user should contain all remaining arguments
    expect(parsed.user).toEqual(["export", "-u", "123", "-o", "./export"]);
  });

  it("should parse boolean command with flag", () => {
    // Given: A parser with a boolean flag and boolean command
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
    });

    // When: Parsing arguments with user command and --verbose flag
    const parsed = flagsParser.parse(["user", "--verbose"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{ verbose: boolean; user: boolean }>();

    // Then: Both user and verbose should be true
    expect(parsed.user).toBe(true);
    expect(parsed.verbose).toBe(true);
  });

  it("should parse multiple boolean commands", () => {
    // Given: A parser with a flag and multiple boolean commands
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
      info: command("info").boolean(),
    });

    // When: Parsing arguments with multiple commands and a flag
    const parsed = flagsParser.parse(["user", "info", "--verbose"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      user: boolean;
      info: boolean;
    }>();

    // Then: All commands and flag should be true
    expect(parsed.verbose).toBe(true);
    expect(parsed.user).toBe(true);
    expect(parsed.info).toBe(true);
  });

  it("should parse single command without others", () => {
    // Given: A parser with a flag and multiple boolean commands
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
      info: command("info").boolean(),
    });

    // When: Parsing arguments with only user command
    const parsed = flagsParser.parse(["user"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      user: boolean;
      info: boolean;
    }>();

    // Then: Only user should be true, others false
    expect(parsed.user).toBe(true);
    expect(parsed.info).toBe(false);
    expect(parsed.verbose).toBe(false);
  });

  it("should parse flags only without commands", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing arguments with only a flag
    const parsed = flagsParser.parse(["--name", "jhon"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      name: string | null;
      version: number | null;
      run: string[] | null;
      test: string[] | null;
    }>();

    // Then: Only name should be set, commands should be null
    expect(parsed).toEqual({
      name: "jhon",
      version: null,
      run: null,
      test: null,
    });
  });

  it("should parse flags with = syntax without commands", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing arguments with = syntax
    const parsed = flagsParser.parse(["--name=jhon"]);

    // Then: Only name should be set, commands should be null
    expect(parsed).toEqual({
      name: "jhon",
      version: null,
      run: null,
      test: null,
    });
  });

  it("should parse multiple flags with = syntax", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing multiple flags with = syntax
    const parsed = flagsParser.parse(["--name=jhon", "--version=1"]);

    // Then: Both flags should be set, commands should be null
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: null,
      test: null,
    });
  });

  it("should parse multiple flags with mixed syntax", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing flags with mixed space and = syntax
    const parsed = flagsParser.parse(["--name", "jhon", "--version=1"]);

    // Then: Both flags should be set, commands should be null
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: null,
      test: null,
    });
  });

  it("should parse flags with run command and restArgs", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing flags followed by run command
    const parsed = flagsParser.parse([
      "--name",
      "jhon",
      "--version=1",
      "run",
      "foo",
    ]);

    // Then: Flags and run command should be set
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: ["foo"],
      test: null,
    });
  });

  it("should parse flags with test command and restArgs", () => {
    // Given: A parser with flags and commands
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    // When: Parsing flags followed by test command
    const parsed = flagsParser.parse([
      "--name",
      "jhon",
      "--version=1",
      "test",
      "taz",
    ]);

    // Then: Flags and test command should be set
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: null,
      test: ["taz"],
    });
  });
});

describe("arguments", () => {
  it("should parse single argument with command", () => {
    // Given: A parser with a flag and a positional argument
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      command: argument().string(),
    });

    // When: Parsing a single positional argument
    const parsed = flagsParser.parse(["user"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      command: string | null;
    }>();

    // Then: The command should be "user" and verbose should be false
    expect(parsed.command).toBe("user");
    expect(parsed.verbose).toBe(false);
  });

  it("should throw error when extra argument is provided", () => {
    // Given: A parser with a flag and a single positional argument
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      command: argument().string(),
    });

    // When/Then: Parsing with extra arguments should throw
    expect(() => {
      flagsParser.parse(["user", "info"]);
    }).toThrow("Unexpected argument: info");
  });

  it("should parse multiple arguments", () => {
    // Given: A parser with two positional arguments
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    // When: Parsing two positional arguments
    const parsed = flagsParser.parse(["read", "123"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verb: string | null;
      userId: string | null;
    }>();

    // Then: Both arguments should be parsed correctly
    expect(parsed.verb).toBe("read");
    expect(parsed.userId).toBe("123");
  });

  it("should parse partial arguments", () => {
    // Given: A parser with two positional arguments
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    // When: Parsing only one positional argument
    const parsed = flagsParser.parse(["read"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verb: string | null;
      userId: string | null;
    }>();

    // Then: First argument should be set, second should be null
    expect(parsed.verb).toBe("read");
    expect(parsed.userId).toBe(null);
  });

  it("should throw error when too many arguments provided", () => {
    // Given: A parser with two positional arguments
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    // When/Then: Parsing with too many arguments should throw
    expect(() => {
      flagsParser.parse(["read", "123", "foo"]);
    }).toThrow("Unexpected argument: foo");
  });
});

describe("docker CLI", () => {
  const dockerFlags = flags({
    // Global Options
    config: flag("--config")
      .string()
      .describe(
        'Location of client config files (default "/Users/jonathan.delgado/.docker")',
      ),

    context: flag("-c", "--context")
      .string()
      .describe("Name of the context to use to connect to the daemon"),

    debug: flag("-D", "--debug").boolean().describe("Enable debug mode"),

    host: flag("-H", "--host").string().describe("Daemon socket to connect to"),

    logLevel: flag("-l", "--log-level")
      .string()
      .default("info")
      .describe(
        'Set the logging level ("debug", "info", "warn", "error", "fatal")',
      ),

    tls: flag("--tls").boolean().describe("Use TLS; implied by --tlsverify"),

    version: flag("-v", "--version")
      .boolean()
      .describe("Print version information and quit"),

    // Common Commands
    run: command("run")
      .restArgs()
      .describe("Create and run a new container from an image"),

    exec: command("exec")
      .restArgs()
      .describe("Execute a command in a running container"),

    ps: command("ps").restArgs().describe("List containers"),

    build: command("build")
      .restArgs()
      .describe("Build an image from a Dockerfile"),

    pull: command("pull")
      .restArgs()
      .describe("Download an image from a registry"),

    images: command("images").restArgs().describe("List images"),

    login: command("login").restArgs().describe("Authenticate to a registry"),

    // Management Commands
    container: command("container").restArgs().describe("Manage containers"),

    image: command("image").restArgs().describe("Manage images"),

    network: command("network").restArgs().describe("Manage networks"),

    volume: command("volume").restArgs().describe("Manage volumes"),
  })
    .programName("docker")
    .describe("A self-sufficient runtime for containers");

  it("should generate docker help message", () => {
    // When: Generating help message for docker CLI
    const help = dockerFlags.helpMessage({ terminalWidth: 180 });

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should parse docker --config flag", () => {
    // When: Parsing docker with --config flag
    const parsed = dockerFlags.parse(["--config", "/custom/path"]);

    // Then: Config should be set and logLevel should have default value
    expect(parsed.config).toBe("/custom/path");
    expect(parsed.logLevel).toBe("info");
  });

  it("should parse docker run command with args", () => {
    // When: Parsing docker run command with container arguments
    const parsed = dockerFlags.parse([
      "run",
      "-d",
      "-p",
      "8080:80",
      "nginx:latest",
    ]);

    // Then: Run command should capture all arguments
    expect(parsed.run).toEqual(["-d", "-p", "8080:80", "nginx:latest"]);

    // Then: Other commands should be null
    expect(parsed.exec).toBe(null);
  });

  it("should parse docker run with global flags", () => {
    // When: Parsing docker with global flags before run command
    const parsed = dockerFlags.parse([
      "--debug",
      "--host",
      "tcp://localhost:2375",
      "run",
      "nginx",
    ]);

    // Then: Global flags should be parsed
    expect(parsed.debug).toBe(true);
    expect(parsed.host).toBe("tcp://localhost:2375");

    // Then: Run command should capture remaining arguments
    expect(parsed.run).toEqual(["nginx"]);
  });

  it("should parse docker ps command", () => {
    // When: Parsing docker ps command with -a flag
    const parsed = dockerFlags.parse(["ps", "-a"]);

    // Then: Ps command should capture the -a argument
    expect(parsed.ps).toEqual(["-a"]);
  });

  it("should parse docker build with context", () => {
    // When: Parsing docker build command with tag and context
    const parsed = dockerFlags.parse(["build", "-t", "myapp:latest", "."]);

    // Then: Build command should capture all arguments
    expect(parsed.build).toEqual(["-t", "myapp:latest", "."]);
  });

  it("should parse docker exec command", () => {
    // When: Parsing docker exec command with interactive flags
    const parsed = dockerFlags.parse([
      "exec",
      "-it",
      "container_name",
      "/bin/bash",
    ]);

    // Then: Exec command should capture all arguments
    expect(parsed.exec).toEqual(["-it", "container_name", "/bin/bash"]);
  });

  it("should parse docker with short context flag", () => {
    // When: Parsing docker with short -c flag and ps command
    const parsed = dockerFlags.parse(["-c", "mycontext", "ps"]);

    // Then: Context should be set
    expect(parsed.context).toBe("mycontext");

    // Then: Ps command should be empty array
    expect(parsed.ps).toEqual([]);
  });

  it("should parse docker images command", () => {
    // When: Parsing docker images command with -a flag
    const parsed = dockerFlags.parse(["images", "-a"]);

    // Then: Images command should capture the -a argument
    expect(parsed.images).toEqual(["-a"]);
  });

  it("should parse docker pull command", () => {
    // When: Parsing docker pull command with image tag
    const parsed = dockerFlags.parse(["pull", "ubuntu:22.04"]);

    // Then: Pull command should capture the image argument
    expect(parsed.pull).toEqual(["ubuntu:22.04"]);
  });

  it("should parse docker with multiple global flags", () => {
    // When: Parsing docker with multiple global flags and container command
    const parsed = dockerFlags.parse([
      "--debug",
      "--tls",
      "-l",
      "debug",
      "container",
      "ls",
    ]);

    // Then: All global flags should be parsed
    expect(parsed.debug).toBe(true);
    expect(parsed.tls).toBe(true);
    expect(parsed.logLevel).toBe("debug");

    // Then: Container command should capture remaining arguments
    expect(parsed.container).toEqual(["ls"]);
  });

  it("should parse docker version flag", () => {
    // When: Parsing docker with --version flag
    const parsed = dockerFlags.parse(["--version"]);

    // Then: Version should be true
    expect(parsed.version).toBe(true);
  });

  it("should parse docker with log-level using = syntax", () => {
    // When: Parsing docker with --log-level using = syntax
    const parsed = dockerFlags.parse(["--log-level=warn", "ps"]);

    // Then: LogLevel should be set to warn
    expect(parsed.logLevel).toBe("warn");

    // Then: Ps command should be empty array
    expect(parsed.ps).toEqual([]);
  });
});

describe("key-value pattern", () => {
  it("should parse key-value with format: --arg name value", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing arguments with --config name value
    const result = parser.parse(["--config", "host", "localhost"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain { host: "localhost" }
    expect(result).toEqual({ config: { host: "localhost" } });
  });

  it("should parse key-value with format: --arg name=value", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing arguments with --config name=value
    const result = parser.parse(["--config", "port=3000"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain { port: "3000" }
    expect(result).toEqual({ config: { port: "3000" } });
  });

  it("should parse key-value with format: --arg=name=value", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing arguments with --config=name=value
    const result = parser.parse(["--config=db=postgres"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain { db: "postgres" }
    expect(result).toEqual({ config: { db: "postgres" } });
  });

  it("should parse multiple key-value pairs with mixed formats", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing multiple key-value pairs with different formats
    const result = parser.parse([
      "--config",
      "host",
      "localhost",
      "--config",
      "port=3000",
      "--config=db=postgres",
    ]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain all key-value pairs
    expect(result).toEqual({
      config: {
        host: "localhost",
        port: "3000",
        db: "postgres",
      },
    });
  });

  it("should parse key-value with short flag syntax", () => {
    // Given: A parser with a keyValue flag with short alias
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing arguments with short flag -c
    const result = parser.parse(["-c", "env", "production"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain { env: "production" }
    expect(result).toEqual({ config: { env: "production" } });
  });

  it("should return empty object when key-value flag is not provided", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should be an empty object
    expect(result).toEqual({ config: {} });
  });

  it("should override duplicate keys with last value", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("--config", "-c").keyValue(),
    });

    // When: Parsing arguments with duplicate keys
    const result = parser.parse([
      "--config",
      "port",
      "3000",
      "--config",
      "port=8080",
    ]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain the last value for port
    expect(result).toEqual({ config: { port: "8080" } });
  });

  it("should parse key-value with describe", () => {
    // Given: A parser with a keyValue flag with description
    const parser = flags({
      config: flag("--config", "-c")
        .keyValue()
        .describe("Set configuration key-value pairs"),
    });

    // When: Parsing arguments with key-value pairs
    const result = parser.parse(["--config", "timeout", "30"]);

    // Then: The config should contain { timeout: "30" }
    expect(result).toEqual({ config: { timeout: "30" } });
  });

  it("should return default value when key-value flag is not provided", () => {
    // Given: A parser with a keyValue flag with default value
    const parser = flags({
      config: flag("--config", "-c").keyValue().default({ host: "localhost" }),
    });

    // When: Parsing empty arguments
    const result = parser.parse([]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should contain the default value
    expect(result).toEqual({ config: { host: "localhost" } });
  });

  it("should merge default value with provided key-value pairs", () => {
    // Given: A parser with a keyValue flag with default value
    const parser = flags({
      config: flag("--config", "-c")
        .keyValue()
        .default({ host: "localhost", port: "3000" }),
    });

    // When: Parsing arguments with additional key-value pairs
    const result = parser.parse(["--config", "db", "postgres"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should merge default and provided values
    expect(result).toEqual({
      config: {
        host: "localhost",
        port: "3000",
        db: "postgres",
      },
    });
  });

  it("should override default value with provided key-value pairs", () => {
    // Given: A parser with a keyValue flag with default value
    const parser = flags({
      config: flag("--config", "-c")
        .keyValue()
        .default({ host: "localhost", port: "3000" }),
    });

    // When: Parsing arguments that override default keys
    const result = parser.parse(["--config", "host", "0.0.0.0"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: The config should override the default host value
    expect(result).toEqual({
      config: {
        host: "0.0.0.0",
        port: "3000",
      },
    });
  });
});

describe("flag with restArgs", () => {
  it("should parse flag with restArgs capturing all remaining arguments", () => {
    // Given: A parser with a flag that captures rest args
    const parser = flags({
      C: flag("-C").restArgs(),
    });

    // When: Parsing arguments with -C flag and additional args
    const parsed = parser.parse(["-C", "arg1", "arg2", "arg3"]);

    // Then: The result type should be { C: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ C: string[] | null }>();

    // Then: The C flag should contain all remaining arguments
    expect(parsed.C).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should parse flag with restArgs and no additional arguments", () => {
    // Given: A parser with a flag that captures rest args
    const parser = flags({
      C: flag("-C").restArgs(),
    });

    // When: Parsing arguments with -C flag but no additional args
    const parsed = parser.parse(["-C"]);

    // Then: The result type should be { C: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ C: string[] | null }>();

    // Then: The C flag should be an empty array
    expect(parsed.C).toEqual([]);
  });

  it("should return null when flag with restArgs is not provided", () => {
    // Given: A parser with a flag that captures rest args
    const parser = flags({
      C: flag("-C").restArgs(),
    });

    // When: Parsing empty arguments
    const parsed = parser.parse([]);

    // Then: The result type should be { C: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ C: string[] | null }>();

    // Then: The C flag should be null
    expect(parsed.C).toBe(null);
  });

  it("should parse other flags before flag with restArgs", () => {
    // Given: A parser with regular flags and a flag with restArgs
    const parser = flags({
      verbose: flag("--verbose").boolean(),
      name: flag("--name").string(),
      C: flag("-C").restArgs(),
    });

    // When: Parsing arguments with regular flags before -C
    const parsed = parser.parse([
      "--verbose",
      "--name",
      "test",
      "-C",
      "arg1",
      "arg2",
    ]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      name: string | null;
      C: string[] | null;
    }>();

    // Then: All flags should be parsed correctly
    expect(parsed.verbose).toBe(true);
    expect(parsed.name).toBe("test");
    expect(parsed.C).toEqual(["arg1", "arg2"]);
  });

  it("should stop parsing after flag with restArgs", () => {
    // Given: A parser with a flag with restArgs
    const parser = flags({
      C: flag("-C").restArgs(),
      verbose: flag("--verbose").boolean(),
    });

    // When: Parsing arguments with -C followed by what looks like flags
    const parsed = parser.parse(["-C", "--verbose", "-x", "value"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      C: string[] | null;
      verbose: boolean;
    }>();

    // Then: Everything after -C should be captured as rest args
    expect(parsed.C).toEqual(["--verbose", "-x", "value"]);
    expect(parsed.verbose).toBe(false);
  });

  it("should parse flag with restArgs using long flag name", () => {
    // Given: A parser with a long flag that captures rest args
    const parser = flags({
      chdir: flag("--chdir", "-C").restArgs(),
    });

    // When: Parsing arguments with --chdir flag
    const parsed = parser.parse(["--chdir", "dir1", "dir2"]);

    // Then: The result type should be { chdir: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ chdir: string[] | null }>();

    // Then: The chdir flag should contain all remaining arguments
    expect(parsed.chdir).toEqual(["dir1", "dir2"]);
  });

  it("should parse flag with restArgs using short flag name", () => {
    // Given: A parser with a flag that has both long and short names
    const parser = flags({
      chdir: flag("--chdir", "-C").restArgs(),
    });

    // When: Parsing arguments with -C short flag
    const parsed = parser.parse(["-C", "dir1", "dir2"]);

    // Then: The result type should be { chdir: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ chdir: string[] | null }>();

    // Then: The chdir flag should contain all remaining arguments
    expect(parsed.chdir).toEqual(["dir1", "dir2"]);
  });

  it("should support describe with flag restArgs", () => {
    // Given: A parser with a flag with restArgs and description
    const parser = flags({
      C: flag("-C").restArgs().describe("Change directory and run command"),
    });

    // When: Parsing arguments with -C flag
    const parsed = parser.parse(["-C", "build", "test"]);

    // Then: The C flag should contain all remaining arguments
    expect(parsed.C).toEqual(["build", "test"]);
  });

  it("should parse multiple flags but only one can have restArgs", () => {
    // Given: A parser with multiple flags where one has restArgs
    const parser = flags({
      verbose: flag("--verbose", "-v").boolean(),
      port: flag("--port", "-p").number(),
      exec: flag("--exec", "-e").restArgs(),
    });

    // When: Parsing arguments with regular flags before restArgs flag
    const parsed = parser.parse([
      "--verbose",
      "--port",
      "3000",
      "--exec",
      "npm",
      "run",
      "dev",
    ]);

    // Then: All flags should be parsed correctly
    expect(parsed.verbose).toBe(true);
    expect(parsed.port).toBe(3000);
    expect(parsed.exec).toEqual(["npm", "run", "dev"]);
  });

  it("should support restArgs on command builder", () => {
    // Given: A parser with a command that has restArgs
    const parser = flags({
      run: command("run").restArgs(),
    });

    // When: Parsing arguments with run command
    const parsed = parser.parse(["run", "arg1", "arg2"]);

    // Then: The result type should be { run: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ run: string[] | null }>();

    // Then: The run command should contain all remaining arguments
    expect(parsed.run).toEqual(["arg1", "arg2"]);
  });

  it("should support restArgs on argument builder", () => {
    // Given: A parser with an argument that has restArgs
    const parser = flags({
      args: argument().restArgs(),
    });

    // When: Parsing arguments with multiple values
    const parsed = parser.parse(["arg1", "arg2", "arg3"]);

    // Then: The result type should be { args: string[] | null }
    expectTypeOf(parsed).toEqualTypeOf<{ args: string[] | null }>();

    // Then: The args should contain all arguments
    expect(parsed.args).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should support restArgs on argument with flags before", () => {
    // Given: A parser with flags and an argument with restArgs
    const parser = flags({
      verbose: flag("--verbose").boolean(),
      files: argument().restArgs(),
    });

    // When: Parsing arguments with flag before positional args
    const parsed = parser.parse(["--verbose", "file1.txt", "file2.txt"]);

    // Then: The result type should match expected types
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      files: string[] | null;
    }>();

    // Then: All should be parsed correctly
    expect(parsed.verbose).toBe(true);
    expect(parsed.files).toEqual(["file1.txt", "file2.txt"]);
  });
});

describe("combined short flags", () => {
  it("should parse combined single-letter boolean flags like -ti", () => {
    // Given: A parser with two single-letter boolean flags
    const parser = flags({
      tty: flag("-t").boolean(),
      interactive: flag("-i").boolean(),
    });

    // When: Parsing combined flags -ti
    const result = parser.parse(["-ti"]);

    // Then: The result type should be { tty: boolean; interactive: boolean }
    expectTypeOf(result).toEqualTypeOf<{
      tty: boolean;
      interactive: boolean;
    }>();

    // Then: Both flags should be true
    expect(result).toEqual({ tty: true, interactive: true });
  });

  it("should parse combined single-letter boolean flags like -abc", () => {
    // Given: A parser with three single-letter boolean flags
    const parser = flags({
      all: flag("-a").boolean(),
      brief: flag("-b").boolean(),
      color: flag("-c").boolean(),
    });

    // When: Parsing combined flags -abc
    const result = parser.parse(["-abc"]);

    // Then: The result type should match expected types
    expectTypeOf(result).toEqualTypeOf<{
      all: boolean;
      brief: boolean;
      color: boolean;
    }>();

    // Then: All flags should be true
    expect(result).toEqual({ all: true, brief: true, color: true });
  });

  it("should parse combined flags with other separate flags", () => {
    // Given: A parser with multiple single-letter boolean flags
    const parser = flags({
      all: flag("-a").boolean(),
      brief: flag("-b").boolean(),
      verbose: flag("-v").boolean(),
    });

    // When: Parsing combined flags -ab followed by separate flag -v
    const result = parser.parse(["-ab", "-v"]);

    // Then: All flags should be true
    expect(result).toEqual({ all: true, brief: true, verbose: true });
  });

  it("should not expand combined flags if they are not single-letter", () => {
    // Given: A parser with a multi-letter flag
    const parser = flags({
      test: flag("-test").boolean(),
    });

    // When: Parsing -test flag
    const result = parser.parse(["-test"]);

    // Then: The test flag should be true
    expect(result).toEqual({ test: true });
  });

  it("should not expand combined flags if any flag is not boolean", () => {
    // Given: A parser with a single-letter string flag
    const parser = flags({
      name: flag("-n").string(),
      verbose: flag("-v").boolean(),
    });

    // When: Parsing -n with a value
    const result = parser.parse(["-n", "test"]);

    // Then: Only name should be set
    expect(result).toEqual({ name: "test", verbose: false });
  });

  it("should parse docker-style combined flags -ti", () => {
    // Given: A parser with docker-style flags
    const parser = flags({
      tty: flag("-t", "--tty").boolean(),
      interactive: flag("-i", "--interactive").boolean(),
    });

    // When: Parsing combined flags -ti
    const result = parser.parse(["-ti"]);

    // Then: Both flags should be true
    expect(result).toEqual({ tty: true, interactive: true });
  });

  it("should parse combined flags with long flags also defined", () => {
    // Given: A parser with flags that have both short and long forms
    const parser = flags({
      all: flag("-a", "--all").boolean(),
      long: flag("-l", "--long").boolean(),
      human: flag("-h", "--human-readable").boolean(),
    });

    // When: Parsing combined flags -alh
    const result = parser.parse(["-alh"]);

    // Then: All flags should be true
    expect(result).toEqual({ all: true, long: true, human: true });
  });

  it("should parse combined flags mixed with other arguments", () => {
    // Given: A parser with flags and a command
    const parser = flags({
      all: flag("-a").boolean(),
      long: flag("-l").boolean(),
      run: command("run").restArgs(),
    });

    // When: Parsing combined flags before a command
    const result = parser.parse(["-al", "run", "test"]);

    // Then: Flags should be true and command should capture args
    expect(result).toEqual({ all: true, long: true, run: ["test"] });
  });

  it("should throw error for combined flags with unknown letters", () => {
    // Given: A parser with only -a and -b flags
    const parser = flags({
      all: flag("-a").boolean(),
      brief: flag("-b").boolean(),
    });

    // When/Then: Parsing combined flags with unknown letter should throw
    expect(() => {
      parser.parse(["-abc"]);
    }).toThrow("Unexpected argument: -abc");
  });

  it("should parse combined flags in docker exec example", () => {
    // Given: A docker-style parser
    const parser = flags({
      tty: flag("-t").boolean(),
      interactive: flag("-i").boolean(),
      exec: command("exec").restArgs(),
    });

    // When: Parsing docker exec with combined flags after the command
    const result = parser.parse(["exec", "-ti", "container", "/bin/bash"]);

    // Then: Flags should be false because exec restArgs captures everything after it
    // The -ti is captured as part of exec's arguments, not parsed as flags
    expect(result).toEqual({
      tty: false,
      interactive: false,
      exec: ["-ti", "container", "/bin/bash"],
    });
  });

  it("should handle combined flags with = syntax not expanding", () => {
    // Given: A parser with single-letter flags
    const parser = flags({
      name: flag("-n").string(),
      value: flag("-v").string(),
    });

    // When: Parsing -n=test (should not expand)
    const result = parser.parse(["-n=test"]);

    // Then: Only name should be set with value "test"
    expect(result).toEqual({ name: "test", value: null });
  });

  it("should parse combined flags only for single-letter boolean flags", () => {
    // Given: A parser with mixed flag types
    const parser = flags({
      all: flag("-a").boolean(),
      brief: flag("-b").boolean(),
      count: flag("-c").number(),
    });

    // When: Parsing -ab (should work) but -abc should fail because -c needs a value
    const result1 = parser.parse(["-ab"]);
    expect(result1).toEqual({ all: true, brief: true, count: null });

    // When: Parsing -abc should not expand because -c is not boolean
    expect(() => {
      parser.parse(["-abc"]);
    }).toThrow("Unexpected argument: -abc");
  });

  it("should parse combined flags with both short and long forms defined", () => {
    // Given: A parser with flags that have both short and long forms
    const parser = flags({
      verbose: flag("-v", "--verbose").boolean(),
      help: flag("-h", "--help", "-?").boolean(),
      tty: flag("-t", "--tty").boolean(),
      interactive: flag("-i", "--interactive").boolean(),
    });

    // When: Parsing with long forms
    const result1 = parser.parse(["--verbose"]);
    expect(result1).toEqual({
      verbose: true,
      help: false,
      tty: false,
      interactive: false,
    });

    // When: Parsing with short forms
    const result2 = parser.parse(["-v"]);
    expect(result2).toEqual({
      verbose: true,
      help: false,
      tty: false,
      interactive: false,
    });

    // When: Parsing with combined short forms
    const result3 = parser.parse(["-ti"]);
    expect(result3).toEqual({
      verbose: false,
      help: false,
      tty: true,
      interactive: true,
    });

    // When: Parsing with mixed long and short forms
    const result4 = parser.parse(["--tty", "--interactive"]);
    expect(result4).toEqual({
      verbose: false,
      help: false,
      tty: true,
      interactive: true,
    });

    // When: Parsing with all combined
    const result5 = parser.parse(["-vhti"]);
    expect(result5).toEqual({
      verbose: true,
      help: true,
      tty: true,
      interactive: true,
    });

    // When: Parsing with multiple aliases for help
    const result6 = parser.parse(["-?"]);
    expect(result6).toEqual({
      verbose: false,
      help: true,
      tty: false,
      interactive: false,
    });
  });
});

describe("Type transformations with Builder generics", () => {
  it("should transform FlagBuilder types when calling required() on string flag", () => {
    // Given: A string flag that starts as FlagBuilder<string | null, string | null>
    const optionalFlag = flag("--name").string();

    // Then: Initial value should be string | null
    expectTypeOf(optionalFlag.getInitial()).toEqualTypeOf<string | null>();

    // When: Calling required() to transform to FlagBuilder<string | null, string>
    const requiredFlag = optionalFlag.required();

    // Then: Initial value should still be string | null (InitialValue doesn't change)
    expectTypeOf(requiredFlag.getInitial()).toEqualTypeOf<string | null>();

    // Then: ParseResult should be string (non-null)
    const testResult = requiredFlag.test("--name", 0, ["--name", "value"]);
    if (testResult) {
      expectTypeOf(testResult.parsed).toEqualTypeOf<string>();
    }
  });

  it("should transform FlagBuilder types when calling default() on number flag", () => {
    // Given: A number flag that starts as FlagBuilder<number | null, number | null>
    const optionalFlag = flag("--port").number();

    // Then: Initial value should be number | null
    expectTypeOf(optionalFlag.getInitial()).toEqualTypeOf<number | null>();

    // When: Calling default(3000) to transform to FlagBuilder<number, number>
    const flagWithDefault = optionalFlag.default(3000);

    // Then: Initial value should be number (non-null because of default)
    expectTypeOf(flagWithDefault.getInitial()).toEqualTypeOf<number>();

    // Then: ParseResult should be number (non-null)
    const testResult = flagWithDefault.test("--port", 0, ["--port", "8080"]);
    if (testResult) {
      expectTypeOf(testResult.parsed).toEqualTypeOf<number | null>();
    }
  });

  it("should transform CommandBuilder types when calling restArgs()", () => {
    // Given: A boolean command that starts as CommandBuilder<boolean, boolean>
    const booleanCommand = command("run");

    // Then: Initial value should be boolean
    expectTypeOf(booleanCommand.getInitial()).toEqualTypeOf<boolean>();

    // When: Calling restArgs() to transform to CommandBuilder<string[] | null, string[] | null>
    const restArgsCommand = booleanCommand.restArgs();

    // Then: Initial value should be string[] | null
    expectTypeOf(restArgsCommand.getInitial()).toEqualTypeOf<string[] | null>();

    // Then: ParseResult should be string[] | null
    const testResult = restArgsCommand.test("run", 0, ["run", "arg1", "arg2"]);
    if (testResult) {
      expectTypeOf(testResult.parsed).toEqualTypeOf<string[] | null>();
    }
  });

  it("should transform ArgumentBuilder types when calling required()", () => {
    // Given: An optional argument that starts as ArgumentBuilder<string | null, string | null>
    const optionalArg = argument();

    // Then: Initial value should be string | null
    expectTypeOf(optionalArg.getInitial()).toEqualTypeOf<string | null>();

    // When: Calling required() to transform to ArgumentBuilder<string | null, string>
    const requiredArg = optionalArg.required();

    // Then: Initial value should still be string | null
    expectTypeOf(requiredArg.getInitial()).toEqualTypeOf<string | null>();

    // Then: ParseResult should be string (non-null)
    const testResult = requiredArg.test("value", 0, ["value"]);
    if (testResult) {
      expectTypeOf(testResult.parsed).toEqualTypeOf<string>();
    }
  });

  it("should chain type transformations correctly", () => {
    // Given: A flag that goes through multiple transformations
    const flag1 = flag("--port");
    expectTypeOf(flag1.getInitial()).toEqualTypeOf<boolean>();

    const flag2 = flag1.number();
    expectTypeOf(flag2.getInitial()).toEqualTypeOf<number | null>();

    const flag3 = flag2.describe("Port number");
    expectTypeOf(flag3.getInitial()).toEqualTypeOf<number | null>();

    const flag4 = flag3.required();
    expectTypeOf(flag4.getInitial()).toEqualTypeOf<number | null>();

    const testResult = flag4.test("--port", 0, ["--port", "3000"]);
    if (testResult) {
      expectTypeOf(testResult.parsed).toEqualTypeOf<number>();
    }
  });
});

describe("Legacy flags.spec.ts compatibility tests", () => {
  describe("Basic flag parsing", () => {
    it("should run flags function with empty config", () => {
      // Given: A parser with no flags
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({});

      // When: Parsing empty arguments
      const result = parser.parse([]);

      // Then: Should not throw
      expect(result).toEqual({});
    });

    it("should return undefined for unprovided flags (version)", () => {
      // Given: A parser with version flag
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({
        version: flag("--version", "-v").boolean(),
      });

      // When: Parsing empty arguments
      const result = parser.parse([]);

      // Then: Version should be false (not undefined, but false for boolean)
      expect(result.version).toBe(false);
    });

    it("should parse version flag as true with ['--version']", () => {
      // Given: A parser with version flag
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({
        version: flag("--version", "-v").boolean(),
      });

      // When: Parsing arguments with --version
      const result = parser.parse(["--version"]);

      // Then: Version should be true
      expect(result.version).toBe(true);
    });

    it("should parse name flag as 'foo' with ['--name','foo']", () => {
      // Given: A parser with name flag
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({
        name: flag("--name").string(),
      });

      // When: Parsing arguments with --name foo
      const result = parser.parse(["--name", "foo"]);

      // Then: Name should be "foo"
      expect(result.name).toEqual("foo");
    });

    it("should parse name flag as 'foo' with ['--name=foo']", () => {
      // Given: A parser with name flag
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({
        name: flag("--name").string(),
      });

      // When: Parsing arguments with --name=foo
      const result = parser.parse(["--name=foo"]);

      // Then: Name should be "foo"
      expect(result.name).toEqual("foo");
    });

    it("should parse name='foo' and version=true with ['--name=foo','-v']", () => {
      // Given: A parser with name and version flags
      interface Options {
        version: boolean;
        name: string;
        help: boolean;
      }

      const parser = flags({
        name: flag("--name").string(),
        version: flag("--version", "-v").boolean(),
      });

      // When: Parsing arguments with --name=foo and -v
      const result = parser.parse(["--name=foo", "-v"]);

      // Then: Name should be "foo" and version should be true
      expect(result.name).toEqual("foo");
      expect(result.version).toBe(true);
    });

    it("should reject if not match argument", () => {
      // Given: A parser with verbose flag
      const parser = flags({
        verbose: flag("--verbose", "-V").boolean(),
      });

      // When/Then: Parsing unknown argument should throw
      expect(() => {
        parser.parse(["-V", "unknown"]);
      }).toThrow(/unexpected argument/i);
    });
  });

  describe("Rest arguments", () => {
    it("should group rest of arguments on a property with any()", () => {
      // Given: A parser with verbose flag and rest arguments
      const parser = flags({
        verbose: flag("--verbose", "-V").boolean(),
        rest: argument().restArgs(),
      });

      // When: Parsing arguments with -V and multiple unknown args
      const result = parser.parse([
        "-V",
        "unknown",
        "unknown2",
        "unknown3",
        "unknown4",
        "unknown5",
      ]);

      // Then: Rest should contain all non-flag arguments
      expect(result.rest).toEqual([
        "unknown",
        "unknown2",
        "unknown3",
        "unknown4",
        "unknown5",
      ]);
    });

    it("should group rest of arguments after command", () => {
      // Given: A parser with verbose flag and command with rest args
      const parser = flags({
        verbose: flag("--verbose", "-V").boolean(),
        name: command("name").restArgs(),
      });

      // When: Parsing arguments with command name and rest args
      const result = parser.parse([
        "name",
        "unknown",
        "-V",
        "unknown2",
        "unknown3",
        "unknown4",
        "unknown5",
      ]);

      // Then: Rest should contain all arguments after command
      expect(result.name).toEqual([
        "unknown",
        "-V",
        "unknown2",
        "unknown3",
        "unknown4",
        "unknown5",
      ]);
    });

    it("should match command with rest arguments", () => {
      // Given: A parser with verbose flag and say command
      type Options = {
        verbose: boolean;
        say: string[];
      };

      const parser = flags({
        verbose: flag("-V", "--verbose").boolean(),
        say: command("say").restArgs(),
      });

      // When: Parsing arguments with -V and say command
      const result = parser.parse(["-V", "say", "hello"]);

      // Then: Verbose should be true and say should contain ["hello"]
      expect(result.verbose).toBe(true);
      expect(result.say).toEqual(["hello"]);
    });
  });

  describe("Arguments", () => {
    it("should get the first argument", () => {
      // Given: A parser with a single argument
      const parser = flags({
        firstArg: argument().string(),
      });

      // When: Parsing arguments with one value
      const result = parser.parse(["foo"]);

      // Then: FirstArg should be "foo"
      expect(result.firstArg).toEqual("foo");
    });

    it("should get the second argument", () => {
      // Given: A parser with two arguments
      const parser = flags({
        firstArg: argument().string(),
        secondArg: argument().string(),
      });

      // When: Parsing arguments with two values
      const result = parser.parse(["foo", "taz"]);

      // Then: SecondArg should be "taz"
      expect(result.secondArg).toEqual("taz");
    });

    it("should throw error if more arguments than rules", () => {
      // Given: A parser with a single argument
      const parser = flags({
        firstArg: argument().string(),
      });

      // When/Then: Parsing with too many arguments should throw
      expect(() => {
        parser.parse(["foo", "taz"]);
      }).toThrow();
    });
  });

  describe("Array values", () => {
    it("should collect multiple values into a list", () => {
      // Given: A parser with strings array flag
      interface Options {
        items: string[];
      }

      const parser = flags({
        items: flag("--taz").strings(),
      });

      // When: Parsing arguments with multiple --taz flags
      const result = parser.parse(["--taz", "foo", "--taz", "buz"]);

      // Then: Items should contain ["foo", "buz"]
      expect(result.items).toEqual(["foo", "buz"]);
    });

    it("should parse numbers with number flag", () => {
      // Given: A parser with number flags
      interface Options {
        num1: number;
        num2: number;
        num3: number;
      }

      const parser = flags({
        num1: flag("--num1").number(),
        num2: flag("--num2").number(),
        num3: flag("--num3").number(),
      });

      // When: Parsing arguments with numbers and invalid number
      const result = parser.parse([
        "--num1",
        "1",
        "--num2",
        "1.24",
        "--num3",
        "foo",
      ]);

      // Then: num1 should be 1, num2 should be 1.24, num3 should be NaN
      expect(result.num1).toBe(1);
      expect(result.num2).toBeCloseTo(1.24);
      expect(result.num3).toBeNaN();
    });

    it("should collect multiple numbers into a list with isArrayNumberAt equivalent", () => {
      // Given: A parser with numbers array flag (using strings and manual conversion)
      interface Options {
        nums: string[];
      }

      const parser = flags({
        nums: flag("--nums").strings(),
      });

      // When: Parsing arguments with multiple --nums flags
      // Note: In new-flags, negative numbers need special handling or use = syntax
      const result = parser.parse([
        "--nums",
        "1",
        "--nums",
        "2.5",
        "--nums=-3",
      ]);

      // Then: Nums should contain string values that can be converted to numbers
      const nums = result.nums.map(Number);
      expect(nums).toEqual([1, 2.5, -3]);
    });
  });

  describe("Chained syntax", () => {
    it("should support chained syntax: flag().boolean()", () => {
      // Given: A parser with chained boolean flag
      interface Options {
        version: boolean;
      }

      const parser = flags({
        version: flag("--version", "-v").boolean(),
      });

      // When: Parsing arguments with --version
      const result = parser.parse(["--version"]);

      // Then: Version should be true
      expect(result.version).toBe(true);
    });

    it("should support chained syntax: flag().boolean().describe()", () => {
      // Given: A parser with chained boolean flag with description
      interface Options {
        version: boolean;
      }

      const parser = flags({
        version: flag("--version", "-v").boolean().describe("Show version"),
      });

      // When: Parsing arguments with --version
      const result = parser.parse(["--version"]);

      // Then: Version should be true
      expect(result.version).toBe(true);

      // Then: Config should have description in metadata
      const config = flag("--version", "-v")
        .boolean()
        .describe("Show version")
        .toConfig();
      expect(config.metadata.description).toBe("Show version");
    });

    it("should support chained syntax: flag().string()", () => {
      // Given: A parser with chained string flag
      interface Options {
        name: string;
      }

      const parser = flags({
        name: flag("--name", "-n").string(),
      });

      // When: Parsing arguments with --name foo
      const result = parser.parse(["--name", "foo"]);

      // Then: Name should be "foo"
      expect(result.name).toBe("foo");
    });

    it("should support chained syntax: flag().string().describe()", () => {
      // Given: A parser with chained string flag with description
      interface Options {
        name: string;
      }

      const parser = flags({
        name: flag("--name", "-n").string().describe("Set the name"),
      });

      // When: Parsing arguments with --name bar
      const result = parser.parse(["--name", "bar"]);

      // Then: Name should be "bar"
      expect(result.name).toBe("bar");

      // Then: Config should have description in metadata
      const config = flag("--name", "-n")
        .string()
        .describe("Set the name")
        .toConfig();
      expect(config.metadata.description).toBe("Set the name");
    });

    it("should support chained syntax: flag().number().describe()", () => {
      // Given: A parser with chained number flag with description
      interface Options {
        port: number;
      }

      const parser = flags({
        port: flag("--port", "-p").number().describe("Port number"),
      });

      // When: Parsing arguments with --port 3000
      const result = parser.parse(["--port", "3000"]);

      // Then: Port should be 3000
      expect(result.port).toBe(3000);

      // Then: Config should have description in metadata
      const config = flag("--port", "-p")
        .number()
        .describe("Port number")
        .toConfig();
      expect(config.metadata.description).toBe("Port number");
    });

    it("should support chained syntax: flag().strings().describe()", () => {
      // Given: A parser with chained strings flag with description
      interface Options {
        items: string[];
      }

      const parser = flags({
        items: flag("--item").strings().describe("Add an item"),
      });

      // When: Parsing arguments with multiple --item flags
      const result = parser.parse(["--item", "a", "--item", "b"]);

      // Then: Items should contain ["a", "b"]
      expect(result.items).toEqual(["a", "b"]);

      // Then: Config should have description in metadata
      const config = flag("--item")
        .strings()
        .describe("Add an item")
        .toConfig();
      expect(config.metadata.description).toBe("Add an item");
    });

    it("should support multiple chained flags in schema", () => {
      // Given: A parser with multiple chained flags
      interface Options {
        version: boolean;
        name: string;
        port: number;
      }

      const parser = flags({
        version: flag("--version", "-v").boolean().describe("Show version"),
        name: flag("--name", "-n").string().describe("Set name"),
        port: flag("--port", "-p").number(),
      });

      // When: Parsing arguments with all flags
      const result = parser.parse([
        "--version",
        "--name",
        "test",
        "--port",
        "8080",
      ]);

      // Then: All flags should be parsed correctly
      expect(result.version).toBe(true);
      expect(result.name).toBe("test");
      expect(result.port).toBe(8080);

      // Then: Configs should have descriptions
      const versionConfig = flag("--version", "-v")
        .boolean()
        .describe("Show version")
        .toConfig();
      const nameConfig = flag("--name", "-n")
        .string()
        .describe("Set name")
        .toConfig();
      const portConfig = flag("--port", "-p").number().toConfig();

      expect(versionConfig.metadata.description).toBe("Show version");
      expect(nameConfig.metadata.description).toBe("Set name");
      expect(portConfig.metadata.description).toBeUndefined();
    });

    it("should parse string flag value starting with -- as a value", () => {
      // Given: A parser with a string flag
      const parser = flags({
        foo: flag("-f").string(),
      });

      // When: Parsing arguments ["-f", "--verbose"]
      const result = parser.parse(["-f", "--verbose"]);

      // Then: The result type should be { foo: string | null }
      expectTypeOf(result).toEqualTypeOf<{ foo: string | null }>();

      // Then: foo should be "--verbose"
      expect(result).toEqual({ foo: "--verbose" });
    });
  });
});

describe("Edge cases - valores que empiezan con --", () => {
  it("should parse string flag with value starting with --", () => {
    // Given: A parser with a strings flag
    const parser = flags({
      foo: flag("-f", "--flag").strings(),
    });

    // When: Parsing arguments ["-f", "--taz"]
    const result = parser.parse(["-f", "--taz"]);

    // Then: The result type should be { foo: string[] }
    expectTypeOf(result).toEqualTypeOf<{ foo: string[] }>();

    // Then: foo should contain ["--taz"]
    expect(result).toEqual({ foo: ["--taz"] });
  });

  it("should parse string flag with comma-separated value starting with --", () => {
    // Given: A parser with a strings flag
    const parser = flags({
      foo: flag("-f", "--flag").strings(),
    });

    // When: Parsing arguments ["-f", "--taz,bliz"]
    const result = parser.parse(["-f", "--taz,bliz"]);

    // Then: The result type should be { foo: string[] }
    expectTypeOf(result).toEqualTypeOf<{ foo: string[] }>();

    // Then: foo should contain ["--taz,bliz"] (not split by comma)
    expect(result).toEqual({ foo: ["--taz,bliz"] });
  });

  it("should parse keyValue flag with key starting with -- in space syntax", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      foo: flag("-f", "--flag").keyValue(),
    });

    // When: Parsing arguments ["-f", "--taz=bliz"]
    const result = parser.parse(["-f", "--taz=bliz"]);

    // Then: The result type should be { foo: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ foo: Record<string, string> }>();

    // Then: foo should contain { "--taz": "bliz" }
    expect(result).toEqual({ foo: { "--taz": "bliz" } });
  });

  it("should parse keyValue flag with = syntax and key starting with --", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      foo: flag("-f", "--flag").keyValue(),
    });

    // When: Parsing arguments ["-f=--taz=bliz"]
    const result = parser.parse(["-f=--taz=bliz"]);

    // Then: The result type should be { foo: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ foo: Record<string, string> }>();

    // Then: foo should contain { "--taz": "bliz" }
    // Note: Using = syntax DOES work for keys starting with --
    expect(result).toEqual({ foo: { "--taz": "bliz" } });
  });

  it("should document workaround for keyValue with keys starting with -- using = syntax", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      foo: flag("-f", "--flag").keyValue(),
    });

    // When: Using = syntax to pass keys starting with --
    const result1 = parser.parse(["-f=--key1=value1"]);
    const result2 = parser.parse(["--flag=--key2=value2"]);

    // Then: Both should work correctly
    expect(result1).toEqual({ foo: { "--key1": "value1" } });
    expect(result2).toEqual({ foo: { "--key2": "value2" } });

    // When: Combining multiple keyValue pairs
    const result3 = parser.parse([
      "-f=--key1=value1",
      "-f=--key2=value2",
      "-f=normalkey=value3",
    ]);

    // Then: All should be merged correctly
    expect(result3).toEqual({
      foo: {
        "--key1": "value1",
        "--key2": "value2",
        normalkey: "value3",
      },
    });
  });

  it("should parse keyValue flag with three-argument syntax and key starting with --", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      foo: flag("-f", "--flag").keyValue(),
    });

    // When: Parsing arguments ["-f", "--taz", "=bliz"]
    const result = parser.parse(["-f", "--taz", "=bliz"]);

    // Then: The result type should be { foo: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ foo: Record<string, string> }>();

    // Then: foo should contain { "--taz": "=bliz" }
    expect(result).toEqual({ foo: { "--taz": "=bliz" } });
  });

  it("should parse multiple strings flags with values starting with --", () => {
    // Given: A parser with a strings flag
    const parser = flags({
      foo: flag("-f", "--flag").strings(),
    });

    // When: Parsing arguments ["-f", "--taz", "-f", "--bliz"]
    const result = parser.parse(["-f", "--taz", "-f", "--bliz"]);

    // Then: The result type should be { foo: string[] }
    expectTypeOf(result).toEqualTypeOf<{ foo: string[] }>();

    // Then: foo should contain ["--taz", "--bliz"]
    expect(result).toEqual({ foo: ["--taz", "--bliz"] });
  });

  it("should parse string flag with value starting with - (single dash)", () => {
    // Given: A parser with a string flag
    const parser = flags({
      foo: flag("-f", "--flag").string(),
    });

    // When: Parsing arguments ["-f", "-bar"]
    const result = parser.parse(["-f", "-bar"]);

    // Then: The result type should be { foo: string | null }
    expectTypeOf(result).toEqualTypeOf<{ foo: string | null }>();

    // Then: foo should be "-bar"
    expect(result).toEqual({ foo: "-bar" });
  });

  it("should parse number flag with negative number value", () => {
    // Given: A parser with a number flag
    const parser = flags({
      temp: flag("-t", "--temp").number(),
    });

    // When: Parsing arguments ["-t", "-10"]
    const result = parser.parse(["-t", "-10"]);

    // Then: The result type should be { temp: number | null }
    expectTypeOf(result).toEqualTypeOf<{ temp: number | null }>();

    // Then: temp should be -10
    expect(result).toEqual({ temp: -10 });
  });

  it("should parse number flag with negative decimal value", () => {
    // Given: A parser with a number flag
    const parser = flags({
      value: flag("-v", "--value").number(),
    });

    // When: Parsing arguments ["--value", "-3.14"]
    const result = parser.parse(["--value", "-3.14"]);

    // Then: The result type should be { value: number | null }
    expectTypeOf(result).toEqualTypeOf<{ value: number | null }>();

    // Then: value should be -3.14
    expect(result).toEqual({ value: -3.14 });
  });

  it("should parse keyValue with value containing equals sign", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("-c", "--config").keyValue(),
    });

    // When: Parsing arguments ["-c", "url=http://example.com?foo=bar"]
    const result = parser.parse(["-c", "url=http://example.com?foo=bar"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: config should contain { "url": "http://example.com?foo=bar" }
    expect(result).toEqual({ config: { url: "http://example.com?foo=bar" } });
  });

  it("should parse keyValue with empty value", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("-c", "--config").keyValue(),
    });

    // When: Parsing arguments ["-c", "key="]
    const result = parser.parse(["-c", "key="]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: config should contain { "key": "" }
    expect(result).toEqual({ config: { key: "" } });
  });

  it("should parse keyValue with key only (no value)", () => {
    // Given: A parser with a keyValue flag
    const parser = flags({
      config: flag("-c", "--config").keyValue(),
    });

    // When: Parsing arguments ["-c", "key"]
    const result = parser.parse(["-c", "key"]);

    // Then: The result type should be { config: Record<string, string> }
    expectTypeOf(result).toEqualTypeOf<{ config: Record<string, string> }>();

    // Then: config should contain { "key": "" }
    expect(result).toEqual({ config: { key: "" } });
  });
});

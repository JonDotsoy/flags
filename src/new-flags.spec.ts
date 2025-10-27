import { describe, it, expect, expectTypeOf } from "bun:test";
import { flags, flag, command, argument } from "./new-flags";

describe("new-flags", () => {
  describe("Builder with two templates", () => {
    it("should have initialValue method that returns initial value type", () => {
      // Given: A flag builder for a boolean flag
      const booleanFlag = flag("--verbose").boolean();

      // When: Getting the initial value
      const initialValue = booleanFlag.initialValue();

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
        parsed: "value"
      });

      // When: Testing if an argument matches the flag with = syntax
      const matchEquals = stringFlag.test("--name=value", 0, ["--name=value"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchEquals).toEqual({
        index: 0,
        args: ["--name=value"],
        parsed: "value"
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
      const initialValue = stringFlag.initialValue();

      // Then: Initial value should be null
      expect(initialValue).toBe(null);
      expectTypeOf(initialValue).toEqualTypeOf<string | null>();
    });

    it("should return correct initial value for number flags", () => {
      // Given: A number flag
      const numberFlag = flag("--port").number();

      // When: Getting initial value
      const initialValue = numberFlag.initialValue();

      // Then: Initial value should be null
      expect(initialValue).toBe(null);
      expectTypeOf(initialValue).toEqualTypeOf<number | null>();
    });

    it("should return correct initial value for strings array flags", () => {
      // Given: A strings array flag
      const stringsFlag = flag("--label").strings();

      // When: Getting initial value
      const initialValue = stringsFlag.initialValue();

      // Then: Initial value should be empty array
      expect(initialValue).toEqual([]);
      expectTypeOf(initialValue).toEqualTypeOf<string[]>();
    });

    it("should return correct initial value for keyValue flags", () => {
      // Given: A keyValue flag
      const kvFlag = flag("--config").keyValue();

      // When: Getting initial value
      const initialValue = kvFlag.initialValue();

      // Then: Initial value should be empty object
      expect(initialValue).toEqual({});
      expectTypeOf(initialValue).toEqualTypeOf<Record<string, string>>();
    });

    it("should return default value as initial value when default is set", () => {
      // Given: A number flag with default value
      const numberFlag = flag("--port").number().default(3000);

      // When: Getting initial value
      const initialValue = numberFlag.initialValue();

      // Then: Initial value should be the default value
      expect(initialValue).toBe(3000);
      expectTypeOf(initialValue).toEqualTypeOf<number>();
    });

    it("should parse strings array flag correctly", () => {
      // Given: A strings array flag
      const stringsFlag = flag("--label").strings();

      // When: Getting initial value
      const initialValue = stringsFlag.initialValue();

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
        parsed: ["arg1", "arg2"]
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
        parsed: "value"
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
        parsed: true
      });

      // When: Testing with short flag
      const matchShort = verboseFlag.test("-v", 0, ["-v"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchShort).toEqual({
        index: 0,
        args: ["-v"],
        parsed: true
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
        parsed: 3000
      });

      // When: Testing with = syntax
      const matchEquals = portFlag.test("--port=3000", 0, ["--port=3000"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchEquals).toEqual({
        index: 0,
        args: ["--port=3000"],
        parsed: 3000
      });

      // When: Testing flag without value
      const matchNoValue = portFlag.test("--port", 0, ["--port"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchNoValue).toEqual({
        index: 0,
        args: ["--port"],
        parsed: null
      });
    });

    it("should test keyValue flag with different syntaxes", () => {
      // Given: A keyValue flag
      const configFlag = flag("--config").keyValue();

      // When: Testing with name value syntax (3 args total)
      const matchNameValue = configFlag.test("--config", 0, ["--config", "host", "localhost"]);

      // Then: test should return match info with 3 arguments consumed
      expect(matchNameValue).toEqual({
        index: 0,
        args: ["--config", "host", "localhost"],
        parsed: { host: "localhost" }
      });

      // When: Testing with name=value syntax (2 args total)
      const matchNameEquals = configFlag.test("--config", 0, ["--config", "host=localhost"]);

      // Then: test should return match info with 2 arguments consumed
      expect(matchNameEquals).toEqual({
        index: 0,
        args: ["--config", "host=localhost"],
        parsed: { host: "localhost" }
      });

      // When: Testing with --flag=name=value syntax (1 arg total)
      const matchAllEquals = configFlag.test("--config=host=localhost", 0, ["--config=host=localhost"]);

      // Then: test should return match info with 1 argument consumed
      expect(matchAllEquals).toEqual({
        index: 0,
        args: ["--config=host=localhost"],
        parsed: { host: "localhost" }
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
        parsed: true
      });
    });
  });

  describe("Builder inheritance", () => {
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

      // Then: All configs should have descriptions
      expect(flagConfig.description).toBe("Test flag");
      expect(commandConfig.description).toBe("Test command");
      expect(argumentConfig.description).toBe("Test argument");
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

      // Then: All configs should have descriptions and other properties
      expect(flagConfig.description).toBe("Port number");
      expect(flagConfig.type).toBe("number");
      expect(flagConfig.required).toBe(true);

      expect(commandConfig.description).toBe("Run command");
      expect(commandConfig.type).toBe("restArgs");

      expect(argumentConfig.description).toBe("Input file");
      expect(argumentConfig.type).toBe("string");
      expect(argumentConfig.required).toBe(true);
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
    const help = parser.helpMessage();

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should generate help message with custom program name using programName()", () => {
    // Given: A parser with a required port flag and custom program name
    const parser = flags({
      port: flag("--port", "-p").number().required(),
    }).programName("myapp");

    // When: Generating help message
    const help = parser.helpMessage();

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
    const help = parser.helpMessage();

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
    const help = parser.helpMessage();

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();
  });

  it("should support describe() before required()", () => {
    // Given: A parser with describe() called before required()
    const parser = flags({
      port: flag("--port", "-p").number().describe("Port number").required(),
    });

    // When: Generating help message
    const help = parser.helpMessage();

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
    const help = parser.helpMessage();

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
    const help = parser.helpMessage();

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
    const help = parser.helpMessage();

    // Then: The help message should match snapshot
    expect(help).toMatchSnapshot();

    // When: Parsing arguments
    const result = parser.parse(["--port", "3000"]);

    // Then: The port should be 3000
    expect(result).toEqual({ port: 3000 });
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
    const help = dockerFlags.helpMessage();

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

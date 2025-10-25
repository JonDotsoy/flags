import { describe, it, expect, expectTypeOf } from "bun:test";
import { flags, flag, command, argument } from "./new-flags";

describe("new-flags", () => {
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

import { describe, it, expect, expectTypeOf } from "bun:test";
import { flags, flag, command, argument } from "./new-flags";

describe("new-flags", () => {
  it("should parse boolean flag with --version", () => {
    const result = flags({ version: flag("--version", "-v") }).parse([
      "--version",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();
    expect(result).toEqual({ version: true });
  });

  it("should parse explicit boolean flag with --version", () => {
    const result = flags({ version: flag("--version", "-v").boolean() }).parse([
      "--version",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();
    expect(result).toEqual({ version: true });
  });

  it("should return false when boolean flag is not provided", () => {
    const result = flags({ version: flag("--version", "-v") }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ version: boolean }>();
    expect(result).toEqual({ version: false });
  });

  it("should return null when string flag is not provided", () => {
    const result = flags({ name: flag("--name", "-n").string() }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();
    expect(result).toEqual({ name: null });
  });

  it("should parse string flag with = syntax", () => {
    const result = flags({ name: flag("--name", "-n").string() }).parse([
      "--name=july cesar",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();
    expect(result).toEqual({ name: "july cesar" });
  });

  it("should parse string flag with space syntax", () => {
    const result = flags({ name: flag("--name", "-n").string() }).parse([
      "--name",
      "july cesar",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ name: string | null }>();
    expect(result).toEqual({ name: "july cesar" });
  });

  it("should parse single string array flag", () => {
    const result = flags({ labels: flag("--label", "-l").strings() }).parse([
      "--label",
      "blue",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ labels: string[] }>();
    expect(result).toEqual({ labels: ["blue"] });
  });

  it("should parse multiple string array flags", () => {
    const result = flags({ labels: flag("--label", "-l").strings() }).parse([
      "--label",
      "blue",
      "--label",
      "red",
    ]);
    expectTypeOf(result).toEqualTypeOf<{ labels: string[] }>();
    expect(result).toEqual({ labels: ["blue", "red"] });
  });

  it("should throw error for unexpected argument", () => {
    expect(() => {
      flags({}).parse(["foo"]);
    }).toThrow("Unexpected argument: foo");
  });
});

it("should parse number flag with space syntax", () => {
  const result = flags({ port: flag("--port", "-p").number() }).parse([
    "--port",
    "3000",
  ]);
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();
  expect(result).toEqual({ port: 3000 });
});

it("should parse number flag with = syntax", () => {
  const result = flags({ port: flag("--port", "-p").number() }).parse([
    "--port=3000",
  ]);
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();
  expect(result).toEqual({ port: 3000 });
});

it("should return null when number flag has no value", () => {
  const result = flags({ port: flag("--port", "-p").number() }).parse([
    "--port",
  ]);
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();
  expect(result).toEqual({ port: null });
});

it("should return null when number flag is not provided", () => {
  const result = flags({ port: flag("--port", "-p").number() }).parse([]);
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();
  expect(result).toEqual({ port: null });
});

it("should throw when required number flag is not provided", () => {
  expect(() => {
    flags({ port: flag("--port", "-p").number().required() }).parse([]);
  }).toThrow("Required flag missing: --port");
});

it("should return number when optional number flag is provided", () => {
  const result = flags({ port: flag("--port", "-p").number() }).parse([
    "--port",
    "3000",
  ]);
  expectTypeOf(result).toEqualTypeOf<{ port: number | null }>();
  expect(result).toEqual({ port: 3000 });
});

it("should return number when required number flag is provided", () => {
  const result = flags({
    port: flag("--port", "-p").number().required(),
  }).parse(["--port", "3000"]);
  expectTypeOf(result).toEqualTypeOf<{ port: number }>();
  expect(result).toEqual({ port: 3000 });
});

describe("helpMessage", () => {
  it("should generate help message with default format", () => {
    const help = flags({
      port: flag("--port", "-p").number().required(),
    }).helpMessage();
    expect(help).toMatchSnapshot();
  });

  it("should generate help message with custom program name using programName()", () => {
    const help = flags({
      port: flag("--port", "-p").number().required(),
    })
      .programName("myapp")
      .helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should generate help message with description using describe()", () => {
    const help = flags({
      verbose: flag("--verbose", "-v").boolean(),
    })
      .programName("myapp")
      .describe("A simple CLI tool")
      .helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should generate help message with flag descriptions using describe()", () => {
    const help = flags({
      port: flag("--port", "-p")
        .number()
        .required()
        .describe("Port number to listen on"),
      verbose: flag("--verbose", "-v")
        .boolean()
        .describe("Enable verbose output"),
    }).helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should support describe() before required()", () => {
    const help = flags({
      port: flag("--port", "-p").number().describe("Port number").required(),
    }).helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should generate help message for multiple flags", () => {
    const help = flags({
      port: flag("--port", "-p").number().required(),
      name: flag("--name", "-n").string(),
      verbose: flag("--verbose", "-v").boolean(),
    }).helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should generate complete help message with all features", () => {
    const help = flags({
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
      .describe("A simple CLI application")
      .helpMessage();

    expect(help).toMatchSnapshot();
  });

  it("should support fluent API with programName, describe and parse", () => {
    const parser = flags({
      port: flag("--port", "-p").number().required().describe("Port number"),
    })
      .programName("myapp")
      .describe("A simple CLI tool");

    const help = parser.helpMessage();
    expect(help).toMatchSnapshot();

    const result = parser.parse(["--port", "3000"]);
    expect(result).toEqual({ port: 3000 });
  });
});

describe("default values", () => {
  it("should validate that default method only accepts number type for number flags", () => {
    const defaultMethod = flag("--port", "-p").number().default;
    expectTypeOf(defaultMethod).parameters.toEqualTypeOf<[number]>();
  });

  it("should validate that default method only accepts string type for string flags", () => {
    const defaultMethod = flag("--host", "-h").string().default;
    expectTypeOf(defaultMethod).parameters.toEqualTypeOf<[string]>();
  });

  it("should return default value when number flag is not provided", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();
    expect(result).toEqual({ port: 3000 });
  });

  it("should return default value when string flag is not provided", () => {
    const result = flags({
      host: flag("--host", "-h").string().default("localhost"),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();
    expect(result).toEqual({ host: "localhost" });
  });

  it("should override default value when number flag is provided", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000),
    }).parse(["--port", "8080"]);
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();
    expect(result).toEqual({ port: 8080 });
  });

  it("should override default value when string flag is provided", () => {
    const result = flags({
      host: flag("--host", "-h").string().default("localhost"),
    }).parse(["--host", "0.0.0.0"]);
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();
    expect(result).toEqual({ host: "0.0.0.0" });
  });

  it("should support default with describe for number flags", () => {
    const result = flags({
      port: flag("--port", "-p").number().describe("Port number").default(3000),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();
    expect(result).toEqual({ port: 3000 });
  });

  it("should support default with describe for string flags", () => {
    const result = flags({
      host: flag("--host", "-h")
        .string()
        .describe("Host address")
        .default("localhost"),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();
    expect(result).toEqual({ host: "localhost" });
  });

  it("should support describe after default for number flags", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000).describe("Port number"),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ port: number }>();
    expect(result).toEqual({ port: 3000 });
  });

  it("should support describe after default for string flags", () => {
    const result = flags({
      host: flag("--host", "-h")
        .string()
        .default("localhost")
        .describe("Host address"),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{ host: string }>();
    expect(result).toEqual({ host: "localhost" });
  });

  it("should handle multiple flags with different default values", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000),
      host: flag("--host", "-h").string().default("localhost"),
      verbose: flag("--verbose", "-v").boolean(),
    }).parse([]);
    expectTypeOf(result).toEqualTypeOf<{
      port: number;
      host: string;
      verbose: boolean;
    }>();
    expect(result).toEqual({
      port: 3000,
      host: "localhost",
      verbose: false,
    });
  });

  it("should handle partial override of default values", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000),
      host: flag("--host", "-h").string().default("localhost"),
    }).parse(["--port", "8080"]);
    expectTypeOf(result).toEqualTypeOf<{ port: number; host: string }>();
    expect(result).toEqual({ port: 8080, host: "localhost" });
  });

  it("should infer non-nullable type when default is provided for number", () => {
    const result = flags({
      port: flag("--port", "-p").number().default(3000),
    }).parse([]);
    // El tipo debe ser number, no number | null
    expectTypeOf(result.port).toEqualTypeOf<number>();
  });

  it("should infer non-nullable type when default is provided for string", () => {
    const result = flags({
      host: flag("--host", "-h").string().default("localhost"),
    }).parse([]);
    // El tipo debe ser string, no string | null
    expectTypeOf(result.host).toEqualTypeOf<string>();
  });

  it("should infer nullable type when default is NOT provided for number", () => {
    const result = flags({
      port: flag("--port", "-p").number(),
    }).parse([]);
    // El tipo debe ser number | null
    expectTypeOf(result.port).toEqualTypeOf<number | null>();
  });

  it("should infer nullable type when default is NOT provided for string", () => {
    const result = flags({
      host: flag("--host", "-h").string(),
    }).parse([]);
    // El tipo debe ser string | null
    expectTypeOf(result.host).toEqualTypeOf<string | null>();
  });
});

describe("commands", () => {
  it("should parse command with restArgs", () => {
    const parsed = flags({
      user: command("user").restArgs(),
    }).parse(["user", "export", "-u", "123", "-o", "./export"]);

    expectTypeOf(parsed).toEqualTypeOf<{ user: string[] }>();
    expect(parsed.user).toEqual(["export", "-u", "123", "-o", "./export"]);
  });

  it("should parse boolean command with flag", () => {
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
    });

    const parsed = flagsParser.parse(["user", "--verbose"]);
    expectTypeOf(parsed).toEqualTypeOf<{ verbose: boolean; user: boolean }>();
    expect(parsed.user).toBe(true);
    expect(parsed.verbose).toBe(true);
  });

  it("should parse multiple boolean commands", () => {
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
      info: command("info").boolean(),
    });

    const parsed = flagsParser.parse(["user", "info", "--verbose"]);
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      user: boolean;
      info: boolean;
    }>();
    expect(parsed.verbose).toBe(true);
    expect(parsed.user).toBe(true);
    expect(parsed.info).toBe(true);
  });

  it("should parse single command without others", () => {
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      user: command("user").boolean(),
      info: command("info").boolean(),
    });

    const parsed = flagsParser.parse(["user"]);
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      user: boolean;
      info: boolean;
    }>();
    expect(parsed.user).toBe(true);
    expect(parsed.info).toBe(false);
    expect(parsed.verbose).toBe(false);
  });
});

describe("arguments", () => {
  it("should parse single argument with command", () => {
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      command: argument().string(),
    });

    const parsed = flagsParser.parse(["user"]);
    expectTypeOf(parsed).toEqualTypeOf<{
      verbose: boolean;
      command: string | null;
    }>();
    expect(parsed.command).toBe("user");
    expect(parsed.verbose).toBe(false);
  });

  it("should throw error when extra argument is provided", () => {
    const flagsParser = flags({
      verbose: flag("--verbose").boolean(),
      command: argument().string(),
    });

    expect(() => {
      flagsParser.parse(["user", "info"]);
    }).toThrow("Unexpected argument: info");
  });

  it("should parse multiple arguments", () => {
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    const parsed = flagsParser.parse(["read", "123"]);

    expectTypeOf(parsed).toEqualTypeOf<{
      verb: string | null;
      userId: string | null;
    }>();
    expect(parsed.verb).toBe("read");
    expect(parsed.userId).toBe("123");
  });

  it("should parse partial arguments", () => {
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    const parsed = flagsParser.parse(["read"]);
    expectTypeOf(parsed).toEqualTypeOf<{
      verb: string | null;
      userId: string | null;
    }>();
    expect(parsed.verb).toBe("read");
    expect(parsed.userId).toBe(null);
  });

  it("should throw error when too many arguments provided", () => {
    const flagsParser = flags({
      verb: argument().string(),
      userId: argument().string(),
    });

    expect(() => {
      flagsParser.parse(["read", "123", "foo"]);
    }).toThrow("Unexpected argument: foo");
  });
});

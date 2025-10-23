import { describe, it, expect, expectTypeOf } from "bun:test";
import { flags, flag } from "./new-flags";

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

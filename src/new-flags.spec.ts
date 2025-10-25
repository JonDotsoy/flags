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

    expectTypeOf(parsed).toEqualTypeOf<{ user: string[] | null }>();
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

  it("should parse flags only without commands", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse(["--name", "jhon"]);
    expectTypeOf(parsed).toEqualTypeOf<{
      name: string | null;
      version: number | null;
      run: string[] | null;
      test: string[] | null;
    }>();
    expect(parsed).toEqual({
      name: "jhon",
      version: null,
      run: null,
      test: null,
    });
  });

  it("should parse flags with = syntax without commands", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse(["--name=jhon"]);

    expect(parsed).toEqual({
      name: "jhon",
      version: null,
      run: null,
      test: null,
    });
  });

  it("should parse multiple flags with = syntax", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse(["--name=jhon", "--version=1"]);
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: null,
      test: null,
    });
  });

  it("should parse multiple flags with mixed syntax", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse(["--name", "jhon", "--version=1"]);
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: null,
      test: null,
    });
  });

  it("should parse flags with run command and restArgs", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse([
      "--name",
      "jhon",
      "--version=1",
      "run",
      "foo",
    ]);
    expect(parsed).toEqual({
      name: "jhon",
      version: 1,
      run: ["foo"],
      test: null,
    });
  });

  it("should parse flags with test command and restArgs", () => {
    const flagsParser = flags({
      name: flag("--name").string(),
      version: flag("--version").number(),
      run: command("run").restArgs(),
      test: command("test").restArgs(),
    });

    const parsed = flagsParser.parse([
      "--name",
      "jhon",
      "--version=1",
      "test",
      "taz",
    ]);
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
    const help = dockerFlags.helpMessage();
    expect(help).toMatchSnapshot();
  });

  it("should parse docker --config flag", () => {
    const parsed = dockerFlags.parse(["--config", "/custom/path"]);
    expect(parsed.config).toBe("/custom/path");
    expect(parsed.logLevel).toBe("info"); // default value
  });

  it("should parse docker run command with args", () => {
    const parsed = dockerFlags.parse([
      "run",
      "-d",
      "-p",
      "8080:80",
      "nginx:latest",
    ]);
    expect(parsed.run).toEqual(["-d", "-p", "8080:80", "nginx:latest"]);
    expect(parsed.exec).toBe(null);
  });

  it("should parse docker run with global flags", () => {
    const parsed = dockerFlags.parse([
      "--debug",
      "--host",
      "tcp://localhost:2375",
      "run",
      "nginx",
    ]);
    expect(parsed.debug).toBe(true);
    expect(parsed.host).toBe("tcp://localhost:2375");
    expect(parsed.run).toEqual(["nginx"]);
  });

  it("should parse docker ps command", () => {
    const parsed = dockerFlags.parse(["ps", "-a"]);
    expect(parsed.ps).toEqual(["-a"]);
  });

  it("should parse docker build with context", () => {
    const parsed = dockerFlags.parse(["build", "-t", "myapp:latest", "."]);
    expect(parsed.build).toEqual(["-t", "myapp:latest", "."]);
  });

  it("should parse docker exec command", () => {
    const parsed = dockerFlags.parse([
      "exec",
      "-it",
      "container_name",
      "/bin/bash",
    ]);
    expect(parsed.exec).toEqual(["-it", "container_name", "/bin/bash"]);
  });

  it("should parse docker with short context flag", () => {
    const parsed = dockerFlags.parse(["-c", "mycontext", "ps"]);
    expect(parsed.context).toBe("mycontext");
    expect(parsed.ps).toEqual([]);
  });

  it("should parse docker images command", () => {
    const parsed = dockerFlags.parse(["images", "-a"]);
    expect(parsed.images).toEqual(["-a"]);
  });

  it("should parse docker pull command", () => {
    const parsed = dockerFlags.parse(["pull", "ubuntu:22.04"]);
    expect(parsed.pull).toEqual(["ubuntu:22.04"]);
  });

  it("should parse docker with multiple global flags", () => {
    const parsed = dockerFlags.parse([
      "--debug",
      "--tls",
      "-l",
      "debug",
      "container",
      "ls",
    ]);
    expect(parsed.debug).toBe(true);
    expect(parsed.tls).toBe(true);
    expect(parsed.logLevel).toBe("debug");
    expect(parsed.container).toEqual(["ls"]);
  });

  it("should parse docker version flag", () => {
    const parsed = dockerFlags.parse(["--version"]);
    expect(parsed.version).toBe(true);
  });

  it("should parse docker with log-level using = syntax", () => {
    const parsed = dockerFlags.parse(["--log-level=warn", "ps"]);
    expect(parsed.logLevel).toBe("warn");
    expect(parsed.ps).toEqual([]);
  });
});

import { describe, it, expect } from "bun:test";
import { FlagsParser } from "./FlagsParser";
import { FlagBuilder } from "./builders/FlagBuilder";
import { CommandBuilder } from "./builders/CommandBuilder";
import { ArgumentBuilder } from "./builders/ArgumentBuilder";
import { UnexpectedArgumentError } from "./errors/UnexpectedArgumentError";

describe("FlagsParser", () => {
  describe("constructor", () => {
    it("should create a parser with empty schema", () => {
      const schema = {};
      const parser = new FlagsParser(schema);
      expect(parser).toBeDefined();
    });
  });

  describe("program", () => {
    it("should return a new instance with updated program name", () => {
      const parser = new FlagsParser({});
      const result = parser.program("myapp");
      expect(result).not.toBe(parser);
      expect(result.metadata.program).toBe("myapp");
      expect(parser.metadata.program).toBe("cli");
    });
  });

  describe("describe", () => {
    it("should return a new instance with updated description", () => {
      const parser = new FlagsParser({});
      const result = parser.describe("A test CLI tool");
      expect(result).not.toBe(parser);
      expect(result.metadata.description).toBe("A test CLI tool");
      expect(parser.metadata.description).toBeUndefined();
    });
  });

  describe("parse", () => {
    it("should parse empty args with empty schema", () => {
      const parser = new FlagsParser({});
      const result = parser.parse([]);
      expect(result).toEqual({});
    });

    it("should parse string flag with space syntax", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name", "-n").string(),
      });
      const result = parser.parse(["--name", "john"]);
      expect(result).toEqual({ name: "john" });
    });

    it("should parse number flag with space syntax", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
      });
      const result = parser.parse(["--port", "3000"]);
      expect(result).toEqual({ port: 3000 });
    });

    it("should throw UnexpectedArgumentError for unrecognized argument", () => {
      const parser = new FlagsParser({});
      expect(() => parser.parse(["foo"])).toThrow(UnexpectedArgumentError);
    });

    it("should parse boolean command", () => {
      const parser = new FlagsParser({
        user: CommandBuilder.create("user").boolean(),
      });
      const result = parser.parse(["user"]);
      expect(result).toEqual({ user: true });
    });

    it("should parse argument", () => {
      const parser = new FlagsParser({
        file: ArgumentBuilder.create().string(),
      });
      const result = parser.parse(["input.txt"]);
      expect(result).toEqual({ file: "input.txt" });
    });
  });

  describe("parse - additional scenarios", () => {
    it("should parse string flag with equals syntax", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name", "-n").string(),
      });
      const result = parser.parse(["--name=john"]);
      expect(result).toEqual({ name: "john" });
    });

    it("should return null for string flag when not present", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name", "-n").string(),
      });
      const result = parser.parse([]);
      expect(result).toEqual({ name: null });
    });

    it("should parse number flag with equals syntax", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
      });
      const result = parser.parse(["--port=3000"]);
      expect(result).toEqual({ port: 3000 });
    });

    it("should return null for number flag when not present", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
      });
      const result = parser.parse([]);
      expect(result).toEqual({ port: null });
    });

    it("should parse multiple flags", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
        name: FlagBuilder.create("--name", "-n").string(),
      });
      const result = parser.parse(["--port", "3000", "--name", "app"]);
      expect(result).toEqual({ port: 3000, name: "app" });
    });

    it("should parse flags in any order", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
        name: FlagBuilder.create("--name", "-n").string(),
      });
      const result = parser.parse(["--name", "app", "--port", "3000"]);
      expect(result).toEqual({ port: 3000, name: "app" });
    });

    it("should handle mixed short and long flag names", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port", "-p").number(),
      });
      const result = parser.parse(["-p", "3000"]);
      expect(result).toEqual({ port: 3000 });
    });

    it("should parse command with string transformation", () => {
      const parser = new FlagsParser({
        run: CommandBuilder.create("run").string(),
      });
      const result = parser.parse(["run"]);
      expect(result).toEqual({ run: "run" });
    });

    it("should handle number argument", () => {
      const parser = new FlagsParser({
        count: ArgumentBuilder.create().number(),
      });
      const result = parser.parse(["42"]);
      expect(result).toEqual({ count: 42 });
    });

    it("should parse flags and arguments together", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name", "-n").string(),
        file: ArgumentBuilder.create().string(),
      });
      const result = parser.parse(["--name", "app", "input.txt"]);
      expect(result).toEqual({ name: "app", file: "input.txt" });
    });

    it("should not consume arguments used by other flags", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name", "-n").string(),
        port: FlagBuilder.create("--port", "-p").number(),
      });
      const result = parser.parse(["--name", "app", "--port", "3000"]);
      expect(result).toEqual({ name: "app", port: 3000 });
    });

    it("should handle multiple arguments", () => {
      const parser = new FlagsParser({
        source: ArgumentBuilder.create().string(),
        dest: ArgumentBuilder.create().string(),
      });
      const result = parser.parse(["input.txt", "output.txt"]);
      expect(result).toEqual({ source: "input.txt", dest: "output.txt" });
    });

    it("should handle flags between arguments", () => {
      const parser = new FlagsParser({
        verbose: FlagBuilder.create("--verbose", "-v").string(),
        source: ArgumentBuilder.create().string(),
        dest: ArgumentBuilder.create().string(),
      });
      const result = parser.parse([
        "input.txt",
        "--verbose",
        "yes",
        "output.txt",
      ]);
      expect(result).toEqual({
        verbose: "yes",
        source: "input.txt",
        dest: "output.txt",
      });
    });

    it("should throw with correct error message for unexpected argument", () => {
      const parser = new FlagsParser({});
      expect(() => parser.parse(["--unknown"])).toThrow(
        "Unexpected argument: --unknown",
      );
    });

    it("should handle schema with multiple builder types", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port").number(),
        run: CommandBuilder.create("run").boolean(),
        file: ArgumentBuilder.create().string(),
      });
      const result = parser.parse(["run", "--port", "3000", "input.txt"]);
      expect(result).toEqual({ port: 3000, run: true, file: "input.txt" });
    });
  });

  describe("version", () => {
    it("should return a new instance with updated version", () => {
      const parser = new FlagsParser({});
      const result = parser.version("1.0.0");
      expect(result).not.toBe(parser);
      expect(result.metadata.version).toBe("1.0.0");
      expect(parser.metadata.version).toBeUndefined();
    });
  });

  describe("fluent API", () => {
    it("should support chaining program, describe, and parse", () => {
      const parser = new FlagsParser({
        port: FlagBuilder.create("--port").number(),
      });
      const result = parser
        .program("myapp")
        .describe("Test application")
        .parse(["--port", "8080"]);
      expect(result).toEqual({ port: 8080 });
    });

    it("should support chaining in different order", () => {
      const parser = new FlagsParser({
        name: FlagBuilder.create("--name").string(),
      });
      const result = parser
        .describe("Test app")
        .program("testcli")
        .parse(["--name", "test"]);
      expect(result).toEqual({ name: "test" });
    });

    it("should support chaining program, version, describe, and parse", () => {
      const parser = new FlagsParser({
        verbose: FlagBuilder.create("--verbose").string(),
      });
      const result = parser
        .program("mycli")
        .version("2.0.0")
        .describe("My CLI tool")
        .parse(["--verbose", "true"]);
      expect(result).toEqual({ verbose: "true" });
    });

    it("should maintain immutability through chain", () => {
      const parser1 = new FlagsParser({});
      const parser2 = parser1.program("app1");
      const parser3 = parser2.describe("Description 1");
      const parser4 = parser3.version("1.0.0");

      expect(parser1.metadata.program).toBe("cli");
      expect(parser1.metadata.description).toBeUndefined();
      expect(parser1.metadata.version).toBeUndefined();

      expect(parser2.metadata.program).toBe("app1");
      expect(parser2.metadata.description).toBeUndefined();
      expect(parser2.metadata.version).toBeUndefined();

      expect(parser3.metadata.program).toBe("app1");
      expect(parser3.metadata.description).toBe("Description 1");
      expect(parser3.metadata.version).toBeUndefined();

      expect(parser4.metadata.program).toBe("app1");
      expect(parser4.metadata.description).toBe("Description 1");
      expect(parser4.metadata.version).toBe("1.0.0");
    });
  });
});

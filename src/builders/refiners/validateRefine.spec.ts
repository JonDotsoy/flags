import { describe, it, expect } from "bun:test";
import {
  argument,
  command,
  flag,
  flags,
  FlagsParseError,
  ValidationError,
} from "../../flags.js";

class MyError extends Error {}

const validPort = (n: number) => n >= 3_000 && n < 60_000;

describe("validate", () => {
  describe("flag", () => {
    it("passes the value through when valid", () => {
      const parser = flags({
        port: flag("--port", "-p").number().validate(validPort),
      });
      expect(parser.parse(["--port", "8080"])).toEqual({ port: 8080 });
      expect(parser.parse(["-p=3000"])).toEqual({ port: 3000 });
    });

    it("does not run when the flag is absent", () => {
      const parser = flags({
        port: flag("--port").number().default(80).validate(validPort),
      });
      expect(parser.parse([])).toEqual({ port: 80 });
    });

    it("throws a ValidationError with an automatic message", () => {
      const parser = flags({
        port: flag("--port", "-p").number().validate(validPort),
      });
      const [ok, error] = parser.safeParse(["--port", "70000"]);
      expect(ok).toBe(false);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(FlagsParseError);
      expect((error as ValidationError).message).toBe(
        "Invalid value for --port, -p: 70000",
      );
      expect((error as ValidationError).value).toBe(70000);
      expect((error as ValidationError).target).toBe("--port, -p");
    });

    it("uses a custom message", () => {
      const parser = flags({
        port: flag("--port", "-p")
          .number()
          .validate(validPort, "The port is not a valid value"),
      });
      expect(() => parser.parse(["--port", "80"])).toThrow(
        new ValidationError("--port, -p", 80, "The port is not a valid value"),
      );
    });

    it("throws the error returned by the custom message function", () => {
      const parser = flags({
        port: flag("--port", "-p")
          .number()
          .validate(validPort, () => new MyError("The port is not valid")),
      });
      expect(() => parser.parse(["--port", "80"])).toThrow(MyError);
    });

    it("accepts a function that builds the message from the value", () => {
      const parser = flags({
        port: flag("--port")
          .number()
          .validate(validPort, (n) => `Port ${n} is out of range`),
      });
      const [, error] = parser.safeParse(["--port", "80"]);
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as Error).message).toBe("Port 80 is out of range");
    });

    it("works with string flags", () => {
      const parser = flags({
        name: flag("--name")
          .string()
          .validate((s) => s.length >= 3),
      });
      expect(parser.parse(["--name", "bob"])).toEqual({ name: "bob" });
      expect(() => parser.parse(["--name", "al"])).toThrow(
        'Invalid value for --name: "al"',
      );
    });

    it("validates each occurrence of a strings flag", () => {
      const parser = flags({
        tags: flag("--tag")
          .strings()
          .validate((v) => v.every((t) => /^[a-z]+$/.test(t))),
      });
      expect(parser.parse(["--tag", "a", "--tag", "b"])).toEqual({
        tags: ["a", "b"],
      });
      expect(() => parser.parse(["--tag", "a", "--tag", "B"])).toThrow(
        ValidationError,
      );
    });

    it("works with boolean flags", () => {
      const parser = flags({
        force: flag("--force")
          .boolean()
          .validate(() => false, "--force is disabled"),
      });
      expect(parser.parse([])).toEqual({ force: false });
      expect(() => parser.parse(["--force"])).toThrow("--force is disabled");
    });

    it("keeps the builder chainable", () => {
      const parser = flags({
        port: flag("--port")
          .number()
          .validate(validPort)
          .gt(4000)
          .describe("Server port"),
      });
      expect(parser.parse(["--port", "5000"])).toEqual({ port: 5000 });
    });
  });

  describe("argument", () => {
    it("validates positional arguments", () => {
      const parser = flags({
        file: argument().validate((f) => f.endsWith(".txt")),
      });
      expect(parser.parse(["a.txt"])).toEqual({ file: "a.txt" });
      expect(() => parser.parse(["a.md"])).toThrow(
        'Invalid value for argument: "a.md"',
      );
    });

    it("validates number arguments", () => {
      const parser = flags({
        count: argument()
          .number()
          .validate((n) => n > 0, "count must be positive"),
      });
      expect(parser.parse(["3"])).toEqual({ count: 3 });
      expect(() => parser.parse(["-1"])).toThrow("count must be positive");
    });
  });

  describe("command", () => {
    it("validates command rest args", () => {
      const parser = flags({
        run: command("run")
          .restArgs()
          .validate((args) => args.length > 0, "run needs a script"),
      });
      expect(parser.parse(["run", "build"])).toEqual({
        run: ["build"],
      });
      expect(() => parser.parse(["run"])).toThrow("run needs a script");
    });

    it("uses the command name in the automatic message", () => {
      const parser = flags({
        serve: command("serve").validate(() => false),
      });
      expect(() => parser.parse(["serve"])).toThrow(
        'Invalid value for serve: "serve"',
      );
    });
  });
});

import { test, expect, describe } from "bun:test";
import { BooleanFlagBuilder } from "./BooleanFlagBuilder.js";
import { FlagBuilder } from "./FlagBuilder.js";

describe("BooleanFlagBuilder", () => {
  test("should create BooleanFlagBuilder from FlagBuilder", () => {
    const builder = FlagBuilder.create("--verbose").boolean();

    expect(builder).toBeInstanceOf(BooleanFlagBuilder);
  });

  test("should parse boolean flag without value", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose"]);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: true,
    });
  });

  test("should parse boolean flag with explicit true value", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose=true"]);

    expect(result).toEqual({
      args: ["--verbose=true"],
      index: 0,
      value: true,
    });
  });

  test("should parse boolean flag with explicit false value", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose=false"]);

    expect(result).toEqual({
      args: ["--verbose=false"],
      index: 0,
      value: false,
    });
  });

  test("should parse boolean flag with 1 as true", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose=1"]);

    expect(result).toEqual({
      args: ["--verbose=1"],
      index: 0,
      value: true,
    });
  });

  test("should parse boolean flag with 0 as false", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose=0"]);

    expect(result).toEqual({
      args: ["--verbose=0"],
      index: 0,
      value: false,
    });
  });

  test("should return null for invalid boolean value", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--verbose=invalid"]);

    expect(result).toBeNull();
  });

  test("should return null for non-matching flag", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(0, ["--other"]);

    expect(result).toBeNull();
  });

  test("should parse boolean flag at specific index", () => {
    const builder = FlagBuilder.create("--verbose").boolean();
    const result = builder.parse(1, ["--other", "--verbose", "--more"]);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 1,
      value: true,
    });
  });

  test("should support multiple flag aliases", () => {
    const builder = FlagBuilder.create("--verbose", "-v").boolean();

    const resultLong = builder.parse(0, ["--verbose"]);
    expect(resultLong).toEqual({
      args: ["--verbose"],
      index: 0,
      value: true,
    });

    const resultShort = builder.parse(0, ["-v"]);
    expect(resultShort).toEqual({
      args: ["-v"],
      index: 0,
      value: true,
    });
  });

  test("should support initial value", () => {
    const builder = FlagBuilder.create("--verbose").boolean().initial(false);

    expect(builder).toBeInstanceOf(BooleanFlagBuilder);
  });

  test("should support metadata", () => {
    const builder = FlagBuilder.create("--verbose")
      .boolean()
      .metadata({ key: "value" });

    expect(builder).toBeInstanceOf(BooleanFlagBuilder);
  });

  test("should support custom refine", () => {
    const builder = FlagBuilder.create("--verbose")
      .boolean()
      .refine((arg, index, args, context) => {
        if (context?.value === true) {
          return {
            ...context,
            value: false,
          };
        }
        return context;
      });

    const result = builder.parse(0, ["--verbose"]);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: false,
    });
  });

  test("should support transform", () => {
    const builder = FlagBuilder.create("--verbose")
      .boolean()
      .transform((value) => (value ? "yes" : "no"));

    const result = builder.parse(0, ["--verbose"]);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: "yes",
    });
  });

  test("should support delimiter method", () => {
    const builder = FlagBuilder.create("--verbose").boolean().delimiter("=");

    expect(builder).toBeInstanceOf(BooleanFlagBuilder);
  });

  test("should be case insensitive for boolean values", () => {
    const builder = FlagBuilder.create("--verbose").boolean();

    const resultTrue = builder.parse(0, ["--verbose=TRUE"]);
    expect(resultTrue?.value).toBe(true);

    const resultFalse = builder.parse(0, ["--verbose=FALSE"]);
    expect(resultFalse?.value).toBe(false);
  });

  describe("combined short flags", () => {
    test("should parse single-letter flag normally", () => {
      const builder = FlagBuilder.create("-a").boolean();
      const result = builder.parse(0, ["-a"]);

      expect(result).toEqual({
        args: ["-a"],
        index: 0,
        value: true,
      });
    });

    test("should not expand multi-letter short flags", () => {
      const builder = FlagBuilder.create("-abc").boolean();
      const result = builder.parse(0, ["-abc"]);

      expect(result).toEqual({
        args: ["-abc"],
        index: 0,
        value: true,
      });
    });

    test("should not expand flags with equals syntax", () => {
      const builder = FlagBuilder.create("-a").boolean();
      const result = builder.parse(0, ["-a=value"]);

      // Should try to parse as boolean value and fail
      expect(result).toBeNull();
    });

    test("should parse single-letter flag with long alias", () => {
      const builder = FlagBuilder.create("-a", "--all").boolean();

      const resultShort = builder.parse(0, ["-a"]);
      expect(resultShort).toEqual({
        args: ["-a"],
        index: 0,
        value: true,
      });

      const resultLong = builder.parse(0, ["--all"]);
      expect(resultLong).toEqual({
        args: ["--all"],
        index: 0,
        value: true,
      });
    });

    test("should parse docker-style short flags", () => {
      const builderT = FlagBuilder.create("-t", "--tty").boolean();
      const builderI = FlagBuilder.create("-i", "--interactive").boolean();

      const resultT = builderT.parse(0, ["-t"]);
      expect(resultT?.value).toBe(true);

      const resultI = builderI.parse(0, ["-i"]);
      expect(resultI?.value).toBe(true);
    });

    test("should parse unix-style short flags", () => {
      const builderA = FlagBuilder.create("-a", "--all").boolean();
      const builderL = FlagBuilder.create("-l", "--long").boolean();
      const builderH = FlagBuilder.create("-h", "--human-readable").boolean();

      const resultA = builderA.parse(0, ["-a"]);
      expect(resultA?.value).toBe(true);

      const resultL = builderL.parse(0, ["-l"]);
      expect(resultL?.value).toBe(true);

      const resultH = builderH.parse(0, ["-h"]);
      expect(resultH?.value).toBe(true);
    });

    test("should handle single-letter flags in different positions", () => {
      const builder = FlagBuilder.create("-v").boolean();

      const result1 = builder.parse(0, ["-v", "other"]);
      expect(result1?.value).toBe(true);

      const result2 = builder.parse(1, ["other", "-v"]);
      expect(result2?.value).toBe(true);

      const result3 = builder.parse(1, ["other", "-v", "more"]);
      expect(result3?.value).toBe(true);
    });

    test("should not match when flag is not present", () => {
      const builder = FlagBuilder.create("-a").boolean();
      const result = builder.parse(0, ["-b"]);

      expect(result).toBeNull();
    });

    test("should handle multiple single-letter aliases", () => {
      const builder = FlagBuilder.create("-h", "-?", "--help").boolean();

      const resultH = builder.parse(0, ["-h"]);
      expect(resultH?.value).toBe(true);

      const resultQ = builder.parse(0, ["-?"]);
      expect(resultQ?.value).toBe(true);

      const resultHelp = builder.parse(0, ["--help"]);
      expect(resultHelp?.value).toBe(true);
    });
  });
});

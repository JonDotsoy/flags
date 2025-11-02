import { test, expect, describe } from "bun:test";
import { BooleanFlagBuilder } from "./BooleanFlagBuilder";
import { FlagBuilder } from "./FlagBuilder";

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
});

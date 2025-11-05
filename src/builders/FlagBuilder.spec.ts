import { test, expect, describe } from "bun:test";
import { FlagBuilder } from "./FlagBuilder.js";

describe("FlagBuilder", () => {
  test("should create FlagBuilder with single alias", () => {
    const builder = FlagBuilder.create("--verbose");

    expect(builder).toBeInstanceOf(FlagBuilder);
  });

  test("should create FlagBuilder with multiple aliases", () => {
    const builder = FlagBuilder.create("--foo", "-f");

    expect(builder).toBeInstanceOf(FlagBuilder);
  });

  test("should parse flag without value", () => {
    const builder = FlagBuilder.create("--verbose");
    const result = builder.parse(0, ["--verbose"]);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: "",
    });
  });

  test("should parse flag with value using = syntax", () => {
    const builder = FlagBuilder.create("--verbose");
    const result = builder.parse(0, ["--verbose=foo"]);

    expect(result).toEqual({
      args: ["--verbose=foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should parse flag with comma-separated value using = syntax", () => {
    const builder = FlagBuilder.create("--verbose");
    const result = builder.parse(0, ["--verbose=foo,taz"]);

    expect(result).toEqual({
      args: ["--verbose=foo,taz"],
      index: 0,
      value: "foo,taz",
    });
  });

  test("should parse flag using first alias", () => {
    const builder = FlagBuilder.create("--foo", "-f");
    const result = builder.parse(0, ["--foo"]);

    expect(result).toEqual({
      args: ["--foo"],
      index: 0,
      value: "",
    });
  });

  test("should parse flag using second alias", () => {
    const builder = FlagBuilder.create("--foo", "-f");
    const result = builder.parse(0, ["-f"]);

    expect(result).toEqual({
      args: ["-f"],
      index: 0,
      value: "",
    });
  });

  test("should parse short alias with value using = syntax", () => {
    const builder = FlagBuilder.create("--foo", "-f");
    const result = builder.parse(0, ["-f=bar"]);

    expect(result).toEqual({
      args: ["-f=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should return null for non-matching flag", () => {
    const builder = FlagBuilder.create("--verbose");
    const result = builder.parse(0, ["--other"]);

    expect(result).toBeNull();
  });

  test("should parse flag at specific index", () => {
    const builder = FlagBuilder.create("--verbose");
    const result = builder.parse(1, ["cmd", "--verbose=value"]);

    expect(result).toEqual({
      args: ["--verbose=value"],
      index: 1,
      value: "value",
    });
  });

  test("should support initial value", () => {
    const builder = FlagBuilder.create("--verbose").initial("default");

    expect(builder).toBeInstanceOf(FlagBuilder);
  });

  test("should support string method", () => {
    const builder = FlagBuilder.create("--verbose").string();

    expect(builder).toBeDefined();
  });

  test("should support metadata", () => {
    const builder = FlagBuilder.create("--verbose").metadata({ key: "value" });

    expect(builder).toBeInstanceOf(FlagBuilder);
  });

  test("should support custom refine", () => {
    const builder = FlagBuilder.create("--verbose").refine(
      (arg, index, args, context) => {
        if (context?.value === "foo") {
          return {
            ...context,
            value: "FOO",
          };
        }
        return context;
      },
    );

    const result = builder.parse(0, ["--verbose=foo"]);

    expect(result).toEqual({
      args: ["--verbose=foo"],
      index: 0,
      value: "FOO",
    });
  });

  test("should support accumulate", () => {
    const builder = FlagBuilder.create("--verbose").accumulate(
      (prev, value) => [...(Array.isArray(prev) ? prev : [prev]), value],
    );

    const result1 = builder.parse(0, ["--verbose=foo"]);
    const result2 = builder.parse(1, ["--verbose=foo", "--verbose=bar"], {
      current: result1?.value,
    });

    expect(result2).toEqual({
      args: ["--verbose=bar"],
      index: 1,
      value: ["foo", "bar"],
    });
  });

  test("should parse flag without dashes", () => {
    const builder = FlagBuilder.create("foo-taz");
    const result = builder.parse(0, ["foo-taz"]);

    expect(result).toEqual({
      args: ["foo-taz"],
      index: 0,
      value: "",
    });
  });

  test("should parse flag without dashes with = value", () => {
    const builder = FlagBuilder.create("foo-taz");
    const result = builder.parse(0, ["foo-taz=bar"]);

    expect(result).toEqual({
      args: ["foo-taz=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should parse string flag with next argument value", () => {
    const builder = FlagBuilder.create("--foo").string();
    const result = builder.parse(0, ["--foo", "taz"]);

    expect(result).toEqual({
      args: ["--foo", "taz"],
      index: 0,
      value: "taz",
    });
  });

  test("should parse string flag with = value", () => {
    const builder = FlagBuilder.create("--foo").string();
    const result = builder.parse(0, ["--foo=taz"]);

    expect(result).toEqual({
      args: ["--foo=taz"],
      index: 0,
      value: "taz",
    });
  });

  test("should return null for string flag without value", () => {
    const builder = FlagBuilder.create("--foo").string();
    const result = builder.parse(0, ["--foo"]);

    expect(result).toBeNull();
  });

  test("should parse string flag with comma-separated value", () => {
    const builder = FlagBuilder.create("--foo").string();
    const result = builder.parse(0, ["--foo", "bar,baz"]);

    expect(result).toEqual({
      args: ["--foo", "bar,baz"],
      index: 0,
      value: "bar,baz",
    });
  });

  test("should support delimiter method on string builder", () => {
    const builder = FlagBuilder.create("--foo").string().delimiter(":");

    expect(builder).toBeDefined();
  });

  test("should parse string flag with custom delimiter", () => {
    const builder = FlagBuilder.create("--foo").string().delimiter(":");
    const result = builder.parse(0, ["--foo:taz"]);

    expect(result).toEqual({
      args: ["--foo:taz"],
      index: 0,
      value: "taz",
    });
  });

  test("should support number method", () => {
    const builder = FlagBuilder.create("--count").number();

    expect(builder).toBeDefined();
  });

  test("should parse number flag with = value", () => {
    const builder = FlagBuilder.create("--count").number();
    const result = builder.parse(0, ["--count=123"]);

    expect(result).toEqual({
      args: ["--count=123"],
      index: 0,
      value: 123,
    });
  });

  test("should parse number flag with next argument value", () => {
    const builder = FlagBuilder.create("--count").number();
    const result = builder.parse(0, ["--count", "456"]);

    expect(result).toEqual({
      args: ["--count", "456"],
      index: 0,
      value: 456,
    });
  });

  test("should return null for number flag without value", () => {
    const builder = FlagBuilder.create("--count").number();
    const result = builder.parse(0, ["--count"]);

    expect(result).toBeNull();
  });

  test("should return null for non-numeric value", () => {
    const builder = FlagBuilder.create("--count").number();
    const result = builder.parse(0, ["--count=abc"]);

    expect(result).toBeNull();
  });

  test("should parse negative numbers", () => {
    const builder = FlagBuilder.create("--count").number();
    const result = builder.parse(0, ["--count=-10"]);

    expect(result).toEqual({
      args: ["--count=-10"],
      index: 0,
      value: -10,
    });
  });

  test("should parse decimal numbers", () => {
    const builder = FlagBuilder.create("--ratio").number();
    const result = builder.parse(0, ["--ratio=3.14"]);

    expect(result).toEqual({
      args: ["--ratio=3.14"],
      index: 0,
      value: 3.14,
    });
  });

  test("should support number flag with custom delimiter", () => {
    const builder = FlagBuilder.create("--count").number().delimiter(":");
    const result = builder.parse(0, ["--count:42"]);

    expect(result).toEqual({
      args: ["--count:42"],
      index: 0,
      value: 42,
    });
  });

  test("should support positive validation", () => {
    const builder = FlagBuilder.create("--count").number().positive();
    const result1 = builder.parse(0, ["--count=5"]);
    const result2 = builder.parse(0, ["--count=-5"]);

    expect(result1).toEqual({
      args: ["--count=5"],
      index: 0,
      value: 5,
    });
    expect(result2).toBeNull();
  });

  test("should support negative validation", () => {
    const builder = FlagBuilder.create("--count").number().negative();
    const result1 = builder.parse(0, ["--count=-5"]);
    const result2 = builder.parse(0, ["--count=5"]);

    expect(result1).toEqual({
      args: ["--count=-5"],
      index: 0,
      value: -5,
    });
    expect(result2).toBeNull();
  });

  test("should support greaterThan validation", () => {
    const builder = FlagBuilder.create("--count").number().gt(10);
    const result1 = builder.parse(0, ["--count=15"]);
    const result2 = builder.parse(0, ["--count=5"]);

    expect(result1).toEqual({
      args: ["--count=15"],
      index: 0,
      value: 15,
    });
    expect(result2).toBeNull();
  });

  test("should support greaterThanOrEqual validation", () => {
    const builder = FlagBuilder.create("--count").number().gte(10);
    const result1 = builder.parse(0, ["--count=10"]);
    const result2 = builder.parse(0, ["--count=9"]);

    expect(result1).toEqual({
      args: ["--count=10"],
      index: 0,
      value: 10,
    });
    expect(result2).toBeNull();
  });

  test("should support lessThan validation", () => {
    const builder = FlagBuilder.create("--count").number().lt(10);
    const result1 = builder.parse(0, ["--count=5"]);
    const result2 = builder.parse(0, ["--count=15"]);

    expect(result1).toEqual({
      args: ["--count=5"],
      index: 0,
      value: 5,
    });
    expect(result2).toBeNull();
  });

  test("should support lessThanOrEqual validation", () => {
    const builder = FlagBuilder.create("--count").number().lte(10);
    const result1 = builder.parse(0, ["--count=10"]);
    const result2 = builder.parse(0, ["--count=11"]);

    expect(result1).toEqual({
      args: ["--count=10"],
      index: 0,
      value: 10,
    });
    expect(result2).toBeNull();
  });

  test("should support multipleOf validation", () => {
    const builder = FlagBuilder.create("--count").number().multipleOf(5);
    const result1 = builder.parse(0, ["--count=15"]);
    const result2 = builder.parse(0, ["--count=7"]);

    expect(result1).toEqual({
      args: ["--count=15"],
      index: 0,
      value: 15,
    });
    expect(result2).toBeNull();
  });

  test("should chain multiple number validations", () => {
    const builder = FlagBuilder.create("--count")
      .number()
      .positive()
      .gte(10)
      .lte(100);
    const result1 = builder.parse(0, ["--count=50"]);
    const result2 = builder.parse(0, ["--count=5"]);
    const result3 = builder.parse(0, ["--count=150"]);

    expect(result1).toEqual({
      args: ["--count=50"],
      index: 0,
      value: 50,
    });
    expect(result2).toBeNull();
    expect(result3).toBeNull();
  });
});

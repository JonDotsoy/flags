import { test, expect, describe } from "bun:test";
import { CommandBuilder } from "./CommandBuilder";
import { BooleanCommandBuilder } from "./BooleanCommandBuilder";

describe("CommandBuilder", () => {
  test("should create CommandBuilder with argumentMatch", () => {
    const builder = CommandBuilder.create("foo");

    expect(builder).toBeInstanceOf(CommandBuilder);
  });

  test("should parse matching command", () => {
    const builder = CommandBuilder.create("foo");
    const result = builder.parse(0, ["foo"]);

    expect(result).toEqual({
      args: ["foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should return null for non-matching command", () => {
    const builder = CommandBuilder.create("foo");
    const result = builder.parse(0, ["bar"]);

    expect(result).toBeNull();
  });

  test("should parse command at specific index", () => {
    const builder = CommandBuilder.create("foo");
    const result = builder.parse(1, ["bar", "foo", "baz"]);

    expect(result).toEqual({
      args: ["foo"],
      index: 1,
      value: "foo",
    });
  });

  test("should support initial value", () => {
    const builder = CommandBuilder.create("foo").initial("default");

    expect(builder).toBeInstanceOf(CommandBuilder);
  });

  test("should support string method", () => {
    const builder = CommandBuilder.create("foo").string();

    expect(builder).toBeInstanceOf(CommandBuilder);
  });

  test("should support metadata", () => {
    const builder = CommandBuilder.create("foo").metadata({ key: "value" });

    expect(builder).toBeInstanceOf(CommandBuilder);
  });

  test("should support custom refine", () => {
    const builder = CommandBuilder.create("foo").refine(
      (arg, index, args, context) => {
        if (context?.value === "foo") {
          return {
            ...context,
            value: "FOO",
          };
        }
        return null;
      },
    );

    const result = builder.parse(0, ["foo"]);

    expect(result).toEqual({
      args: ["foo"],
      index: 0,
      value: "FOO",
    });
  });

  test("should support accumulate", () => {
    const builder = CommandBuilder.create("foo").accumulate((prev, value) => [
      ...(Array.isArray(prev) ? prev : [prev]),
      value,
    ]);

    const result1 = builder.parse(0, ["foo"]);
    const result2 = builder.parse(1, ["foo", "foo"], {
      current: result1?.value,
    });

    expect(result2).toEqual({
      args: ["foo"],
      index: 1,
      value: ["foo", "foo"],
    });
  });
  test("should handle multiple parses without accumulate", () => {
    const builder = CommandBuilder.create("foo");

    const result1 = builder.parse(0, ["foo"]);
    const result2 = builder.parse(1, ["foo", "foo"], {
      current: result1?.value,
    });

    expect(result2).toEqual({
      args: ["foo"],
      index: 1,
      value: "foo",
    });
  });
  test("should support transform", () => {
    const builder = CommandBuilder.create("foo").transform((value) => value.toUpperCase());

    const result = builder.parse(0, ["foo"]);

    expect(result).toEqual({
      args: ["foo"],
      index: 0,
      value: "FOO",
    });
  });  
  test("should support boolean method", () => {
    const builder = CommandBuilder.create("foo").boolean();

    expect(builder).toBeInstanceOf(BooleanCommandBuilder);
  });
  test("should parse boolean command correctly", () => {
    const builder = CommandBuilder.create("foo").boolean();
    const result = builder.parse(0, ["foo"]);

    expect(result).toEqual({
      args: ["foo"],
      index: 0,
      value: true,
    });
  });
  
});

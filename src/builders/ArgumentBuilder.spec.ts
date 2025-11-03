import { test, describe, expect } from "bun:test";
import { ArgumentBuilder } from "./ArgumentBuilder";
import { Builder } from "./Builder";
import { StringsArgumentBuilder } from "./StringsArgumentBuilder";

describe("ArgumentBuilder", () => {
  test("should create an instance of Builder", () => {
    const builder = ArgumentBuilder.create();

    expect(builder).toBeInstanceOf(Builder);
  });
  test("should parse a single argument", () => {
    const builder = ArgumentBuilder.create();

    const parsed = builder.parse(0, ["foo"]);

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: "foo" });
  });
  test("should accumulate values with custom accumulator", () => {
    const builder = ArgumentBuilder.create().accumulate((prev, current) => {
      return prev + current;
    });

    const parsed = builder.parse(0, ["foo"], { current: "taz" });

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: "tazfoo" });
  });
  test("should accumulate array values with refine and custom accumulator", () => {
    const builder = ArgumentBuilder.create()
      .refine((arg, index, args) => ({
        args: args.slice(index, index + 1),
        index,
        value: Array.isArray(arg) ? arg : [arg],
      }))
      .accumulate((prev, current) => {
        return [
          ...(Array.isArray(prev) ? prev : [prev]),
          ...(Array.isArray(current) ? current : [current]),
        ];
      });

    const parsed = builder.parse(0, ["foo"], { current: ["taz"] });

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: ["taz", "foo"] });
  });
  test("should return StringsArgumentBuilder when calling strings()", () => {
    const builder = ArgumentBuilder.create().strings();

    expect(builder).toBeInstanceOf(StringsArgumentBuilder);
  });
  test("should parse and accumulate strings as array", () => {
    const builder = ArgumentBuilder.create().strings();

    const parsed = builder.parse(0, ["foo"], { current: ["taz"] });

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: ["taz", "foo"] });
  });
  test("should parse argument as string", () => {
    const builder = ArgumentBuilder.create().string();

    const parsed = builder.parse(0, ["foo"], { current: ["taz"] });

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: "foo" });
  });
  test("should parse argument as number (NaN for invalid)", () => {
    const builder = ArgumentBuilder.create().number();

    const parsed = builder.parse(0, ["foo"], { current: ["taz"] });

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: NaN });
  });
  test("should return null when parsing invalid number with notNaN()", () => {
    const builder = ArgumentBuilder.create().number().notNaN();

    const parsed = builder.parse(0, ["foo"], { current: ["taz"] });

    expect(parsed).toBeNull();
  });
  test("should parse valid number argument", () => {
    const builder = ArgumentBuilder.create().number();

    const parsed = builder.parse(0, ["101"], { current: ["101"] });

    expect(parsed).toEqual({ args: ["101"], index: 0, value: 101 });
  });
  test("should support transform to uppercase", () => {
    const builder = ArgumentBuilder.create().transform((value) =>
      value.toUpperCase(),
    );

    const parsed = builder.parse(0, ["foo"]);

    expect(parsed).toEqual({ args: ["foo"], index: 0, value: "FOO" });
  });
  test("should support transform with string method", () => {
    const builder = ArgumentBuilder.create()
      .string()
      .transform((value) => value.toUpperCase());

    const parsed = builder.parse(0, ["hello"]);

    expect(parsed).toEqual({ args: ["hello"], index: 0, value: "HELLO" });
  });
  test("should support transform with number method", () => {
    const builder = ArgumentBuilder.create()
      .number()
      .transform((value) => (value ?? 0) * 2);

    const parsed = builder.parse(0, ["10"]);

    expect(parsed).toEqual({ args: ["10"], index: 0, value: 20 });
  });
  test("should support transform to different type", () => {
    const builder = ArgumentBuilder.create().transform((value) => ({
      original: value,
      length: value.length,
    }));

    const parsed = builder.parse(0, ["test"]);

    expect(parsed).toEqual({
      args: ["test"],
      index: 0,
      value: { original: "test", length: 4 },
    });
  });
  test("should match regex with named groups", () => {
    const builder = ArgumentBuilder.create().match(
      /^(?<part1>\w+):(?<part2>\w+)$/,
    );

    const parsed = builder.parse(0, ["tar:foo"]);

    expect(parsed).toEqual({
      args: ["tar:foo"],
      index: 0,
      value: { part1: "tar", part2: "foo" },
    });
  });
  test("should return null when regex does not match", () => {
    const builder = ArgumentBuilder.create().match(/^TAR-(?<part2>\w+)$/);

    const parsed = builder.parse(0, ["tar:foo"]);

    expect(parsed).toBeNull();
  });
  test("should match regex without named groups", () => {
    const builder = ArgumentBuilder.create().match(/^\w+:\w+$/);

    const parsed = builder.parse(0, ["tar:foo"]);

    expect(parsed).toEqual({
      args: ["tar:foo"],
      index: 0,
      value: "tar:foo",
    });
  });
  test("should match regex with partial groups", () => {
    const builder = ArgumentBuilder.create().match(/^(\w+):(\w+)$/);

    const parsed = builder.parse(0, ["hello:world"]);

    expect(parsed).toEqual({
      args: ["hello:world"],
      index: 0,
      value: "hello:world",
    });
  });
});

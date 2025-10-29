import { test, it, expect, describe } from "bun:test";
import {
  ArgumentBuilder as Builder,
  type Refine,
  FlagsParser as FlagsParser,
} from "./flags";

type Context = {
  args: string[];
  index: number;
  value: any;
};

const fooParser: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (arg === "foo") {
    return {
      args: [arg],
      index: index + 1,
      value: arg,
    };
  }
  return null;
};

const upperParser: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (context) {
    return {
      ...context,
      value: context.value.toUpperCase(),
    };
  }
  return null;
};

// Parse ['--foo', <value>]
const flagParser: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (arg.startsWith("--")) {
    const label = arg.slice(2);
    if (index + 1 < args.length) {
      return {
        args: [label, args[index + 1]],
        index: index + 2,
        value: args[index + 1],
      };
    }
  }
  return null;
};

const flagParser2 =
  (name: string): Refine =>
  (
    arg: string,
    index: number,
    args: string[],
    context: null | Context,
  ): null | Context => {
    if (arg.startsWith(`--${name}`)) {
      const label = arg.slice(2);
      if (index + 1 < args.length) {
        return {
          args: [label, args[index + 1]],
          index: index + 2,
          value: args[index + 1],
        };
      }
    }
    return null;
  };

describe("ArgumentBuilder and FlagsParser", () => {
  it("should return null when parsing empty args without refiners", () => {
    expect(Builder.create().parse(0, [])).toEqual(null);
  });
  it("should return null when parsing empty args with fooParser", () => {
    expect(Builder.create().refine(fooParser).parse(0, [])).toEqual(null);
  });
  it("should parse 'foo' argument correctly", () => {
    expect(Builder.create().refine(fooParser).parse(0, ["foo"])).toEqual({
      args: ["foo"],
      index: 0,
      value: "foo",
    });
  });
  it("should chain refiners and transform 'foo' to uppercase", () => {
    expect(
      Builder.create().refine(fooParser).refine(upperParser).parse(0, ["foo"]),
    ).toEqual({ args: ["foo"], index: 0, value: "FOO" });
  });
  it("should parse flag with value", () => {
    expect(
      Builder.create().refine(flagParser).parse(0, ["--foo", "biz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "biz" });
  });
  it("should parse flag and transform value to uppercase", () => {
    expect(
      Builder.create()
        .refine(flagParser)
        .refine(upperParser)
        .parse(0, ["--foo", "biz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "BIZ" });
  });
  it("should parse flag and ignore extra arguments", () => {
    expect(
      Builder.create()
        .refine(flagParser)
        .refine(upperParser)
        .parse(0, ["--foo", "biz", "taz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "BIZ" });
  });
  it("should return null when starting at wrong index", () => {
    expect(
      Builder.create()
        .refine(flagParser)
        .refine(upperParser)
        .parse(0, ["bar", "--foo", "biz", "taz"]),
    ).toEqual(null);
  });
  it("should parse flag when starting at correct index", () => {
    expect(
      Builder.create()
        .refine(flagParser)
        .refine(upperParser)
        .parse(1, ["bar", "--foo", "biz", "taz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 1, value: "BIZ" });
  });
  it("should parse single flag with FlagsParser", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().refine(flagParser),
    });

    expect(flagsParser.parse(["--foo", "biz"])).toEqual({ foo: "biz" });
  });
  it("should return null for missing optional flag", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().refine(flagParser),
    });

    expect(flagsParser.parse([])).toEqual({ foo: null });
  });
  it("should throw error for unrecognized arguments", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().refine(flagParser),
    });

    expect(() => {
      flagsParser.parse(["taz"]);
    }).toThrow();
  });
  it("should use initial value when flag is not provided", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().setInitial(1).refine(flagParser),
    });

    expect(flagsParser.parse([])).toEqual({ foo: 1 });
  });
  it("should handle multiple flags with null values", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().refine(flagParser2("foo")),
      tar: Builder.create().refine(flagParser2("tar")),
    });

    expect(flagsParser.parse([])).toEqual({ foo: null, tar: null });
  });
  it("should parse multiple flags with their values", () => {
    const flagsParser = new FlagsParser({
      foo: Builder.create().refine(flagParser2("foo")),
      tar: Builder.create().refine(flagParser2("tar")),
    });

    expect(flagsParser.parse(["--foo", "biz", "--tar", "bar"])).toEqual({
      foo: "biz",
      tar: "bar",
    });
  });
});

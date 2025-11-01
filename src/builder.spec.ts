import { test, it, expect, describe, mock } from "bun:test";
import { FlagsParser } from "./FlagsParser";
import { Builder } from "./builders/Builder";
import { type Refine } from "./dtos/Refine";
import { Spec } from "./builders/Spec";

type Context = {
  args: string[];
  index: number;
  value: any;
};

const matchFooRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (arg === "foo") {
    return {
      args: args.slice(index, index + 1),
      index: index,
      value: arg,
    };
  }
  return null;
};

const uppercaseValueRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (typeof context?.value === "string") {
    return {
      ...context,
      value: context.value.toUpperCase(),
    };
  }
  return null;
};

const addBracketsRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (typeof context?.value === "string") {
    return {
      ...context,
      value: `[${context.value}]`,
    };
  }
  return null;
};

// Parse ['--foo', <value>]
const nextArgumentRefine: Refine = (
  arg: string,
  index: number,
  args: string[],
  context: null | Context,
): null | Context => {
  if (args.length > index + 1) {
    return {
      args: args.slice(index, index + 2),
      index: index,
      value: args[index + 1],
    };
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
          index: index,
          value: args[index + 1],
        };
      }
    }
    return null;
  };

const secondArgAsValueRefine: Refine = (arg, index, args, context) => {
  const argsChunk = args.slice(index, index + 2);
  if (argsChunk.length !== 2) return null;
  return {
    args: argsChunk,
    index: index,
    value: argsChunk[1],
  };
};

const uppercaseRefine: Refine = (arg, index, args, context) => {
  if (typeof context?.value === "string") {
    return {
      ...context,
      value: context.value.toUpperCase(),
    };
  }
  return null;
};

const argumentRefine = (arg: string, index: number) => ({
  args: [arg],
  index: index,
  value: arg,
});

const arrayArgumentsAccumulator = (prev: any, value: any) => [
  ...(Array.isArray(prev) ? prev : [prev]),
  ...(Array.isArray(value) ? value : [value]),
];

describe("refine style", () => {
  test("should refine second argument as value", () => {
    const args = ["foo", "bar"];
    const index = 0;
    const arg = args[index];

    const refined = secondArgAsValueRefine(arg, index, args, null);

    expect(refined).toEqual({
      args: ["foo", "bar"],
      index: 0,
      value: "bar",
    });
  });
  test("should refine second argument and transform to uppercase", () => {
    const args = ["foo", "bar"];
    const index = 0;
    const arg = args[index];

    const refined1 = secondArgAsValueRefine(arg, index, args, null);
    const refined2 = uppercaseRefine(arg, index, args, refined1);

    expect(refined2).toEqual({
      args: ["foo", "bar"],
      index: 0,
      value: "BAR",
    });
  });
  test("should refine second argument starting at index 1", () => {
    const args = ["biz", "foo", "bar", "tar"];
    const index = 1;
    const arg = args[index];

    const refined = secondArgAsValueRefine(arg, index, args, null);

    expect(refined).toEqual({
      args: ["foo", "bar"],
      index: 1,
      value: "bar",
    });
  });
  test("should refine second argument at index 1 and transform to uppercase", () => {
    const args = ["biz", "foo", "bar", "tar"];
    const index = 1;
    const arg = args[index];

    const refined1 = secondArgAsValueRefine(arg, index, args, null);
    const refined2 = uppercaseRefine(arg, index, args, refined1);

    expect(refined2).toEqual({
      args: ["foo", "bar"],
      index: 1,
      value: "BAR",
    });
  });
  test("should return null when index is out of bounds", () => {
    const args = ["biz", "foo", "bar", "tar"];
    const index = 4;
    const arg = args[index];

    const refined1 = secondArgAsValueRefine(arg, index, args, null);
    const refined2 = uppercaseRefine(arg, index, args, refined1);

    expect(refined2).toBeNull();
  });
  test("should parse next argument as value", () => {
    const args = ["biz", "foo", "bar", "tar"];
    const index = 1;
    const arg = args[index];

    const refined = nextArgumentRefine(arg, index, args, null);

    expect(refined).toEqual({
      args: ["foo", "bar"],
      index: 1,
      value: "bar",
    });
  });
});

describe("ArgumentBuilder and FlagsParser", () => {
  it("should return null when parsing empty args without refiners", () => {
    expect(new Builder(new Spec(null, [])).parse(0, [])).toEqual(null);
  });
  it("should return null when parsing empty args with fooParser", () => {
    expect(
      new Builder(new Spec(null, [])).refine(matchFooRefine).parse(0, []),
    ).toEqual(null);
  });
  it("should parse 'foo' argument correctly", () => {
    expect(
      new Builder(new Spec(null, [])).refine(matchFooRefine).parse(0, ["foo"]),
    ).toEqual({
      args: ["foo"],
      index: 0,
      value: "foo",
    });
  });
  it("should chain refiners and transform 'foo' to uppercase", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(matchFooRefine)
        .refine(uppercaseValueRefine)
        .parse(0, ["foo"]),
    ).toEqual({ args: ["foo"], index: 0, value: "FOO" });
  });
  it("should parse flag with value", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .parse(0, ["--foo", "biz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "biz" });
  });
  it("should parse flag and transform value to uppercase", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .parse(0, ["--foo", "biz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "BIZ" });
  });
  it("should parse flag and ignore extra arguments", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .parse(0, ["--foo", "biz", "taz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 0, value: "BIZ" });
  });
  it("should return null when starting at wrong index", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .parse(1, ["bar", "--foo", "biz", "taz"]),
    ).toEqual({
      args: ["--foo", "biz"],
      index: 1,
      value: "BIZ",
    });
  });
  it("should parse first two arguments when starting at index 0", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .parse(0, ["bar", "--foo", "biz", "taz"]),
    ).toEqual({
      args: ["bar", "--foo"],
      index: 0,
      value: "--FOO",
    });
  });
  it("should parse flag when starting at correct index", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .parse(1, ["bar", "--foo", "biz", "taz"]),
    ).toEqual({ args: ["--foo", "biz"], index: 1, value: "BIZ" });
  });
  it("should return null when parsing without refiners", () => {
    expect(new Builder(new Spec(null, [])).parse(0, ["foo"])).toBeNull();
  });
  it("should parse argument with simple refiner", () => {
    expect(
      new Builder(new Spec(null, []))
        .refine((arg, index) => ({ value: arg, index, args: [] }))
        .parse(0, ["foo"]),
    ).toEqual({
      args: [],
      index: 0,
      value: "foo",
    });
  });
  it("should parse single flag with FlagsParser", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, [])).refine(nextArgumentRefine),
    });

    expect(flagsParser.parse(["--foo", "biz"])).toEqual({ foo: "biz" });
  });
  it("should return null for missing optional flag", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, [])).refine(nextArgumentRefine),
    });

    expect(flagsParser.parse([])).toEqual({ foo: null });
  });
  it("should throw error for unrecognized arguments", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, [])).refine(nextArgumentRefine),
    });

    expect(() => {
      flagsParser.parse(["taz"]);
    }).toThrow();
  });
  it("should use initial value when flag is not provided", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, []))
        .initial(1)
        .refine(nextArgumentRefine),
    });

    expect(flagsParser.parse([])).toEqual({ foo: 1 });
  });
  it("should handle multiple flags with null values", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, [])).refine(flagParser2("foo")),
      tar: new Builder(new Spec(null, [])).refine(flagParser2("tar")),
    });

    expect(flagsParser.parse([])).toEqual({ foo: null, tar: null });
  });
  it("should parse multiple flags with their values", () => {
    const flagsParser = new FlagsParser({
      foo: new Builder(new Spec(null, [])).refine(flagParser2("foo")),
      tar: new Builder(new Spec(null, [])).refine(flagParser2("tar")),
    });

    expect(flagsParser.parse(["--foo", "biz", "--tar", "bar"])).toEqual({
      foo: "biz",
      tar: "bar",
    });
  });

  describe("accumulate", () => {
    it("should return parsed value without accumulate function", () => {
      const result = new Builder(new Spec(null, []))
        .refine(argumentRefine)
        .parse(0, ["foo"]);

      expect(result).toEqual({ args: ["foo"], index: 0, value: "foo" });
    });

    it("should accumulate value into array using initial value when no prevValue provided", () => {
      const arrayArgumentsAccumulatorMock = mock(arrayArgumentsAccumulator);

      const result = new Builder(
        new Spec(null, [], arrayArgumentsAccumulatorMock),
      )
        .refine(argumentRefine)
        .parse(0, ["foo"]);

      expect(arrayArgumentsAccumulatorMock).not.toBeCalled();
      expect(result).toEqual({ args: ["foo"], index: 0, value: "foo" });
    });

    it("should accumulate value into array using provided prevValue", () => {
      const result = new Builder(new Spec(null, [], arrayArgumentsAccumulator))
        .refine(argumentRefine)
        .parse(1, ["foo", "taz"], { current: ["foo"] });

      expect(result).toEqual({
        args: ["taz"],
        index: 1,
        value: ["foo", "taz"],
      });
    });

    it("should accumulate multiple parsed values with transformations", () => {
      const arrayArgumentsAccumulatorMock = mock(arrayArgumentsAccumulator);

      const args = ["foo", "bar", "biz", "taz"];
      const index = 0;
      const arg = args[index];

      const builder = new Builder(new Spec(null, []))
        .refine(nextArgumentRefine)
        .refine(uppercaseValueRefine)
        .refine(addBracketsRefine)
        .accumulate(arrayArgumentsAccumulatorMock);

      const parsed1 = builder.parse(index, args)!;
      const parsed2 = builder.parse(index + parsed1.args.length, args, {
        current: parsed1.value,
      });

      expect(arrayArgumentsAccumulatorMock).toBeCalled();
      expect(parsed2).toEqual({
        args: ["biz", "taz"],
        index: 2,
        value: ["[BAR]", "[TAZ]"],
      });
    });
  });
});

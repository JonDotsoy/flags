import { test, expect, describe } from "bun:test";
import { numberFlagRefine } from "./numberFlagRefine";
import { Spec } from "../Spec";

describe("numberFlagRefine", () => {
  test("should return null if no context", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const result = refine("--foo", 0, ["--foo", "123"], null);

    expect(result).toBeNull();
  });

  test("should parse number from context value", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo=123"],
      index: 0,
      value: "123",
    };
    const result = refine("--foo=123", 0, ["--foo=123"], context);

    expect(result).toEqual({
      args: ["--foo=123"],
      index: 0,
      value: 123,
    });
  });

  test("should consume next argument as number", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = refine("--foo", 0, ["--foo", "456"], context);

    expect(result).toEqual({
      args: ["--foo", "456"],
      index: 0,
      value: 456,
    });
  });

  test("should return null if no next argument", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = refine("--foo", 0, ["--foo"], context);

    expect(result).toBeNull();
  });

  test("should return null for non-numeric value", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    };
    const result = refine("--foo=bar", 0, ["--foo=bar"], context);

    expect(result).toBeNull();
  });

  test("should parse negative numbers", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo=-123"],
      index: 0,
      value: "-123",
    };
    const result = refine("--foo=-123", 0, ["--foo=-123"], context);

    expect(result).toEqual({
      args: ["--foo=-123"],
      index: 0,
      value: -123,
    });
  });

  test("should parse decimal numbers", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo=3.14"],
      index: 0,
      value: "3.14",
    };
    const result = refine("--foo=3.14", 0, ["--foo=3.14"], context);

    expect(result).toEqual({
      args: ["--foo=3.14"],
      index: 0,
      value: 3.14,
    });
  });

  test("should parse zero", () => {
    const spec = Spec.create();
    const refine = numberFlagRefine(spec);
    const context = {
      args: ["--foo=0"],
      index: 0,
      value: "0",
    };
    const result = refine("--foo=0", 0, ["--foo=0"], context);

    expect(result).toEqual({
      args: ["--foo=0"],
      index: 0,
      value: 0,
    });
  });
});

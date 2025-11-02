import { test, expect, describe } from "bun:test";
import { stringFlagRefine } from "./stringFlagRefine";
import { Spec } from "../Spec";

describe("stringFlagRefine", () => {
  test("should return null if no context", () => {
    const spec = Spec.create();
    const refine = stringFlagRefine(spec);
    const result = refine("--foo", 0, ["--foo", "bar"], null);

    expect(result).toBeNull();
  });

  test("should keep existing value from context", () => {
    const spec = Spec.create();
    const refine = stringFlagRefine(spec);
    const context = {
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    };
    const result = refine("--foo=bar", 0, ["--foo=bar"], context);

    expect(result).toEqual({
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should consume next argument as value", () => {
    const spec = Spec.create();
    const refine = stringFlagRefine(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = refine("--foo", 0, ["--foo", "bar"], context);

    expect(result).toEqual({
      args: ["--foo", "bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should return null if no next argument", () => {
    const spec = Spec.create();
    const refine = stringFlagRefine(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = refine("--foo", 0, ["--foo"], context);

    expect(result).toBeNull();
  });

  test("should consume comma-separated value", () => {
    const spec = Spec.create();
    const refine = stringFlagRefine(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = refine("--foo", 0, ["--foo", "bar,baz"], context);

    expect(result).toEqual({
      args: ["--foo", "bar,baz"],
      index: 0,
      value: "bar,baz",
    });
  });
});

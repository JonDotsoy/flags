import { test, expect, describe } from "bun:test";
import { numberFlagRefine } from "./numberFlagRefine";
import { Spec } from "../Spec";
import { Builder } from "../Builder";

describe("numberFlagRefine", () => {
  test("should return null if no context", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const result = numberFlagRefine(
      "--foo",
      0,
      ["--foo", "123"],
      null,
      builder,
    );

    expect(result).toBeNull();
  });

  test("should parse number from context value", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=123"],
      index: 0,
      value: "123",
    };
    const result = numberFlagRefine(
      "--foo=123",
      0,
      ["--foo=123"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=123"],
      index: 0,
      value: 123,
    });
  });

  test("should consume next argument as number", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = numberFlagRefine(
      "--foo",
      0,
      ["--foo", "456"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo", "456"],
      index: 0,
      value: 456,
    });
  });

  test("should return null if no next argument", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = numberFlagRefine("--foo", 0, ["--foo"], context, builder);

    expect(result).toBeNull();
  });

  test("should return null for non-numeric value", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    };
    const result = numberFlagRefine(
      "--foo=bar",
      0,
      ["--foo=bar"],
      context,
      builder,
    );

    expect(result).toBeNull();
  });

  test("should parse negative numbers", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=-123"],
      index: 0,
      value: "-123",
    };
    const result = numberFlagRefine(
      "--foo=-123",
      0,
      ["--foo=-123"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=-123"],
      index: 0,
      value: -123,
    });
  });

  test("should parse decimal numbers", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=3.14"],
      index: 0,
      value: "3.14",
    };
    const result = numberFlagRefine(
      "--foo=3.14",
      0,
      ["--foo=3.14"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=3.14"],
      index: 0,
      value: 3.14,
    });
  });

  test("should parse zero", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=0"],
      index: 0,
      value: "0",
    };
    const result = numberFlagRefine(
      "--foo=0",
      0,
      ["--foo=0"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=0"],
      index: 0,
      value: 0,
    });
  });
});

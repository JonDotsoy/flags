import { test, expect, describe } from "bun:test";
import { flagMatchRefine } from "./flagMatchRefine";
import { Spec } from "../Spec";
import { Builder } from "../Builder";

describe("flagMatchRefine", () => {
  test("should match single alias without value", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose",
      0,
      ["--verbose"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: "",
    });
  });

  test("should match single alias with value using = syntax", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose=foo",
      0,
      ["--verbose=foo"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose=foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should match single alias with comma-separated value using = syntax", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose=foo,taz",
      0,
      ["--verbose=foo,taz"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose=foo,taz"],
      index: 0,
      value: "foo,taz",
    });
  });

  test("should match multiple aliases - first alias", () => {
    const spec = Spec.create().metadata({ matches: ["--foo", "-f"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine("--foo", 0, ["--foo"], null, builder);

    expect(result).toEqual({
      args: ["--foo"],
      index: 0,
      value: "",
    });
  });

  test("should match multiple aliases - second alias", () => {
    const spec = Spec.create().metadata({ matches: ["--foo", "-f"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine("-f", 0, ["-f"], null, builder);

    expect(result).toEqual({
      args: ["-f"],
      index: 0,
      value: "",
    });
  });

  test("should match alias with value using = syntax", () => {
    const spec = Spec.create().metadata({ matches: ["--foo", "-f"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--foo=bar",
      0,
      ["--foo=bar"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should match short alias with value using = syntax", () => {
    const spec = Spec.create().metadata({ matches: ["--foo", "-f"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine("-f=bar", 0, ["-f=bar"], null, builder);

    expect(result).toEqual({
      args: ["-f=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should return null for non-matching flag", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine("--other", 0, ["--other"], null, builder);

    expect(result).toBeNull();
  });

  test("should work at different index positions", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose=value",
      2,
      ["cmd", "arg", "--verbose=value"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose=value"],
      index: 2,
      value: "value",
    });
  });

  test("should handle empty value with = syntax", () => {
    const spec = Spec.create().metadata({ matches: ["--verbose"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose=",
      0,
      ["--verbose="],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose="],
      index: 0,
      value: "",
    });
  });

  test("should match flag without dashes", () => {
    const spec = Spec.create().metadata({ matches: ["foo-taz"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine("foo-taz", 0, ["foo-taz"], null, builder);

    expect(result).toEqual({
      args: ["foo-taz"],
      index: 0,
      value: "",
    });
  });

  test("should match flag without dashes with = value", () => {
    const spec = Spec.create().metadata({ matches: ["foo-taz"] });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "foo-taz=bar",
      0,
      ["foo-taz=bar"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["foo-taz=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should support custom delimiter", () => {
    const spec = Spec.create().metadata({
      delimiter: ":",
      matches: ["--verbose"],
    });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose:foo",
      0,
      ["--verbose:foo"],
      null,
      builder,
    );

    expect(result).toEqual({
      args: ["--verbose:foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should not match with wrong delimiter", () => {
    const spec = Spec.create().metadata({
      delimiter: ":",
      matches: ["--verbose"],
    });
    const builder = new Builder(spec);
    const result = flagMatchRefine(
      "--verbose=foo",
      0,
      ["--verbose=foo"],
      null,
      builder,
    );

    expect(result).toBeNull();
  });

  test("should support custom delimiter with multiple aliases", () => {
    const spec = Spec.create().metadata({
      delimiter: ":",
      matches: ["--foo", "-f"],
    });
    const builder = new Builder(spec);
    const result = flagMatchRefine("-f:bar", 0, ["-f:bar"], null, builder);

    expect(result).toEqual({
      args: ["-f:bar"],
      index: 0,
      value: "bar",
    });
  });
});

import { test, expect, describe } from "bun:test";
import { flagMatchRefine } from "./flagMatchRefine";
import { Spec } from "../Spec";

describe("flagMatchRefine", () => {
  test("should match single alias without value", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine("--verbose", 0, ["--verbose"], null);

    expect(result).toEqual({
      args: ["--verbose"],
      index: 0,
      value: "",
    });
  });

  test("should match single alias with value using = syntax", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine("--verbose=foo", 0, ["--verbose=foo"], null);

    expect(result).toEqual({
      args: ["--verbose=foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should match single alias with comma-separated value using = syntax", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine("--verbose=foo,taz", 0, ["--verbose=foo,taz"], null);

    expect(result).toEqual({
      args: ["--verbose=foo,taz"],
      index: 0,
      value: "foo,taz",
    });
  });

  test("should match multiple aliases - first alias", () => {
    const refine = flagMatchRefine(["--foo", "-f"]);
    const result = refine("--foo", 0, ["--foo"], null);

    expect(result).toEqual({
      args: ["--foo"],
      index: 0,
      value: "",
    });
  });

  test("should match multiple aliases - second alias", () => {
    const refine = flagMatchRefine(["--foo", "-f"]);
    const result = refine("-f", 0, ["-f"], null);

    expect(result).toEqual({
      args: ["-f"],
      index: 0,
      value: "",
    });
  });

  test("should match alias with value using = syntax", () => {
    const refine = flagMatchRefine(["--foo", "-f"]);
    const result = refine("--foo=bar", 0, ["--foo=bar"], null);

    expect(result).toEqual({
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should match short alias with value using = syntax", () => {
    const refine = flagMatchRefine(["--foo", "-f"]);
    const result = refine("-f=bar", 0, ["-f=bar"], null);

    expect(result).toEqual({
      args: ["-f=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should return null for non-matching flag", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine("--other", 0, ["--other"], null);

    expect(result).toBeNull();
  });

  test("should work at different index positions", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine(
      "--verbose=value",
      2,
      ["cmd", "arg", "--verbose=value"],
      null,
    );

    expect(result).toEqual({
      args: ["--verbose=value"],
      index: 2,
      value: "value",
    });
  });

  test("should handle empty value with = syntax", () => {
    const refine = flagMatchRefine(["--verbose"]);
    const result = refine("--verbose=", 0, ["--verbose="], null);

    expect(result).toEqual({
      args: ["--verbose="],
      index: 0,
      value: "",
    });
  });

  test("should match flag without dashes", () => {
    const refine = flagMatchRefine(["foo-taz"]);
    const result = refine("foo-taz", 0, ["foo-taz"], null);

    expect(result).toEqual({
      args: ["foo-taz"],
      index: 0,
      value: "",
    });
  });

  test("should match flag without dashes with = value", () => {
    const refine = flagMatchRefine(["foo-taz"]);
    const result = refine("foo-taz=bar", 0, ["foo-taz=bar"], null);

    expect(result).toEqual({
      args: ["foo-taz=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should support custom delimiter", () => {
    const spec = Spec.create().metadata({ delimiter: ":" });
    const refine = flagMatchRefine(["--verbose"], spec);
    const result = refine("--verbose:foo", 0, ["--verbose:foo"], null);

    expect(result).toEqual({
      args: ["--verbose:foo"],
      index: 0,
      value: "foo",
    });
  });

  test("should not match with wrong delimiter", () => {
    const spec = Spec.create().metadata({ delimiter: ":" });
    const refine = flagMatchRefine(["--verbose"], spec);
    const result = refine("--verbose=foo", 0, ["--verbose=foo"], null);

    expect(result).toBeNull();
  });

  test("should support custom delimiter with multiple aliases", () => {
    const spec = Spec.create().metadata({ delimiter: ":" });
    const refine = flagMatchRefine(["--foo", "-f"], spec);
    const result = refine("-f:bar", 0, ["-f:bar"], null);

    expect(result).toEqual({
      args: ["-f:bar"],
      index: 0,
      value: "bar",
    });
  });
});

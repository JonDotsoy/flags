import { test, expect, describe } from "bun:test";
import { numberFlagRefine } from "./numberFlagRefine.js";
import {
  Spec,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "../Spec.js";
import { Builder as B } from "../Builder.js";
import type { Refine } from "../../dtos/Refine.js";
import type { Accumulate } from "../../dtos/Accumulate.js";

class Builder<T extends Spec<any, any>> extends B<T> {
  initial<U>(initial: U) {
    return new Builder(
      this.spec.initial(initial) as RedefineInitialValue<T, U>,
    );
  }

  accumulate(accumulate: Accumulate) {
    return new Builder(this.spec.accumulate(accumulate) as T);
  }

  refine<U>(refine: Refine) {
    return new Builder(this.spec.refine(refine) as RedefineParseResult<T, U>);
  }

  metadata(values: Record<string, any>) {
    return new Builder(this.spec.metadata(values) as T);
  }

  describe(description: string) {
    return this.metadata({ description });
  }

  required() {
    return this.metadata({ required: true });
  }
}

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

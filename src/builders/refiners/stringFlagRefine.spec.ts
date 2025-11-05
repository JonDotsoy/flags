import { test, expect, describe } from "bun:test";
import { stringFlagRefine } from "./stringFlagRefine.js";
import {
  Spec,
  type RedefineInitialValue,
  type RedefineParseResult,
} from "../Spec.js";
import { Builder as B } from "../Builder.js";
import type { Accumulate, Refine } from "../../flags.js";

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

describe("stringFlagRefine", () => {
  test("should return null if no context", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const result = stringFlagRefine(
      "--foo",
      0,
      ["--foo", "bar"],
      null,
      builder,
    );

    expect(result).toBeNull();
  });

  test("should keep existing value from context", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    };
    const result = stringFlagRefine(
      "--foo=bar",
      0,
      ["--foo=bar"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo=bar"],
      index: 0,
      value: "bar",
    });
  });

  test("should consume next argument as value", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = stringFlagRefine(
      "--foo",
      0,
      ["--foo", "bar"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo", "bar"],
      index: 0,
      value: "bar",
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
    const result = stringFlagRefine("--foo", 0, ["--foo"], context, builder);

    expect(result).toBeNull();
  });

  test("should consume comma-separated value", () => {
    const spec = Spec.create();
    const builder = new Builder(spec);
    const context = {
      args: ["--foo"],
      index: 0,
      value: "",
    };
    const result = stringFlagRefine(
      "--foo",
      0,
      ["--foo", "bar,baz"],
      context,
      builder,
    );

    expect(result).toEqual({
      args: ["--foo", "bar,baz"],
      index: 0,
      value: "bar,baz",
    });
  });
});

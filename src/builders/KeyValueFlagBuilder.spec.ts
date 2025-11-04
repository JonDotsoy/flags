import { test, expect, describe } from "bun:test";
import { KeyValueFlagBuilder } from "./KeyValueFlagBuilder";
import { FlagBuilder } from "./FlagBuilder";

describe("KeyValueFlagBuilder", () => {
  test("should create KeyValueFlagBuilder from FlagBuilder", () => {
    const builder = FlagBuilder.create("--config").keyValue();

    expect(builder).toBeInstanceOf(KeyValueFlagBuilder);
  });

  test("should parse key=value with space syntax (3 args)", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config", "host=localhost"]);

    expect(result).toEqual({
      args: ["--config", "host=localhost"],
      index: 0,
      value: { host: "localhost" },
    });
  });

  test("should parse key value with 3 separate args", () => {
    const builder = FlagBuilder.create("--set").keyValue();
    const result = builder.parse(0, ["--set", "foo", "taz"]);

    expect(result).toEqual({
      args: ["--set", "foo", "taz"],
      index: 0,
      value: { foo: "taz" },
    });
  });

  test("should return null when parsing empty args array", () => {
    const builder = FlagBuilder.create("--set").keyValue();
    const result = builder.parse(0, []);

    expect(result).toEqual(null);
  });

  test("should have empty object as initial value", () => {
    const builder = FlagBuilder.create("--set").keyValue();
    const initial = builder.spec.getInitial();

    expect(initial).toEqual(null);
  });

  test("should parse key=value with = syntax (1 arg)", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config=host=localhost"]);

    expect(result).toEqual({
      args: ["--config=host=localhost"],
      index: 0,
      value: { host: "localhost" },
    });
  });

  test("should return null when no value provided", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config"]);

    expect(result).toBeNull();
  });

  test("should return null when value has no = delimiter", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config", "invalid"]);

    expect(result).toBeNull();
  });

  test("should return null when key is empty", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config", "=value"]);

    expect(result).toBeNull();
  });

  test("should parse value with empty string", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config", "host="]);

    expect(result).toEqual({
      args: ["--config", "host="],
      index: 0,
      value: { host: "" },
    });
  });

  test("should parse value with multiple = signs", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--config", "url=http://localhost:3000"]);

    expect(result).toEqual({
      args: ["--config", "url=http://localhost:3000"],
      index: 0,
      value: { url: "http://localhost:3000" },
    });
  });

  test("should accumulate multiple key-value pairs", () => {
    const builder = FlagBuilder.create("--config").keyValue();

    const result1 = builder.parse(0, ["--config", "host=localhost"]);
    const result2 = builder.parse(
      2,
      ["--config", "host=localhost", "--config", "port=3000"],
      {
        current: result1?.value,
      },
    );

    expect(result2).toEqual({
      args: ["--config", "port=3000"],
      index: 2,
      value: { host: "localhost", port: "3000" },
    });
  });

  test("should override previous value when same key is used", () => {
    const builder = FlagBuilder.create("--config").keyValue();

    const result1 = builder.parse(0, ["--config", "host=localhost"]);
    const result2 = builder.parse(
      2,
      ["--config", "host=localhost", "--config", "host=127.0.0.1"],
      {
        current: result1?.value,
      },
    );

    expect(result2).toEqual({
      args: ["--config", "host=127.0.0.1"],
      index: 2,
      value: { host: "127.0.0.1" },
    });
  });

  test("should support initial value", () => {
    const builder = FlagBuilder.create("--config")
      .keyValue()
      .initial({ default: "value" });

    expect(builder).toBeInstanceOf(KeyValueFlagBuilder);
  });

  test("should support metadata", () => {
    const builder = FlagBuilder.create("--config")
      .keyValue()
      .metadata({ key: "value" });

    expect(builder).toBeInstanceOf(KeyValueFlagBuilder);
  });

  test("should support custom refine", () => {
    const builder = FlagBuilder.create("--config")
      .keyValue()
      .refine((arg, index, args, context) => {
        if (context?.value && typeof context.value === "object") {
          const entries = Object.entries(context.value);
          const uppercased = Object.fromEntries(
            entries.map(([k, v]) => [k.toUpperCase(), v]),
          );
          return {
            ...context,
            value: uppercased,
          };
        }
        return context;
      });

    const result = builder.parse(0, ["--config", "host=localhost"]);

    expect(result).toEqual({
      args: ["--config", "host=localhost"],
      index: 0,
      value: { HOST: "localhost" },
    });
  });

  test("should support transform", () => {
    const builder = FlagBuilder.create("--config")
      .keyValue()
      .transform((value) => {
        if (typeof value === "object" && value !== null) {
          return Object.keys(value).length;
        }
        return 0;
      });

    const result = builder.parse(0, ["--config", "host=localhost"]);

    expect(result?.value).toBe(1);
  });

  test("should support delimiter method", () => {
    const builder = FlagBuilder.create("--config").keyValue().delimiter(":");

    expect(builder).toBeInstanceOf(KeyValueFlagBuilder);
  });

  test("should parse with custom delimiter", () => {
    const builder = FlagBuilder.create("--config").keyValue().delimiter(":");
    const result = builder.parse(0, ["--config:host=localhost"]);

    expect(result).toEqual({
      args: ["--config:host=localhost"],
      index: 0,
      value: { host: "localhost" },
    });
  });

  test("should return null for non-matching flag", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(0, ["--other", "host=localhost"]);

    expect(result).toBeNull();
  });

  test("should parse at specific index", () => {
    const builder = FlagBuilder.create("--config").keyValue();
    const result = builder.parse(2, [
      "--verbose",
      "--name",
      "--config",
      "host=localhost",
    ]);

    expect(result).toEqual({
      args: ["--config", "host=localhost"],
      index: 2,
      value: { host: "localhost" },
    });
  });

  test("should support multiple aliases", () => {
    const builder = FlagBuilder.create("--config", "-c").keyValue();

    const result1 = builder.parse(0, ["--config", "host=localhost"]);
    const result2 = builder.parse(0, ["-c", "host=localhost"]);

    expect(result1).toEqual({
      args: ["--config", "host=localhost"],
      index: 0,
      value: { host: "localhost" },
    });

    expect(result2).toEqual({
      args: ["-c", "host=localhost"],
      index: 0,
      value: { host: "localhost" },
    });
  });
});

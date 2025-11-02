import { test, expect, describe } from "bun:test";
import { StringsFlagBuilder } from "./StringsFlagBuilder";
import { FlagBuilder } from "./FlagBuilder";

describe("StringsFlagBuilder", () => {
  test("should create StringsFlagBuilder from FlagBuilder", () => {
    const builder = FlagBuilder.create("--files").strings();

    expect(builder).toBeInstanceOf(StringsFlagBuilder);
  });

  test("should parse single string value", () => {
    const builder = FlagBuilder.create("--files").strings();
    const result = builder.parse(0, ["--files", "file1.txt"]);

    expect(result).toEqual({
      args: ["--files", "file1.txt"],
      index: 0,
      value: ["file1.txt"],
    });
  });

  test("should parse string value with = syntax", () => {
    const builder = FlagBuilder.create("--files").strings();
    const result = builder.parse(0, ["--files=file1.txt"]);

    expect(result).toEqual({
      args: ["--files=file1.txt"],
      index: 0,
      value: ["file1.txt"],
    });
  });

  test("should return null when no value provided", () => {
    const builder = FlagBuilder.create("--files").strings();
    const result = builder.parse(0, ["--files"]);

    expect(result).toBeNull();
  });

  test("should accumulate multiple string values", () => {
    const builder = FlagBuilder.create("--files").strings();

    const result1 = builder.parse(0, ["--files", "file1.txt"]);
    const result2 = builder.parse(
      2,
      ["--files", "file1.txt", "--files", "file2.txt"],
      {
        current: result1?.value,
      },
    );

    expect(result2).toEqual({
      args: ["--files", "file2.txt"],
      index: 2,
      value: ["file1.txt", "file2.txt"],
    });
  });

  test("should accumulate multiple values with mixed syntax", () => {
    const builder = FlagBuilder.create("--files").strings();

    const result1 = builder.parse(0, ["--files=file1.txt"]);
    const result2 = builder.parse(
      1,
      ["--files=file1.txt", "--files", "file2.txt"],
      {
        current: result1?.value,
      },
    );

    expect(result2).toEqual({
      args: ["--files", "file2.txt"],
      index: 1,
      value: ["file1.txt", "file2.txt"],
    });
  });

  test("should support initial value", () => {
    const builder = FlagBuilder.create("--files")
      .strings()
      .initial(["default.txt"]);

    expect(builder).toBeInstanceOf(StringsFlagBuilder);
  });

  test("should support metadata", () => {
    const builder = FlagBuilder.create("--files")
      .strings()
      .metadata({ key: "value" });

    expect(builder).toBeInstanceOf(StringsFlagBuilder);
  });

  test("should support custom refine", () => {
    const builder = FlagBuilder.create("--files")
      .strings()
      .refine((arg, index, args, context) => {
        if (context?.value && Array.isArray(context.value)) {
          return {
            ...context,
            value: context.value.map((v: string) => v.toUpperCase()),
          };
        }
        return context;
      });

    const result = builder.parse(0, ["--files", "file1.txt"]);

    expect(result).toEqual({
      args: ["--files", "file1.txt"],
      index: 0,
      value: ["FILE1.TXT"],
    });
  });

  test("should support transform", () => {
    const builder = FlagBuilder.create("--files")
      .strings()
      .transform((value) => {
        if (Array.isArray(value)) {
          return value.length;
        }
        return 0;
      });

    const result = builder.parse(0, ["--files", "file1.txt"]);

    expect(result?.value).toBe(1);
  });

  test("should support delimiter method", () => {
    const builder = FlagBuilder.create("--files").strings().delimiter(":");

    expect(builder).toBeInstanceOf(StringsFlagBuilder);
  });

  test("should parse with custom delimiter", () => {
    const builder = FlagBuilder.create("--files").strings().delimiter(":");
    const result = builder.parse(0, ["--files:file1.txt"]);

    expect(result).toEqual({
      args: ["--files:file1.txt"],
      index: 0,
      value: ["file1.txt"],
    });
  });

  test("should return null for non-matching flag", () => {
    const builder = FlagBuilder.create("--files").strings();
    const result = builder.parse(0, ["--other", "file1.txt"]);

    expect(result).toBeNull();
  });

  test("should parse at specific index", () => {
    const builder = FlagBuilder.create("--files").strings();
    const result = builder.parse(2, [
      "--verbose",
      "--name",
      "--files",
      "file1.txt",
    ]);

    expect(result).toEqual({
      args: ["--files", "file1.txt"],
      index: 2,
      value: ["file1.txt"],
    });
  });

  test("should support multiple aliases", () => {
    const builder = FlagBuilder.create("--files", "-f").strings();

    const result1 = builder.parse(0, ["--files", "file1.txt"]);
    const result2 = builder.parse(0, ["-f", "file2.txt"]);

    expect(result1).toEqual({
      args: ["--files", "file1.txt"],
      index: 0,
      value: ["file1.txt"],
    });

    expect(result2).toEqual({
      args: ["-f", "file2.txt"],
      index: 0,
      value: ["file2.txt"],
    });
  });

  test("should accumulate three or more values", () => {
    const builder = FlagBuilder.create("--files").strings();

    const result1 = builder.parse(0, ["--files", "file1.txt"]);
    const result2 = builder.parse(
      2,
      ["--files", "file1.txt", "--files", "file2.txt"],
      {
        current: result1?.value,
      },
    );
    const result3 = builder.parse(
      4,
      [
        "--files",
        "file1.txt",
        "--files",
        "file2.txt",
        "--files",
        "file3.txt",
      ],
      {
        current: result2?.value,
      },
    );

    expect(result3).toEqual({
      args: ["--files", "file3.txt"],
      index: 4,
      value: ["file1.txt", "file2.txt", "file3.txt"],
    });
  });
});

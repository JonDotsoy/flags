import { describe, test, expect } from "bun:test";

export const untab = (
  value: string | TemplateStringsArray,
  ...values: any[]
): string => {
  // Handle template literal usage
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else {
    // Combine template strings with interpolated values
    str = value.reduce((acc, part, i) => acc + part + (values[i] || ""), "");
  }

  const lines = str.split("\n");

  // Find minimum indentation (ignoring empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^(\s*)/)?.[1].length || 0;
    minIndent = Math.min(minIndent, indent);
  }

  // Remove minimum indentation from all lines
  if (minIndent === Infinity) return str;

  return lines
    .map((line) => (line.length > 0 ? line.slice(minIndent) : line))
    .join("\n");
};

describe("untab", () => {
  test("test_untab_1", () => {
    expect(
      untab(`\
                foo: tar
                    bar: baz
            `),
    ).toEqual("foo: tar\n" + "    bar: baz\n");
  });
});

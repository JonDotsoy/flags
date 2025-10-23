# Flag Handlers Documentation

This directory contains comprehensive documentation for all built-in flag handlers provided by @jondotsoy/flags.

## Overview

Flag handlers are functions that process argument values and set properties on your options object. They are combined with test functions (like `flag()`, `command()`, or `argument()`) using the `rule()` function to create complete argument processing rules.

## Built-in Handlers

### Boolean Handlers

- **[`isBooleanAt()`](./isBooleanAt.md)** - Set property to `true` when flag is present
  - Use for: `--verbose`, `--help`, `--force`, feature toggles
  - Example: `rule(flag("--verbose", "-v"), isBooleanAt("verbose"))`

### String Handlers

- **[`isStringAt()`](./isStringAt.md)** - Capture string value after flag
  - Use for: `--output file.txt`, `--name John`, configuration values
  - Example: `rule(flag("--output", "-o"), isStringAt("output"))`

### Number Handlers

- **[`isNumberAt()`](./isNumberAt.md)** - Capture and convert numeric value after flag
  - Use for: `--port 3000`, `--timeout 30`, `--workers 4`
  - Example: `rule(flag("--port", "-p"), isNumberAt("port"))`

### Array Handlers

- **[`isArrayStringAt()`](./isArrayStringAt.md)** - Accumulate multiple string values
  - Use for: `--include src/ --include lib/`, `--tag js --tag react`
  - Example: `rule(flag("--include", "-I"), isArrayStringAt("include"))`

- **[`isArrayNumberAt()`](./isArrayNumberAt.md)** - Accumulate multiple numeric values
  - Use for: `--port 3000 --port 3001`, `--timeout 30 --timeout 60`
  - Example: `rule(flag("--port", "-p"), isArrayNumberAt("ports"))`

### Special Handlers

- **[`restArgumentsAt()`](./restArgumentsAt.md)** - Capture all remaining positional arguments
  - Use for: file lists, command arguments, flexible input
  - Example: `rule(() => true, restArgumentsAt("files"))`

## Quick Reference

```ts
import {
  rule,
  flag,
  isBooleanAt,
  isStringAt,
  isNumberAt,
  isArrayStringAt,
  isArrayNumberAt,
  restArgumentsAt,
} from "@jondotsoy/flags";

interface MyOptions {
  // Boolean flags
  verbose: boolean;
  help: boolean;

  // String values
  output: string;
  config: string;

  // Numeric values
  port: number;
  workers: number;

  // Arrays
  include: string[];
  exclude: string[];
  timeouts: number[];

  // Rest arguments
  files: string[];
}

const rules = [
  // Boolean flags
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--help", "-h"), isBooleanAt("help")),

  // String flags
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--config", "-c"), isStringAt("config")),

  // Number flags
  rule(flag("--port", "-p"), isNumberAt("port")),
  rule(flag("--workers", "-w"), isNumberAt("workers")),

  // Array flags
  rule(flag("--include", "-I"), isArrayStringAt("include")),
  rule(flag("--exclude", "-E"), isArrayStringAt("exclude")),
  rule(flag("--timeout", "-t"), isArrayNumberAt("timeouts")),

  // Rest arguments (should be last)
  rule(() => true, restArgumentsAt("files")),
];
```

## Usage Patterns

### Basic Flag Processing

```ts
// Simple boolean and string flags
const rules = [
  rule(flag("--verbose"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),
];

// Usage: myapp --verbose --output result.txt
// Result: { verbose: true, output: "result.txt" }
```

### Multiple Values

```ts
// Accumulate multiple values with array handlers
const rules = [
  rule(flag("--include"), isArrayStringAt("include")),
  rule(flag("--port"), isArrayNumberAt("ports")),
];

// Usage: myapp --include src/ --include lib/ --port 3000 --port 3001
// Result: { include: ["src/", "lib/"], ports: [3000, 3001] }
```

### File Processing

```ts
// Common pattern for file processing tools
const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--format", "-f"), isStringAt("format")),
  rule(() => true, restArgumentsAt("inputFiles")),
];

// Usage: processor -v -o result.json -f json file1.txt file2.txt
// Result: {
//   verbose: true,
//   output: "result.json",
//   format: "json",
//   inputFiles: ["file1.txt", "file2.txt"]
// }
```

## Working with Defaults

All handlers work seamlessly with default values:

```ts
const options = flags<MyOptions>(
  process.argv.slice(2),
  {
    // Provide sensible defaults
    verbose: false,
    port: 3000,
    workers: 1,
    include: [],
    files: [],
  },
  rules,
);
```

## Error Handling

Most handlers perform automatic type conversion, but you should validate critical values:

```ts
const options = flags(args, {}, rules);

// Validate required fields
if (!options.output) {
  throw new Error("--output is required");
}

// Validate ranges
if (options.port && (options.port < 1 || options.port > 65535)) {
  throw new Error(`Invalid port: ${options.port}`);
}

// Validate arrays
if (options.files && options.files.length === 0) {
  throw new Error("At least one input file is required");
}
```

## Testing Handlers

All handlers are easily testable:

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isBooleanAt, isStringAt } from "@jondotsoy/flags";

describe("flag handlers", () => {
  const rules = [
    rule(flag("--verbose"), isBooleanAt("verbose")),
    rule(flag("--output", "-o"), isStringAt("output")),
  ];

  test("should handle boolean flags", () => {
    const options = flags(["--verbose"], {}, rules);
    expect(options.verbose).toBe(true);
  });

  test("should handle string flags", () => {
    const options = flags(["--output", "test.txt"], {}, rules);
    expect(options.output).toBe("test.txt");
  });
});
```

## Advanced Usage

For complex scenarios, you can create custom handlers using [`flagHandler()`](../api_references/flag-handler.md) or write completely custom handler functions. See the individual handler documentation for advanced patterns and examples.

## Related Documentation

- [API References](../api_references/README.md) - Core API documentation
- [Main Documentation](../README.md) - Comprehensive usage guide
- [Project README](../../README.md) - Getting started and overview

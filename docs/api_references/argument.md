# `argument()` - API Reference

Create test functions that match positional arguments in order. Each call to `argument()` captures the next available positional argument that hasn't been consumed by flags or commands.

## Syntax

```ts
argument<T>(): Test<T>
```

## Returns

`Test<T>` - A test function that matches the next positional argument

## Basic Usage

### Single Positional Argument

```ts
import { argument, rule, isStringAt } from "@jondotsoy/flags";

// Capture first positional argument
const inputRule = rule(argument(), isStringAt("input"));

// Usage: myapp input.txt
// Result: { input: "input.txt" }
```

### Multiple Positional Arguments

```ts
interface FileOptions {
  input: string;
  output: string;
}

const rules = [
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
];

// Usage: myapp input.txt output.txt
// Result: { input: "input.txt", output: "output.txt" }
```

### Mixed with Flags

```ts
interface Options {
  verbose: boolean;
  input: string;
  output: string;
}

const rules = [
  // Flags can appear anywhere
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),

  // Positional arguments are processed in order
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
];

// All of these work:
// myapp input.txt output.txt --verbose
// myapp --verbose input.txt output.txt
// myapp input.txt --verbose output.txt
```

## How `argument()` Works

The `argument()` function uses a unique symbol system to ensure each call captures a distinct positional argument:

```ts
// Each call creates a unique matcher
const firstArg = argument(); // Captures 1st positional arg
const secondArg = argument(); // Captures 2nd positional arg
const thirdArg = argument(); // Captures 3rd positional arg

// They won't interfere with each other
const rules = [
  rule(firstArg, isStringAt("first")),
  rule(secondArg, isStringAt("second")),
  rule(thirdArg, isStringAt("third")),
];
```

## Advanced Usage

### Optional Positional Arguments

```ts
const rules = [
  // Required argument
  rule(argument(), isStringAt("input")),

  // Optional argument with default
  rule(argument(), (ctx) => {
    // Only set if argument exists
    if (ctx.argValue) {
      ctx.flags.output = ctx.argValue;
    } else {
      ctx.flags.output = "output.txt"; // default
    }
  }),
];
```

### Positional Arguments with Validation

```ts
const fileRule = rule(
  argument(),
  flagHandler("inputFile", (ctx, _, value) => {
    if (!value) {
      throw new Error("Input file is required");
    }

    if (!fs.existsSync(value)) {
      throw new Error(`File not found: ${value}`);
    }

    return path.resolve(value);
  }),
);
```

### Variable Number of Arguments

```ts
interface Options {
  command: string;
  files: string[];
}

const rules = [
  // First positional arg is the command
  rule(argument(), isStringAt("command")),

  // Collect all remaining arguments as files
  rule(any(), restArgumentsAt("files")),
];

// Usage: myapp process file1.txt file2.txt file3.txt
// Result: { command: "process", files: ["file1.txt", "file2.txt", "file3.txt"] }
```

## Real-World Examples

### File Copy Tool

```ts
interface CopyOptions {
  source: string;
  destination: string;
  recursive?: boolean;
  force?: boolean;
}

const rules = [
  rule(flag("--recursive", "-r"), isBooleanAt("recursive")),
  rule(flag("--force", "-f"), isBooleanAt("force")),
  rule(argument(), isStringAt("source")),
  rule(argument(), isStringAt("destination")),
];

// Usage: cp --recursive src/ dest/
// Usage: cp file1.txt file2.txt
```

### Image Converter

```ts
interface ConvertOptions {
  input: string;
  output: string;
  format: string;
  quality?: number;
}

const rules = [
  rule(flag("--format"), isStringAt("format")),
  rule(flag("--quality", "-q"), isNumberAt("quality")),
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
];

// Usage: convert --format png --quality 90 image.jpg image.png
```

### Build Tool

```ts
interface BuildOptions {
  entry: string;
  outDir?: string;
  watch?: boolean;
  minify?: boolean;
}

const rules = [
  rule(flag("--watch", "-w"), isBooleanAt("watch")),
  rule(flag("--minify", "-m"), isBooleanAt("minify")),
  rule(flag("--out-dir", "-o"), isStringAt("outDir")),

  // Entry file is required positional argument
  rule(
    argument(),
    flagHandler("entry", (ctx, _, value) => {
      if (!value) {
        throw new Error("Entry file is required");
      }

      if (!value.endsWith(".ts") && !value.endsWith(".js")) {
        throw new Error("Entry file must be .ts or .js");
      }

      return value;
    }),
  ),
];

// Usage: build src/index.ts --out-dir dist --minify
```

### Database Migration Tool

```ts
interface MigrationOptions {
  action: "up" | "down" | "create";
  name?: string;
  steps?: number;
}

const rules = [
  // First argument is the action
  rule(
    argument(),
    flagHandler("action", (ctx, _, value) => {
      const validActions = ["up", "down", "create"];
      if (!value || !validActions.includes(value)) {
        throw new Error(
          `Invalid action: ${value}. Valid actions: ${validActions.join(", ")}`,
        );
      }
      return value;
    }),
  ),

  // Second argument is context-dependent
  rule(argument(), (ctx) => {
    const action = ctx.flags.action;
    const value = ctx.argValue;

    if (action === "create") {
      ctx.flags.name = value || "new_migration";
    } else if (action === "down") {
      ctx.flags.steps = value ? Number(value) : 1;
    }
    // "up" doesn't use the second argument
  }),
];

// Usage:
// migrate up
// migrate down 3
// migrate create add_users_table
```

## Common Patterns

### Required vs Optional Arguments

```ts
// Required argument - will throw error if missing
const requiredRule = rule(
  argument(),
  flagHandler("required", (ctx, _, value) => {
    if (!value) {
      throw new Error("Required argument missing");
    }
    return value;
  }),
);

// Optional argument - provides default if missing
const optionalRule = rule(argument(), (ctx) => {
  ctx.flags.optional = ctx.argValue || "default-value";
});
```

### Argument Order Independence with Flags

```ts
const rules = [
  // Flags can appear anywhere
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("outputFile")),

  // Positional args maintain their relative order
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("destination")),
];

// These all work the same:
// myapp input.txt dest.txt --verbose --output result.log
// myapp --verbose input.txt --output result.log dest.txt
// myapp --output result.log --verbose input.txt dest.txt
```

### Combining with Commands

```ts
const rules = [
  // Commands consume arguments after them
  rule(command("build"), restArgumentsAt("buildFiles")),

  // But if no command matches, use positional args
  rule(argument(), isStringAt("defaultInput")),
];

// myapp build file1.js file2.js  → { buildFiles: ["file1.js", "file2.js"] }
// myapp input.txt                → { defaultInput: "input.txt" }
```

## Error Handling

### Missing Required Arguments

```ts
const rules = [
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
];

try {
  const options = flags(["input.txt"], {}, rules); // Missing output
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error("Usage: myapp <input> <output>");
    process.exit(1);
  }
}
```

### Too Many Arguments

```ts
const rules = [
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
  // No more argument rules
];

try {
  const options = flags(["in.txt", "out.txt", "extra.txt"], {}, rules);
} catch (error) {
  // Will throw UnknownArgumentError for "extra.txt"
  console.error("Too many arguments provided");
}
```

### Type Validation

```ts
const numericRule = rule(
  argument(),
  flagHandler("port", (ctx, _, value) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Expected number, got: ${value}`);
    }
    return num;
  }),
);
```

## Testing Positional Arguments

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, argument, isStringAt } from "@jondotsoy/flags";

describe("argument() function", () => {
  test("should capture first positional argument", () => {
    const rules = [rule(argument(), isStringAt("first"))];
    const options = flags(["hello"], {}, rules);
    expect(options.first).toBe("hello");
  });

  test("should capture arguments in order", () => {
    const rules = [
      rule(argument(), isStringAt("first")),
      rule(argument(), isStringAt("second")),
    ];
    const options = flags(["hello", "world"], {}, rules);
    expect(options.first).toBe("hello");
    expect(options.second).toBe("world");
  });

  test("should work with interspersed flags", () => {
    const rules = [
      rule(flag("--flag"), isBooleanAt("flag")),
      rule(argument(), isStringAt("arg")),
    ];
    const options = flags(["--flag", "value"], {}, rules);
    expect(options.flag).toBe(true);
    expect(options.arg).toBe("value");
  });
});
```

### Integration Tests

```ts
describe("file processing CLI", () => {
  const rules = [
    rule(flag("--format"), isStringAt("format")),
    rule(argument(), isStringAt("input")),
    rule(argument(), isStringAt("output")),
  ];

  test("should handle typical usage", () => {
    const options = flags(
      ["--format", "json", "input.txt", "output.json"],
      {},
      rules,
    );

    expect(options.format).toBe("json");
    expect(options.input).toBe("input.txt");
    expect(options.output).toBe("output.json");
  });
});
```

## Performance Considerations

### Argument State Management

The `argument()` function maintains a static `visited` set to track which arguments have been consumed. This is automatically reset between `flags()` calls.

```ts
// Reset happens automatically, but you can check the state:
argument.visited; // Set<symbol> - internal tracking
```

### Memory Usage

Each `argument()` call creates a unique symbol. For CLIs with many positional arguments, consider using `restArgumentsAt()` instead:

```ts
// Instead of many argument() calls:
const manyArgs = [
  rule(argument(), isStringAt("arg1")),
  rule(argument(), isStringAt("arg2")),
  rule(argument(), isStringAt("arg3")),
  // ... many more
];

// Consider using:
const fewerRules = [rule(any(), restArgumentsAt("allArgs"))];
```

## Limitations

### Order Dependency

Unlike flags, positional arguments are order-dependent:

```ts
const rules = [
  rule(argument(), isStringAt("source")),
  rule(argument(), isStringAt("destination")),
];

// This order matters:
// myapp src.txt dst.txt  ✓ Correct
// myapp dst.txt src.txt  ✗ Wrong assignment
```

### No Named Positional Arguments

Unlike some CLI libraries, there's no way to name positional arguments in the help text automatically. Use samples for clarity:

```ts
const helpText = makeHelpMessage("myapp", rules, [
  "<input-file> <output-file>",
  "process data.json results.json",
]);
```

## Related APIs

- [`rule()`](./rule.md) - Combine arguments with handlers
- [`any()`](./any.md) - Match any argument (more flexible)
- [`restArgumentsAt()`](./handlers.md#restargumentsat) - Capture remaining arguments
- [`flag()`](./flag.md) - Match named flags
- [`command()`](./command.md) - Match subcommands

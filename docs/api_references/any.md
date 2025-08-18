# `any()` - Test Function

Create a test function that matches any argument. This is useful as a wildcard pattern or as a fallback rule to capture unmatched arguments.

## Syntax

```ts
any<T>(): Test<T>
```

## Parameters

None

## Returns

`Test<T>` - A test function that always returns `true` for any argument

## Basic Usage

### Wildcard Pattern

```ts
import { rule, any, restArgumentsAt } from "@jondotsoy/flags";

interface Options {
  remainingArgs: string[];
}

const wildcardRule = rule(any(), restArgumentsAt("remainingArgs"));

// This will capture ALL arguments
// Usage: myapp arg1 arg2 --flag value arg3
// Result: { remainingArgs: ["arg1", "arg2", "--flag", "value", "arg3"] }
```

### Fallback Rule

```ts
interface Options {
  verbose: boolean;
  output: string;
  unknownArgs: string[];
}

const rules = [
  // Specific rules first
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),

  // Fallback for unmatched arguments
  rule(any(), restArgumentsAt("unknownArgs")),
];

// Usage: myapp --verbose --output file.txt extra1 extra2
// Result: { verbose: true, output: "file.txt", unknownArgs: ["extra1", "extra2"] }
```

## Common Use Cases

### Catch-All for Remaining Arguments

```ts
interface ProcessorOptions {
  format: string;
  files: string[];
}

const rules = [
  rule(flag("--format", "-f"), isStringAt("format")),
  rule(any(), restArgumentsAt("files")), // Capture all remaining as files
];

// Usage: processor --format json file1.txt file2.txt file3.txt
// Result: { format: "json", files: ["file1.txt", "file2.txt", "file3.txt"] }
```

### Debug Mode - Capture Everything

```ts
interface DebugOptions {
  debug: boolean;
  allArgs: string[];
}

const rules = [rule(flag("--debug"), isBooleanAt("debug"))];

// Add debug rule conditionally
if (process.env.DEBUG_ARGS) {
  rules.push(rule(any(), restArgumentsAt("allArgs")));
}

// When DEBUG_ARGS=1: captures all arguments for debugging
```

### Proxy Command Pattern

```ts
interface ProxyOptions {
  target: string;
  proxyArgs: string[];
}

const rules = [
  // First argument is the target
  rule((arg, ctx) => ctx.consumedArgs === 0, isStringAt("target")),

  // Everything else goes to the target
  rule(any(), restArgumentsAt("proxyArgs")),
];

// Usage: proxy docker run -it ubuntu bash
// Result: { target: "docker", proxyArgs: ["run", "-it", "ubuntu", "bash"] }
```

## Important Considerations

### Rule Order Matters

`any()` matches everything, so it should typically be the **last rule** in your rules array:

```ts
// ✅ Correct order
const rules = [
  rule(flag("--verbose"), isBooleanAt("verbose")), // Specific rules first
  rule(flag("--output"), isStringAt("output")), // More specific rules
  rule(any(), restArgumentsAt("remaining")), // Wildcard last
];

// ❌ Wrong order - any() will capture everything before other rules run
const badRules = [
  rule(any(), restArgumentsAt("all")), // This captures everything!
  rule(flag("--verbose"), isBooleanAt("verbose")), // This will never run
];
```

### Performance Impact

Since `any()` always returns `true`, it will match every argument. Use it carefully in performance-critical scenarios:

```ts
// This will call the handler for EVERY argument
rule(any(), expensiveHandler);

// Better: Use specific conditions when possible
rule(
  (arg) => arg.endsWith(".txt"), // Only match .txt files
  fileHandler,
);
```

## Testing `any()`

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, any, restArgumentsAt } from "@jondotsoy/flags";

describe("any() test function", () => {
  test("should match any argument", () => {
    const anyRule = rule(any(), restArgumentsAt("args"));

    const options = flags(["anything", "goes", "here"], {}, [anyRule]);
    expect(options.args).toEqual(["anything", "goes", "here"]);
  });

  test("should work as fallback after specific rules", () => {
    const rules = [
      rule(flag("--verbose"), isBooleanAt("verbose")),
      rule(any(), restArgumentsAt("remaining")),
    ];

    const options = flags(["--verbose", "file1", "file2"], {}, rules);

    expect(options.verbose).toBe(true);
    expect(options.remaining).toEqual(["file1", "file2"]);
  });

  test("should capture flags and values when used alone", () => {
    const anyRule = rule(any(), restArgumentsAt("all"));

    const options = flags(["--flag", "value", "arg"], {}, [anyRule]);
    expect(options.all).toEqual(["--flag", "value", "arg"]);
  });
});
```

## Alternative Patterns

Instead of `any()`, you might want more specific patterns:

```ts
// Only non-flag arguments
rule((arg) => !arg.startsWith("-"), restArgumentsAt("files"));

// Only specific file extensions
rule((arg) => /\.(js|ts|json)$/.test(arg), restArgumentsAt("sourceFiles"));

// Arguments after a separator
let afterSeparator = false;
rule((arg) => {
  if (arg === "--") {
    afterSeparator = true;
    return false; // Don't capture the separator itself
  }
  return afterSeparator;
}, restArgumentsAt("rawArgs"));
```

## Related APIs

- [`rule()`](./rule.md) - Create parsing rules
- [`restArgumentsAt()`](../flag_handlers/restArgumentsAt.md) - Common handler used with `any()`
- [`flag()`](./flag.md) - Match specific flags
- [`command()`](./command.md) - Match specific commands
- [`argument()`](./argument.md) - Match positional arguments

## Real-World Example

### Command Proxy Tool

```ts
interface ProxyOptions {
  verbose: boolean;
  target: string;
  args: string[];
}

const rules = [
  // Global flags
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),

  // First non-flag argument is the target command
  rule(
    (arg, ctx) => !arg.startsWith("-") && !ctx.flags.target,
    isStringAt("target"),
  ),

  // Everything else passes through to the target
  rule(any(), restArgumentsAt("args")),
];

// Usage: myproxy --verbose docker run -it ubuntu bash
// Result: {
//   verbose: true,
//   target: "docker",
//   args: ["run", "-it", "ubuntu", "bash"]
// }

// Then execute: spawn(options.target, options.args)
```

The `any()` function is simple but powerful for creating flexible CLIs that need to handle unknown or variable arguments.

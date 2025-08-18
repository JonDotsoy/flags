# `rule()` - API Reference

Create parsing rules that combine test functions with handlers to define how command-line arguments are processed.

## Syntax

```ts
rule<T>(test: Test<T>, handler: Handler<T>, ...specs: Spec[]): Rule<T>
```

## Parameters

- `test: Test<T>` - A function that determines if an argument matches a pattern
- `handler: Handler<T>` - A function that processes the matched argument and updates the options object
- `specs: Spec[]` - Optional metadata for documentation and help generation

## Returns

`Rule<T>` - A tuple `[Test<T>, Handler<T>]` that can be used in the `flags()` function

## Basic Usage

### Simple Flag Rule

```ts
import { rule, flag, isBooleanAt } from "@jondotsoy/flags";

// Create a rule for a boolean flag
const verboseRule = rule(flag("--verbose", "-v"), isBooleanAt("verbose"));

// Usage in flags()
const options = flags<{ verbose?: boolean }>(["--verbose"], {}, [verboseRule]);

console.log(options.verbose); // true
```

### String Flag Rule

```ts
// Create a rule for a string flag
const nameRule = rule(flag("--name", "-n"), isStringAt("name"));

// Supports multiple formats:
// --name John
// --name=John
// -n John
```

### Command Rule

```ts
import { command, restArgumentsAt } from "@jondotsoy/flags";

// Create a rule for a subcommand
const buildRule = rule(command("build"), restArgumentsAt("buildArgs"));

// Usage: mycli build --watch src/
// Result: { buildArgs: ["--watch", "src/"] }
```

## Advanced Usage

### With Documentation

Add metadata to rules for automatic help generation:

```ts
const verboseRule = rule(flag("--verbose", "-v"), isBooleanAt("verbose"), {
  description: "Enable verbose output",
  category: "General Options",
});
```

### Custom Test Functions

Create rules with custom test logic:

```ts
const customTest = (arg: string, ctx: Context<any>) => {
  // Custom matching logic
  return arg.startsWith("--custom-");
};

const customRule = rule(customTest, (ctx) => {
  // Custom handling logic
  const value = ctx.arg.substring("--custom-".length);
  ctx.flags.customValue = value;
});
```

### Custom Handlers

Use `flagHandler` for advanced value processing:

```ts
import { flagHandler } from "@jondotsoy/flags";

const portRule = rule(
  flag("--port", "-p"),
  flagHandler("port", (ctx, _, value) => {
    const port = Number(value);
    if (port < 1 || port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }
    return port;
  }),
);
```

## Multiple Rules Example

```ts
interface CLIOptions {
  verbose: boolean;
  port: number;
  name: string;
  buildArgs: string[];
}

const rules = [
  // Boolean flag
  rule(flag("--verbose", "-v"), isBooleanAt("verbose"), {
    description: "Enable verbose logging",
  }),

  // Numeric flag with validation
  rule(
    flag("--port", "-p"),
    flagHandler("port", (ctx, _, value) => {
      const port = Number(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error("Invalid port number");
      }
      return port;
    }),
    { description: "Set server port (1-65535)" },
  ),

  // String flag
  rule(flag("--name", "-n"), isStringAt("name"), {
    description: "Set application name",
  }),

  // Command with arguments
  rule(command("build"), restArgumentsAt("buildArgs"), {
    description: "Build the application",
    category: "Commands",
  }),
];
```

## Rule Composition Patterns

### Conditional Rules

Create rules that behave differently based on context:

```ts
const modeRule = rule(
  flag("--mode"),
  (ctx) => {
    const mode = ctx.argValue || ctx.args[ctx.nextIndex];

    if (mode === "development") {
      ctx.flags.development = true;
      ctx.flags.minify = false;
      ctx.flags.sourceMap = true;
    } else if (mode === "production") {
      ctx.flags.production = true;
      ctx.flags.minify = true;
      ctx.flags.sourceMap = false;
    }

    ctx.nextIndex += ctx.argValue ? 0 : 1;
  },
  { description: "Set application mode (development|production)" },
);
```

### Dependent Rules

Create rules that depend on previous flags:

```ts
let outputSet = false;

const outputRule = rule(flag("--output", "-o"), (ctx) => {
  ctx.flags.output = ctx.argValue || ctx.args[ctx.nextIndex];
  outputSet = true;
  ctx.nextIndex += ctx.argValue ? 0 : 1;
});

const formatRule = rule(flag("--format"), (ctx) => {
  if (!outputSet) {
    throw new Error("--format requires --output to be set first");
  }

  const format = ctx.argValue || ctx.args[ctx.nextIndex];
  ctx.flags.format = format;
  ctx.nextIndex += ctx.argValue ? 0 : 1;
});
```

### Dynamic Rule Generation

Generate rules programmatically:

```ts
// Generate feature flag rules
const createFeatureRule = (featureName: string) =>
  rule(
    flag(`--${featureName}`),
    flagHandler(
      "features",
      (ctx, acc = [], value) => [...acc, featureName],
      false,
    ), // No value required for feature flags
    {
      description: `Enable ${featureName} feature`,
      category: "Feature Flags",
    },
  );

const featureRules = ["auth", "payments", "analytics"].map(createFeatureRule);

const allRules = [...baseRules, ...featureRules];
```

## Error Handling in Rules

### Validation Errors

```ts
const emailRule = rule(
  flag("--email"),
  flagHandler("email", (ctx, _, value) => {
    if (!value) {
      throw new Error("Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }

    return value;
  }),
  { description: "Set user email address" },
);
```

### Recovery Strategies

```ts
const resilientRule = rule(
  flag("--config"),
  (ctx) => {
    try {
      const configPath = ctx.argValue || ctx.args[ctx.nextIndex];
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      ctx.flags.config = config;
    } catch (error) {
      console.warn(`Warning: Could not load config file, using defaults`);
      ctx.flags.config = getDefaultConfig();
    }

    ctx.nextIndex += ctx.argValue ? 0 : 1;
  },
  { description: "Load configuration from file" },
);
```

## Testing Rules

### Unit Testing Individual Rules

```ts
import { describe, test, expect } from "bun:test";
import { flags } from "@jondotsoy/flags";

describe("verboseRule", () => {
  test("should set verbose to true with --verbose", () => {
    const options = flags(["--verbose"], {}, [verboseRule]);
    expect(options.verbose).toBe(true);
  });

  test("should set verbose to true with -v", () => {
    const options = flags(["-v"], {}, [verboseRule]);
    expect(options.verbose).toBe(true);
  });

  test("should not set verbose with other flags", () => {
    const options = flags(["--other"], { verbose: false }, [verboseRule]);
    expect(options.verbose).toBe(false);
  });
});
```

### Integration Testing Multiple Rules

```ts
describe("CLI rules integration", () => {
  const rules = [verboseRule, nameRule, buildRule];

  test("should handle multiple flags", () => {
    const options = flags(
      ["--verbose", "--name", "MyApp", "build", "--watch"],
      {},
      rules,
    );

    expect(options.verbose).toBe(true);
    expect(options.name).toBe("MyApp");
    expect(options.buildArgs).toEqual(["--watch"]);
  });
});
```

## Performance Considerations

### Efficient Rule Ordering

Place more common rules first:

```ts
const rules = [
  // Most common flags first
  rule(flag("--help", "-h"), isBooleanAt("help")),
  rule(flag("--version", "-v"), isBooleanAt("version")),

  // Less common flags
  rule(flag("--debug"), isBooleanAt("debug")),

  // Commands (usually less frequent)
  rule(command("build"), restArgumentsAt("buildArgs")),

  // Catch-all rules last
  rule(any(), restArgumentsAt("remaining")),
];
```

### Avoiding Expensive Operations

```ts
// Good: Simple string comparison
const simpleRule = rule(flag("--simple"), isStringAt("simple"));

// Avoid: Expensive operations in test functions
const expensiveRule = rule((arg, ctx) => {
  // Avoid file I/O, network calls, or complex regex in test functions
  return fs.existsSync(arg); // ❌ Don't do this
}, someHandler);

// Better: Do expensive operations in handlers
const betterRule = rule(flag("--file"), (ctx) => {
  const filePath = ctx.argValue || ctx.args[ctx.nextIndex];

  // Do expensive operation here, after matching
  if (fs.existsSync(filePath)) {
    ctx.flags.file = filePath;
  } else {
    throw new Error(`File not found: ${filePath}`);
  }

  ctx.nextIndex += ctx.argValue ? 0 : 1;
});
```

## Related APIs

- [`flag()`](./flag.md) - Create flag test functions
- [`command()`](./command.md) - Create command test functions
- [`argument()`](./argument.md) - Create positional argument tests
- [`flagHandler()`](./flag-handler.md) - Create custom handlers
- [`describe()`](./describe.md) - Add metadata to test functions

## Examples Repository

For more complete examples, see the [examples directory](../examples/) in the repository.

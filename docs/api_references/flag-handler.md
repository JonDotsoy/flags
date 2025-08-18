# `flagHandler()` - API Reference

Create custom handlers with full control over how flag values are processed and stored in your options object.

## Syntax

```ts
flagHandler<T>(
  propName: keyof T,
  reducer: (ctx: Context<T>, accumulate: unknown, value: string | null) => unknown,
  requireValue?: boolean
): Handler<T>
```

## Parameters

- `propName: keyof T` - The property on the options object to update
- `reducer: Function` - Function that processes the flag value and returns the new property value
  - `ctx: Context<T>` - Full parsing context with arguments, current index, and flags
  - `accumulate: unknown` - Current value of the property (for accumulation)
  - `value: string | null` - The flag value (from `--flag=value` or `--flag value`)
- `requireValue?: boolean` - Whether the flag expects a value (default: `true`)

## Returns

`Handler<T>` - A handler function that can be used in rules

## Basic Examples

### Simple String Handler

```ts
import { flagHandler, rule, flag } from "@jondotsoy/flags";

const nameHandler = flagHandler("name", (ctx, _, value) => value);

const nameRule = rule(flag("--name"), nameHandler);

// Usage: --name John → { name: "John" }
```

### Boolean Handler

```ts
const debugHandler = flagHandler("debug", () => true, false);

const debugRule = rule(flag("--debug"), debugHandler);

// Usage: --debug → { debug: true }
// Note: requireValue is false, so no value expected
```

### Numeric Handler with Validation

```ts
const portHandler = flagHandler("port", (ctx, _, value) => {
  const port = Number(value);

  if (isNaN(port)) {
    throw new Error("Port must be a number");
  }

  if (port < 1 || port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }

  return port;
});

const portRule = rule(flag("--port", "-p"), portHandler);
```

## Accumulation Patterns

### Array Accumulation

```ts
const includeHandler = flagHandler("includes", (ctx, acc = [], value) => [
  ...(Array.isArray(acc) ? acc : [acc]),
  value,
]);

const includeRule = rule(flag("--include", "-I"), includeHandler);

// Usage: --include src --include lib → { includes: ["src", "lib"] }
```

### Numeric Accumulation

```ts
const countHandler = flagHandler("count", (ctx, acc = 0, value) => {
  return acc + Number(value);
});

const countRule = rule(flag("--count"), countHandler);

// Usage: --count 5 --count 3 → { count: 8 }
```

### Object Accumulation

```ts
interface DatabaseConfig {
  host?: string;
  port?: number;
  name?: string;
}

const dbHandler = flagHandler(
  "database",
  (ctx, acc: DatabaseConfig = {}, value) => {
    // Parse key=value format
    const [key, val] = value?.split("=") || [];

    if (key === "host") {
      return { ...acc, host: val };
    } else if (key === "port") {
      return { ...acc, port: Number(val) };
    } else if (key === "name") {
      return { ...acc, name: val };
    }

    throw new Error(`Invalid database option: ${key}`);
  },
);

const dbRule = rule(flag("--db"), dbHandler);

// Usage: --db host=localhost --db port=5432 --db name=myapp
// Result: { database: { host: "localhost", port: 5432, name: "myapp" } }
```

## Advanced Examples

### Conditional Processing

```ts
const modeHandler = flagHandler("config", (ctx, acc = {}, value) => {
  const mode = value || "development";

  if (mode === "development") {
    return {
      ...acc,
      debug: true,
      minify: false,
      sourceMap: true,
    };
  } else if (mode === "production") {
    return {
      ...acc,
      debug: false,
      minify: true,
      sourceMap: false,
    };
  } else if (mode === "test") {
    return {
      ...acc,
      debug: true,
      minify: false,
      coverage: true,
    };
  }

  throw new Error(`Unknown mode: ${mode}`);
});

const modeRule = rule(flag("--mode"), modeHandler);
```

### File Processing

```ts
const configHandler = flagHandler("config", (ctx, _, value) => {
  if (!value) {
    throw new Error("Config file path required");
  }

  const fullPath = path.resolve(value);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }

  try {
    const content = fs.readFileSync(fullPath, "utf8");

    if (fullPath.endsWith(".json")) {
      return JSON.parse(content);
    } else if (fullPath.endsWith(".yaml") || fullPath.endsWith(".yml")) {
      return yaml.parse(content);
    } else {
      throw new Error("Config file must be JSON or YAML");
    }
  } catch (error) {
    throw new Error(`Failed to parse config file: ${error.message}`);
  }
});

const configRule = rule(flag("--config", "-c"), configHandler);
```

### Environment Variable Integration

```ts
const envHandler = flagHandler("environment", (ctx, _, value) => {
  // Flag value takes precedence over environment variable
  const envValue = value || process.env.NODE_ENV || "development";

  // Validate environment
  const validEnvs = ["development", "production", "test", "staging"];
  if (!validEnvs.includes(envValue)) {
    throw new Error(
      `Invalid environment: ${envValue}. Valid: ${validEnvs.join(", ")}`,
    );
  }

  // Set related environment variables
  process.env.NODE_ENV = envValue;

  return envValue;
});

const envRule = rule(flag("--env", "-e"), envHandler);
```

## Context Usage

The `ctx` parameter provides full access to the parsing state:

### Using Context for Complex Logic

```ts
const smartHandler = flagHandler("output", (ctx, _, value) => {
  // Access current argument
  console.log(`Processing flag: ${ctx.arg}`);

  // Access all arguments
  console.log(`All args: ${ctx.args.join(" ")}`);

  // Access current index
  console.log(`Current position: ${ctx.index}`);

  // Access other parsed flags
  if (ctx.flags.verbose) {
    console.log(`Output will be: ${value}`);
  }

  // Modify parsing flow
  if (value === "auto") {
    // Skip next argument
    ctx.nextIndex += 1;
    return "dist";
  }

  return value;
});
```

### Cross-Flag Dependencies

```ts
let hasOutput = false;

const outputHandler = flagHandler("output", (ctx, _, value) => {
  hasOutput = true;
  return value;
});

const formatHandler = flagHandler("format", (ctx, _, value) => {
  if (!hasOutput) {
    throw new Error("--format requires --output to be specified");
  }

  const validFormats = ["json", "yaml", "xml"];
  if (!validFormats.includes(value)) {
    throw new Error(`Invalid format: ${value}`);
  }

  return value;
});

const rules = [
  rule(flag("--output", "-o"), outputHandler),
  rule(flag("--format", "-f"), formatHandler),
];
```

## Error Handling

### Validation Errors

```ts
const emailHandler = flagHandler("email", (ctx, _, value) => {
  if (!value) {
    throw new Error("Email address is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error(`Invalid email format: ${value}`);
  }

  return value.toLowerCase(); // Normalize email
});
```

### Recovery Strategies

```ts
const resilientHandler = flagHandler("config", (ctx, acc = {}, value) => {
  try {
    const config = JSON.parse(fs.readFileSync(value, "utf8"));
    return { ...acc, ...config };
  } catch (error) {
    console.warn(
      `Warning: Could not load config from ${value}, using defaults`,
    );
    return acc; // Keep existing config
  }
});
```

### Custom Error Types

```ts
class ValidationError extends Error {
  constructor(field: string, value: string, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.name = "ValidationError";
  }
}

const urlHandler = flagHandler("url", (ctx, _, value) => {
  try {
    const url = new URL(value);
    return url.toString();
  } catch (error) {
    throw new ValidationError("URL", value, "Must be a valid URL");
  }
});
```

## Built-in Handler Equivalents

Understanding how built-in handlers work with `flagHandler`:

### `isBooleanAt` equivalent

```ts
const isBooleanAt = (prop) => flagHandler(prop, () => true, false);
```

### `isStringAt` equivalent

```ts
const isStringAt = (prop) => flagHandler(prop, (ctx, _, value) => value);
```

### `isNumberAt` equivalent

```ts
const isNumberAt = (prop) =>
  flagHandler(prop, (ctx, _, value) => Number(value));
```

### `isArrayStringAt` equivalent

```ts
const isArrayStringAt = (prop) =>
  flagHandler(prop, (ctx, acc = [], value) => [
    ...(Array.isArray(acc) ? acc : [acc]),
    value,
  ]);
```

## Performance Considerations

### Efficient Value Processing

```ts
// Good: Simple, fast processing
const simpleHandler = flagHandler("value", (ctx, _, value) => value);

// Avoid: Expensive operations
const expensiveHandler = flagHandler("files", (ctx, acc = [], value) => {
  // Don't do expensive file I/O for each flag
  const stats = fs.statSync(value); // ❌ Expensive
  return [...acc, { path: value, size: stats.size }];
});

// Better: Defer expensive operations
const betterHandler = flagHandler("files", (ctx, acc = [], value) => {
  // Just collect paths, process later
  return [...acc, value];
});
```

### Memory Management

```ts
// For large accumulations, consider limits
const limitedArrayHandler = flagHandler("items", (ctx, acc = [], value) => {
  const newArray = [...acc, value];

  if (newArray.length > 1000) {
    console.warn(
      "Warning: Large number of items, consider using batch processing",
    );
  }

  return newArray;
});
```

## Testing Handlers

### Unit Testing

```ts
import { describe, test, expect } from "bun:test";

describe("custom handlers", () => {
  const portHandler = flagHandler("port", (ctx, _, value) => {
    const port = Number(value);
    if (port < 1 || port > 65535) {
      throw new Error("Invalid port");
    }
    return port;
  });

  test("should accept valid port", () => {
    const options = flags(["--port", "3000"], {}, [
      rule(flag("--port"), portHandler),
    ]);
    expect(options.port).toBe(3000);
  });

  test("should reject invalid port", () => {
    expect(() => {
      flags(["--port", "99999"], {}, [rule(flag("--port"), portHandler)]);
    }).toThrow("Invalid port");
  });
});
```

### Integration Testing

```ts
describe("handler integration", () => {
  const rules = [
    rule(flag("--include"), includeHandler),
    rule(flag("--exclude"), excludeHandler),
  ];

  test("should handle multiple includes and excludes", () => {
    const options = flags(
      [
        "--include",
        "src",
        "--include",
        "lib",
        "--exclude",
        "test",
        "--exclude",
        "node_modules",
      ],
      {},
      rules,
    );

    expect(options.includes).toEqual(["src", "lib"]);
    expect(options.excludes).toEqual(["test", "node_modules"]);
  });
});
```

## Common Patterns

### Feature Flags

```ts
const featureHandler = flagHandler(
  "features",
  (ctx, acc = new Set(), value) => {
    return acc.add(value);
  },
  false,
); // Boolean flag, no value required

// Usage: --feature auth --feature payments
```

### Key-Value Pairs

```ts
const defineHandler = flagHandler("defines", (ctx, acc = {}, value) => {
  const [key, val = "true"] = value.split("=");
  return { ...acc, [key]: val };
});

// Usage: --define DEBUG=true --define VERSION=1.0.0
```

### Verbosity Levels

```ts
const verboseHandler = flagHandler(
  "verbosity",
  (ctx, acc = 0) => acc + 1,
  false,
);

// Usage: -v (verbosity: 1), -vv (verbosity: 2), -vvv (verbosity: 3)
```

## Related APIs

- [`rule()`](./rule.md) - Combine handlers with test functions
- [`flag()`](./flag.md) - Create flag test functions
- Built-in handlers: [`isBooleanAt`](./handlers.md#isbooleanat), [`isStringAt`](./handlers.md#isstringat), etc.

# `flag()` - API Reference

Create test functions that match command-line flags like `--verbose`, `-v`, or `--name=value`.

## Syntax

```ts
flag<T>(...flags: string[]): Test<T>
```

## Parameters

- `flags: string[]` - Array of flag names to match (e.g., `"--verbose"`, `"-v"`)

## Returns

`Test<T>` - A test function that matches the specified flags

## Basic Usage

### Single Flag

```ts
import { flag, rule, isBooleanAt } from "@jondotsoy/flags";

// Match --verbose flag
const verboseFlag = flag("--verbose");

// Use in a rule
const verboseRule = rule(verboseFlag, isBooleanAt("verbose"));
```

### Multiple Aliases

```ts
// Match both --verbose and -v
const verboseFlag = flag("--verbose", "-v");

// Usage: both --verbose and -v will match
const options = flags(["--verbose"], {}, [
  rule(verboseFlag, isBooleanAt("verbose")),
]);
```

## Supported Flag Formats

### Boolean Flags

```ts
const debugFlag = flag("--debug", "-d");

// Matches:
// --debug
// -d
```

### Flags with Values

```ts
const nameFlag = flag("--name", "-n");

// Matches:
// --name John
// --name=John
// -n John
// -n=John (though less common)
```

### Long and Short Forms

```ts
const portFlag = flag("--port", "-p");

// Matches:
// --port 3000
// --port=3000
// -p 3000
// -p=3000
```

## Value Extraction

The `flag()` function automatically handles value extraction:

### Inline Values (--flag=value)

```ts
const nameRule = rule(flag("--name"), isStringAt("name"));

// Input: ["--name=John"]
// Result: { name: "John" }
```

### Separate Values (--flag value)

```ts
const portRule = rule(flag("--port"), isNumberAt("port"));

// Input: ["--port", "3000"]
// Result: { port: 3000 }
```

## Advanced Examples

### Multiple Flags with Same Handler

```ts
interface Options {
  verbose: boolean;
}

const rules = [
  // Multiple ways to enable verbose mode
  rule(flag("--verbose", "-v", "--debug", "-d"), isBooleanAt("verbose")),
];

// All of these enable verbose:
// --verbose, -v, --debug, -d
```

### Flags with Custom Logic

```ts
const configFlag = flag("--config", "-c");

const configRule = rule(configFlag, (ctx) => {
  const configPath = ctx.argValue || ctx.args[ctx.nextIndex];

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    ctx.flags.config = config;
  } catch (error) {
    throw new Error(`Invalid config file: ${configPath}`);
  }

  ctx.nextIndex += ctx.argValue ? 0 : 1;
});
```

### Conditional Flag Behavior

```ts
let isProduction = false;

const envRule = rule(flag("--env"), (ctx) => {
  const env = ctx.argValue || ctx.args[ctx.nextIndex];
  ctx.flags.environment = env;
  isProduction = env === "production";
  ctx.nextIndex += ctx.argValue ? 0 : 1;
});

const optimizeRule = rule(flag("--optimize"), (ctx) => {
  // Only allow optimization in production
  if (!isProduction) {
    console.warn("Optimization is only available in production mode");
    return;
  }
  ctx.flags.optimize = true;
});
```

## Flag Naming Conventions

### Recommended Patterns

```ts
// Good: Clear, descriptive names
flag("--verbose", "-v"); // Enable verbose output
flag("--output", "-o"); // Output file/directory
flag("--help", "-h"); // Show help
flag("--version", "-V"); // Show version (capital V to avoid conflict with verbose)
flag("--quiet", "-q"); // Quiet mode
flag("--force", "-f"); // Force operation

// Good: Consistent naming
flag("--input-file"); // Use hyphens for multi-word flags
flag("--output-dir");
flag("--max-workers");
```

### Anti-patterns

```ts
// Avoid: Ambiguous single letters
flag("-x"); // What does x mean?
flag("-z"); // Not intuitive

// Avoid: Inconsistent naming
flag("--inputFile"); // camelCase in CLI flags
flag("--output_dir"); // mixing conventions

// Avoid: Too many aliases
flag("--verbose", "-v", "--debug", "-d", "--loud", "-l"); // Confusing
```

## Integration with Handlers

### Boolean Flags

```ts
const rules = [
  rule(flag("--force", "-f"), isBooleanAt("force")),
  rule(flag("--quiet", "-q"), isBooleanAt("quiet")),
  rule(flag("--help", "-h"), isBooleanAt("help")),
];
```

### String Flags

```ts
const rules = [
  rule(flag("--name", "-n"), isStringAt("name")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--format"), isStringAt("format")),
];
```

### Numeric Flags

```ts
const rules = [
  rule(flag("--port", "-p"), isNumberAt("port")),
  rule(flag("--workers", "-j"), isNumberAt("workers")),
  rule(flag("--timeout"), isNumberAt("timeout")),
];
```

### Array Flags

```ts
const rules = [
  rule(flag("--include", "-I"), isArrayStringAt("includes")),
  rule(flag("--exclude", "-X"), isArrayStringAt("excludes")),
  rule(flag("--define", "-D"), isArrayStringAt("defines")),
];
```

## Custom Flag Validation

### Type Validation

```ts
const portRule = rule(
  flag("--port", "-p"),
  flagHandler("port", (ctx, _, value) => {
    const port = Number(value);

    if (isNaN(port)) {
      throw new Error("Port must be a number");
    }

    if (port < 1 || port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }

    return port;
  }),
);
```

### Enum Validation

```ts
const logLevelRule = rule(
  flag("--log-level"),
  flagHandler("logLevel", (ctx, _, value) => {
    const validLevels = ["error", "warn", "info", "debug"];

    if (!value || !validLevels.includes(value)) {
      throw new Error(
        `Invalid log level: ${value}. Valid levels: ${validLevels.join(", ")}`,
      );
    }

    return value;
  }),
);
```

### File Path Validation

```ts
const configRule = rule(
  flag("--config", "-c"),
  flagHandler("config", (ctx, _, value) => {
    if (!value) {
      throw new Error("Config file path is required");
    }

    if (!fs.existsSync(value)) {
      throw new Error(`Config file not found: ${value}`);
    }

    if (!value.endsWith(".json") && !value.endsWith(".yaml")) {
      throw new Error("Config file must be JSON or YAML");
    }

    return path.resolve(value);
  }),
);
```

## Testing Flag Behavior

### Basic Flag Tests

```ts
import { describe, test, expect } from "bun:test";

describe("flag() behavior", () => {
  const verboseFlag = flag("--verbose", "-v");
  const rule = [verboseFlag, isBooleanAt("verbose")];

  test("should match long form", () => {
    const options = flags(["--verbose"], {}, [rule]);
    expect(options.verbose).toBe(true);
  });

  test("should match short form", () => {
    const options = flags(["-v"], {}, [rule]);
    expect(options.verbose).toBe(true);
  });

  test("should not match similar flags", () => {
    expect(() => {
      flags(["--verb"], {}, [rule]);
    }).toThrow(UnknownArgumentError);
  });
});
```

### Value Extraction Tests

```ts
describe("flag value extraction", () => {
  const nameFlag = flag("--name", "-n");
  const rule = [nameFlag, isStringAt("name")];

  test("should extract inline values", () => {
    const options = flags(["--name=John"], {}, [rule]);
    expect(options.name).toBe("John");
  });

  test("should extract separate values", () => {
    const options = flags(["--name", "John"], {}, [rule]);
    expect(options.name).toBe("John");
  });

  test("should work with short flags", () => {
    const options = flags(["-n", "John"], {}, [rule]);
    expect(options.name).toBe("John");
  });
});
```

## Common Patterns

### Help Flag

```ts
const helpRule = rule(
  flag("--help", "-h"),
  (ctx) => {
    console.log(makeHelpMessage("myapp", rules));
    process.exit(0);
  },
  { description: "Show this help message" },
);
```

### Version Flag

```ts
const packageJson = require("./package.json");

const versionRule = rule(
  flag("--version", "-V"),
  (ctx) => {
    console.log(packageJson.version);
    process.exit(0);
  },
  { description: "Show version number" },
);
```

### Verbose/Quiet Flags

```ts
const verboseRule = rule(
  flag("--verbose", "-v"),
  flagHandler("verbosity", (ctx, acc = 0) => acc + 1, false),
  { description: "Increase verbosity (-v, -vv, -vvv)" },
);

const quietRule = rule(
  flag("--quiet", "-q"),
  flagHandler("verbosity", (ctx, acc = 0) => acc - 1, false),
  { description: "Decrease verbosity" },
);
```

## Performance Tips

### Flag Ordering

More common flags should be listed first in multi-alias flags:

```ts
// Good: Most common alias first
flag("--help", "-h");
flag("--verbose", "-v");

// Less optimal: Less common form first
flag("-h", "--help");
```

### Avoid Deep Flag Hierarchies

```ts
// Good: Simple flags
flag("--database-host");
flag("--database-port");

// Avoid: Complex nested structures in single flags
flag("--database-connection-pool-max-size"); // Too specific, hard to remember
```

## Related APIs

- [`rule()`](./rule.md) - Combine flags with handlers
- [`command()`](./command.md) - Match subcommands
- [`argument()`](./argument.md) - Match positional arguments
- [`describe()`](./describe.md) - Add metadata to flags

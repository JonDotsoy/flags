# `isStringAt()` - Flag Handler

Set a property to a string value provided after a flag. This handler captures string arguments like `--name John`, `--output file.txt`, or `--config config.json`.

## Syntax

```ts
isStringAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to the string value

## Returns

`Handler<T>` - A handler function that captures the next argument as a string value

## Basic Usage

### Simple String Flag

```ts
import { rule, flag, isStringAt } from "@jondotsoy/flags";

interface Options {
  name: string;
}

const nameRule = rule(flag("--name", "-n"), isStringAt("name"));

// Usage: --name John      → { name: "John" }
// Usage: -n "Jane Doe"    → { name: "Jane Doe" }
// Usage: --name=Mike      → { name: "Mike" }
```

### Multiple String Flags

```ts
interface BuildOptions {
  entry: string;
  output: string;
  config: string;
  logLevel: string;
}

const rules = [
  rule(flag("--entry", "-e"), isStringAt("entry")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--config", "-c"), isStringAt("config")),
  rule(flag("--log-level"), isStringAt("logLevel")),
];

// Usage: build --entry src/main.ts --output dist/bundle.js --config webpack.config.js
```

## Common Use Cases

### File Paths and Names

```ts
interface FileOptions {
  input: string;
  output: string;
  backup: string;
  workdir: string;
}

const rules = [
  rule(flag("--input", "-i"), isStringAt("input")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--backup", "-b"), isStringAt("backup")),
  rule(flag("--workdir", "-w"), isStringAt("workdir")),
];

// Usage: myapp -i data.json -o result.json -b backup/ -w /tmp
```

### Configuration Options

```ts
interface ServerOptions {
  host: string;
  port: string;
  database: string;
  logFile: string;
  environment: string;
}

const rules = [
  rule(flag("--host", "-h"), isStringAt("host")),
  rule(flag("--port", "-p"), isStringAt("port")),
  rule(flag("--database", "--db"), isStringAt("database")),
  rule(flag("--log-file"), isStringAt("logFile")),
  rule(flag("--env", "-e"), isStringAt("environment")),
];

// Usage: server --host localhost --port 3000 --db mydb --env production
```

### User Identification

```ts
interface UserOptions {
  username: string;
  email: string;
  role: string;
  organization: string;
}

const rules = [
  rule(flag("--username", "-u"), isStringAt("username")),
  rule(flag("--email", "-m"), isStringAt("email")),
  rule(flag("--role", "-r"), isStringAt("role")),
  rule(flag("--org"), isStringAt("organization")),
];

// Usage: adduser -u john -m john@example.com -r admin --org acme
```

## Different Value Formats

### Space-Separated Values

```ts
// Usage: --name John
// Usage: --output "file name with spaces.txt"
// Usage: --config /path/to/config.json
```

### Equals-Separated Values

```ts
// Usage: --name=John
// Usage: --output="file with spaces.txt"
// Usage: --config=/path/to/config.json
```

### Quoted Values

```ts
// Usage: --message "Hello, World!"
// Usage: --command 'echo "nested quotes"'
// Usage: --data '{"key": "value"}'
```

## Working with Defaults

### Providing Default Values

```ts
const options = flags<ServerOptions>(
  process.argv.slice(2),
  {
    host: "localhost", // Default host
    port: "3000", // Default port
    environment: "development", // Default environment
  },
  rules,
);

// Usage: server --port 8080
// Result: { host: "localhost", port: "8080", environment: "development" }
```

### Conditional Defaults

```ts
const options = flags(args, {}, rules);

// Set defaults after parsing
options.host = options.host ?? "localhost";
options.port = options.port ?? "3000";
options.environment = options.environment ?? "development";
```

## Advanced Patterns

### Environment Variable Fallback

```ts
interface Options {
  apiKey: string;
  endpoint: string;
}

const rules = [
  rule(flag("--api-key"), isStringAt("apiKey")),
  rule(flag("--endpoint"), isStringAt("endpoint")),
];

const options = flags(args, {}, rules);

// Fallback to environment variables
options.apiKey = options.apiKey ?? process.env.API_KEY;
options.endpoint = options.endpoint ?? process.env.API_ENDPOINT;

if (!options.apiKey) {
  throw new Error(
    "API key required: use --api-key or set API_KEY environment variable",
  );
}
```

### Path Resolution

```ts
import path from "path";

interface PathOptions {
  config: string;
  output: string;
}

const rules = [
  rule(flag("--config", "-c"), isStringAt("config")),
  rule(flag("--output", "-o"), isStringAt("output")),
];

const options = flags(args, {}, rules);

// Resolve relative paths
if (options.config) {
  options.config = path.resolve(options.config);
}

if (options.output) {
  options.output = path.resolve(options.output);
}
```

### Validation with Custom Handler

```ts
const portRule = rule(flag("--port", "-p"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) {
    throw new Error("--port requires a value");
  }

  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }

  ctx.flags.port = value; // Store as string, validate as number
});

// Or combine with isStringAt and validate later
const rules = [rule(flag("--port", "-p"), isStringAt("port"))];

const options = flags(args, {}, rules);

if (options.port) {
  const port = parseInt(options.port, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${options.port}`);
  }
}
```

## Required String Options

### Validation After Parsing

```ts
const options = flags(args, {}, rules);

// Validate required options
const required = ["input", "output"] as const;
for (const field of required) {
  if (!options[field]) {
    throw new Error(`--${field} is required`);
  }
}
```

### Helper Function for Required Options

```ts
function requireOptions<T>(options: T, required: (keyof T)[]): void {
  for (const field of required) {
    if (!options[field]) {
      const flagName = String(field)
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase();
      throw new Error(`--${flagName} is required`);
    }
  }
}

const options = flags(args, {}, rules);
requireOptions(options, ["input", "output", "apiKey"]);
```

## Testing String Flags

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isStringAt } from "@jondotsoy/flags";

describe("isStringAt", () => {
  const nameRule = rule(flag("--name", "-n"), isStringAt("name"));

  test("should capture string value after flag", () => {
    const options = flags(["--name", "John"], {}, [nameRule]);
    expect(options.name).toBe("John");
  });

  test("should work with short flag", () => {
    const options = flags(["-n", "Jane"], {}, [nameRule]);
    expect(options.name).toBe("Jane");
  });

  test("should handle quoted strings", () => {
    const options = flags(["--name", "Jane Doe"], {}, [nameRule]);
    expect(options.name).toBe("Jane Doe");
  });

  test("should handle equals format", () => {
    const options = flags(["--name=Mike"], {}, [nameRule]);
    expect(options.name).toBe("Mike");
  });

  test("should leave property undefined when flag is not present", () => {
    const options = flags([], {}, [nameRule]);
    expect(options.name).toBeUndefined();
  });

  test("should work with defaults", () => {
    const options = flags([], { name: "default" }, [nameRule]);
    expect(options.name).toBe("default");

    const options2 = flags(["--name", "John"], { name: "default" }, [nameRule]);
    expect(options2.name).toBe("John");
  });

  test("should handle empty strings", () => {
    const options = flags(["--name", ""], {}, [nameRule]);
    expect(options.name).toBe("");
  });
});
```

### Error Testing

```ts
describe("isStringAt error handling", () => {
  const nameRule = rule(flag("--name"), isStringAt("name"));

  test("should handle missing value", () => {
    // Test what happens when no value is provided
    expect(() => {
      flags(["--name"], {}, [nameRule]);
    }).toThrow(); // This should throw an error
  });

  test("should handle value that looks like another flag", () => {
    const rules = [
      rule(flag("--name"), isStringAt("name")),
      rule(flag("--age"), isStringAt("age")),
    ];

    const options = flags(["--name", "--age", "30"], {}, rules);
    // This might capture "--age" as the name value
    // Design your CLI to handle this appropriately
  });
});
```

### Integration Tests

```ts
describe("multiple string flags", () => {
  const rules = [
    rule(flag("--input", "-i"), isStringAt("input")),
    rule(flag("--output", "-o"), isStringAt("output")),
    rule(flag("--config", "-c"), isStringAt("config")),
  ];

  test("should handle multiple string flags", () => {
    const options = flags(
      [
        "--input",
        "src/main.ts",
        "--output",
        "dist/bundle.js",
        "--config",
        "webpack.config.js",
      ],
      {},
      rules,
    );

    expect(options.input).toBe("src/main.ts");
    expect(options.output).toBe("dist/bundle.js");
    expect(options.config).toBe("webpack.config.js");
  });

  test("should handle mixed short and long flags", () => {
    const options = flags(
      ["-i", "input.txt", "--output", "output.txt", "-c", "config.json"],
      {},
      rules,
    );

    expect(options.input).toBe("input.txt");
    expect(options.output).toBe("output.txt");
    expect(options.config).toBe("config.json");
  });
});
```

## Equivalent Implementation

Understanding how `isStringAt` works internally:

```ts
// This is equivalent to isStringAt
const customStringHandler =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const value = ctx.consumeArgument();
    if (value !== undefined) {
      ctx.flags[propName] = value as T[keyof T];
    }
  };

// Or using flagHandler
const stringWithFlagHandler = <T>(propName: keyof T): Handler<T> =>
  flagHandler<T>(propName, (value) => value, "");
```

## Common Mistakes

### ❌ Wrong: No Value Handling

```ts
// Not checking if string is provided
const options = flags(["--name"], {}, [nameRule]);
// This might throw an error if --name expects a value
```

### ❌ Wrong: Assuming Non-Empty

```ts
// Assuming string is non-empty
if (options.name) {
  // Could be empty string ""
  console.log(options.name.toUpperCase());
}
```

### ✅ Correct: Proper Validation

```ts
// Check for undefined vs empty string
if (options.name !== undefined) {
  console.log(options.name || "No name provided");
}

// Or check for meaningful content
if (options.name && options.name.trim()) {
  console.log(options.name.toUpperCase());
}
```

### ❌ Wrong: Type Confusion

```ts
interface Options {
  port: number; // Wrong: isStringAt returns strings
}

// Should be:
interface Options {
  port: string; // Correct: parse to number later
}
```

## Type Conversion Patterns

### String to Number

```ts
const options = flags(args, {}, [rule(flag("--port"), isStringAt("port"))]);

const port = options.port ? parseInt(options.port, 10) : 3000;
if (isNaN(port)) {
  throw new Error(`Invalid port: ${options.port}`);
}
```

### String to Boolean

```ts
const options = flags(args, {}, [
  rule(flag("--enabled"), isStringAt("enabled")),
]);

const enabled = options.enabled?.toLowerCase() === "true";
// Or more flexible:
const enabled = ["true", "1", "yes", "on"].includes(
  options.enabled?.toLowerCase() || "",
);
```

### String to Array

```ts
const options = flags(args, {}, [rule(flag("--tags"), isStringAt("tags"))]);

const tags = options.tags ? options.tags.split(",") : [];
// Usage: --tags "javascript,typescript,node"
```

## Related APIs

- [`flag()`](../api_references/flag.md) - Create flag test functions
- [`rule()`](../api_references/rule.md) - Combine flags with handlers
- [`isBooleanAt()`](./isBooleanAt.md) - Handle boolean flags
- [`isNumberAt()`](./isNumberAt.md) - Handle numeric flags
- [`isArrayStringAt()`](./isArrayStringAt.md) - Handle string arrays
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom string processing

## Real-World Examples

### Build Tool Configuration

```ts
interface WebpackOptions {
  entry: string;
  output: string;
  mode: string;
  config: string;
}

const rules = [
  rule(flag("--entry"), isStringAt("entry")),
  rule(flag("--output"), isStringAt("output")),
  rule(flag("--mode"), isStringAt("mode")),
  rule(flag("--config"), isStringAt("config")),
];

// Usage: webpack --entry src/app.js --output dist/ --mode production
```

### Database Connection

```ts
interface DatabaseOptions {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

const rules = [
  rule(flag("--host", "-h"), isStringAt("host")),
  rule(flag("--port", "-p"), isStringAt("port")),
  rule(flag("--database", "-d"), isStringAt("database")),
  rule(flag("--username", "-u"), isStringAt("username")),
  rule(flag("--password"), isStringAt("password")),
];

// Usage: dbclient -h localhost -p 5432 -d myapp -u admin --password secret
```

### File Processing Tool

```ts
interface ProcessorOptions {
  input: string;
  output: string;
  format: string;
  quality: string;
  watermark: string;
}

const rules = [
  rule(flag("--input", "-i"), isStringAt("input")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--format", "-f"), isStringAt("format")),
  rule(flag("--quality", "-q"), isStringAt("quality")),
  rule(flag("--watermark", "-w"), isStringAt("watermark")),
];

// Usage: imageproc -i photo.jpg -o thumbnail.jpg -f jpeg -q 85 -w logo.png
```

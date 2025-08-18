# Flags Documentation

Welcome to the comprehensive documentation for `@jondotsoy/flags` - a powerful, type-safe command-line argument processor for JavaScript and TypeScript.

## Overview

`@jondotsoy/flags` provides a flexible, rule-based approach to parsing command-line arguments. Unlike traditional CLI libraries that use method chaining or configuration objects, this library uses composable rules that make complex argument parsing scenarios simple and maintainable.

### Key Concepts

- **Rules**: Combinations of test functions and handlers that define how arguments are processed
- **Test Functions**: Functions that determine if an argument matches a pattern (flags, commands, etc.)
- **Handlers**: Functions that process matched arguments and update the options object ([Built-in Handlers →](./flag_handlers/README.md))
- **Type Safety**: Full TypeScript support with generic types for your CLI options

## Architecture

The library follows a functional, composable design:

```
Args → Rules → Options
 ↓       ↓        ↓
Input   Logic   Output
```

1. **Input**: Raw command-line arguments (string array)
2. **Logic**: Array of rules that define parsing behavior
3. **Output**: Typed options object with parsed values

## Basic Usage

### 1. Define Your Options Interface

```ts
interface MyCliOptions {
  verbose: boolean;
  output: string;
  port: number;
  files: string[];
}
```

### 2. Create Parsing Rules

```ts
import {
  rule,
  flag,
  isStringAt,
  isBooleanAt,
  isNumberAt,
  isArrayStringAt,
} from "@jondotsoy/flags";

const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")), // Boolean flag handler
  rule(flag("--output", "-o"), isStringAt("output")), // String value handler
  rule(flag("--port", "-p"), isNumberAt("port")), // Numeric value handler
  rule(flag("--file", "-f"), isArrayStringAt("files")), // String array handler
];
```

> 📋 **Handler Documentation**: For detailed documentation on all built-in handlers, see [Built-in Handlers →](./flag_handlers/README.md)

### 3. Parse Arguments

```ts
const options = flags<MyCliOptions>(
  process.argv.slice(2),
  { port: 3000, files: [] }, // defaults
  rules,
);
```

## Built-in Handlers

The library provides several built-in handlers for common CLI patterns:

### Boolean Handlers

- **[`isBooleanAt()`](./flag_handlers/isBooleanAt.md)** - Set property to `true` when flag is present
  ```ts
  rule(flag("--verbose", "-v"), isBooleanAt("verbose"));
  // Usage: --verbose → { verbose: true }
  ```

### Value Handlers

- **[`isStringAt()`](./flag_handlers/isStringAt.md)** - Capture string value after flag

  ```ts
  rule(flag("--output", "-o"), isStringAt("output"));
  // Usage: --output file.txt → { output: "file.txt" }
  ```

- **[`isNumberAt()`](./flag_handlers/isNumberAt.md)** - Capture and convert numeric value
  ```ts
  rule(flag("--port", "-p"), isNumberAt("port"));
  // Usage: --port 3000 → { port: 3000 }
  ```

### Array Handlers

- **[`isArrayStringAt()`](./flag_handlers/isArrayStringAt.md)** - Accumulate multiple string values

  ```ts
  rule(flag("--include", "-I"), isArrayStringAt("include"));
  // Usage: --include src/ --include lib/ → { include: ["src/", "lib/"] }
  ```

- **[`isArrayNumberAt()`](./flag_handlers/isArrayNumberAt.md)** - Accumulate multiple numeric values
  ```ts
  rule(flag("--port", "-p"), isArrayNumberAt("ports"));
  // Usage: --port 3000 --port 3001 → { ports: [3000, 3001] }
  ```

### Special Handlers

- **[`restArgumentsAt()`](./flag_handlers/restArgumentsAt.md)** - Capture remaining positional arguments
  ```ts
  rule(() => true, restArgumentsAt("files"));
  // Usage: myapp file1.txt file2.txt → { files: ["file1.txt", "file2.txt"] }
  ```

> 📚 **Complete Handler Documentation**: For comprehensive examples, advanced patterns, and testing approaches, see [Built-in Handlers →](./flag_handlers/README.md)

## Advanced Examples

### Multi-Command CLI

Create CLIs with subcommands like `git`, `npm`, or `docker`:

```ts
interface GitLikeOptions {
  global?: boolean;
  verbose?: boolean;
  // Command-specific options
  commitMessage?: string;
  pushArgs?: string[];
  cloneUrl?: string;
  cloneDir?: string;
}

const rules = [
  // Global flags
  rule(flag("--global", "-g"), isBooleanAt("global")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),

  // git commit -m "message"
  rule(command("commit"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    const messageIndex = args.findIndex(
      (arg) => arg === "-m" || arg === "--message",
    );
    if (messageIndex !== -1 && args[messageIndex + 1]) {
      ctx.flags.commitMessage = args[messageIndex + 1];
      ctx.nextIndex = ctx.index + messageIndex + 2;
    } else {
      ctx.nextIndex = ctx.index + args.length;
    }
  }),

  // git push origin main
  rule(command("push"), restArgumentsAt("pushArgs")),

  // git clone <url> [directory]
  rule(command("clone"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    ctx.flags.cloneUrl = args[0];
    ctx.flags.cloneDir = args[1];
    ctx.nextIndex = ctx.index + args.length;
  }),
];

// Usage examples:
// git-cli --global commit -m "Initial commit"
// git-cli --verbose push origin main
// git-cli clone https://github.com/user/repo.git my-project
```

> 💡 **Handler Tip**: For simpler cases, you can use built-in handlers like [`isStringAt()`](./flag_handlers/isStringAt.md), [`isArrayStringAt()`](./flag_handlers/isArrayStringAt.md), and [`restArgumentsAt()`](./flag_handlers/restArgumentsAt.md) instead of custom handlers.

### Configuration-Based CLI

Build CLIs that work with configuration files and environment variables:

```ts
interface ConfigOptions {
  config?: string;
  environment: "development" | "production" | "test";
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
  };
  features: string[];
}

const rules = [
  // Config file path
  rule(flag("--config", "-c"), isStringAt("config")),

  // Environment with validation
  rule(
    flag("--env", "-e"),
    flagHandler("environment", (ctx, _, value) => {
      const validEnvs = ["development", "production", "test"];
      if (!value || !validEnvs.includes(value)) {
        throw new Error(
          `Invalid environment: ${value}. Valid options: ${validEnvs.join(", ")}`,
        );
      }
      return value;
    }),
  ),

  // Nested configuration
  rule(
    flag("--db-host"),
    flagHandler("database", (ctx, acc = {}, value) => ({
      ...acc,
      host: value,
    })),
  ),

  rule(
    flag("--db-port"),
    flagHandler("database", (ctx, acc = {}, value) => ({
      ...acc,
      port: Number(value),
    })),
  ),

  rule(
    flag("--db-name"),
    flagHandler("database", (ctx, acc = {}, value) => ({
      ...acc,
      name: value,
    })),
  ),

  // Feature flags
  rule(flag("--feature"), isArrayStringAt("features")),
];

// Usage: myapp --env production --db-host localhost --db-port 5432 --feature auth --feature payments
```

### File Processing Tool

Create tools for processing files with complex options:

```ts
interface ProcessorOptions {
  input: string[];
  output: string;
  format: "json" | "yaml" | "xml";
  transform: string[];
  exclude: string[];
  recursive: boolean;
  dryRun: boolean;
  parallel: number;
}

const rules = [
  // Input files (multiple ways to specify)
  rule(flag("--input", "-i"), isArrayStringAt("input")),
  rule(
    argument(),
    flagHandler("input", (ctx, acc = [], value) => [...acc, value]),
  ),

  // Output directory
  rule(flag("--output", "-o"), isStringAt("output")),

  // Format with validation
  rule(
    flag("--format", "-f"),
    flagHandler("format", (ctx, _, value) => {
      const validFormats = ["json", "yaml", "xml"];
      if (!value || !validFormats.includes(value)) {
        throw new Error(
          `Invalid format: ${value}. Valid formats: ${validFormats.join(", ")}`,
        );
      }
      return value;
    }),
  ),

  // Transform operations
  rule(flag("--transform", "-t"), isArrayStringAt("transform")),

  // Exclude patterns
  rule(flag("--exclude", "-x"), isArrayStringAt("exclude")),

  // Boolean options
  rule(flag("--recursive", "-r"), isBooleanAt("recursive")),
  rule(flag("--dry-run", "-n"), isBooleanAt("dryRun")),

  // Parallel processing
  rule(
    flag("--parallel", "-j"),
    flagHandler("parallel", (ctx, _, value) => {
      const num = Number(value);
      if (isNaN(num) || num < 1) {
        throw new Error("Parallel count must be a positive number");
      }
      return Math.min(num, require("os").cpus().length);
    }),
  ),
];

// Usage: processor src/**/*.ts --output dist --format json --transform minify --exclude test --parallel 4
```

## Error Handling Patterns

### Comprehensive Error Handling

```ts
import {
  flags,
  UnknownArgumentError,
  FlagsError,
  makeHelpMessage,
} from "@jondotsoy/flags";

function parseCliArgs(args: string[]) {
  try {
    return flags<MyCliOptions>(args, defaults, rules);
  } catch (error) {
    if (error instanceof UnknownArgumentError) {
      console.error(`❌ Error: ${error.message}`);
      console.log(
        "\n" +
          makeHelpMessage("myapp", rules, [
            "--verbose --output ./dist",
            "build --watch",
            "serve --port 3000",
          ]),
      );
      process.exit(1);
    } else if (error instanceof FlagsError) {
      console.error(`❌ Flags Error: ${error.message}`);
      process.exit(1);
    } else {
      // Re-throw unexpected errors
      throw error;
    }
  }
}
```

### Custom Validation Errors

```ts
const rules = [
  rule(
    flag("--port"),
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
  ),

  rule(
    flag("--email"),
    flagHandler("email", (ctx, _, value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!value || !emailRegex.test(value)) {
        throw new Error("Invalid email address format");
      }

      return value;
    }),
  ),
];
```

## Testing Your CLI

### Unit Testing Rules

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isBooleanAt, isStringAt } from "@jondotsoy/flags";

describe("CLI parsing", () => {
  const rules = [
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--name"), isStringAt("name")),
  ];

  test("should parse boolean flags", () => {
    const options = flags(["--verbose"], {}, rules);
    expect(options.verbose).toBe(true);
  });

  test("should parse string flags", () => {
    const options = flags(["--name", "John"], {}, rules);
    expect(options.name).toBe("John");
  });

  test("should handle flag=value syntax", () => {
    const options = flags(["--name=John"], {}, rules);
    expect(options.name).toBe("John");
  });

  test("should apply defaults", () => {
    const options = flags([], { name: "Default" }, rules);
    expect(options.name).toBe("Default");
  });
});
```

> 🧪 **Testing Handlers**: Each built-in handler has comprehensive test examples. See the individual handler documentation for testing patterns:
>
> - [Boolean Handler Tests](./flag_handlers/isBooleanAt.md#testing-boolean-flags)
> - [String Handler Tests](./flag_handlers/isStringAt.md#testing-string-flags)
> - [Number Handler Tests](./flag_handlers/isNumberAt.md#testing-number-flags)
> - [Array Handler Tests](./flag_handlers/isArrayStringAt.md#testing-array-string-flags)
> - [Rest Arguments Tests](./flag_handlers/restArgumentsAt.md#testing-rest-arguments)

### Integration Testing

```ts
import { spawn } from "child_process";
import { promisify } from "util";

const execFile = promisify(require("child_process").execFile);

describe("CLI integration", () => {
  test("should display help message", async () => {
    const { stdout } = await execFile("node", ["./bin/mycli.js", "--help"]);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("--verbose");
  });

  test("should handle invalid arguments", async () => {
    try {
      await execFile("node", ["./bin/mycli.js", "--invalid-flag"]);
    } catch (error) {
      expect(error.code).toBe(1);
      expect(error.stderr).toContain("Unknown argument");
    }
  });
});
```

## Performance Considerations

### Large Argument Lists

For CLIs that might process hundreds or thousands of arguments:

```ts
// Use restArgumentsAt for bulk processing
rule(any(), restArgumentsAt("files"));

// Or process in chunks
rule(
  flag("--file"),
  flagHandler("files", (ctx, acc = [], value) => {
    const files = Array.isArray(acc) ? acc : [];
    files.push(value);

    // Process in batches of 100
    if (files.length % 100 === 0) {
      console.log(`Processed ${files.length} files...`);
    }

    return files;
  }),
);
```

### Memory Management

```ts
// For streaming/large file processing
rule(command("process"), (ctx) => {
  const files = ctx.args.slice(ctx.index);

  // Process files one at a time instead of loading all into memory
  ctx.flags.processFiles = async () => {
    for (const file of files) {
      await processFile(file);
    }
  };

  ctx.nextIndex = ctx.args.length;
});
```

## API Reference

For detailed API documentation, see the [API References](./api_references/) directory:

### Core Functions

- [`rule()`](./api_references/rule.md) - Create parsing rules
- [`flags()`](./api_references/README.md#flags) - Main parsing function

### Test Functions

- [`flag()`](./api_references/flag.md) - Match command-line flags
- [`command()`](./api_references/command.md) - Match subcommands
- [`argument()`](./api_references/argument.md) - Match positional arguments

### Built-in Handlers

- [`isBooleanAt()`](./flag_handlers/isBooleanAt.md) - Boolean flag handler
- [`isStringAt()`](./flag_handlers/isStringAt.md) - String value handler
- [`isNumberAt()`](./flag_handlers/isNumberAt.md) - Numeric value handler
- [`isArrayStringAt()`](./flag_handlers/isArrayStringAt.md) - String array handler
- [`isArrayNumberAt()`](./flag_handlers/isArrayNumberAt.md) - Number array handler
- [`restArgumentsAt()`](./flag_handlers/restArgumentsAt.md) - Rest arguments handler
- [**All Built-in Handlers →**](./flag_handlers/README.md) - Complete handler documentation

### Advanced Features

- [`flagHandler()`](./api_references/flag-handler.md) - Create custom handlers
- [`makeHelpMessage()`](./api_references/make-help-message.md) - Generate help text
- [Error Classes](./api_references/errors.md) - Error handling reference

## License

MIT - see [LICENSE](../LICENSE) file for details.

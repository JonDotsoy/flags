# Flags

A powerful and type-safe JavaScript/TypeScript command-line arguments processor with flexible rule-based parsing.

## Features

- 🔥 **Type-safe**: Full TypeScript support with generic types
- 📋 **Rule-based**: Flexible and composable argument parsing rules
- 🎯 **Multiple formats**: Support for `--flag=value`, `--flag value`, and `-f` syntax
- 🔧 **Built-in handlers**: Boolean, string, number, and array handlers
- 📚 **Commands**: Support for subcommands and positional arguments
- 🆘 **Help generation**: Automatic help message generation with beautiful formatting
- 🔍 **Introspection**: Extract metadata from rules with `getSpecs()`
- 📖 **Comprehensive docs**: Complete API reference and examples for all functions
- ⚡ **Lightweight**: Minimal dependencies, zero runtime overhead

## Recent Updates

- ✨ **Complete API Documentation**: All functions now have comprehensive documentation with examples
- 📋 **Enhanced Handler Docs**: Detailed documentation for all built-in handlers with advanced patterns
- 🔍 **New Utility Functions**: `getSpecs()` for rule introspection and custom help generation
- 📝 **Better Examples**: Real-world CLI patterns and advanced use cases
- 🎯 **Improved Navigation**: Organized documentation structure with cross-references

## Installation

```bash
npm install @jondotsoy/flags
# or
yarn add @jondotsoy/flags
# or
bun add @jondotsoy/flags
```

## Quick Start

```ts
import {
  flags,
  rule,
  flag,
  command,
  describe,
  isBooleanAt,
  isStringAt,
  isNumberAt,
  restArgumentsAt,
  makeHelpMessage,
} from "@jondotsoy/flags";

interface Options {
  verbose?: boolean;
  name?: string;
  port: number;
  help?: boolean;
  command?: string;
  args?: string[];
}

// Define rules with metadata for automatic help generation
const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose output",
      category: "Options",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--name", "-n"), {
      description: "Set application name",
      category: "Options",
    }),
    isStringAt("name"),
  ),

  rule(
    describe(flag("--port", "-p"), {
      description: "Server port number",
      category: "Server",
    }),
    isNumberAt("port"),
  ),

  rule(
    describe(flag("--help", "-h"), {
      description: "Show help message",
      category: "Info",
    }),
    isBooleanAt("help"),
  ),

  rule(
    describe(command("serve"), {
      description: "Start the server",
      category: "Commands",
    }),
    (ctx) => {
      ctx.flags.command = "serve";
      ctx.flags.args = ctx.args.slice(ctx.index + 1);
      ctx.nextIndex = ctx.args.length;
    },
  ),
];

// Parse command line arguments
const args = ["--name=myapp", "-v", "--port", "8080", "serve", "--watch"];

try {
  const options = flags<Options>(args, { port: 3000 }, rules);

  // Handle help flag
  if (options.help) {
    console.log(
      makeHelpMessage("mycli", rules, [
        "serve --port 8080",
        "--name myapp --verbose",
        "--help",
      ]),
    );
    process.exit(0);
  }

  console.log("Parsed options:", options);
  // Output: { name: "myapp", verbose: true, port: 8080, command: "serve", args: ["--watch"] }
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.log(makeHelpMessage("mycli", rules));
  process.exit(1);
}
```

## Documentation

For comprehensive documentation, examples, and API reference:

📚 **[Complete Documentation →](./docs/README.md)**

📖 **[API Reference →](./docs/api_references/README.md)**

📋 **[Built-in Handlers →](./docs/flag_handlers/README.md)**

### Quick Links

#### Core API

- [Complete API Reference](./docs/api_references/README.md) - All functions and types
- [Core Functions](./docs/api_references/README.md#core-functions) - `flags()`, `rule()`
- [Test Functions](./docs/api_references/README.md#test-functions) - Pattern matching functions
  - [`flag()`](./docs/api_references/flag.md) - Match command-line flags
  - [`command()`](./docs/api_references/command.md) - Match subcommands
  - [`argument()`](./docs/api_references/argument.md) - Match positional arguments
  - [`any()`](./docs/api_references/any.md) - Match any argument (wildcard)
  - [`describe()`](./docs/api_references/describe.md) - Add metadata to test functions
- [Utility Functions](./docs/api_references/README.md#utility-functions) - Helper functions
  - [`getSpecs()`](./docs/api_references/get-specs.md) - Extract metadata from rules
  - [`makeHelpMessage()`](./docs/api_references/make-help-message.md) - Generate help text

#### Built-in Handlers

- [Handler Functions Overview](./docs/api_references/README.md#handler-functions) - Built-in value processors
- [Detailed Handler Documentation](./docs/flag_handlers/README.md) - Comprehensive handler examples
  - [Boolean Flags](./docs/flag_handlers/isBooleanAt.md) - `isBooleanAt()`
  - [String Values](./docs/flag_handlers/isStringAt.md) - `isStringAt()`
  - [Numeric Values](./docs/flag_handlers/isNumberAt.md) - `isNumberAt()`
  - [String Arrays](./docs/flag_handlers/isArrayStringAt.md) - `isArrayStringAt()`
  - [Number Arrays](./docs/flag_handlers/isArrayNumberAt.md) - `isArrayNumberAt()`
  - [Rest Arguments](./docs/flag_handlers/restArgumentsAt.md) - `restArgumentsAt()`

#### Additional Resources

- [Error Handling](./docs/api_references/errors.md) - `UnknownArgumentError`, `FlagsError`
- [Advanced Examples](./docs/README.md#advanced-examples) - Real-world CLI patterns
- [Complete Usage Guide](./docs/README.md) - In-depth documentation with examples

## API Reference

> 📖 **Complete API Documentation**: This is a quick reference. For comprehensive documentation, examples, and advanced patterns, see [**Complete API Reference →**](./docs/api_references/README.md)

### Core Function

#### `flags<T>(args, initialOptions, rules)`

Processes an array of arguments according to a set of rules and returns an object with the parsed options.

**Parameters:**

- `args: string[]` - Array of string arguments (e.g., from `process.argv.slice(2)`)
- `initialOptions: Partial<T>` - Object with initial/default values
- `rules: Rule<T>[]` - Array of rules created with `rule(...)`

**Returns:** `Partial<T>` - Object containing parsed options

**Throws:** `UnknownArgumentError` when an unknown argument is encountered

```ts
const options = flags(process.argv.slice(2), { verbose: false }, [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--name"), isStringAt("name")),
]);
```

### Rule Creation

#### `rule<T>(test, handler, ...specs)`

Creates a parsing rule that combines a test function with a handler.

**Parameters:**

- `test: Test<T>` - Function that matches arguments
- `handler: Handler<T>` - Function that processes matched arguments
- `specs: Spec[]` - Optional metadata (description, category)

```ts
const nameRule = rule(flag("--name", "-n"), isStringAt("name"), {
  description: "Set the name",
});
```

> 📚 **Learn More**: See [**rule() API Reference →**](./docs/api_references/rule.md) for complete documentation and examples

### Type Definitions

```ts
export interface Context<T> {
  nextIndex: number; // Next argument index to process
  args: string[]; // All command line arguments
  index: number; // Current argument index
  arg: string; // Current argument being processed
  argValue: null | string; // Value portion of --flag=value
  flags: Partial<T>; // Accumulated parsed options
}

export type Test<T> = ((arg: string, ctx: Context<T>) => boolean) & Spec;
export interface Handler<T> {
  (ctx: Context<T>): void;
}
export type Rule<T> = [Test<T>, Handler<T>];
```

## Test Functions

Test functions determine whether an argument matches a specific pattern and should be processed by the associated handler.

> 📖 **Detailed Documentation**: For comprehensive examples, advanced patterns, and complete API reference, see [**Test Functions →**](./docs/api_references/README.md#test-functions)

### `flag(...flags: string[])`

Matches command-line flags like `--verbose`, `-v`, or `--name=value`. Supports multiple aliases and both `--flag value` and `--flag=value` formats.

**Features:**

- Multiple aliases: `flag("--verbose", "-v")`
- Inline values: `--name=value` automatically extracts `value`
- Short flags: `-v`, `-h`, etc.
- Long flags: `--verbose`, `--help`, etc.

```ts
// Matches: --title, -t, --title=value, -t value
const titleFlag = flag("--title", "-t");

// Usage in rules
rule(flag("--port", "-p"), isNumberAt("port"));
```

> 📚 **Learn More**: See [**flag() API Reference →**](./docs/api_references/flag.md) for complete documentation and examples

### `command(name: string)`

Matches an argument that exactly equals the given string. Commonly used for subcommands like `build`, `serve`, or `test`.

```ts
// Matches exactly "build"
const buildCmd = command("build");

// Example: npm-like commands
rule(command("install"), restArgumentsAt("packages")),
rule(command("run"), restArgumentsAt("script")),
rule(command("test"), restArgumentsAt("testArgs")),
```

> 📚 **Learn More**: See [**command() API Reference →**](./docs/api_references/command.md) for complete documentation and examples

### `argument()`

Matches positional arguments in order. Each call to `argument()` captures the next available positional argument that isn't a flag or command.

```ts
// Captures: cli.js <file> <output>
const rules = [
  rule(argument(), isStringAt("inputFile")),
  rule(argument(), isStringAt("outputFile")),
];

// Usage: mycli input.txt output.txt
// Result: { inputFile: "input.txt", outputFile: "output.txt" }
```

> 📚 **Learn More**: See [**argument() API Reference →**](./docs/api_references/argument.md) for complete documentation and examples

### `any()`

Matches any argument (wildcard pattern). Useful for catch-all scenarios, fallback handlers, or when combined with `restArgumentsAt()`.

```ts
// Catch any unmatched argument
rule(any(), restArgumentsAt("remaining"));

// Can be used as a fallback
rule(any(), (ctx) => {
  console.warn(`Unhandled argument: ${ctx.arg}`);
});
```

> 📚 **Learn More**: See [**any() API Reference →**](./docs/api_references/any.md) for complete documentation and examples

### `describe(test, spec)`

Adds metadata (description, category) to a test function for automatic help generation and documentation.

```ts
const verboseFlag = describe(flag("--verbose", "-v"), {
  description: "Enable verbose output with detailed logging",
  category: "General Options",
});

// Use in rules
rule(verboseFlag, isBooleanAt("verbose"));
```

> 📚 **Learn More**: See [**describe() API Reference →**](./docs/api_references/describe.md) for complete documentation and examples

## Handler Functions

Handler functions process matched arguments and update the options object.

> 📋 **Detailed Handler Documentation**: For comprehensive examples, advanced patterns, and testing approaches, see [**Built-in Handlers →**](./docs/flag_handlers/README.md)

### Basic Handlers

#### `isBooleanAt(propName)`

Sets the specified property to `true` when the flag is present.

```ts
rule(flag("--verbose", "-v"), isBooleanAt("verbose"));
// --verbose → { verbose: true }
```

> 📚 **Learn More**: See [**isBooleanAt() Documentation →**](./docs/flag_handlers/isBooleanAt.md) for complete examples and patterns

#### `isStringAt(propName)`

Assigns the flag's value to the specified property.

```ts
rule(flag("--name"), isStringAt("name"));
// --name John → { name: "John" }
// --name=John → { name: "John" }
```

> 📚 **Learn More**: See [**isStringAt() Documentation →**](./docs/flag_handlers/isStringAt.md) for complete examples and patterns

#### `isNumberAt(propName)`

Parses the flag's value as a number and assigns it to the property.

```ts
rule(flag("--port"), isNumberAt("port"));
// --port 3000 → { port: 3000 }
// --port abc → { port: NaN }
```

> 📚 **Learn More**: See [**isNumberAt() Documentation →**](./docs/flag_handlers/isNumberAt.md) for complete examples and patterns

### Array Handlers

#### `isArrayStringAt(propName)`

Accumulates multiple string values into an array.

```ts
rule(flag("--include"), isArrayStringAt("includes"));
// --include src --include lib → { includes: ["src", "lib"] }
```

> 📚 **Learn More**: See [**isArrayStringAt() Documentation →**](./docs/flag_handlers/isArrayStringAt.md) for complete examples and patterns

#### `isArrayNumberAt(propName)`

Accumulates multiple numeric values into an array.

```ts
rule(flag("--port"), isArrayNumberAt("ports"));
// --port 3000 --port 4000 → { ports: [3000, 4000] }
```

> 📚 **Learn More**: See [**isArrayNumberAt() Documentation →**](./docs/flag_handlers/isArrayNumberAt.md) for complete examples and patterns

### Special Handlers

#### `restArgumentsAt(propName)`

Captures all remaining arguments as an array. Useful for subcommands.

```ts
rule(command("run"), restArgumentsAt("args"));
// run build --watch → { args: ["build", "--watch"] }
```

> 📚 **Learn More**: See [**restArgumentsAt() Documentation →**](./docs/flag_handlers/restArgumentsAt.md) for complete examples and patterns

### Advanced Handler

#### `flagHandler(propName, reducer, requireValue?)`

Creates custom handlers with full control over value processing.

**Parameters:**

- `propName: keyof T` - Property to update
- `reducer: (ctx, accumulate, value) => unknown` - Function to process the value
- `requireValue?: boolean` - Whether the flag expects a value (default: `true`)

```ts
// Custom boolean handler (requireValue: false)
rule(
  flag("--debug"),
  flagHandler("debug", () => true, false),
);

// Custom accumulator
rule(
  flag("--count"),
  flagHandler("total", (ctx, acc = 0, value) => acc + Number(value)),
);

// Custom transformation
rule(
  flag("--env"),
  flagHandler("environment", (ctx, _, value) => value?.toUpperCase()),
);
```

## Utilities

> 📖 **Complete Utility Documentation**: For advanced patterns, customization options, and detailed examples, see [**Utility Functions →**](./docs/api_references/README.md#utility-functions)

### `makeHelpMessage(command, rules, samples?)`

Generates a beautifully formatted help message based on your CLI rules. Uses rule metadata added with `describe()` to create organized, professional help text.

**Features:**

- Automatic categorization based on `describe()` metadata
- Terminal width-aware formatting
- Usage examples with multiple samples
- Professional alignment and spacing

```ts
const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose output with detailed logging",
      category: "Debug Options",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--port", "-p"), {
      description: "Set server port number (default: 3000)",
      category: "Server Options",
    }),
    isNumberAt("port"),
  ),

  rule(
    describe(command("build"), {
      description: "Build the project for production",
      category: "Commands",
    }),
    restArgumentsAt("buildArgs"),
  ),
];

const helpText = makeHelpMessage("mycli", rules, [
  "build --verbose",
  "serve --port 8080",
  "--help",
]);

console.log(helpText);

// Output:
// Usage: mycli build --verbose
//        mycli serve --port 8080
//        mycli --help
//
// Commands:
//    build                Build the project for production
//
// Server Options:
//    --port, -p           Set server port number (default: 3000)
//
// Debug Options:
//    --verbose, -v        Enable verbose output with detailed logging
```

> 📚 **Learn More**: See [**makeHelpMessage() API Reference →**](./docs/api_references/make-help-message.md) for advanced customization and examples

### `getSpecs(rules)`

Extracts metadata from parsing rules for programmatic access. Returns a generator that yields spec objects containing rule metadata.

**Use cases:**

- Custom help generation
- Configuration validation
- CLI introspection
- Documentation generation

```ts
import { getSpecs } from "@jondotsoy/flags";

// Extract all rule metadata
for (const spec of getSpecs(rules)) {
  console.log({
    names: spec.names, // ["--verbose", "-v"]
    category: spec.category, // "Debug Options"
    description: spec.description, // "Enable verbose output..."
  });
}

// Convert to array for manipulation
const allSpecs = Array.from(getSpecs(rules));

// Filter by category
const debugSpecs = allSpecs.filter((spec) => spec.category === "Debug Options");

// Generate custom documentation
function generateConfigDocs(rules) {
  const specs = Array.from(getSpecs(rules));
  return specs.map((spec) => ({
    flags: spec.names?.join(", "),
    help: spec.description,
    section: spec.category,
  }));
}
```

> 📚 **Learn More**: See [**getSpecs() API Reference →**](./docs/api_references/get-specs.md) for comprehensive usage patterns and examples

## Error Handling

The library provides specific error types for better error handling:

> 📚 **Complete Error Documentation**: See [**Error Handling →**](./docs/api_references/errors.md) for comprehensive error handling patterns and examples

### `UnknownArgumentError`

Thrown when an unrecognized argument is encountered.

```ts
import { flags, UnknownArgumentError } from "@jondotsoy/flags";

try {
  const options = flags(process.argv.slice(2), {}, rules);
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error(`Error: ${error.message}`);
    console.log(makeHelpMessage("mycli", rules));
    process.exit(1);
  }
  throw error;
}
```

### `FlagsError`

Base error class for all flags-related errors.

```ts
import { FlagsError } from "@jondotsoy/flags";

try {
  // ... parsing logic
} catch (error) {
  if (error instanceof FlagsError) {
    // Handle any flags-related error
  }
}
```

## Complete Examples

> 🚀 **More Advanced Examples**: For real-world CLI patterns, complex configurations, and production-ready examples, see [**Advanced Examples →**](./docs/README.md#advanced-examples)

### Basic CLI Tool

```ts
import {
  flags,
  rule,
  flag,
  isBooleanAt,
  isStringAt,
  isNumberAt,
  makeHelpMessage,
  UnknownArgumentError,
} from "@jondotsoy/flags";

interface CLIOptions {
  verbose: boolean;
  output: string;
  port: number;
  help: boolean;
}

const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose logging",
    }),
    isBooleanAt("verbose"),
  ),
  rule(
    describe(flag("--output", "-o"), {
      description: "Output file path",
    }),
    isStringAt("output"),
  ),
  rule(
    describe(flag("--port", "-p"), {
      description: "Server port number",
    }),
    isNumberAt("port"),
  ),
  rule(
    describe(flag("--help", "-h"), {
      description: "Show help message",
    }),
    isBooleanAt("help"),
  ),
];

try {
  const options = flags<CLIOptions>(
    process.argv.slice(2),
    { port: 3000, output: "dist" }, // defaults
    rules,
  );

  if (options.help) {
    console.log(
      makeHelpMessage("mycli", rules, [
        "--verbose --port 8080",
        "--output ./build",
      ]),
    );
    process.exit(0);
  }

  console.log("Starting with options:", options);
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error(`Error: ${error.message}`);
    console.log(makeHelpMessage("mycli", rules));
    process.exit(1);
  }
  throw error;
}
```

### Multi-Command CLI (like npm/git)

```ts
interface CLIOptions {
  global?: boolean;
  verbose?: boolean;
  // Command-specific
  buildArgs?: string[];
  testPattern?: string;
  servePort?: number;
  watchFiles?: string[];
}

const rules = [
  // Global flags
  rule(flag("--global", "-g"), isBooleanAt("global")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),

  // Commands
  rule(command("build"), restArgumentsAt("buildArgs")),
  rule(command("test"), (ctx) => {
    // Custom logic for test command
    const remaining = ctx.args.slice(ctx.index);
    ctx.flags.testPattern = remaining[0] || "**/*.test.js";
    ctx.nextIndex = ctx.args.length;
  }),

  // Serve command with port flag
  rule(command("serve"), (ctx) => {
    const remaining = ctx.args.slice(ctx.index);
    if (remaining[0]?.startsWith("--port=")) {
      ctx.flags.servePort = Number(remaining[0].split("=")[1]);
      ctx.nextIndex = ctx.index + 1;
    } else {
      ctx.flags.servePort = 3000;
    }
  }),
];

// Usage examples:
// mycli build --verbose
// mycli test src/**/*.test.ts
// mycli serve --port=8080
```

### Advanced File Processing Tool

```ts
interface FileOptions {
  input?: string[];
  output?: string;
  format?: string;
  exclude?: string[];
  recursive?: boolean;
  dryRun?: boolean;
}

const rules = [
  // Multiple input files
  rule(flag("--input", "-i"), isArrayStringAt("input")),

  // Output directory
  rule(flag("--output", "-o"), isStringAt("output")),

  // Format with validation
  rule(
    flag("--format", "-f"),
    flagHandler("format", (ctx, _, value) => {
      const validFormats = ["json", "yaml", "xml"];
      if (value && !validFormats.includes(value)) {
        throw new Error(
          `Invalid format: ${value}. Valid formats: ${validFormats.join(", ")}`,
        );
      }
      return value;
    }),
  ),

  // Exclude patterns
  rule(flag("--exclude"), isArrayStringAt("exclude")),

  // Boolean flags
  rule(flag("--recursive", "-r"), isBooleanAt("recursive")),
  rule(flag("--dry-run"), isBooleanAt("dryRun")),

  // Positional arguments as fallback input
  rule(
    argument(),
    flagHandler("input", (ctx, acc = [], value) => [...acc, value]),
  ),
];

// Usage: fileprocessor --input src/ --exclude node_modules --format json --output dist/
```

### Environment Configuration

```ts
interface Config {
  environment: "development" | "production" | "test";
  debug: boolean;
  logLevel: number;
  features: string[];
}

const rules = [
  // Environment with custom validation
  rule(
    flag("--env", "-e"),
    flagHandler("environment", (ctx, _, value) => {
      const validEnvs = ["development", "production", "test"];
      if (value && !validEnvs.includes(value)) {
        return "development"; // default fallback
      }
      return value;
    }),
  ),

  // Debug flag affects log level
  rule(flag("--debug", "-d"), (ctx) => {
    ctx.flags.debug = true;
    ctx.flags.logLevel = 4; // Set verbose logging
  }),

  // Log level with range validation
  rule(
    flag("--log-level"),
    flagHandler("logLevel", (ctx, _, value) => {
      const level = Number(value);
      return Math.max(0, Math.min(5, level)); // Clamp between 0-5
    }),
  ),

  // Feature flags
  rule(flag("--feature"), isArrayStringAt("features")),
];

// Usage: myapp --env production --log-level 2 --feature auth --feature payments
```

## Best Practices

### 1. Use TypeScript Interfaces

Define clear interfaces for your CLI options to get full type safety:

```ts
interface MyCliOptions {
  // Use optional properties for flags that might not be present
  verbose?: boolean;
  output?: string;

  // Use required properties for options with defaults
  port: number;

  // Use arrays for repeatable options
  include: string[];
}
```

### 2. Provide Sensible Defaults

Always provide default values in the second parameter:

```ts
const options = flags<MyCliOptions>(
  args,
  {
    port: 3000,
    include: [],
    verbose: false,
  },
  rules,
);
```

### 3. Add Help Documentation

Use `describe()` to add helpful descriptions for auto-generated help:

```ts
const rules = [
  rule(
    describe(flag("--port", "-p"), {
      description: "Port number for the server (default: 3000)",
      category: "Server Options",
    }),
    isNumberAt("port"),
  ),
];
```

### 4. Handle Errors Gracefully

Always wrap flag parsing in try-catch blocks:

```ts
try {
  const options = flags(args, defaults, rules);
  return options;
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error(`Error: ${error.message}`);
    console.log(makeHelpMessage("myapp", rules));
    process.exit(1);
  }
  throw error;
}
```

### 5. Organize Complex CLIs

For complex CLIs, organize rules by functionality:

```ts
const globalRules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--help", "-h"), isBooleanAt("help")),
];

const buildRules = [
  rule(command("build"), restArgumentsAt("buildArgs")),
  rule(flag("--watch"), isBooleanAt("watch")),
];

const allRules = [...globalRules, ...buildRules];
```

## Migration Guide

### From other CLI libraries

#### From `yargs`:

```ts
// Before (yargs)
const argv = yargs
  .option("verbose", { type: "boolean", alias: "v" })
  .option("port", { type: "number", default: 3000 }).argv;

// After (@jondotsoy/flags)
const options = flags<{ verbose?: boolean; port: number }>(
  process.argv.slice(2),
  { port: 3000 },
  [
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--port"), isNumberAt("port")),
  ],
);
```

#### From `commander`:

```ts
// Before (commander)
program
  .option("-v, --verbose", "verbose output")
  .option("-p, --port <port>", "port number", "3000")
  .parse();

// After (@jondotsoy/flags)
const options = flags<{ verbose?: boolean; port: number }>(
  process.argv.slice(2),
  { port: 3000 },
  [
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--port", "-p"), isNumberAt("port")),
  ],
);
```

### From version 1.x to 2.x

- `commandOption()` is deprecated, use `argument()` instead
- Error types are now exported: `UnknownArgumentError`, `FlagsError`
- `flagHandler()` is the new recommended way for custom handlers

## FAQ

**Q: How do I handle subcommands like `git commit` or `npm install`?**

A: Use the `command()` test function combined with `restArgumentsAt()`:

```ts
rule(command("commit"), restArgumentsAt("commitArgs"));
```

**Q: Can I have flags that don't require values?**

A: Yes! Use `isBooleanAt()` for boolean flags or `flagHandler()` with `requireValue: false`:

```ts
rule(flag("--verbose"), isBooleanAt("verbose"));
// or
rule(
  flag("--debug"),
  flagHandler("debug", () => true, false),
);
```

**Q: How do I validate flag values?**

A: Use `flagHandler()` with custom validation logic:

```ts
rule(
  flag("--port"),
  flagHandler("port", (ctx, _, value) => {
    const port = Number(value);
    if (port < 1 || port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }
    return port;
  }),
);
```

**Q: Can I have the same flag appear multiple times?**

A: Yes! Use `isArrayStringAt()`, `isArrayNumberAt()`, or custom `flagHandler()`:

```ts
rule(flag("--include"), isArrayStringAt("includes"));
// --include src --include lib → { includes: ["src", "lib"] }
```

## License

MIT - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# API Reference Index

Complete API reference for `@jondotsoy/flags`. Click on any function or class to see detailed documentation.

## Core Functions

### [`flags()`](./flags.md)

Main parsing function that processes command-line arguments according to rules.

```ts
flags<T>(args: string[], init: Partial<T>, rules: Rule<T>[]): Partial<T>
```

### [`rule()`](./rule.md) ⭐

Create parsing rules that combine test functions with handlers.

```ts
rule<T>(test: Test<T>, handler: Handler<T>, ...specs: Spec[]): Rule<T>
```

## Test Functions

Test functions determine which arguments match specific patterns.

### [`flag()`](./flag.md) ⭐

Match command-line flags like `--verbose`, `-v`, or `--name=value`.

```ts
flag<T>(...flags: string[]): Test<T>
```

### [`command()`](./command.md)

Match subcommands like `build`, `serve`, or `test`.

```ts
command<T>(name: string): Test<T>
```

### [`argument()`](./argument.md)

Match positional arguments in order.

```ts
argument<T>(): Test<T>
```

### [`any()`](./any.md)

Match any argument (wildcard pattern).

```ts
any<T>(): Test<T>
```

### [`describe()`](./describe.md)

Add metadata (description, category) to test functions.

```ts
describe<T>(test: Test<T>, ...specs: Spec[]): Test<T>
```

## Utility Functions

### [`getSpecs()`](./get-specs.md)

Extract metadata from parsing rules for help generation and introspection.

```ts
getSpecs(rules: Rule<any>[]): Generator<Spec>
```

### [`makeHelpMessage()`](./make-help-message.md)

Generate formatted help text for CLI applications.

```ts
makeHelpMessage(command: string, rules: Rule<any>[], samples?: string[]): string
```

## Handler Functions

Handler functions process matched arguments and update the options object.

### Built-in Handlers

> 📋 **Detailed Handler Documentation**: For comprehensive examples, advanced patterns, and testing approaches, see [**Built-in Handlers →**](../flag_handlers/README.md)

#### [`isBooleanAt()`](../flag_handlers/isBooleanAt.md)

Set a property to `true` when a flag is present.

```ts
isBooleanAt<T>(propName: keyof T): Handler<T>
```

#### [`isStringAt()`](../flag_handlers/isStringAt.md)

Store a flag's string value in a property.

```ts
isStringAt<T>(propName: keyof T): Handler<T>
```

#### [`isNumberAt()`](../flag_handlers/isNumberAt.md)

Parse and store a flag's numeric value.

```ts
isNumberAt<T>(propName: keyof T): Handler<T>
```

#### [`isArrayStringAt()`](../flag_handlers/isArrayStringAt.md)

Accumulate multiple string values in an array.

```ts
isArrayStringAt<T>(propName: keyof T): Handler<T>
```

#### [`isArrayNumberAt()`](../flag_handlers/isArrayNumberAt.md)

Accumulate multiple numeric values in an array.

```ts
isArrayNumberAt<T>(propName: keyof T): Handler<T>
```

#### [`restArgumentsAt()`](../flag_handlers/restArgumentsAt.md)

Capture all remaining arguments as an array.

```ts
restArgumentsAt<T>(propName: keyof T): Handler<T>
```

### Custom Handlers

#### [`flagHandler()`](./flag-handler.md) ⭐

Create custom handlers with full control over value processing.

```ts
flagHandler<T>(
  propName: keyof T,
  reducer: (ctx: Context<T>, accumulate: unknown, value: string | null) => unknown,
  requireValue?: boolean
): Handler<T>
```

## Utility Functions

### [`makeHelpMessage()`](./make-help-message.md) ⭐

Generate formatted help messages for your CLI.

```ts
makeHelpMessage(command: string, rules: Rule<any>[], samples?: string[]): string
```

### [`getSpecs()`](./get-specs.md)

Extract metadata from rules for programmatic access.

```ts
getSpecs(rules: Rule<any>[]): Generator<Spec>
```

## Error Classes

### [`FlagsError`](./errors.md#flagserror)

Base error class for all flags-related errors.

```ts
class FlagsError extends Error
```

### [`UnknownArgumentError`](./errors.md#unknownargumenterror) ⭐

Thrown when an argument doesn't match any rule.

```ts
class UnknownArgumentError extends FlagsError
```

## Type Definitions

### Core Types

```ts
// Main types
export type Rule<T> = [Test<T>, Handler<T>];
export type Test<T> = ((arg: string, ctx: Context<T>) => boolean) & Spec;
export interface Handler<T> {
  (ctx: Context<T>): void;
}

// Context provided to handlers
export interface Context<T> {
  nextIndex: number; // Next argument index to process
  args: string[]; // All command line arguments
  index: number; // Current argument index
  arg: string; // Current argument being processed
  argValue: null | string; // Value from --flag=value syntax
  flags: Partial<T>; // Accumulated parsed options
}

// Metadata for documentation
export interface Spec {
  names?: string[]; // Flag/command names
  category?: string; // Group for help generation
  description?: string; // Help text description
}
```

## Quick Reference by Use Case

### Basic CLI with Flags

```ts
import { flags, rule, flag, isBooleanAt, isStringAt } from "@jondotsoy/flags";

// Simple boolean and string flags
const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),
];
```

### Multi-Command CLI

```ts
import { command, restArgumentsAt } from "@jondotsoy/flags";

// Subcommands like git, npm, docker
const rules = [
  rule(command("build"), restArgumentsAt("buildArgs")),
  rule(command("serve"), restArgumentsAt("serveArgs")),
];
```

### Complex Validation

```ts
import { flagHandler } from "@jondotsoy/flags";

// Custom validation and processing
const rules = [
  rule(
    flag("--port"),
    flagHandler("port", (ctx, _, value) => {
      const port = Number(value);
      if (port < 1 || port > 65535) throw new Error("Invalid port");
      return port;
    }),
  ),
];
```

### Help Generation

```ts
import {
  makeHelpMessage,
  describe,
  UnknownArgumentError,
} from "@jondotsoy/flags";

// Add descriptions and generate help
const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),
];

// Handle errors with help
try {
  const options = flags(args, {}, rules);
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.log(makeHelpMessage("myapp", rules));
  }
}
```

### Positional Arguments

```ts
import { argument } from "@jondotsoy/flags";

// Handle positional args like: myapp input.txt output.txt
const rules = [
  rule(argument(), isStringAt("input")),
  rule(argument(), isStringAt("output")),
];
```

## Common Patterns

### Configuration Loading

```ts
const configRule = rule(
  flag("--config"),
  flagHandler("config", (ctx, _, value) => {
    return JSON.parse(fs.readFileSync(value, "utf8"));
  }),
);
```

### Array Accumulation

```ts
const includeRule = rule(flag("--include"), isArrayStringAt("includes"));
// --include src --include lib → { includes: ["src", "lib"] }
```

### Environment Integration

```ts
const envRule = rule(
  flag("--env"),
  flagHandler("environment", (ctx, _, value) => {
    const env = value || process.env.NODE_ENV || "development";
    process.env.NODE_ENV = env;
    return env;
  }),
);
```

### Feature Flags

```ts
const featureRule = rule(
  flag("--feature"),
  flagHandler("features", (ctx, acc = new Set(), value) => {
    return acc.add(value);
  }),
);
```

---

⭐ = Most commonly used APIs

For complete examples and advanced usage patterns, see the [main documentation](../README.md).

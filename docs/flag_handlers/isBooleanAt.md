# `isBooleanAt()` - Flag Handler

Set a property to `true` when a flag is present. This is the most common handler for boolean flags like `--verbose`, `--help`, or `--force`.

## Syntax

```ts
isBooleanAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to `true`

## Returns

`Handler<T>` - A handler function that sets the specified property to `true`

## Basic Usage

### Simple Boolean Flag

```ts
import { rule, flag, isBooleanAt } from "@jondotsoy/flags";

interface Options {
  verbose: boolean;
}

const verboseRule = rule(flag("--verbose", "-v"), isBooleanAt("verbose"));

// Usage: --verbose → { verbose: true }
// Usage: -v        → { verbose: true }
// Usage: (no flag) → { verbose: undefined }
```

### Multiple Boolean Flags

```ts
interface CLIOptions {
  verbose: boolean;
  quiet: boolean;
  force: boolean;
  dryRun: boolean;
}

const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--quiet", "-q"), isBooleanAt("quiet")),
  rule(flag("--force", "-f"), isBooleanAt("force")),
  rule(flag("--dry-run", "-n"), isBooleanAt("dryRun")),
];

// Usage: myapp --verbose --force --dry-run
// Result: { verbose: true, force: true, dryRun: true, quiet: undefined }
```

## Common Use Cases

### Help and Version Flags

```ts
interface AppOptions {
  help: boolean;
  version: boolean;
  verbose: boolean;
}

const rules = [
  rule(flag("--help", "-h"), isBooleanAt("help")),
  rule(flag("--version", "-V"), isBooleanAt("version")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
];

// Handle help/version in your main logic
const options = flags(process.argv.slice(2), {}, rules);

if (options.help) {
  console.log(makeHelpMessage("myapp", rules));
  process.exit(0);
}

if (options.version) {
  console.log("v1.0.0");
  process.exit(0);
}
```

### Build Tool Flags

```ts
interface BuildOptions {
  watch: boolean;
  minify: boolean;
  sourcemap: boolean;
  development: boolean;
  production: boolean;
}

const rules = [
  rule(flag("--watch", "-w"), isBooleanAt("watch")),
  rule(flag("--minify", "-m"), isBooleanAt("minify")),
  rule(flag("--sourcemap"), isBooleanAt("sourcemap")),
  rule(flag("--dev", "-d"), isBooleanAt("development")),
  rule(flag("--prod", "-p"), isBooleanAt("production")),
];

// Usage: build --watch --minify --sourcemap
// Result: { watch: true, minify: true, sourcemap: true }
```

### Feature Toggles

```ts
interface Features {
  enableAuth: boolean;
  enablePayments: boolean;
  enableAnalytics: boolean;
  debugMode: boolean;
}

const rules = [
  rule(flag("--enable-auth"), isBooleanAt("enableAuth")),
  rule(flag("--enable-payments"), isBooleanAt("enablePayments")),
  rule(flag("--enable-analytics"), isBooleanAt("enableAnalytics")),
  rule(flag("--debug"), isBooleanAt("debugMode")),
];
```

## Working with Defaults

### Providing Default Values

```ts
const options = flags<CLIOptions>(
  process.argv.slice(2),
  {
    // Set defaults for boolean flags
    verbose: false,
    minify: true, // Default to true
    watch: false,
  },
  rules,
);

// Now you can safely check options.verbose without undefined
if (options.verbose) {
  console.log("Verbose mode enabled");
}
```

### Explicit Default Handling

```ts
const options = flags(args, {}, rules);

// Handle undefined vs explicit false
const isVerbose = options.verbose ?? false; // Default to false if undefined
const shouldMinify = options.minify ?? true; // Default to true if undefined
```

## Advanced Patterns

### Mutually Exclusive Flags

```ts
interface Options {
  verbose: boolean;
  quiet: boolean;
}

const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--quiet", "-q"), isBooleanAt("quiet")),
];

const options = flags(args, {}, rules);

// Validate mutual exclusion
if (options.verbose && options.quiet) {
  throw new Error("--verbose and --quiet cannot be used together");
}
```

### Hierarchical Boolean Logic

```ts
interface Options {
  debug: boolean;
  verbose: boolean;
  silent: boolean;
}

const rules = [
  rule(flag("--debug"), isBooleanAt("debug")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--silent", "-s"), isBooleanAt("silent")),
];

const options = flags(args, {}, rules);

// Debug implies verbose
if (options.debug) {
  options.verbose = true;
}

// Silent overrides everything
if (options.silent) {
  options.verbose = false;
  options.debug = false;
}
```

### Boolean Flag with Custom Logic

For more complex boolean logic, you can combine with custom handlers:

```ts
const smartVerboseRule = rule(flag("--verbose", "-v"), (ctx) => {
  // Set verbose to true
  ctx.flags.verbose = true;

  // Also enable related debugging features
  ctx.flags.showTimestamps = true;
  ctx.flags.logLevel = "debug";
});
```

## Testing Boolean Flags

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isBooleanAt } from "@jondotsoy/flags";

describe("isBooleanAt", () => {
  const verboseRule = rule(flag("--verbose", "-v"), isBooleanAt("verbose"));

  test("should set property to true when flag is present", () => {
    const options = flags(["--verbose"], {}, [verboseRule]);
    expect(options.verbose).toBe(true);
  });

  test("should work with short flag", () => {
    const options = flags(["-v"], {}, [verboseRule]);
    expect(options.verbose).toBe(true);
  });

  test("should leave property undefined when flag is not present", () => {
    const options = flags([], {}, [verboseRule]);
    expect(options.verbose).toBeUndefined();
  });

  test("should work with defaults", () => {
    const options = flags([], { verbose: false }, [verboseRule]);
    expect(options.verbose).toBe(false);

    const options2 = flags(["--verbose"], { verbose: false }, [verboseRule]);
    expect(options2.verbose).toBe(true);
  });
});
```

### Integration Tests

```ts
describe("multiple boolean flags", () => {
  const rules = [
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--force", "-f"), isBooleanAt("force")),
    rule(flag("--dry-run"), isBooleanAt("dryRun")),
  ];

  test("should handle multiple flags", () => {
    const options = flags(["--verbose", "--force", "--dry-run"], {}, rules);

    expect(options.verbose).toBe(true);
    expect(options.force).toBe(true);
    expect(options.dryRun).toBe(true);
  });

  test("should handle mixed presence", () => {
    const options = flags(["--verbose"], {}, rules);

    expect(options.verbose).toBe(true);
    expect(options.force).toBeUndefined();
    expect(options.dryRun).toBeUndefined();
  });
});
```

## Equivalent Implementation

Understanding how `isBooleanAt` works internally:

```ts
// This is equivalent to isBooleanAt
const customBooleanHandler =
  <T>(propName: keyof T): Handler<T> =>
  ({ flags }) => {
    flags[propName] = true as T[keyof T];
  };

// Or using flagHandler
const booleanWithFlagHandler = <T>(propName: keyof T): Handler<T> =>
  flagHandler<T>(propName, () => true, false);
```

## Common Mistakes

### ❌ Wrong: Using with Value

```ts
// Don't do this - boolean flags don't take values
rule(flag("--verbose"), isBooleanAt("verbose"));

// Usage: --verbose true  ❌ This will cause "true" to be treated as unknown argument
```

### ❌ Wrong: Multiple Assignments

```ts
// This won't work as expected
rule(flag("--verbose"), (ctx) => {
  ctx.flags.verbose = true;
  ctx.flags.verbose = false; // Overwrites previous value
});
```

### ✅ Correct: Simple Boolean Logic

```ts
// Correct usage
rule(flag("--verbose", "-v"), isBooleanAt("verbose"));

// Usage: --verbose  ✅ { verbose: true }
// Usage: -v        ✅ { verbose: true }
```

## Performance Considerations

`isBooleanAt` is one of the most efficient handlers since it performs a simple assignment:

```ts
// Very fast operation
const handler = isBooleanAt("verbose");
// Internally: ctx.flags.verbose = true;
```

For CLIs with many boolean flags, performance is not a concern.

## Related APIs

- [`flag()`](../api_references/flag.md) - Create flag test functions
- [`rule()`](../api_references/rule.md) - Combine flags with handlers
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom boolean logic
- [`isStringAt()`](./isStringAt.md) - Handle string flags
- [`makeHelpMessage()`](../api_references/make-help-message.md) - Include in help generation

## Real-World Examples

### Docker-like CLI

```ts
interface DockerOptions {
  detach: boolean;
  interactive: boolean;
  tty: boolean;
  remove: boolean;
}

const rules = [
  rule(flag("--detach", "-d"), isBooleanAt("detach")),
  rule(flag("--interactive", "-i"), isBooleanAt("interactive")),
  rule(flag("--tty", "-t"), isBooleanAt("tty")),
  rule(flag("--rm"), isBooleanAt("remove")),
];

// Usage: docker run -dit --rm myimage
```

### Git-like CLI

```ts
interface GitOptions {
  all: boolean;
  force: boolean;
  quiet: boolean;
  verbose: boolean;
}

const rules = [
  rule(flag("--all", "-a"), isBooleanAt("all")),
  rule(flag("--force", "-f"), isBooleanAt("force")),
  rule(flag("--quiet", "-q"), isBooleanAt("quiet")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
];

// Usage: git commit --all --verbose
// Usage: git push --force --quiet
```

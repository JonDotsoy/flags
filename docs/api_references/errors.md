# Error Classes - API Reference

`@jondotsoy/flags` provides specific error classes for better error handling and debugging.

## Error Hierarchy

```
Error (built-in)
└── FlagsError
    └── UnknownArgumentError
```

## `FlagsError`

Base error class for all flags-related errors.

### Syntax

```ts
class FlagsError extends Error {
  name = "FlagsError";
}
```

### Usage

```ts
import { FlagsError } from "@jondotsoy/flags";

try {
  // Flag parsing logic
} catch (error) {
  if (error instanceof FlagsError) {
    // Handle any flags-related error
    console.error("Flags error:", error.message);
  } else {
    // Handle other errors
    throw error;
  }
}
```

### Creating Custom Flag Errors

```ts
import { FlagsError } from "@jondotsoy/flags";

class ValidationError extends FlagsError {
  name = "ValidationError";

  constructor(field: string, value: string, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
  }
}

// Usage in custom handlers
const portHandler = flagHandler("port", (ctx, _, value) => {
  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new ValidationError("port", value, "Must be between 1 and 65535");
  }
  return port;
});
```

## `UnknownArgumentError`

Thrown when an argument doesn't match any of the provided rules.

### Syntax

```ts
class UnknownArgumentError extends FlagsError {
  name = "UnknownArgumentError";

  constructor(arg: string) {
    super(`Unknown argument: ${arg}`);
  }
}
```

### Properties

- `message: string` - Error message including the unknown argument
- `name: string` - Always `"UnknownArgumentError"`

### Usage

```ts
import { flags, UnknownArgumentError, makeHelpMessage } from "@jondotsoy/flags";

try {
  const options = flags(process.argv.slice(2), {}, rules);
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error(`❌ ${error.message}`);
    console.log("\nAvailable options:");
    console.log(makeHelpMessage("myapp", rules));
    process.exit(1);
  }
  throw error;
}
```

### Common Scenarios

#### Typos in Flag Names

```bash
# User types:
myapp --verbos

# Results in:
# UnknownArgumentError: Unknown argument: --verbos
```

#### Unsupported Flags

```bash
# User tries to use a flag that doesn't exist:
myapp --unsupported-flag

# Results in:
# UnknownArgumentError: Unknown argument: --unsupported-flag
```

#### Missing Rules for Arguments

```bash
# User provides positional arguments but no rules handle them:
myapp build extra-arg

# If no rule matches "extra-arg":
# UnknownArgumentError: Unknown argument: extra-arg
```

## Error Handling Patterns

### Basic Error Handling

```ts
function parseArgs(args: string[]) {
  try {
    return flags(args, defaults, rules);
  } catch (error) {
    if (error instanceof UnknownArgumentError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error; // Re-throw unexpected errors
  }
}
```

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
    return flags(args, defaults, rules);
  } catch (error) {
    if (error instanceof UnknownArgumentError) {
      console.error(`❌ ${error.message}`);
      console.log("\n" + makeHelpMessage("myapp", rules));
      process.exit(1);
    } else if (error instanceof FlagsError) {
      console.error(`❌ Configuration error: ${error.message}`);
      process.exit(1);
    } else if (error instanceof Error) {
      console.error(`❌ Unexpected error: ${error.message}`);
      if (process.env.NODE_ENV === "development") {
        console.error(error.stack);
      }
      process.exit(1);
    } else {
      console.error("❌ Unknown error occurred");
      process.exit(1);
    }
  }
}
```

### Graceful Degradation

```ts
function parseWithFallback(args: string[]) {
  try {
    return flags(args, defaults, rules);
  } catch (error) {
    if (error instanceof UnknownArgumentError) {
      console.warn(`Warning: ${error.message}, ignoring unknown arguments`);

      // Filter out unknown arguments and try again
      const knownArgs = args.filter((arg) => {
        // Simple heuristic: keep known flag patterns
        return rules.some(([test]) => {
          try {
            return test.names?.some((name) => arg.startsWith(name));
          } catch {
            return false;
          }
        });
      });

      return flags(knownArgs, defaults, rules);
    }
    throw error;
  }
}
```

### Error Recovery with Suggestions

```ts
function parseWithSuggestions(args: string[]) {
  try {
    return flags(args, defaults, rules);
  } catch (error) {
    if (error instanceof UnknownArgumentError) {
      const unknownArg = error.message.match(/Unknown argument: (.+)/)?.[1];

      if (unknownArg) {
        // Find similar flags
        const allFlags = rules
          .flatMap(([test]) => test.names || [])
          .filter((name) => name.startsWith("-"));

        const suggestions = allFlags.filter((flag) => {
          // Simple similarity check
          return levenshteinDistance(unknownArg, flag) <= 2;
        });

        console.error(`❌ ${error.message}`);

        if (suggestions.length > 0) {
          console.error(`Did you mean: ${suggestions.join(", ")}?`);
        }

        console.log("\n" + makeHelpMessage("myapp", rules));
        process.exit(1);
      }
    }
    throw error;
  }
}

// Simple Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[b.length][a.length];
}
```

## Custom Error Classes

### Validation Error

```ts
export class ValidationError extends FlagsError {
  name = "ValidationError";
  field: string;
  value: string;

  constructor(field: string, value: string, reason: string) {
    super(`Invalid ${field}: ${value}. ${reason}`);
    this.field = field;
    this.value = value;
  }
}

// Usage
const emailHandler = flagHandler("email", (ctx, _, value) => {
  if (!value || !value.includes("@")) {
    throw new ValidationError("email", value, "Must contain @ symbol");
  }
  return value;
});
```

### Configuration Error

```ts
export class ConfigurationError extends FlagsError {
  name = "ConfigurationError";

  constructor(message: string) {
    super(`Configuration error: ${message}`);
  }
}

// Usage
const configHandler = flagHandler("config", (ctx, _, value) => {
  try {
    return JSON.parse(fs.readFileSync(value, "utf8"));
  } catch (error) {
    throw new ConfigurationError(`Failed to load config file: ${value}`);
  }
});
```

### Dependency Error

```ts
export class DependencyError extends FlagsError {
  name = "DependencyError";

  constructor(required: string, missing: string) {
    super(`${required} requires ${missing} to be set`);
  }
}

// Usage
let outputSet = false;

const outputHandler = flagHandler("output", (ctx, _, value) => {
  outputSet = true;
  return value;
});

const formatHandler = flagHandler("format", (ctx, _, value) => {
  if (!outputSet) {
    throw new DependencyError("--format", "--output");
  }
  return value;
});
```

## Testing Error Handling

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, UnknownArgumentError, FlagsError } from "@jondotsoy/flags";

describe("error handling", () => {
  const rules = [rule(flag("--valid"), isStringAt("valid"))];

  test("should throw UnknownArgumentError for invalid flags", () => {
    expect(() => {
      flags(["--invalid"], {}, rules);
    }).toThrow(UnknownArgumentError);
  });

  test("should include argument name in error message", () => {
    try {
      flags(["--invalid"], {}, rules);
    } catch (error) {
      expect(error.message).toContain("--invalid");
    }
  });

  test("should be instance of FlagsError", () => {
    try {
      flags(["--invalid"], {}, rules);
    } catch (error) {
      expect(error).toBeInstanceOf(FlagsError);
      expect(error).toBeInstanceOf(UnknownArgumentError);
    }
  });
});
```

### Integration Tests

```ts
describe("CLI error scenarios", () => {
  test("should handle typos gracefully", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const exitSpy = jest.spyOn(process, "exit").mockImplementation();

    parseCliArgs(["--verbos"]); // Typo

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("--verbos"),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

## Best Practices

### Error Message Quality

```ts
// Good: Specific, actionable error messages
throw new Error("Port must be between 1 and 65535, got: 99999");

// Bad: Vague error messages
throw new Error("Invalid port");
```

### Error Context

```ts
// Good: Include context in error messages
const portHandler = flagHandler("port", (ctx, _, value) => {
  const port = Number(value);
  if (isNaN(port)) {
    throw new Error(
      `Port "${value}" is not a valid number. Example: --port 3000`,
    );
  }
  return port;
});
```

### Consistent Error Handling

```ts
// Create a standard error handler
function handleCliError(error: Error, command: string, rules: Rule<any>[]) {
  if (error instanceof UnknownArgumentError) {
    console.error(`❌ ${error.message}`);
    console.log(`\nRun "${command} --help" for usage information.`);
  } else if (error instanceof ValidationError) {
    console.error(`❌ ${error.message}`);
    console.log(`Use "${command} --help" to see valid options.`);
  } else {
    console.error(`❌ Unexpected error: ${error.message}`);
  }
  process.exit(1);
}
```

## Related APIs

- [`flags()`](./flags.md) - Main parsing function that throws these errors
- [`makeHelpMessage()`](./make-help-message.md) - Generate help for error recovery
- [`flagHandler()`](./flag-handler.md) - Custom handlers that may throw errors

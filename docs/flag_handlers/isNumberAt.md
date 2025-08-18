# `isNumberAt()` - Flag Handler

Set a property to a numeric value provided after a flag. This handler captures and converts string arguments to numbers like `--port 3000`, `--timeout 30`, or `--workers 4`.

## Syntax

```ts
isNumberAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to the numeric value

## Returns

`Handler<T>` - A handler function that captures the next argument and converts it to a number

## Basic Usage

### Simple Number Flag

```ts
import { rule, flag, isNumberAt } from "@jondotsoy/flags";

interface Options {
  port: number;
}

const portRule = rule(flag("--port", "-p"), isNumberAt("port"));

// Usage: --port 3000     → { port: 3000 }
// Usage: -p 8080        → { port: 8080 }
// Usage: --port=5000    → { port: 5000 }
```

### Multiple Number Flags

```ts
interface ServerOptions {
  port: number;
  workers: number;
  timeout: number;
  maxConnections: number;
}

const rules = [
  rule(flag("--port", "-p"), isNumberAt("port")),
  rule(flag("--workers", "-w"), isNumberAt("workers")),
  rule(flag("--timeout", "-t"), isNumberAt("timeout")),
  rule(flag("--max-connections"), isNumberAt("maxConnections")),
];

// Usage: server --port 3000 --workers 4 --timeout 30 --max-connections 1000
```

## Number Types and Formats

### Integer Values

```ts
interface Options {
  count: number;
  retries: number;
  workers: number;
}

const rules = [
  rule(flag("--count", "-c"), isNumberAt("count")),
  rule(flag("--retries", "-r"), isNumberAt("retries")),
  rule(flag("--workers", "-w"), isNumberAt("workers")),
];

// Usage: --count 10 --retries 3 --workers 4
// Result: { count: 10, retries: 3, workers: 4 }
```

### Decimal Values

```ts
interface Options {
  threshold: number;
  ratio: number;
  percentage: number;
}

const rules = [
  rule(flag("--threshold"), isNumberAt("threshold")),
  rule(flag("--ratio"), isNumberAt("ratio")),
  rule(flag("--percentage"), isNumberAt("percentage")),
];

// Usage: --threshold 0.75 --ratio 1.5 --percentage 85.5
// Result: { threshold: 0.75, ratio: 1.5, percentage: 85.5 }
```

### Negative Numbers

```ts
interface Options {
  offset: number;
  adjustment: number;
}

const rules = [
  rule(flag("--offset"), isNumberAt("offset")),
  rule(flag("--adjustment"), isNumberAt("adjustment")),
];

// Usage: --offset -10 --adjustment -2.5
// Result: { offset: -10, adjustment: -2.5 }
```

### Scientific Notation

```ts
interface Options {
  precision: number;
  scale: number;
}

const rules = [
  rule(flag("--precision"), isNumberAt("precision")),
  rule(flag("--scale"), isNumberAt("scale")),
];

// Usage: --precision 1e-6 --scale 2.5e3
// Result: { precision: 0.000001, scale: 2500 }
```

## Common Use Cases

### Server Configuration

```ts
interface ServerConfig {
  port: number;
  workers: number;
  timeout: number;
  keepAlive: number;
  maxMemory: number;
}

const rules = [
  rule(flag("--port", "-p"), isNumberAt("port")),
  rule(flag("--workers", "-w"), isNumberAt("workers")),
  rule(flag("--timeout"), isNumberAt("timeout")),
  rule(flag("--keep-alive"), isNumberAt("keepAlive")),
  rule(flag("--max-memory"), isNumberAt("maxMemory")),
];

// Usage: server --port 8080 --workers 4 --timeout 30000 --keep-alive 5000 --max-memory 512
```

### Build Tool Options

```ts
interface BuildOptions {
  parallelism: number;
  chunkSize: number;
  compressionLevel: number;
  cacheSize: number;
}

const rules = [
  rule(flag("--parallelism"), isNumberAt("parallelism")),
  rule(flag("--chunk-size"), isNumberAt("chunkSize")),
  rule(flag("--compression-level"), isNumberAt("compressionLevel")),
  rule(flag("--cache-size"), isNumberAt("cacheSize")),
];

// Usage: build --parallelism 8 --chunk-size 1024 --compression-level 9 --cache-size 256
```

### Scientific Computing

```ts
interface SimulationOptions {
  iterations: number;
  stepSize: number;
  tolerance: number;
  seed: number;
}

const rules = [
  rule(flag("--iterations", "-i"), isNumberAt("iterations")),
  rule(flag("--step-size"), isNumberAt("stepSize")),
  rule(flag("--tolerance"), isNumberAt("tolerance")),
  rule(flag("--seed"), isNumberAt("seed")),
];

// Usage: simulate -i 10000 --step-size 0.001 --tolerance 1e-8 --seed 42
```

## Working with Defaults

### Providing Default Values

```ts
const options = flags<ServerConfig>(
  process.argv.slice(2),
  {
    port: 3000, // Default port
    workers: 1, // Default workers
    timeout: 30000, // Default timeout
    keepAlive: 5000, // Default keep-alive
  },
  rules,
);

// Usage: server --port 8080
// Result: { port: 8080, workers: 1, timeout: 30000, keepAlive: 5000 }
```

### Environment Variable Fallback

```ts
const options = flags(args, {}, rules);

// Use environment variables as defaults
options.port = options.port ?? parseInt(process.env.PORT || "3000", 10);
options.workers = options.workers ?? parseInt(process.env.WORKERS || "1", 10);
options.timeout =
  options.timeout ?? parseInt(process.env.TIMEOUT || "30000", 10);
```

## Validation and Error Handling

### Range Validation

```ts
const options = flags(args, {}, rules);

// Validate port range
if (options.port && (options.port < 1 || options.port > 65535)) {
  throw new Error(`Port must be between 1 and 65535, got: ${options.port}`);
}

// Validate positive numbers
if (options.workers && options.workers < 1) {
  throw new Error(`Workers must be positive, got: ${options.workers}`);
}

// Validate percentage range
if (
  options.percentage &&
  (options.percentage < 0 || options.percentage > 100)
) {
  throw new Error(
    `Percentage must be between 0 and 100, got: ${options.percentage}`,
  );
}
```

### Custom Validation Handler

```ts
const validatedPortRule = rule(flag("--port", "-p"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) {
    throw new Error("--port requires a numeric value");
  }

  const port = Number(value);
  if (isNaN(port)) {
    throw new Error(`Invalid port number: ${value}`);
  }

  if (port < 1 || port > 65535) {
    throw new Error(`Port must be between 1 and 65535, got: ${port}`);
  }

  ctx.flags.port = port;
});
```

### Helper Functions for Validation

```ts
function validateRange(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}, got: ${value}`);
  }
}

function validatePositive(value: number, name: string): void {
  if (value <= 0) {
    throw new Error(`${name} must be positive, got: ${value}`);
  }
}

// Usage after parsing
const options = flags(args, {}, rules);

if (options.port) validateRange(options.port, 1, 65535, "Port");
if (options.workers) validatePositive(options.workers, "Workers");
if (options.timeout) validatePositive(options.timeout, "Timeout");
```

## Invalid Number Handling

The behavior when invalid numbers are provided depends on JavaScript's `Number()` conversion:

```ts
Number("123"); // 123
Number("123.45"); // 123.45
Number("abc"); // NaN
Number(""); // 0
Number(" 123 "); // 123 (strips whitespace)
Number("123abc"); // NaN
Number("Infinity"); // Infinity
Number("-Infinity"); // -Infinity
```

### Handling NaN Values

```ts
const options = flags(args, {}, rules);

// Check for NaN values
Object.keys(options).forEach((key) => {
  const value = options[key as keyof typeof options];
  if (typeof value === "number" && isNaN(value)) {
    throw new Error(
      `Invalid number for --${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
    );
  }
});
```

## Advanced Patterns

### Unit Conversion

```ts
interface Options {
  memory: number; // Store in bytes
  timeout: number; // Store in milliseconds
  size: number; // Store in bytes
}

const rules = [
  rule(flag("--memory"), (ctx) => {
    const value = ctx.consumeArgument();
    if (!value) return;

    // Support units: 1024, 1K, 1M, 1G
    const match = value.match(/^(\d+(?:\.\d+)?)(K|M|G)?$/i);
    if (!match) {
      throw new Error(`Invalid memory format: ${value}`);
    }

    const num = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase() || "";

    let bytes = num;
    switch (unit) {
      case "k":
        bytes *= 1024;
        break;
      case "m":
        bytes *= 1024 * 1024;
        break;
      case "g":
        bytes *= 1024 * 1024 * 1024;
        break;
    }

    ctx.flags.memory = Math.floor(bytes);
  }),

  rule(flag("--timeout"), (ctx) => {
    const value = ctx.consumeArgument();
    if (!value) return;

    // Support units: 30, 30s, 5m, 2h
    const match = value.match(/^(\d+(?:\.\d+)?)(s|m|h)?$/);
    if (!match) {
      throw new Error(`Invalid timeout format: ${value}`);
    }

    const num = parseFloat(match[1]);
    const unit = match[2] || "s";

    let milliseconds = num * 1000; // default to seconds
    switch (unit) {
      case "m":
        milliseconds = num * 60 * 1000;
        break;
      case "h":
        milliseconds = num * 60 * 60 * 1000;
        break;
    }

    ctx.flags.timeout = Math.floor(milliseconds);
  }),
];

// Usage: --memory 512M --timeout 5m
// Result: { memory: 536870912, timeout: 300000 }
```

### Percentage to Decimal

```ts
const percentageRule = rule(flag("--threshold"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid percentage: ${value}`);
  }

  // Convert percentage to decimal (0-1 range)
  if (num > 1) {
    ctx.flags.threshold = num / 100;
  } else {
    ctx.flags.threshold = num;
  }
});

// Usage: --threshold 85    → { threshold: 0.85 }
// Usage: --threshold 0.85  → { threshold: 0.85 }
```

## Testing Number Flags

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isNumberAt } from "@jondotsoy/flags";

describe("isNumberAt", () => {
  const portRule = rule(flag("--port", "-p"), isNumberAt("port"));

  test("should convert string to number", () => {
    const options = flags(["--port", "3000"], {}, [portRule]);
    expect(options.port).toBe(3000);
    expect(typeof options.port).toBe("number");
  });

  test("should work with decimal numbers", () => {
    const options = flags(["--port", "3000.5"], {}, [portRule]);
    expect(options.port).toBe(3000.5);
  });

  test("should work with negative numbers", () => {
    const options = flags(["--port", "-10"], {}, [portRule]);
    expect(options.port).toBe(-10);
  });

  test("should work with scientific notation", () => {
    const options = flags(["--port", "1e3"], {}, [portRule]);
    expect(options.port).toBe(1000);
  });

  test("should handle zero", () => {
    const options = flags(["--port", "0"], {}, [portRule]);
    expect(options.port).toBe(0);
  });

  test("should work with equals format", () => {
    const options = flags(["--port=8080"], {}, [portRule]);
    expect(options.port).toBe(8080);
  });

  test("should leave property undefined when flag is not present", () => {
    const options = flags([], {}, [portRule]);
    expect(options.port).toBeUndefined();
  });

  test("should work with defaults", () => {
    const options = flags([], { port: 3000 }, [portRule]);
    expect(options.port).toBe(3000);

    const options2 = flags(["--port", "8080"], { port: 3000 }, [portRule]);
    expect(options2.port).toBe(8080);
  });
});
```

### Invalid Number Tests

```ts
describe("isNumberAt invalid values", () => {
  const portRule = rule(flag("--port"), isNumberAt("port"));

  test("should handle invalid numbers", () => {
    const options = flags(["--port", "abc"], {}, [portRule]);
    expect(isNaN(options.port)).toBe(true);
  });

  test("should handle empty string", () => {
    const options = flags(["--port", ""], {}, [portRule]);
    expect(options.port).toBe(0); // Number("") === 0
  });

  test("should handle whitespace", () => {
    const options = flags(["--port", "  123  "], {}, [portRule]);
    expect(options.port).toBe(123);
  });

  test("should handle infinity", () => {
    const options = flags(["--port", "Infinity"], {}, [portRule]);
    expect(options.port).toBe(Infinity);
  });
});
```

### Validation Tests

```ts
describe("number validation", () => {
  const rules = [
    rule(flag("--port"), isNumberAt("port")),
    rule(flag("--workers"), isNumberAt("workers")),
  ];

  test("should validate port range", () => {
    const options = flags(["--port", "70000"], {}, rules);

    expect(() => {
      if (options.port && (options.port < 1 || options.port > 65535)) {
        throw new Error(`Invalid port: ${options.port}`);
      }
    }).toThrow("Invalid port: 70000");
  });

  test("should validate positive numbers", () => {
    const options = flags(["--workers", "-5"], {}, rules);

    expect(() => {
      if (options.workers && options.workers < 1) {
        throw new Error(`Workers must be positive: ${options.workers}`);
      }
    }).toThrow("Workers must be positive: -5");
  });
});
```

## Equivalent Implementation

Understanding how `isNumberAt` works internally:

```ts
// This is equivalent to isNumberAt
const customNumberHandler =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const value = ctx.consumeArgument();
    if (value !== undefined) {
      ctx.flags[propName] = Number(value) as T[keyof T];
    }
  };

// Or using flagHandler
const numberWithFlagHandler = <T>(propName: keyof T): Handler<T> =>
  flagHandler<T>(propName, (value) => Number(value), 0);
```

## Common Mistakes

### ❌ Wrong: No Validation

```ts
const options = flags(["--port", "abc"], {}, rules);
console.log(options.port); // NaN - no error checking
```

### ❌ Wrong: Assuming Integer

```ts
const options = flags(["--port", "3000.7"], {}, rules);
const port = Math.floor(options.port); // Should validate first
```

### ✅ Correct: Proper Validation

```ts
const options = flags(args, {}, rules);

if (options.port !== undefined) {
  if (isNaN(options.port)) {
    throw new Error("Invalid port number");
  }
  if (options.port < 1 || options.port > 65535) {
    throw new Error("Port out of range");
  }
  if (!Number.isInteger(options.port)) {
    throw new Error("Port must be an integer");
  }
}
```

### ❌ Wrong: Type Mismatch

```ts
interface Options {
  port: string; // Wrong: isNumberAt returns numbers
}

// Should be:
interface Options {
  port: number; // Correct: matches isNumberAt return type
}
```

## Performance Considerations

Number conversion is fast, but validation can add overhead:

```ts
// Fast: Direct assignment
const options = flags(args, {}, rules);

// Slower: Multiple validations
validateRange(options.port, 1, 65535);
validatePositive(options.workers);
validateInteger(options.count);

// Better: Validate only when needed
if (options.port) validatePort(options.port);
```

## Related APIs

- [`flag()`](../api_references/flag.md) - Create flag test functions
- [`rule()`](../api_references/rule.md) - Combine flags with handlers
- [`isStringAt()`](./isStringAt.md) - Handle string flags
- [`isBooleanAt()`](./isBooleanAt.md) - Handle boolean flags
- [`isArrayNumberAt()`](./isArrayNumberAt.md) - Handle number arrays
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom number processing

## Real-World Examples

### HTTP Server Configuration

```ts
interface ServerOptions {
  port: number;
  workers: number;
  timeout: number;
  keepAlive: number;
  maxRequestSize: number;
}

const rules = [
  rule(flag("--port", "-p"), isNumberAt("port")),
  rule(flag("--workers", "-w"), isNumberAt("workers")),
  rule(flag("--timeout"), isNumberAt("timeout")),
  rule(flag("--keep-alive"), isNumberAt("keepAlive")),
  rule(flag("--max-request-size"), isNumberAt("maxRequestSize")),
];

// Usage: server --port 8080 --workers 4 --timeout 30000
```

### Database Connection Pool

```ts
interface DatabaseOptions {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryLimit: number;
}

const rules = [
  rule(flag("--max-connections"), isNumberAt("maxConnections")),
  rule(flag("--min-connections"), isNumberAt("minConnections")),
  rule(flag("--connection-timeout"), isNumberAt("connectionTimeout")),
  rule(flag("--idle-timeout"), isNumberAt("idleTimeout")),
  rule(flag("--retry-limit"), isNumberAt("retryLimit")),
];

// Usage: dbpool --max-connections 20 --min-connections 5 --retry-limit 3
```

### Image Processing Tool

```ts
interface ImageOptions {
  width: number;
  height: number;
  quality: number;
  brightness: number;
  contrast: number;
}

const rules = [
  rule(flag("--width", "-w"), isNumberAt("width")),
  rule(flag("--height", "-h"), isNumberAt("height")),
  rule(flag("--quality", "-q"), isNumberAt("quality")),
  rule(flag("--brightness", "-b"), isNumberAt("brightness")),
  rule(flag("--contrast", "-c"), isNumberAt("contrast")),
];

// Usage: imageproc -w 800 -h 600 -q 85 -b 1.2 -c 0.8
```

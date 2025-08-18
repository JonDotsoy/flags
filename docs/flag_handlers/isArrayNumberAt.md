# `isArrayNumberAt()` - Flag Handler

Set a property to an array of numeric values, allowing the same flag to be used multiple times to collect numbers. This handler is perfect for flags like `--port 3000 --port 3001` or `--timeout 30 --timeout 60 --timeout 90`.

## Syntax

```ts
isArrayNumberAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to the number array

## Returns

`Handler<T>` - A handler function that accumulates numeric values into an array

## Basic Usage

### Multiple Flag Usage

```ts
import { rule, flag, isArrayNumberAt } from "@jondotsoy/flags";

interface Options {
  ports: number[];
}

const portsRule = rule(flag("--port", "-p"), isArrayNumberAt("ports"));

// Usage: --port 3000 --port 3001 --port 3002
// Result: { ports: [3000, 3001, 3002] }

// Usage: -p 8080 -p 8081
// Result: { ports: [8080, 8081] }
```

### Multiple Array Flags

```ts
interface ServerOptions {
  ports: number[];
  workers: number[];
  timeouts: number[];
  limits: number[];
}

const rules = [
  rule(flag("--port", "-p"), isArrayNumberAt("ports")),
  rule(flag("--workers", "-w"), isArrayNumberAt("workers")),
  rule(flag("--timeout", "-t"), isArrayNumberAt("timeouts")),
  rule(flag("--limit", "-l"), isArrayNumberAt("limits")),
];

// Usage: server --port 3000 --port 3001 --workers 2 --workers 4 --timeout 30 --limit 100
// Result: { ports: [3000, 3001], workers: [2, 4], timeouts: [30], limits: [100] }
```

## Common Use Cases

### Load Balancer Configuration

```ts
interface LoadBalancerOptions {
  upstreams: number[];
  weights: number[];
  healthCheckPorts: number[];
}

const rules = [
  rule(flag("--upstream", "-u"), isArrayNumberAt("upstreams")),
  rule(flag("--weight", "-w"), isArrayNumberAt("weights")),
  rule(flag("--health-port"), isArrayNumberAt("healthCheckPorts")),
];

// Usage: lb -u 3000 -u 3001 -u 3002 -w 1 -w 2 -w 1 --health-port 9000 --health-port 9001
```

### Performance Configuration

```ts
interface PerfOptions {
  threadCounts: number[];
  memorySizes: number[];
  cacheSizes: number[];
  retryIntervals: number[];
}

const rules = [
  rule(flag("--threads"), isArrayNumberAt("threadCounts")),
  rule(flag("--memory"), isArrayNumberAt("memorySizes")),
  rule(flag("--cache-size"), isArrayNumberAt("cacheSizes")),
  rule(flag("--retry-interval"), isArrayNumberAt("retryIntervals")),
];

// Usage: perf --threads 2 --threads 4 --threads 8 --memory 512 --memory 1024 --cache-size 100
```

### Scientific Computing Parameters

```ts
interface SimulationOptions {
  seeds: number[];
  iterations: number[];
  thresholds: number[];
  temperatures: number[];
}

const rules = [
  rule(flag("--seed", "-s"), isArrayNumberAt("seeds")),
  rule(flag("--iterations", "-i"), isArrayNumberAt("iterations")),
  rule(flag("--threshold"), isArrayNumberAt("thresholds")),
  rule(flag("--temperature", "-T"), isArrayNumberAt("temperatures")),
];

// Usage: simulate -s 42 -s 123 -s 456 -i 1000 -i 5000 --threshold 0.1 --threshold 0.01
```

## Number Types and Formats

### Integer Arrays

```ts
interface Options {
  counts: number[];
  indices: number[];
}

const rules = [
  rule(flag("--count", "-c"), isArrayNumberAt("counts")),
  rule(flag("--index", "-i"), isArrayNumberAt("indices")),
];

// Usage: --count 10 --count 20 --count 30 --index 0 --index 5 --index 10
// Result: { counts: [10, 20, 30], indices: [0, 5, 10] }
```

### Decimal Arrays

```ts
interface Options {
  ratios: number[];
  percentages: number[];
}

const rules = [
  rule(flag("--ratio", "-r"), isArrayNumberAt("ratios")),
  rule(flag("--percentage"), isArrayNumberAt("percentages")),
];

// Usage: --ratio 0.5 --ratio 1.5 --ratio 2.0 --percentage 25.5 --percentage 75.0
// Result: { ratios: [0.5, 1.5, 2.0], percentages: [25.5, 75.0] }
```

### Mixed Positive and Negative Numbers

```ts
interface Options {
  adjustments: number[];
  offsets: number[];
}

const rules = [
  rule(flag("--adjustment", "-a"), isArrayNumberAt("adjustments")),
  rule(flag("--offset", "-o"), isArrayNumberAt("offsets")),
];

// Usage: --adjustment -10 --adjustment 5 --adjustment -2.5 --offset -100 --offset 50
// Result: { adjustments: [-10, 5, -2.5], offsets: [-100, 50] }
```

### Scientific Notation

```ts
interface Options {
  precisions: number[];
  scales: number[];
}

const rules = [
  rule(flag("--precision"), isArrayNumberAt("precisions")),
  rule(flag("--scale"), isArrayNumberAt("scales")),
];

// Usage: --precision 1e-6 --precision 1e-9 --scale 2.5e3 --scale 1.2e6
// Result: { precisions: [0.000001, 1e-9], scales: [2500, 1200000] }
```

## Array Accumulation Behavior

### Order Preservation

```ts
const portsRule = rule(flag("--port"), isArrayNumberAt("ports"));

// The order of flags is preserved in the array
// --port 8080 --port 3000 --port 5000
// Result: { ports: [8080, 3000, 5000] }
```

### Multiple Occurrences

```ts
// Each flag occurrence adds to the array
// --timeout 30 --timeout 60 --timeout 90
// Result: { timeouts: [30, 60, 90] }
```

### Empty Arrays

```ts
// When no flags are provided, the property remains undefined
const options = flags([], {}, [portsRule]);
console.log(options.ports); // undefined

// With defaults, you can initialize as empty array
const options2 = flags([], { ports: [] }, [portsRule]);
console.log(options2.ports); // []
```

## Working with Defaults

### Empty Array Default

```ts
const options = flags<ServerOptions>(
  process.argv.slice(2),
  {
    ports: [], // Start with empty array
    workers: [], // Start with empty array
    timeouts: [30000], // Default timeout value
    limits: [100, 200], // Multiple default values
  },
  rules,
);

// Usage: server --port 3000
// Result: { ports: [3000], workers: [], timeouts: [30000], limits: [100, 200] }
```

### Conditional Defaults

```ts
const options = flags(args, {}, rules);

// Ensure arrays are initialized
options.ports = options.ports || [];
options.workers = options.workers || [1]; // Default to single worker
options.timeouts = options.timeouts || [30000]; // Default timeout
```

## Validation and Error Handling

### Range Validation

```ts
const options = flags(args, {}, rules);

// Validate port ranges
if (options.ports) {
  options.ports.forEach((port, index) => {
    if (port < 1 || port > 65535) {
      throw new Error(
        `Port at index ${index} must be between 1 and 65535, got: ${port}`,
      );
    }
  });
}

// Validate positive numbers
if (options.workers) {
  options.workers.forEach((workers, index) => {
    if (workers < 1) {
      throw new Error(
        `Workers at index ${index} must be positive, got: ${workers}`,
      );
    }
  });
}
```

### Custom Validation Handler

```ts
const validatedPortsRule = rule(flag("--port", "-p"), (ctx) => {
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

  // Initialize array if needed
  if (!ctx.flags.ports) {
    ctx.flags.ports = [];
  }

  ctx.flags.ports.push(port);
});
```

### Array-Level Validation

```ts
const options = flags(args, {}, rules);

// Validate array constraints
if (options.ports) {
  if (options.ports.length === 0) {
    throw new Error("At least one port must be specified");
  }

  if (options.ports.length > 10) {
    throw new Error("Too many ports specified (maximum 10)");
  }

  // Check for duplicates
  const uniquePorts = new Set(options.ports);
  if (uniquePorts.size !== options.ports.length) {
    throw new Error("Duplicate ports are not allowed");
  }
}

// Validate parallel arrays have same length
if (options.ports && options.weights) {
  if (options.ports.length !== options.weights.length) {
    throw new Error("Number of ports and weights must match");
  }
}
```

## Advanced Patterns

### Deduplicated Number Arrays

```ts
const uniquePortsRule = rule(flag("--port", "-p"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  const port = Number(value);
  if (isNaN(port)) {
    throw new Error(`Invalid port: ${value}`);
  }

  // Initialize array if needed
  if (!ctx.flags.ports) {
    ctx.flags.ports = [];
  }

  // Add only if not already present
  if (!ctx.flags.ports.includes(port)) {
    ctx.flags.ports.push(port);
  }
});

// Usage: --port 3000 --port 3001 --port 3000
// Result: { ports: [3000, 3001] } (no duplicates)
```

### Sorted Number Arrays

```ts
const sortedRule = rule(flag("--threshold"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }

  // Initialize array if needed
  if (!ctx.flags.thresholds) {
    ctx.flags.thresholds = [];
  }

  // Insert in sorted order
  const pos = ctx.flags.thresholds.findIndex((x) => x > num);
  if (pos === -1) {
    ctx.flags.thresholds.push(num);
  } else {
    ctx.flags.thresholds.splice(pos, 0, num);
  }
});

// Usage: --threshold 0.5 --threshold 0.1 --threshold 0.9
// Result: { thresholds: [0.1, 0.5, 0.9] } (automatically sorted)
```

### Range-Based Arrays

```ts
const rangeRule = rule(flag("--range"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  // Support ranges like "1-10" or "start-end"
  const rangeMatch = value.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid range: ${value}`);
    }

    if (!ctx.flags.values) {
      ctx.flags.values = [];
    }

    // Add range as [start, end]
    ctx.flags.values.push(start, end);
  } else {
    // Single number
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid number or range: ${value}`);
    }

    if (!ctx.flags.values) {
      ctx.flags.values = [];
    }

    ctx.flags.values.push(num);
  }
});

// Usage: --range 1-10 --range 15 --range 20-30
// Result: { values: [1, 10, 15, 20, 30] }
```

## Array Processing Patterns

### Post-Processing Arrays

```ts
const options = flags(args, {}, rules);

// Remove duplicates
if (options.ports) {
  options.ports = [...new Set(options.ports)];
}

// Sort arrays
if (options.thresholds) {
  options.thresholds = options.thresholds.sort((a, b) => a - b);
}

// Apply transformations
if (options.percentages) {
  // Convert percentages to decimals
  options.percentages = options.percentages.map((p) => p / 100);
}

// Filter valid values
if (options.ports) {
  options.ports = options.ports.filter((port) => port >= 1 && port <= 65535);
}
```

### Statistical Operations

```ts
const options = flags(args, {}, rules);

if (options.values && options.values.length > 0) {
  // Calculate statistics
  const sum = options.values.reduce((a, b) => a + b, 0);
  const avg = sum / options.values.length;
  const min = Math.min(...options.values);
  const max = Math.max(...options.values);
  const median = options.values.sort((a, b) => a - b)[
    Math.floor(options.values.length / 2)
  ];

  console.log(`Stats: avg=${avg}, min=${min}, max=${max}, median=${median}`);
}
```

### Array Validation Helpers

```ts
function validateNumberArray(
  arr: number[] | undefined,
  name: string,
  options: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    allowDuplicates?: boolean;
  } = {},
): void {
  if (!arr) return;

  // Length validation
  if (options.minLength && arr.length < options.minLength) {
    throw new Error(`${name} must have at least ${options.minLength} values`);
  }

  if (options.maxLength && arr.length > options.maxLength) {
    throw new Error(`${name} must have at most ${options.maxLength} values`);
  }

  // Duplicate validation
  if (!options.allowDuplicates) {
    const unique = new Set(arr);
    if (unique.size !== arr.length) {
      throw new Error(`${name} cannot contain duplicates`);
    }
  }

  // Range validation
  arr.forEach((value, index) => {
    if (typeof options.min === "number" && value < options.min) {
      throw new Error(
        `${name}[${index}] must be >= ${options.min}, got: ${value}`,
      );
    }

    if (typeof options.max === "number" && value > options.max) {
      throw new Error(
        `${name}[${index}] must be <= ${options.max}, got: ${value}`,
      );
    }
  });
}

// Usage
const options = flags(args, {}, rules);
validateNumberArray(options.ports, "Ports", {
  min: 1,
  max: 65535,
  allowDuplicates: false,
});
validateNumberArray(options.workers, "Workers", {
  min: 1,
  minLength: 1,
  maxLength: 16,
});
```

## Testing Number Array Flags

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isArrayNumberAt } from "@jondotsoy/flags";

describe("isArrayNumberAt", () => {
  const portsRule = rule(flag("--port", "-p"), isArrayNumberAt("ports"));

  test("should create array from single flag", () => {
    const options = flags(["--port", "3000"], {}, [portsRule]);
    expect(options.ports).toEqual([3000]);
    expect(typeof options.ports[0]).toBe("number");
  });

  test("should accumulate multiple flags", () => {
    const options = flags(
      ["--port", "3000", "--port", "3001", "--port", "3002"],
      {},
      [portsRule],
    );

    expect(options.ports).toEqual([3000, 3001, 3002]);
  });

  test("should work with decimal numbers", () => {
    const options = flags(["--port", "3000.5", "--port", "3001.7"], {}, [
      portsRule,
    ]);

    expect(options.ports).toEqual([3000.5, 3001.7]);
  });

  test("should work with negative numbers", () => {
    const options = flags(["--port", "-10", "--port", "20"], {}, [portsRule]);

    expect(options.ports).toEqual([-10, 20]);
  });

  test("should work with scientific notation", () => {
    const options = flags(["--port", "1e3", "--port", "2.5e2"], {}, [
      portsRule,
    ]);

    expect(options.ports).toEqual([1000, 250]);
  });

  test("should preserve order", () => {
    const options = flags(
      ["--port", "8080", "--port", "3000", "--port", "5000"],
      {},
      [portsRule],
    );

    expect(options.ports).toEqual([8080, 3000, 5000]);
  });

  test("should work with short flags", () => {
    const options = flags(["-p", "8080", "-p", "8081"], {}, [portsRule]);

    expect(options.ports).toEqual([8080, 8081]);
  });

  test("should handle mixed short and long flags", () => {
    const options = flags(
      ["--port", "8080", "-p", "8081", "--port", "8082"],
      {},
      [portsRule],
    );

    expect(options.ports).toEqual([8080, 8081, 8082]);
  });

  test("should leave property undefined when no flags present", () => {
    const options = flags([], {}, [portsRule]);
    expect(options.ports).toBeUndefined();
  });

  test("should work with defaults", () => {
    const options = flags([], { ports: [3000] }, [portsRule]);
    expect(options.ports).toEqual([3000]);

    const options2 = flags(["--port", "8080"], { ports: [3000] }, [portsRule]);
    expect(options2.ports).toEqual([3000, 8080]);
  });

  test("should handle zero values", () => {
    const options = flags(["--port", "0", "--port", "8080"], {}, [portsRule]);

    expect(options.ports).toEqual([0, 8080]);
  });
});
```

### Invalid Number Tests

```ts
describe("isArrayNumberAt invalid values", () => {
  const portsRule = rule(flag("--port"), isArrayNumberAt("ports"));

  test("should handle invalid numbers as NaN", () => {
    const options = flags(
      ["--port", "3000", "--port", "abc", "--port", "8080"],
      {},
      [portsRule],
    );

    expect(options.ports).toHaveLength(3);
    expect(options.ports[0]).toBe(3000);
    expect(isNaN(options.ports[1])).toBe(true);
    expect(options.ports[2]).toBe(8080);
  });

  test("should handle empty string as 0", () => {
    const options = flags(
      ["--port", "3000", "--port", "", "--port", "8080"],
      {},
      [portsRule],
    );

    expect(options.ports).toEqual([3000, 0, 8080]);
  });

  test("should handle infinity values", () => {
    const options = flags(["--port", "Infinity", "--port", "-Infinity"], {}, [
      portsRule,
    ]);

    expect(options.ports).toEqual([Infinity, -Infinity]);
  });
});
```

### Multiple Array Flags Tests

```ts
describe("multiple number array flags", () => {
  const rules = [
    rule(flag("--port", "-p"), isArrayNumberAt("ports")),
    rule(flag("--worker", "-w"), isArrayNumberAt("workers")),
    rule(flag("--timeout", "-t"), isArrayNumberAt("timeouts")),
  ];

  test("should handle multiple different array flags", () => {
    const options = flags(
      [
        "--port",
        "3000",
        "--worker",
        "2",
        "--port",
        "3001",
        "--timeout",
        "30000",
        "--worker",
        "4",
        "--timeout",
        "60000",
      ],
      {},
      rules,
    );

    expect(options.ports).toEqual([3000, 3001]);
    expect(options.workers).toEqual([2, 4]);
    expect(options.timeouts).toEqual([30000, 60000]);
  });

  test("should handle partial flag usage", () => {
    const options = flags(["--port", "3000", "--worker", "4"], {}, rules);

    expect(options.ports).toEqual([3000]);
    expect(options.workers).toEqual([4]);
    expect(options.timeouts).toBeUndefined();
  });
});
```

## Equivalent Implementation

Understanding how `isArrayNumberAt` works internally:

```ts
// This is equivalent to isArrayNumberAt
const customArrayNumberHandler =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const value = ctx.consumeArgument();
    if (value !== undefined) {
      const num = Number(value);

      // Initialize array if it doesn't exist
      if (!ctx.flags[propName]) {
        ctx.flags[propName] = [] as T[keyof T];
      }

      // Add number to array
      (ctx.flags[propName] as number[]).push(num);
    }
  };

// Or using flagHandler with custom processing
const arrayNumberWithFlagHandler = <T>(propName: keyof T): Handler<T> =>
  flagHandler<T>(
    propName,
    (value, current) => {
      const array = (current || []) as number[];
      return [...array, Number(value)] as T[keyof T];
    },
    [] as number[],
  );
```

## Common Mistakes

### ❌ Wrong: Not Handling NaN Values

```ts
const options = flags(["--port", "abc"], {}, [portsRule]);
const port = options.ports[0]; // NaN - no validation!
console.log(port + 1); // NaN
```

### ❌ Wrong: Not Handling Undefined Arrays

```ts
const options = flags([], {}, [portsRule]);
options.ports.forEach((port) => console.log(port)); // TypeError: Cannot read property 'forEach' of undefined
```

### ✅ Correct: Proper Array and NaN Handling

```ts
const options = flags(args, {}, rules);

// Check for array existence and NaN values
if (options.ports) {
  const validPorts = options.ports.filter(
    (port) => !isNaN(port) && isFinite(port),
  );

  if (validPorts.length !== options.ports.length) {
    console.warn("Some invalid port numbers were ignored");
  }

  validPorts.forEach((port) => {
    console.log(`Starting server on port ${port}`);
  });
}

// Or use defaults
const ports = options.ports ?? [3000];
const validPorts = ports.filter((port) => !isNaN(port) && port > 0);
```

### ❌ Wrong: Mutating Default Arrays

```ts
const defaultOptions = { ports: [3000] };
const options = flags(args, defaultOptions, rules);
options.ports.push(8080); // This mutates defaultOptions.ports!
```

### ✅ Correct: Safe Array Handling

```ts
const defaultOptions = { ports: [3000] };
const options = flags(
  args,
  {
    ...defaultOptions,
    ports: [...defaultOptions.ports],
  },
  rules,
);

// Now safe to mutate
options.ports.push(8080);
```

## Performance Considerations

For arrays with many numbers:

```ts
// Efficient for most use cases
const options = flags(args, {}, rules);

// For large arrays, consider validation strategies
if (options.values && options.values.length > 1000) {
  // Validate in chunks or use streaming validation
  console.warn(`Processing large array with ${options.values.length} values`);
}

// For frequent numeric operations, consider typed arrays
if (options.measurements) {
  const typedArray = new Float64Array(options.measurements);
  // Fast numeric operations on typedArray
}
```

## Related APIs

- [`flag()`](../api_references/flag.md) - Create flag test functions
- [`rule()`](../api_references/rule.md) - Combine flags with handlers
- [`isNumberAt()`](./isNumberAt.md) - Handle single numeric values
- [`isArrayStringAt()`](./isArrayStringAt.md) - Handle string arrays
- [`isBooleanAt()`](./isBooleanAt.md) - Handle boolean flags
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom number array processing

## Real-World Examples

### Multi-Port Server

```ts
interface ServerOptions {
  httpPorts: number[];
  httpsPorts: number[];
  workers: number[];
  timeouts: number[];
}

const rules = [
  rule(flag("--http-port"), isArrayNumberAt("httpPorts")),
  rule(flag("--https-port"), isArrayNumberAt("httpsPorts")),
  rule(flag("--workers", "-w"), isArrayNumberAt("workers")),
  rule(flag("--timeout", "-t"), isArrayNumberAt("timeouts")),
];

// Usage: server --http-port 8080 --http-port 8081 --https-port 8443 --workers 2 --workers 4
```

### Database Sharding Configuration

```ts
interface ShardOptions {
  shardIds: number[];
  replicas: number[];
  weights: number[];
  priorities: number[];
}

const rules = [
  rule(flag("--shard-id"), isArrayNumberAt("shardIds")),
  rule(flag("--replicas"), isArrayNumberAt("replicas")),
  rule(flag("--weight", "-w"), isArrayNumberAt("weights")),
  rule(flag("--priority", "-p"), isArrayNumberAt("priorities")),
];

// Usage: dbshard --shard-id 1 --shard-id 2 --replicas 3 --replicas 5 --weight 100 --weight 200
```

### Machine Learning Hyperparameters

```ts
interface MLOptions {
  learningRates: number[];
  batchSizes: number[];
  hiddenLayers: number[];
  dropoutRates: number[];
}

const rules = [
  rule(flag("--learning-rate", "-lr"), isArrayNumberAt("learningRates")),
  rule(flag("--batch-size", "-bs"), isArrayNumberAt("batchSizes")),
  rule(flag("--hidden", "-h"), isArrayNumberAt("hiddenLayers")),
  rule(flag("--dropout", "-d"), isArrayNumberAt("dropoutRates")),
];

// Usage: train -lr 0.001 -lr 0.01 -bs 32 -bs 64 -h 128 -h 256 -d 0.1 -d 0.2
```

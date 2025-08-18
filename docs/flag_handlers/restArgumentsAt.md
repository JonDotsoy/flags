# `restArgumentsAt()` - Flag Handler

Capture all remaining positional arguments into an array. This handler is typically used as the last rule to collect any additional arguments that weren't matched by other flags or specific argument rules.

## Syntax

```ts
restArgumentsAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to the array of remaining arguments

## Returns

`Handler<T>` - A handler function that captures all remaining unmatched arguments

## Basic Usage

### Simple Rest Arguments

```ts
import { rule, restArgumentsAt } from "@jondotsoy/flags";

interface Options {
  files: string[];
}

const restRule = rule(
  () => true, // Always matches (or use a specific test)
  restArgumentsAt("files"),
);

// Usage: myapp file1.txt file2.txt file3.txt
// Result: { files: ["file1.txt", "file2.txt", "file3.txt"] }
```

### Combined with Other Flags

```ts
interface Options {
  verbose: boolean;
  output: string;
  files: string[];
}

const rules = [
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(() => true, restArgumentsAt("files")), // Captures remaining args
];

// Usage: myapp --verbose --output result.txt file1.js file2.js file3.js
// Result: { verbose: true, output: "result.txt", files: ["file1.js", "file2.js", "file3.js"] }
```

## Common Use Cases

### File Processing Tools

```ts
interface ProcessorOptions {
  format: string;
  quality: number;
  verbose: boolean;
  inputFiles: string[];
}

const rules = [
  rule(flag("--format", "-f"), isStringAt("format")),
  rule(flag("--quality", "-q"), isNumberAt("quality")),
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(() => true, restArgumentsAt("inputFiles")),
];

// Usage: imageproc --format jpeg --quality 85 photo1.png photo2.png photo3.png
// Result: { format: "jpeg", quality: 85, inputFiles: ["photo1.png", "photo2.png", "photo3.png"] }
```

### Compiler-like Tools

```ts
interface CompilerOptions {
  output: string;
  optimize: boolean;
  target: string;
  sourceFiles: string[];
}

const rules = [
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(flag("--optimize", "-O"), isBooleanAt("optimize")),
  rule(flag("--target", "-t"), isStringAt("target")),
  rule(() => true, restArgumentsAt("sourceFiles")),
];

// Usage: compiler --output bundle.js --optimize src/main.ts src/utils.ts src/types.ts
// Result: { output: "bundle.js", optimize: true, sourceFiles: ["src/main.ts", "src/utils.ts", "src/types.ts"] }
```

### Package Managers

```ts
interface InstallOptions {
  save: boolean;
  saveDev: boolean;
  global: boolean;
  packages: string[];
}

const rules = [
  rule(flag("--save", "-S"), isBooleanAt("save")),
  rule(flag("--save-dev", "-D"), isBooleanAt("saveDev")),
  rule(flag("--global", "-g"), isBooleanAt("global")),
  rule(() => true, restArgumentsAt("packages")),
];

// Usage: npm install --save react lodash express
// Result: { save: true, packages: ["react", "lodash", "express"] }
```

### Command Execution

```ts
interface ExecOptions {
  shell: string;
  env: string[];
  cwd: string;
  command: string[];
}

const rules = [
  rule(flag("--shell"), isStringAt("shell")),
  rule(flag("--env", "-e"), isArrayStringAt("env")),
  rule(flag("--cwd"), isStringAt("cwd")),
  rule(() => true, restArgumentsAt("command")),
];

// Usage: exec --shell bash --cwd /tmp node server.js --port 3000
// Result: { shell: "bash", cwd: "/tmp", command: ["node", "server.js", "--port", "3000"] }
```

## Positioning and Order

### Rest Arguments Must Come Last

The rest arguments rule should typically be the last rule in your rules array:

```ts
const rules = [
  // Specific flags first
  rule(flag("--verbose"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),

  // Rest arguments last
  rule(() => true, restArgumentsAt("files")),
];

// This ensures flags are processed before capturing remaining arguments
```

### Multiple Rest Rules (Advanced)

You can have multiple rest argument rules with different conditions:

```ts
interface Options {
  inputs: string[];
  outputs: string[];
}

const rules = [
  rule(flag("--verbose"), isBooleanAt("verbose")),

  // Capture .js files as inputs
  rule(
    (arg) => arg.endsWith(".js"),
    (ctx) => {
      const arg = ctx.consumeArgument();
      if (arg) {
        if (!ctx.flags.inputs) ctx.flags.inputs = [];
        ctx.flags.inputs.push(arg);
      }
    },
  ),

  // Capture .out files as outputs
  rule(
    (arg) => arg.endsWith(".out"),
    (ctx) => {
      const arg = ctx.consumeArgument();
      if (arg) {
        if (!ctx.flags.outputs) ctx.flags.outputs = [];
        ctx.flags.outputs.push(arg);
      }
    },
  ),

  // Catch any remaining arguments
  rule(() => true, restArgumentsAt("others")),
];

// Usage: myapp main.js utils.js result.out temp.out config.json
// Result: {
//   inputs: ["main.js", "utils.js"],
//   outputs: ["result.out", "temp.out"],
//   others: ["config.json"]
// }
```

## Test Functions for Rest Arguments

### Always Match (Most Common)

```ts
rule(() => true, restArgumentsAt("args"));
// Captures all remaining arguments
```

### Conditional Matching

```ts
// Only capture non-flag arguments (don't start with -)
rule((arg) => !arg.startsWith("-"), restArgumentsAt("files"));

// Only capture specific file extensions
rule((arg) => /\.(js|ts|jsx|tsx)$/.test(arg), restArgumentsAt("sourceFiles"));

// Only capture after a certain point
let captureMode = false;
rule((arg) => {
  if (arg === "--") {
    captureMode = true;
    return false; // Don't capture the '--' itself
  }
  return captureMode;
}, restArgumentsAt("rawArgs"));

// Usage: myapp --verbose file1.js -- --some --raw --args
// Result: { verbose: true, rawArgs: ["--some", "--raw", "--args"] }
```

## Working with Subcommands

### After Command Selection

```ts
interface GitOptions {
  command: string;
  args: string[];
}

const rules = [
  // First positional argument as command
  rule(
    (arg, context) => context.consumedArgs === 0,
    (ctx) => {
      const command = ctx.consumeArgument();
      if (command) {
        ctx.flags.command = command;
      }
    },
  ),

  // Rest as command arguments
  rule(() => true, restArgumentsAt("args")),
];

// Usage: git commit -m "message" --amend
// Result: { command: "commit", args: ["-m", "message", "--amend"] }
```

### Complex Command Structure

```ts
interface DockerOptions {
  globalFlags: string[];
  command: string;
  commandArgs: string[];
}

let commandFound = false;

const rules = [
  // Global flags (before command)
  rule(
    (arg) => !commandFound && arg.startsWith("-"),
    (ctx) => {
      const arg = ctx.consumeArgument();
      if (arg) {
        if (!ctx.flags.globalFlags) ctx.flags.globalFlags = [];
        ctx.flags.globalFlags.push(arg);
      }
    },
  ),

  // Command identification
  rule(
    (arg) => !commandFound && !arg.startsWith("-"),
    (ctx) => {
      const command = ctx.consumeArgument();
      if (command) {
        ctx.flags.command = command;
        commandFound = true;
      }
    },
  ),

  // Command arguments (after command)
  rule(() => commandFound, restArgumentsAt("commandArgs")),
];

// Usage: docker --host tcp://localhost:2376 run -it ubuntu bash
// Result: {
//   globalFlags: ["--host", "tcp://localhost:2376"],
//   command: "run",
//   commandArgs: ["-it", "ubuntu", "bash"]
// }
```

## Advanced Patterns

### Argument Validation

```ts
const validatedRestRule = rule(
  () => true,
  (ctx) => {
    const args: string[] = [];

    // Consume all remaining arguments
    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      // Validate each argument
      if (arg.trim() === "") {
        console.warn("Skipping empty argument");
        continue;
      }

      // Example: validate file extensions
      if (!arg.match(/\.(js|ts|json)$/)) {
        throw new Error(`Unsupported file type: ${arg}`);
      }

      args.push(arg);
    }

    ctx.flags.files = args;
  },
);
```

### Path Resolution

```ts
import path from "path";

const resolvedRestRule = rule(
  () => true,
  (ctx) => {
    const files: string[] = [];

    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      // Resolve to absolute paths
      const resolved = path.resolve(arg);
      files.push(resolved);
    }

    ctx.flags.files = files;
  },
);

// Usage: myapp ../file1.txt ./file2.txt file3.txt
// Result: { files: ["/parent/file1.txt", "/current/file2.txt", "/current/file3.txt"] }
```

### Glob Pattern Expansion

```ts
import glob from "glob";

const globRestRule = rule(
  () => true,
  (ctx) => {
    const patterns: string[] = [];

    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      patterns.push(arg);
    }

    // Expand all glob patterns
    const files = patterns.flatMap((pattern) => {
      if (pattern.includes("*") || pattern.includes("?")) {
        return glob.sync(pattern);
      }
      return [pattern];
    });

    ctx.flags.files = files;
  },
);

// Usage: myapp src/*.js test/**/*.spec.js
// Result: { files: ["src/main.js", "src/utils.js", "test/unit/app.spec.js", ...] }
```

## Testing Rest Arguments

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, restArgumentsAt } from "@jondotsoy/flags";

describe("restArgumentsAt", () => {
  const restRule = rule(() => true, restArgumentsAt("args"));

  test("should capture all arguments when no flags present", () => {
    const options = flags(["file1.txt", "file2.txt", "file3.txt"], {}, [
      restRule,
    ]);
    expect(options.args).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });

  test("should capture remaining arguments after flags", () => {
    const rules = [
      rule(flag("--verbose"), isBooleanAt("verbose")),
      rule(() => true, restArgumentsAt("files")),
    ];

    const options = flags(["--verbose", "file1.txt", "file2.txt"], {}, rules);

    expect(options.verbose).toBe(true);
    expect(options.files).toEqual(["file1.txt", "file2.txt"]);
  });

  test("should handle empty argument list", () => {
    const options = flags([], {}, [restRule]);
    expect(options.args).toEqual([]);
  });

  test("should preserve argument order", () => {
    const options = flags(["third", "first", "second"], {}, [restRule]);
    expect(options.args).toEqual(["third", "first", "second"]);
  });

  test("should handle arguments with spaces", () => {
    const options = flags(["file with spaces.txt", "another file.txt"], {}, [
      restRule,
    ]);
    expect(options.args).toEqual(["file with spaces.txt", "another file.txt"]);
  });

  test("should work with defaults", () => {
    const options = flags([], { args: ["default.txt"] }, [restRule]);
    expect(options.args).toEqual(["default.txt" /* no additional args */]);
  });
});
```

### Integration Tests

```ts
describe("restArgumentsAt integration", () => {
  const rules = [
    rule(flag("--output", "-o"), isStringAt("output")),
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--format", "-f"), isStringAt("format")),
    rule(() => true, restArgumentsAt("inputs")),
  ];

  test("should handle mixed flags and arguments", () => {
    const options = flags(
      [
        "--verbose",
        "--output",
        "result.txt",
        "input1.txt",
        "input2.txt",
        "--format",
        "json",
        "input3.txt",
      ],
      {},
      rules,
    );

    expect(options.verbose).toBe(true);
    expect(options.output).toBe("result.txt");
    expect(options.format).toBe("json");
    expect(options.inputs).toEqual(["input1.txt", "input2.txt", "input3.txt"]);
  });

  test("should handle flags interspersed with arguments", () => {
    const options = flags(
      [
        "file1.txt",
        "--verbose",
        "file2.txt",
        "--output",
        "out.txt",
        "file3.txt",
      ],
      {},
      rules,
    );

    expect(options.verbose).toBe(true);
    expect(options.output).toBe("out.txt");
    expect(options.inputs).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });

  test("should handle only flags, no rest arguments", () => {
    const options = flags(
      ["--verbose", "--output", "result.txt", "--format", "json"],
      {},
      rules,
    );

    expect(options.verbose).toBe(true);
    expect(options.output).toBe("result.txt");
    expect(options.format).toBe("json");
    expect(options.inputs).toEqual([]);
  });
});
```

### Conditional Rest Tests

```ts
describe("conditional rest arguments", () => {
  test("should only capture non-flag arguments", () => {
    const nonFlagRule = rule(
      (arg) => !arg.startsWith("-"),
      restArgumentsAt("files"),
    );

    const options = flags(
      ["file1.txt", "--unknown-flag", "file2.txt", "-x", "file3.txt"],
      {},
      [nonFlagRule],
    );

    // Only non-flag arguments are captured
    expect(options.files).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });

  test("should capture arguments after separator", () => {
    let captureMode = false;

    const separatorRule = rule((arg) => {
      if (arg === "--") {
        captureMode = true;
        return false; // Don't capture the separator itself
      }
      return captureMode;
    }, restArgumentsAt("rawArgs"));

    const rules = [
      rule(flag("--verbose"), isBooleanAt("verbose")),
      separatorRule,
    ];

    const options = flags(
      [
        "--verbose",
        "normal-arg",
        "--",
        "--raw-flag",
        "--another-raw-flag",
        "raw-arg",
      ],
      {},
      rules,
    );

    expect(options.verbose).toBe(true);
    expect(options.rawArgs).toEqual([
      "--raw-flag",
      "--another-raw-flag",
      "raw-arg",
    ]);
  });
});
```

## Equivalent Implementation

Understanding how `restArgumentsAt` works internally:

```ts
// This is equivalent to restArgumentsAt
const customRestHandler =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const args: string[] = [];

    // Consume all remaining arguments
    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      args.push(arg);
    }

    ctx.flags[propName] = args as T[keyof T];
  };

// Alternative with explicit array initialization
const restHandlerWithInit =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    // Initialize array
    if (!ctx.flags[propName]) {
      ctx.flags[propName] = [] as T[keyof T];
    }

    // Consume all remaining arguments
    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      (ctx.flags[propName] as string[]).push(arg);
    }
  };
```

## Common Mistakes

### ❌ Wrong: Rest Rule Not Last

```ts
const rules = [
  rule(() => true, restArgumentsAt("files")), // This captures everything!
  rule(flag("--verbose"), isBooleanAt("verbose")), // This will never run
];
```

### ❌ Wrong: Multiple Unconditional Rest Rules

```ts
const rules = [
  rule(() => true, restArgumentsAt("files")),
  rule(() => true, restArgumentsAt("others")), // This will never capture anything
];
```

### ✅ Correct: Proper Rule Ordering

```ts
const rules = [
  // Specific rules first
  rule(flag("--verbose"), isBooleanAt("verbose")),
  rule(flag("--output", "-o"), isStringAt("output")),

  // Rest rule last
  rule(() => true, restArgumentsAt("files")),
];
```

### ❌ Wrong: Not Handling Empty Arrays

```ts
const options = flags(["--verbose"], {}, rules);
if (options.files.length > 0) {
  // TypeError if files is undefined
  // process files
}
```

### ✅ Correct: Safe Array Handling

```ts
const options = flags(args, {}, rules);

// Always check for existence
if (options.files && options.files.length > 0) {
  options.files.forEach((file) => processFile(file));
}

// Or provide defaults
const options2 = flags(args, { files: [] }, rules);
// Now files is always an array
```

## Performance Considerations

Rest arguments are efficient since they directly consume remaining arguments:

```ts
// Fast: Direct consumption
rule(() => true, restArgumentsAt("args"));

// Slower: Validation on each argument
rule(
  () => true,
  (ctx) => {
    const args: string[] = [];
    let arg;
    while ((arg = ctx.consumeArgument()) !== undefined) {
      // Expensive validation on each argument
      if (isValidFile(arg)) {
        args.push(arg);
      }
    }
    ctx.flags.files = args;
  },
);

// Better: Validate after collection
rule(() => true, restArgumentsAt("files"));
// Then validate the entire array at once
```

## Related APIs

- [`rule()`](../api_references/rule.md) - Combine test functions with handlers
- [`argument()`](../api_references/argument.md) - Handle specific positional arguments
- [`command()`](../api_references/command.md) - Handle subcommands
- [`flag()`](../api_references/flag.md) - Handle named flags
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom argument processing

## Real-World Examples

### File Processor

```ts
interface ProcessorOptions {
  recursive: boolean;
  pattern: string;
  output: string;
  inputFiles: string[];
}

const rules = [
  rule(flag("--recursive", "-r"), isBooleanAt("recursive")),
  rule(flag("--pattern", "-p"), isStringAt("pattern")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(() => true, restArgumentsAt("inputFiles")),
];

// Usage: processor --recursive --pattern "*.js" --output dist/ src/ lib/ test/
```

### Bundle Tool

```ts
interface BundlerOptions {
  minify: boolean;
  sourcemap: boolean;
  format: string;
  output: string;
  entries: string[];
}

const rules = [
  rule(flag("--minify"), isBooleanAt("minify")),
  rule(flag("--sourcemap"), isBooleanAt("sourcemap")),
  rule(flag("--format", "-f"), isStringAt("format")),
  rule(flag("--output", "-o"), isStringAt("output")),
  rule(() => true, restArgumentsAt("entries")),
];

// Usage: bundle --minify --sourcemap --format esm --output dist/bundle.js src/main.js src/utils.js
```

### Test Runner

```ts
interface TestOptions {
  watch: boolean;
  coverage: boolean;
  reporter: string;
  testPatterns: string[];
}

const rules = [
  rule(flag("--watch", "-w"), isBooleanAt("watch")),
  rule(flag("--coverage", "-c"), isBooleanAt("coverage")),
  rule(flag("--reporter", "-r"), isStringAt("reporter")),
  rule(() => true, restArgumentsAt("testPatterns")),
];

// Usage: test --watch --coverage --reporter json test/**/*.spec.js test/**/*.test.js
```

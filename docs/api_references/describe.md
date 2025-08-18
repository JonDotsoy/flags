# `describe()` - Test Function Decorator

Add metadata (description, category, names) to test functions for help generation and documentation purposes. This function decorates existing test functions without changing their behavior.

## Syntax

```ts
describe<T>(test: Test<T>, ...specs: Spec[]): Test<T>
```

## Parameters

- `test: Test<T>` - The test function to decorate
- `...specs: Spec[]` - Metadata objects containing description, category, or names

## Returns

`Test<T>` - The original test function with added metadata

## Spec Interface

```ts
interface Spec {
  names?: string[]; // Alternative names for help display
  category?: string; // Category for grouping in help
  description?: string; // Description text for help
}
```

## Basic Usage

### Adding Descriptions

```ts
import { rule, flag, describe, isBooleanAt } from "@jondotsoy/flags";

const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose output with detailed logs",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--output", "-o"), {
      description: "Specify output file path",
    }),
    isStringAt("output"),
  ),
];
```

### Categorizing Options

```ts
const rules = [
  // Input/Output category
  rule(
    describe(flag("--input", "-i"), {
      category: "Input/Output",
      description: "Input file path",
    }),
    isStringAt("input"),
  ),

  rule(
    describe(flag("--output", "-o"), {
      category: "Input/Output",
      description: "Output file path",
    }),
    isStringAt("output"),
  ),

  // Behavior category
  rule(
    describe(flag("--verbose", "-v"), {
      category: "Behavior",
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--quiet", "-q"), {
      category: "Behavior",
      description: "Suppress output",
    }),
    isBooleanAt("quiet"),
  ),
];
```

## Help Generation Integration

The `describe()` function works seamlessly with [`makeHelpMessage()`](./make-help-message.md):

```ts
import { makeHelpMessage } from "@jondotsoy/flags";

const rules = [
  rule(
    describe(flag("--config", "-c"), {
      category: "Configuration",
      description: "Path to configuration file",
    }),
    isStringAt("config"),
  ),

  rule(
    describe(command("build"), {
      category: "Commands",
      description: "Build the project",
    }),
    restArgumentsAt("buildArgs"),
  ),
];

// Generate help message
const help = makeHelpMessage("myapp", rules);
console.log(help);

// Output:
// Usage: myapp [options]
//
// Configuration:
//   -c, --config <value>    Path to configuration file
//
// Commands:
//   build                   Build the project
```

## Multiple Spec Objects

You can pass multiple spec objects that will be merged:

```ts
const baseSpec = { category: "Core Options" };
const verboseSpec = { description: "Enable detailed logging" };

const rule1 = rule(
  describe(flag("--verbose", "-v"), baseSpec, verboseSpec),
  isBooleanAt("verbose"),
);

// Equivalent to:
const rule2 = rule(
  describe(flag("--verbose", "-v"), {
    category: "Core Options",
    description: "Enable detailed logging",
  }),
  isBooleanAt("verbose"),
);
```

## Advanced Examples

### Complex CLI with Categories

```ts
interface BuildOptions {
  // Input/Output
  input: string;
  output: string;
  config: string;

  // Build Options
  minify: boolean;
  sourcemap: boolean;
  target: string;

  // Development
  watch: boolean;
  serve: boolean;
  port: number;

  // Debug
  verbose: boolean;
  debug: boolean;
}

const rules = [
  // Input/Output Options
  rule(
    describe(flag("--input", "-i"), {
      category: "Input/Output",
      description: "Entry point file",
    }),
    isStringAt("input"),
  ),

  rule(
    describe(flag("--output", "-o"), {
      category: "Input/Output",
      description: "Output bundle path",
    }),
    isStringAt("output"),
  ),

  rule(
    describe(flag("--config", "-c"), {
      category: "Input/Output",
      description: "Configuration file path",
    }),
    isStringAt("config"),
  ),

  // Build Options
  rule(
    describe(flag("--minify"), {
      category: "Build Options",
      description: "Minify output bundle",
    }),
    isBooleanAt("minify"),
  ),

  rule(
    describe(flag("--sourcemap"), {
      category: "Build Options",
      description: "Generate source maps",
    }),
    isBooleanAt("sourcemap"),
  ),

  rule(
    describe(flag("--target"), {
      category: "Build Options",
      description: "Build target (es5, es2015, esnext)",
    }),
    isStringAt("target"),
  ),

  // Development Options
  rule(
    describe(flag("--watch", "-w"), {
      category: "Development",
      description: "Watch files and rebuild on changes",
    }),
    isBooleanAt("watch"),
  ),

  rule(
    describe(flag("--serve"), {
      category: "Development",
      description: "Start development server",
    }),
    isBooleanAt("serve"),
  ),

  rule(
    describe(flag("--port", "-p"), {
      category: "Development",
      description: "Development server port",
    }),
    isNumberAt("port"),
  ),

  // Debug Options
  rule(
    describe(flag("--verbose", "-v"), {
      category: "Debug",
      description: "Enable verbose logging",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--debug"), {
      category: "Debug",
      description: "Enable debug mode with extra information",
    }),
    isBooleanAt("debug"),
  ),
];
```

### Git-like Command Structure

```ts
const rules = [
  // Global Options
  rule(
    describe(flag("--global", "-g"), {
      category: "Global Options",
      description: "Use global configuration",
    }),
    isBooleanAt("global"),
  ),

  // Repository Commands
  rule(
    describe(command("init"), {
      category: "Repository Commands",
      description: "Initialize a new repository",
    }),
    restArgumentsAt("initArgs"),
  ),

  rule(
    describe(command("clone"), {
      category: "Repository Commands",
      description: "Clone a repository from URL",
    }),
    restArgumentsAt("cloneArgs"),
  ),

  // Change Commands
  rule(
    describe(command("add"), {
      category: "Change Commands",
      description: "Add files to staging area",
    }),
    restArgumentsAt("addArgs"),
  ),

  rule(
    describe(command("commit"), {
      category: "Change Commands",
      description: "Commit staged changes",
    }),
    restArgumentsAt("commitArgs"),
  ),

  // Remote Commands
  rule(
    describe(command("push"), {
      category: "Remote Commands",
      description: "Push changes to remote repository",
    }),
    restArgumentsAt("pushArgs"),
  ),

  rule(
    describe(command("pull"), {
      category: "Remote Commands",
      description: "Pull changes from remote repository",
    }),
    restArgumentsAt("pullArgs"),
  ),
];
```

## Programmatic Access to Metadata

You can access the metadata using [`getSpecs()`](./get-specs.md):

```ts
import { getSpecs } from "@jondotsoy/flags";

const rules = [
  rule(
    describe(flag("--verbose"), {
      category: "Debug",
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),
];

// Extract all specs
for (const spec of getSpecs(rules)) {
  console.log(spec.description); // "Enable verbose output"
  console.log(spec.category); // "Debug"
  console.log(spec.names); // ["--verbose"]
}
```

## Testing with Describe

```ts
import { describe as testDescribe, test, expect } from "bun:test";
import { describe, flag, makeHelpMessage } from "@jondotsoy/flags";

testDescribe("describe() function", () => {
  test("should add metadata without changing behavior", () => {
    const originalFlag = flag("--verbose", "-v");
    const describedFlag = describe(originalFlag, {
      description: "Enable verbose output",
    });

    // Behavior should be identical
    expect(originalFlag("--verbose")).toBe(describedFlag("--verbose"));
    expect(originalFlag("-v")).toBe(describedFlag("-v"));
    expect(originalFlag("--other")).toBe(describedFlag("--other"));
  });

  test("should add description property", () => {
    const describedFlag = describe(flag("--verbose"), {
      description: "Enable verbose output",
    });

    expect(describedFlag.description).toBe("Enable verbose output");
  });

  test("should add category property", () => {
    const describedFlag = describe(flag("--debug"), {
      category: "Debug Options",
    });

    expect(describedFlag.category).toBe("Debug Options");
  });

  test("should appear in help message", () => {
    const rules = [
      rule(
        describe(flag("--verbose", "-v"), {
          description: "Enable verbose output",
        }),
        isBooleanAt("verbose"),
      ),
    ];

    const help = makeHelpMessage("myapp", rules);
    expect(help).toContain("Enable verbose output");
    expect(help).toContain("-v, --verbose");
  });
});
```

## Best Practices

### Consistent Categories

Use consistent category names across your CLI:

```ts
// ✅ Good: Consistent categories
const categories = {
  INPUT_OUTPUT: "Input/Output",
  BUILD: "Build Options",
  DEVELOPMENT: "Development",
  DEBUG: "Debug & Logging",
};

// ❌ Avoid: Inconsistent naming
// "Input/Output", "input-output", "IO", "Files"
```

### Meaningful Descriptions

Write clear, actionable descriptions:

```ts
// ✅ Good: Clear and helpful
describe(flag("--port", "-p"), {
  description: "Port number for development server (default: 3000)",
});

// ❌ Poor: Too vague
describe(flag("--port", "-p"), {
  description: "Port option",
});
```

### Logical Grouping

Group related options in the same category:

```ts
// ✅ Good: Logical grouping
const debugCategory = "Debug & Logging";

rule(describe(flag("--verbose"), { category: debugCategory }), handler);
rule(describe(flag("--debug"), { category: debugCategory }), handler);
rule(describe(flag("--log-level"), { category: debugCategory }), handler);
```

## Related APIs

- [`makeHelpMessage()`](./make-help-message.md) - Generate help using descriptions
- [`getSpecs()`](./get-specs.md) - Extract metadata programmatically
- [`rule()`](./rule.md) - Create parsing rules
- [`flag()`](./flag.md) - Test function commonly used with describe
- [`command()`](./command.md) - Test function for subcommands

## Real-World Example

```ts
import {
  flags,
  rule,
  flag,
  command,
  describe,
  makeHelpMessage,
  isBooleanAt,
  isStringAt,
  restArgumentsAt,
} from "@jondotsoy/flags";

interface DockerLikeOptions {
  help: boolean;
  version: boolean;
  verbose: boolean;
  // Commands
  runArgs: string[];
  buildArgs: string[];
  psArgs: string[];
}

const rules = [
  // Global Options
  rule(
    describe(flag("--help", "-h"), {
      category: "Global Options",
      description: "Show this help message",
    }),
    isBooleanAt("help"),
  ),

  rule(
    describe(flag("--version", "-v"), {
      category: "Global Options",
      description: "Show version information",
    }),
    isBooleanAt("version"),
  ),

  rule(
    describe(flag("--verbose"), {
      category: "Global Options",
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),

  // Container Commands
  rule(
    describe(command("run"), {
      category: "Container Commands",
      description: "Run a command in a new container",
    }),
    restArgumentsAt("runArgs"),
  ),

  rule(
    describe(command("build"), {
      category: "Container Commands",
      description: "Build an image from a Dockerfile",
    }),
    restArgumentsAt("buildArgs"),
  ),

  // Management Commands
  rule(
    describe(command("ps"), {
      category: "Management Commands",
      description: "List containers",
    }),
    restArgumentsAt("psArgs"),
  ),
];

const options = flags(process.argv.slice(2), {}, rules);

if (options.help) {
  console.log(makeHelpMessage("docker-like", rules));
  process.exit(0);
}

// The help output will be nicely organized by categories with descriptions
```

The `describe()` function is essential for creating professional, well-documented CLIs with helpful error messages and organized help output.

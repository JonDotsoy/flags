# `command()` - API Reference

Create test functions that match subcommands like `build`, `serve`, `test`, or `commit`.

## Syntax

```ts
command<T>(name: string): Test<T>
```

## Parameters

- `name: string` - The exact command name to match

## Returns

`Test<T>` - A test function that matches the specified command

## Basic Usage

### Simple Commands

```ts
import { command, rule, restArgumentsAt } from "@jondotsoy/flags";

// Match "build" command
const buildCommand = command("build");

// Use in a rule to capture remaining arguments
const buildRule = rule(buildCommand, restArgumentsAt("buildArgs"));

// Usage: myapp build --watch src/
// Result: { buildArgs: ["--watch", "src/"] }
```

### Multiple Commands

```ts
interface CLIOptions {
  buildArgs?: string[];
  testArgs?: string[];
  serveArgs?: string[];
}

const rules = [
  rule(command("build"), restArgumentsAt("buildArgs")),
  rule(command("test"), restArgumentsAt("testArgs")),
  rule(command("serve"), restArgumentsAt("serveArgs")),
];

// Examples:
// myapp build --watch          → { buildArgs: ["--watch"] }
// myapp test --coverage        → { testArgs: ["--coverage"] }
// myapp serve --port 3000      → { serveArgs: ["--port", "3000"] }
```

## Advanced Usage

### Commands with Custom Logic

```ts
const commitRule = rule(command("commit"), (ctx) => {
  const args = ctx.args.slice(ctx.index);

  // Look for -m or --message flag
  const messageIndex = args.findIndex(
    (arg) => arg === "-m" || arg === "--message",
  );
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    ctx.flags.commitMessage = args[messageIndex + 1];
    ctx.nextIndex = ctx.index + messageIndex + 2;
  } else {
    // No message provided, will open editor
    ctx.flags.openEditor = true;
    ctx.nextIndex = ctx.index + args.length;
  }
});

// Usage:
// myapp commit -m "Initial commit" → { commitMessage: "Initial commit" }
// myapp commit                     → { openEditor: true }
```

### Commands with Positional Arguments

```ts
const cloneRule = rule(command("clone"), (ctx) => {
  const args = ctx.args.slice(ctx.index);

  if (args.length === 0) {
    throw new Error("clone requires a repository URL");
  }

  ctx.flags.cloneUrl = args[0];
  ctx.flags.cloneDirectory = args[1]; // Optional
  ctx.nextIndex = ctx.index + args.length;
});

// Usage:
// myapp clone https://github.com/user/repo.git
// myapp clone https://github.com/user/repo.git my-project
```

### Commands with Subcommands

```ts
const dockerRule = rule(command("docker"), (ctx) => {
  const args = ctx.args.slice(ctx.index);
  const subcommand = args[0];

  switch (subcommand) {
    case "build":
      ctx.flags.dockerBuild = args.slice(1);
      break;
    case "run":
      ctx.flags.dockerRun = args.slice(1);
      break;
    case "ps":
      ctx.flags.dockerPs = args.slice(1);
      break;
    default:
      throw new Error(`Unknown docker subcommand: ${subcommand}`);
  }

  ctx.nextIndex = ctx.index + args.length;
});

// Usage:
// myapp docker build . -t myapp
// myapp docker run -p 3000:3000 myapp
// myapp docker ps -a
```

## Integration Patterns

### Commands with Global Flags

```ts
interface CLIOptions {
  // Global flags
  verbose?: boolean;
  quiet?: boolean;

  // Command-specific
  buildArgs?: string[];
  testPattern?: string;
}

const rules = [
  // Global flags (processed before commands)
  rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
  rule(flag("--quiet", "-q"), isBooleanAt("quiet")),

  // Commands
  rule(command("build"), restArgumentsAt("buildArgs")),
  rule(command("test"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    ctx.flags.testPattern = args[0] || "**/*.test.js";
    ctx.nextIndex = ctx.index + args.length;
  }),
];

// Usage: myapp --verbose build --watch
// Result: { verbose: true, buildArgs: ["--watch"] }
```

### Command-Specific Help

```ts
const helpRule = rule(command("help"), (ctx) => {
  const args = ctx.args.slice(ctx.index);
  const topic = args[0];

  if (!topic) {
    // General help
    console.log(makeHelpMessage("myapp", rules));
  } else {
    // Topic-specific help
    showTopicHelp(topic);
  }

  process.exit(0);
});

function showTopicHelp(topic: string) {
  const helpTexts: Record<string, string> = {
    build: "myapp build [options]\n  Build the application",
    test: "myapp test [pattern]\n  Run tests matching pattern",
    serve: "myapp serve [options]\n  Start development server",
  };

  console.log(helpTexts[topic] || `No help available for: ${topic}`);
}

// Usage: myapp help build
```

## Command Naming Conventions

### Recommended Names

```ts
// Good: Clear, standard command names
command("build"); // Build/compile the project
command("test"); // Run tests
command("serve"); // Start a server
command("start"); // Start the application
command("dev"); // Development mode
command("deploy"); // Deploy the application
command("init"); // Initialize/scaffold
command("install"); // Install dependencies
command("clean"); // Clean build artifacts
command("docs"); // Generate documentation
```

### Multi-Word Commands

```ts
// Use hyphens for multi-word commands
command("dev-server");
command("build-docs");
command("lint-fix");

// Or use namespacing
command("server:start");
command("db:migrate");
command("cache:clear");
```

### Avoid

```ts
// Avoid: Unclear or overly generic names
command("go"); // What does it do?
command("do"); // Too vague
command("x"); // Not descriptive

// Avoid: Conflicting with common flags
command("help"); // Might conflict with --help
command("version"); // Might conflict with --version
```

## Real-World Examples

### Package Manager Commands

```ts
interface NPMOptions {
  packages?: string[];
  global?: boolean;
  saveDev?: boolean;
  scriptName?: string;
  scriptArgs?: string[];
}

const rules = [
  // Global flags
  rule(flag("--global", "-g"), isBooleanAt("global")),
  rule(flag("--save-dev", "-D"), isBooleanAt("saveDev")),

  // Commands
  rule(command("install"), restArgumentsAt("packages")),
  rule(command("uninstall"), restArgumentsAt("packages")),
  rule(command("run"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    ctx.flags.scriptName = args[0];
    ctx.flags.scriptArgs = args.slice(1);
    ctx.nextIndex = ctx.index + args.length;
  }),
];

// Usage:
// npm install react redux --save
// npm install --global typescript
// npm run build -- --watch
```

### Build Tool Commands

```ts
interface WebpackOptions {
  mode?: "development" | "production";
  watch?: boolean;
  entry?: string;
  output?: string;
}

const rules = [
  rule(flag("--mode"), isStringAt("mode")),
  rule(flag("--watch", "-w"), isBooleanAt("watch")),
  rule(flag("--entry"), isStringAt("entry")),
  rule(flag("--output"), isStringAt("output")),

  rule(command("build"), (ctx) => {
    // Set default mode for build
    if (!ctx.flags.mode) {
      ctx.flags.mode = "production";
    }
  }),

  rule(command("dev"), (ctx) => {
    // Set defaults for development
    ctx.flags.mode = "development";
    ctx.flags.watch = true;
  }),
];
```

### Git-like Commands

```ts
interface GitOptions {
  commitMessage?: string;
  pushRemote?: string;
  pushBranch?: string;
  cloneUrl?: string;
  cloneDir?: string;
}

const rules = [
  rule(command("commit"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    const messageFlag = args.findIndex(
      (arg) => arg === "-m" || arg === "--message",
    );

    if (messageFlag !== -1) {
      ctx.flags.commitMessage = args[messageFlag + 1];
    }

    ctx.nextIndex = ctx.index + args.length;
  }),

  rule(command("push"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    ctx.flags.pushRemote = args[0] || "origin";
    ctx.flags.pushBranch = args[1] || "main";
    ctx.nextIndex = ctx.index + args.length;
  }),

  rule(command("clone"), (ctx) => {
    const args = ctx.args.slice(ctx.index);
    if (!args[0]) {
      throw new Error("Repository URL required");
    }
    ctx.flags.cloneUrl = args[0];
    ctx.flags.cloneDir = args[1];
    ctx.nextIndex = ctx.index + args.length;
  }),
];
```

## Testing Commands

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, command, restArgumentsAt } from "@jondotsoy/flags";

describe("command() function", () => {
  const buildRule = rule(command("build"), restArgumentsAt("buildArgs"));

  test("should match exact command name", () => {
    const options = flags(["build", "--watch"], {}, [buildRule]);
    expect(options.buildArgs).toEqual(["--watch"]);
  });

  test("should not match partial names", () => {
    expect(() => {
      flags(["buil"], {}, [buildRule]); // Typo
    }).toThrow("Unknown argument: buil");
  });

  test("should not match with extra characters", () => {
    expect(() => {
      flags(["builds"], {}, [buildRule]);
    }).toThrow("Unknown argument: builds");
  });
});
```

### Integration Tests

```ts
describe("multi-command CLI", () => {
  const rules = [
    rule(command("build"), restArgumentsAt("buildArgs")),
    rule(command("test"), restArgumentsAt("testArgs")),
  ];

  test("should handle different commands", () => {
    const buildOptions = flags(["build", "--watch"], {}, rules);
    expect(buildOptions.buildArgs).toEqual(["--watch"]);

    const testOptions = flags(["test", "--coverage"], {}, rules);
    expect(testOptions.testArgs).toEqual(["--coverage"]);
  });
});
```

## Performance Considerations

### Command Ordering

Place more common commands first in your rules array:

```ts
const rules = [
  // Most common commands first
  rule(command("build"), buildHandler),
  rule(command("dev"), devHandler),

  // Less common commands
  rule(command("clean"), cleanHandler),
  rule(command("docs"), docsHandler),

  // Rarely used commands last
  rule(command("eject"), ejectHandler),
];
```

### Lazy Command Processing

For commands with expensive setup:

```ts
const expensiveRule = rule(command("analyze"), (ctx) => {
  // Defer expensive analysis until actually needed
  ctx.flags.runAnalysis = () => performExpensiveAnalysis();
});
```

## Error Handling

### Missing Subcommand Arguments

```ts
const deployRule = rule(command("deploy"), (ctx) => {
  const args = ctx.args.slice(ctx.index);
  const environment = args[0];

  if (!environment) {
    throw new Error(
      "deploy command requires an environment (dev, staging, prod)",
    );
  }

  const validEnvs = ["dev", "staging", "prod"];
  if (!validEnvs.includes(environment)) {
    throw new Error(
      `Invalid environment: ${environment}. Valid options: ${validEnvs.join(", ")}`,
    );
  }

  ctx.flags.deployEnvironment = environment;
  ctx.nextIndex = ctx.index + args.length;
});
```

### Command Conflicts

```ts
// Ensure command names don't conflict with flags
const rules = [
  rule(flag("--build"), isBooleanAt("enableBuild")),
  rule(command("build"), restArgumentsAt("buildArgs")), // Potential conflict!
];

// Better: Use clear naming
const betterRules = [
  rule(flag("--enable-build"), isBooleanAt("enableBuild")),
  rule(command("build"), restArgumentsAt("buildArgs")), // Clear distinction
];
```

## Related APIs

- [`rule()`](./rule.md) - Combine commands with handlers
- [`flag()`](./flag.md) - Match command-line flags
- [`restArgumentsAt()`](./handlers.md#restargumentsat) - Capture remaining arguments
- [`argument()`](./argument.md) - Match positional arguments

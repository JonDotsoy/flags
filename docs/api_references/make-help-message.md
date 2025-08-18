# `makeHelpMessage()` - API Reference

Generate beautifully formatted help messages for your CLI applications based on your parsing rules.

## Syntax

```ts
makeHelpMessage(
  command: string,
  rules: Rule<any>[],
  samples?: string[]
): string
```

## Parameters

- `command: string` - The name of your CLI command (e.g., "myapp", "git", "npm")
- `rules: Rule<any>[]` - Array of rules that define your CLI's flags and commands
- `samples?: string[]` - Optional array of usage examples

## Returns

`string` - Formatted help message ready for console output

## Basic Usage

### Simple Help Message

```ts
import {
  makeHelpMessage,
  rule,
  flag,
  command,
  describe,
  isBooleanAt,
  isStringAt,
  restArgumentsAt,
} from "@jondotsoy/flags";

const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),
  rule(
    describe(flag("--port", "-p"), {
      description: "Set server port",
    }),
    isStringAt("port"),
  ),
  rule(
    describe(command("build"), {
      description: "Build the application",
    }),
    restArgumentsAt("buildArgs"),
  ),
];

const helpText = makeHelpMessage("myapp", rules);
console.log(helpText);
```

Output:

```
Usage: myapp

flag:
   --verbose, -v    Enable verbose output
   --port, -p       Set server port

command:
   build            Build the application
```

### With Usage Examples

```ts
const helpText = makeHelpMessage("myapp", rules, [
  "--verbose --port 3000",
  "build --watch",
  "--help",
]);
```

Output:

```
Usage: myapp --verbose --port 3000
       myapp build --watch
       myapp --help

flag:
   --verbose, -v    Enable verbose output
   --port, -p       Set server port

command:
   build            Build the application
```

## Advanced Usage

### Categorized Help

Use the `category` field in `describe()` to organize options:

```ts
const rules = [
  // General options
  rule(
    describe(flag("--help", "-h"), {
      description: "Show this help message",
      category: "General",
    }),
    isBooleanAt("help"),
  ),
  rule(
    describe(flag("--version", "-V"), {
      description: "Show version number",
      category: "General",
    }),
    isBooleanAt("version"),
  ),

  // Server options
  rule(
    describe(flag("--port", "-p"), {
      description: "Set server port (default: 3000)",
      category: "Server",
    }),
    isStringAt("port"),
  ),
  rule(
    describe(flag("--host"), {
      description: "Set server host (default: localhost)",
      category: "Server",
    }),
    isStringAt("host"),
  ),

  // Build options
  rule(
    describe(flag("--watch", "-w"), {
      description: "Watch for file changes",
      category: "Build",
    }),
    isBooleanAt("watch"),
  ),
  rule(
    describe(flag("--minify"), {
      description: "Minify output files",
      category: "Build",
    }),
    isBooleanAt("minify"),
  ),

  // Commands
  rule(
    describe(command("build"), {
      description: "Build the application",
      category: "Commands",
    }),
    restArgumentsAt("buildArgs"),
  ),
  rule(
    describe(command("serve"), {
      description: "Start development server",
      category: "Commands",
    }),
    restArgumentsAt("serveArgs"),
  ),
];

const helpText = makeHelpMessage("myapp", rules, [
  "build --watch --minify",
  "serve --port 8080",
  "--help",
]);
```

Output:

```
Usage: myapp build --watch --minify
       myapp serve --port 8080
       myapp --help

General:
   --help, -h       Show this help message
   --version, -V    Show version number

Server:
   --port, -p       Set server port (default: 3000)
   --host           Set server host (default: localhost)

Build:
   --watch, -w      Watch for file changes
   --minify         Minify output files

Commands:
   build            Build the application
   serve            Start development server
```

## Integration Patterns

### Help Flag Implementation

```ts
const rules = [
  rule(
    describe(flag("--help", "-h"), {
      description: "Show this help message",
    }),
    (ctx) => {
      console.log(
        makeHelpMessage("myapp", rules, [
          "--verbose --output ./dist",
          "build --watch",
          "serve --port 3000",
        ]),
      );
      process.exit(0);
    },
  ),
  // ... other rules
];
```

### Error Handling with Help

```ts
import { flags, UnknownArgumentError, makeHelpMessage } from "@jondotsoy/flags";

try {
  const options = flags(process.argv.slice(2), {}, rules);
} catch (error) {
  if (error instanceof UnknownArgumentError) {
    console.error(`❌ ${error.message}`);
    console.log("\nUsage:");
    console.log(
      makeHelpMessage("myapp", rules, [
        "--verbose --port 3000",
        "build --watch",
      ]),
    );
    process.exit(1);
  }
  throw error;
}
```

### Dynamic Help Generation

```ts
function createCLI(commands: Record<string, Command>) {
  const rules = Object.entries(commands).flatMap(([name, cmd]) => [
    rule(
      describe(command(name), {
        description: cmd.description,
        category: "Commands",
      }),
      restArgumentsAt(name),
    ),
    ...cmd.flags.map((flag) =>
      rule(
        describe(flag.test, {
          description: flag.description,
          category: cmd.name,
        }),
        flag.handler,
      ),
    ),
  ]);

  return {
    parse: (args: string[]) => flags(args, {}, rules),
    help: () => makeHelpMessage("mycli", rules, commands.examples),
  };
}
```

## Customization

### Terminal Width Handling

The help message automatically adapts to terminal width using the `COLUMNS` environment variable:

```bash
# Wide terminal (default 80 columns)
COLUMNS=120 myapp --help

# Narrow terminal
COLUMNS=40 myapp --help
```

### Custom Formatting

For advanced formatting needs, you can process the rules manually:

```ts
import { getSpecs } from "@jondotsoy/flags";

function customHelpMessage(command: string, rules: Rule<any>[]) {
  const specs = Array.from(getSpecs(rules));

  let help = `Usage: ${command} [options]\n\n`;

  // Group by category
  const byCategory: Record<string, typeof specs> = {};
  for (const spec of specs) {
    const category = spec.category || "Options";
    byCategory[category] = [...(byCategory[category] || []), spec];
  }

  // Format each category
  for (const [category, categorySpecs] of Object.entries(byCategory)) {
    help += `${category}:\n`;
    for (const spec of categorySpecs) {
      const names = spec.names?.join(", ") || "";
      const description = spec.description || "";
      help += `  ${names.padEnd(20)} ${description}\n`;
    }
    help += "\n";
  }

  return help;
}
```

## Complex Examples

### Git-like CLI Help

```ts
interface GitOptions {
  global?: boolean;
  verbose?: boolean;
  commitMessage?: string;
  pushArgs?: string[];
  cloneUrl?: string;
}

const rules = [
  // Global options
  rule(
    describe(flag("--global", "-g"), {
      description: "Apply to global Git configuration",
      category: "Global Options",
    }),
    isBooleanAt("global"),
  ),
  rule(
    describe(flag("--verbose", "-v"), {
      description: "Be more verbose",
      category: "Global Options",
    }),
    isBooleanAt("verbose"),
  ),

  // Commands
  rule(
    describe(command("commit"), {
      description: "Record changes to the repository",
      category: "Main Commands",
    }),
    (ctx) => {
      // Handle commit-specific logic
      const args = ctx.args.slice(ctx.index);
      const messageIndex = args.findIndex((arg) => arg === "-m");
      if (messageIndex !== -1) {
        ctx.flags.commitMessage = args[messageIndex + 1];
      }
      ctx.nextIndex = ctx.args.length;
    },
  ),
  rule(
    describe(command("push"), {
      description: "Update remote refs along with associated objects",
      category: "Main Commands",
    }),
    restArgumentsAt("pushArgs"),
  ),
  rule(
    describe(command("clone"), {
      description: "Clone a repository into a new directory",
      category: "Main Commands",
    }),
    (ctx) => {
      ctx.flags.cloneUrl = ctx.args[ctx.index];
      ctx.nextIndex = ctx.index + 1;
    },
  ),
];

const helpText = makeHelpMessage("git", rules, [
  "clone https://github.com/user/repo.git",
  'commit -m "Initial commit"',
  "push origin main",
  "--global --verbose status",
]);
```

### Package Manager Help

```ts
const npmLikeRules = [
  // Global flags
  rule(
    describe(flag("--global", "-g"), {
      description: "Install package globally",
      category: "Options",
    }),
    isBooleanAt("global"),
  ),
  rule(
    describe(flag("--save-dev", "-D"), {
      description: "Save to devDependencies",
      category: "Options",
    }),
    isBooleanAt("saveDev"),
  ),
  rule(
    describe(flag("--verbose"), {
      description: "Show verbose output",
      category: "Options",
    }),
    isBooleanAt("verbose"),
  ),

  // Commands
  rule(
    describe(command("install"), {
      description: "Install packages",
      category: "Commands",
    }),
    restArgumentsAt("packages"),
  ),
  rule(
    describe(command("uninstall"), {
      description: "Remove packages",
      category: "Commands",
    }),
    restArgumentsAt("packages"),
  ),
  rule(
    describe(command("run"), {
      description: "Run a script",
      category: "Commands",
    }),
    restArgumentsAt("script"),
  ),
];

const helpText = makeHelpMessage("npm", npmLikeRules, [
  "install react --save",
  "install --global typescript",
  "run build",
  "uninstall lodash",
]);
```

## Performance Considerations

### Large CLIs

For CLIs with many options, consider lazy help generation:

```ts
let cachedHelp: string | null = null;

function getHelp() {
  if (!cachedHelp) {
    cachedHelp = makeHelpMessage("myapp", rules, examples);
  }
  return cachedHelp;
}
```

### Memory Usage

The help generation uses the `@jondotsoy/console-draw` library, which creates a virtual layout tree. For very large help messages, consider:

```ts
// Stream output for very large help
function streamHelp(command: string, rules: Rule<any>[]) {
  const specs = Array.from(getSpecs(rules));

  console.log(`Usage: ${command} [options]\n`);

  for (const spec of specs) {
    const names = spec.names?.join(", ") || "";
    const description = spec.description || "";
    console.log(`  ${names.padEnd(20)} ${description}`);
  }
}
```

## Testing Help Output

### Snapshot Testing

```ts
import { describe, test, expect } from "bun:test";

describe("help message", () => {
  test("should generate expected help format", () => {
    const helpText = makeHelpMessage("myapp", rules, examples);
    expect(helpText).toMatchSnapshot();
  });

  test("should handle empty rules", () => {
    const helpText = makeHelpMessage("myapp", [], []);
    expect(helpText).toContain("Usage: myapp");
  });
});
```

### Content Testing

```ts
describe("help content", () => {
  test("should include all flag descriptions", () => {
    const helpText = makeHelpMessage("myapp", rules);

    expect(helpText).toContain("--verbose");
    expect(helpText).toContain("Enable verbose output");
    expect(helpText).toContain("--port");
    expect(helpText).toContain("Set server port");
  });
});
```

## Related APIs

- [`describe()`](./describe.md) - Add metadata to rules for help generation
- [`getSpecs()`](./get-specs.md) - Extract rule metadata programmatically
- [`flags()`](./flags.md) - Main parsing function
- [Error Classes](./errors.md) - Error handling that often includes help output

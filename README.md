# <span style="color: gray">></span> flags{args}

A powerful and type-safe JavaScript/TypeScript command-line arguments parser with a fluent builder API.

[Code Wiki](https://codewiki.google/github.com/JonDotsoy/flags)

## Features

- 🔥 **Type-safe**: Full TypeScript support with type inference
- 🎯 **Fluent API**: Chainable builder pattern for intuitive flag definitions
- 📋 **Multiple formats**: Support for `--flag=value`, `--flag value`, and `-f` syntax
- 🔗 **Combined flags**: Automatic expansion of combined short flags like `-abc` → `-a -b -c`
- 🔧 **Built-in types**: Boolean, string, strings array, number, and key-value handlers
- 📚 **Commands**: Support for subcommands and rest arguments
- 📍 **Positional arguments**: Ordered argument parsing
- 🆘 **Help generation**: Automatic help message generation
- ⚡ **Lightweight**: Zero dependencies, minimal overhead

## Installation

```bash
npm install @jondotsoy/flags
# or
yarn add @jondotsoy/flags
# or
bun add @jondotsoy/flags
```

## AI Assistant Skill

A skill is available for AI coding assistants to better understand this library. Install it with:

```bash
npx skills add jondotsoy/flags
```

See [SKILL.md](./skills/flags-builder/SKILL.md) for details.

## Quick Start

```ts
import { flags, flag, command, argument } from "@jondotsoy/flags";

// Define your schema with fluent builder API
const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
  name: flag("--name", "-n").string().describe("Set application name"),
  port: flag("--port", "-p").number().default(3000).describe("Server port"),
  help: flag("--help", "-h").boolean().describe("Show help message"),
  serve: command("serve").restArgs().describe("Start the server"),
  input: argument().string().required().describe("Input file"),
})
  .program("mycli")
  .describe("My awesome CLI tool");

// Parse command line arguments
const args = ["input.txt", "--name=myapp", "-v", "--port", "8080"];

try {
  const options = parser.parse(args);

  // Handle help flag
  if (options.help) {
    console.log(parser.helpMessage());
    process.exit(0);
  }

  console.log("Parsed options:", options);
  // Output: { input: "input.txt", name: "myapp", verbose: true, port: 8080, help: false, serve: null }
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.log(parser.helpMessage());
  process.exit(1);
}
```

## Core Concepts

The library uses a fluent builder API with three main building blocks:

- **Flags**: Named options like `--verbose` or `-v`
- **Commands**: Subcommands like `build` or `serve`
- **Arguments**: Positional arguments like file paths

## API Reference

### `flags(schema)`

Creates a parser with the given schema. Returns a `FlagsParser` instance.

```ts
const parser = flags({
  verbose: flag("--verbose", "-v").boolean(),
  port: flag("--port").number().default(3000),
});
```

### Parser Methods

#### `.program(name: string)`

Sets the program name for help messages.

```ts
parser.program("mycli");
```

#### `.describe(description: string)`

Sets the program description for help messages.

```ts
parser.describe("A powerful CLI tool");
```

#### `.combineShortFlags()`

Enables automatic expansion of combined short boolean flags (e.g., `-abc` → `-a -b -c`).

```ts
const parser = flags({
  all: flag("-a").boolean(),
  long: flag("-l").boolean(),
  human: flag("-h").boolean(),
}).combineShortFlags();

parser.parse(["-alh"]); // { all: true, long: true, human: true }
```

#### `.parse(args: string[])`

Parses the arguments and returns the result object.

```ts
const options = parser.parse(process.argv.slice(2));
```

**Throws:**

- `UnexpectedArgumentError` - When an unknown argument is encountered
- `RequiredFlagMissingError` - When a required flag is missing
- `RequiredArgumentMissingError` - When a required argument is missing

#### `.safeParse(args: string[])`

Like `.parse()`, but never throws. Returns a labeled tuple `[ok, error, output]`.

```ts
const [ok, error, output] = parser.safeParse(process.argv.slice(2));

if (ok) {
  console.log(output); // typed result, same as .parse()
} else {
  console.error(error); // UnexpectedArgumentError, RequiredFlagMissingError, etc.
  console.log(parser.helpMessage());
  process.exit(1);
}
```

| Element  | Type                       | Description                                    |
| -------- | -------------------------- | ---------------------------------------------- |
| `ok`     | `boolean`                  | `true` if parsing succeeded, `false` otherwise |
| `error`  | `unknown \| undefined`     | The thrown error when `ok` is `false`          |
| `output` | `ParseResult \| undefined` | The parsed result when `ok` is `true`          |

#### `.helpMessage()`

Generates and returns a formatted help message.

```ts
console.log(parser.helpMessage());
```

## Builder Functions

### `flag(...names: string[])`

Creates a flag builder for named options. Supports multiple aliases.

```ts
// Single name
flag("--port"); // Matches --port only

// Multiple names (aliases)
flag("--verbose", "-v"); // Matches --verbose or -v
flag("-t", "--tty"); // Matches -t or --tty

// Multiple long and short names
flag("--help", "-h", "-?"); // Matches --help, -h, or -?
```

**Examples:**

```ts
const parser = flags({
  // Long form only
  version: flag("--version").boolean(),

  // Short and long form
  verbose: flag("-v", "--verbose").boolean(),

  // Multiple aliases
  help: flag("-h", "--help", "-?").boolean(),

  // Docker-style: short first, then long
  tty: flag("-t", "--tty").boolean(),
  interactive: flag("-i", "--interactive").boolean(),
});

// All of these work:
parser.parse(["--verbose"]); // { verbose: true, ... }
parser.parse(["-v"]); // { verbose: true, ... }
parser.parse(["-ti"]); // { tty: true, interactive: true, ... } (combined!)
parser.parse(["--tty", "--interactive"]); // { tty: true, interactive: true, ... }
```

#### Flag Type Methods

**`.boolean()`** - Boolean flag (presence = true)

```ts
flag("--verbose").boolean();
// --verbose → true

// Single-letter boolean flags support combined syntax
flag("-t").boolean();
flag("-i").boolean();
// -ti → { t: true, i: true } (automatically expanded)
```

**`.string()`** - String value flag

```ts
flag("--name").string();
// --name John → "John"
// --name=John → "John"
// --name=John=Doe → "John=Doe" (multiple = preserved)
// --name =John → "=John" (leading = preserved)

// Single dash also supported
flag("-name").string();
// -name John → "John"
// -name=John → "John"
```

**`.strings()`** - Array of strings (accumulates multiple values)

```ts
flag("--include").strings();
// --include src --include lib → ["src", "lib"]
// -l blue -l red → ["blue", "red"]

// Supports = syntax and flag-like values
flag("-l").strings();
// -l=-l -l=red → ["-l", "red"]
// -l -l -l red → ["-l", "red"] (flag-like values preserved)
```

**`.number()`** - Numeric value flag

```ts
flag("--port").number();
// --port 3000 → 3000
```

**`.keyValue()`** - Key-value pairs (accumulates into object)

```ts
flag("--config").keyValue();
// --config name=value → { name: "value" }
// --config name value → { name: "value" }
// --config name=value --config foo=bar → { name: "value", foo: "bar" }

// Multiple syntaxes supported
flag("--set").keyValue();
// --set foo taz → { foo: "taz" }
// --set foo=taz → { foo: "taz" }
// --set=foo=taz → { foo: "taz" }

// Flag-like keys are preserved
// --set --foo taz → { "--foo": "taz" }
// --set=--foo=taz → { "--foo": "taz" }
```

#### Flag Modifiers

**`.required()`** - Makes the flag required

```ts
flag("--output").string().required();
// Throws RequiredFlagMissingError if not provided
```

**`.default(value)`** - Sets a default value

```ts
flag("--port").number().default(3000);
// Returns 3000 if --port is not provided

// Without default, optional flags return null when not provided
flag("--name").string();
// Returns null if --name is not provided

flag("--verbose").boolean();
// Returns false if --verbose is not provided (boolean default)
```

**`.describe(description)`** - Adds description for help

```ts
flag("--verbose").boolean().describe("Enable verbose output");
```

### `command(name: string)`

Creates a command builder for subcommands.

```ts
command("build"); // Matches exactly "build"
```

#### Command Type Methods

**`.boolean()`** - Boolean command (presence = true)

```ts
command("build").boolean();
// build → true
```

**`.restArgs()`** - Captures all remaining arguments

```ts
command("serve").restArgs();
// serve --watch --port 3000 → ["--watch", "--port", "3000"]
```

#### Command Modifiers

**`.describe(description)`** - Adds description for help

```ts
command("build").boolean().describe("Build the project");
```

### `argument()`

Creates a positional argument builder. Arguments are matched in order.

```ts
argument(); // Matches the next positional argument
```

#### Argument Type Methods

**`.string()`** - String argument (default)

```ts
argument().string();
// Returns null if not provided
```

**`.strings()`** - Array of strings (captures all remaining positional arguments)

```ts
argument().strings();
// foo tar biz → ["foo", "tar", "biz"]

// Works with interspersed flags
flags({
  verbose: flag("-V", "--verbose").boolean(),
  names: argument().strings(),
});
// foo --verbose tar biz → { verbose: true, names: ["foo", "tar", "biz"] }
```

**Note:** When `argument().strings()` is defined first in the schema, it takes priority and captures all arguments, including flag-like values:

```ts
flags({
  arg: argument().strings(),
  labels: flag("-l").strings(),
});
// -l=-l -l=red foo → { labels: [], arg: ['-l=-l', '-l=red', "foo"] }
```

#### Argument Modifiers

**`.required()`** - Makes the argument required

```ts
argument().string().required();
// Throws RequiredArgumentMissingError if not provided
```

**`.describe(description)`** - Adds description for help

```ts
argument().string().required().describe("Input file path");
```

**`.delimiter(separator)`** - Parse flag with custom delimiter

```ts
flag("pr").string().delimiter(":");
// pr:foo → "foo"
// pr:bar → "bar"
// Returns null if not provided
```

**`.match(regex)`** - Match argument with regex and extract named groups

```ts
argument().match(/^(?<part1>\w+):(?<part2>\w+)$/);
// tar:foo → { part1: "tar", part2: "foo" }
// Returns null if pattern doesn't match
```

**`.refine(fn)`** - Custom refinement function for advanced parsing

```ts
argument().refine((arg, index, args, context) => {
  if (!arg.startsWith("tar:")) return null;
  return {
    index: index + 1,
    args: [arg],
    value: arg.split(":")[1],
  };
});
// tar:foo → "foo"
```

**`.transform(fn)`** - Transform the parsed value

```ts
argument()
  .string()
  .transform((value) => value.toUpperCase());
// tar → "TAR"
```

## Type Inference

The library provides full type inference based on your schema:

```ts
const parser = flags({
  verbose: flag("--verbose").boolean(),
  name: flag("--name").string(),
  port: flag("--port").number().default(3000),
  tags: flag("--tag").strings(),
  config: flag("--config").keyValue(),
  build: command("build").boolean(),
  serve: command("serve").restArgs(),
  input: argument().string().required(),
});

const result = parser.parse(args);

// TypeScript knows the types:
// result.verbose: boolean
// result.name: string | null
// result.port: number (never null due to default)
// result.tags: string[]
// result.config: Record<string, string>
// result.build: boolean
// result.serve: string[] | null
// result.input: string (never null due to required)
```

## Help Messages

The parser automatically generates help messages based on your schema:

```ts
const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
  port: flag("--port", "-p").number().default(3000).describe("Server port"),
  ip: flag("--ip").string().describe("IPv4 address (e.g., 172.30.100.104)"),
  build: command("build").boolean().describe("Build the project"),
})
  .program("mycli")
  .describe("My awesome CLI tool");

console.log(parser.helpMessage());
```

Output:

```
Usage: mycli

My awesome CLI tool

Options:
  -v, --verbose.           Enable verbose output
  -p, --port <number>      Server port
      --ip                 IPv4 address (e.g., 172.30.100.104)

Commands:
  build                    Build the project
```

## Error Handling

The library provides specific error types for better error handling:

### `FlagsParseError`

Base error class for all parsing errors.

### `UnexpectedArgumentError`

Thrown when an unknown argument is encountered.

```ts
import { flags, UnexpectedArgumentError } from "@jondotsoy/flags";

try {
  const options = parser.parse(process.argv.slice(2));
} catch (error) {
  if (error instanceof UnexpectedArgumentError) {
    console.error(`Error: ${error.message}`);
    console.error(`Unexpected argument: ${error.argument}`);
    console.log(parser.helpMessage());
    process.exit(1);
  }
  throw error;
}
```

### `RequiredFlagMissingError`

Thrown when a required flag is not provided.

```ts
import { RequiredFlagMissingError } from "@jondotsoy/flags";

try {
  const options = parser.parse(args);
} catch (error) {
  if (error instanceof RequiredFlagMissingError) {
    console.error(`Required flag missing: ${error.flagName}`);
    process.exit(1);
  }
}
```

### `RequiredArgumentMissingError`

Thrown when a required positional argument is not provided.

```ts
import { RequiredArgumentMissingError } from "@jondotsoy/flags";

try {
  const options = parser.parse(args);
} catch (error) {
  if (error instanceof RequiredArgumentMissingError) {
    console.error("Required argument missing");
    process.exit(1);
  }
}
```

## Combined Short Flags

Single-letter boolean flags can be combined for convenience, similar to common Unix tools. You must call `.combineShortFlags()` on the parser to enable this feature:

```ts
import { flags, flag } from "@jondotsoy/flags";

const parser = flags({
  all: flag("-a", "--all").boolean().describe("Show all files"),
  long: flag("-l", "--long").boolean().describe("Use long listing format"),
  human: flag("-h", "--human-readable")
    .boolean()
    .describe("Human readable sizes"),
}).combineShortFlags();

// All of these are equivalent:
parser.parse(["-a", "-l", "-h"]); // Separate flags
parser.parse(["-alh"]); // Combined flags
parser.parse(["-lah"]); // Order doesn't matter
parser.parse(["-al", "-h"]); // Partially combined

// Result: { all: true, long: true, human: true }
```

### Docker-style Example

```ts
const dockerParser = flags({
  tty: flag("-t", "--tty").boolean().describe("Allocate a pseudo-TTY"),
  interactive: flag("-i", "--interactive")
    .boolean()
    .describe("Keep STDIN open"),
  detach: flag("-d", "--detach").boolean().describe("Run in background"),
}).combineShortFlags();

// Docker-style combined flags
dockerParser.parse(["-ti"]); // { tty: true, interactive: true, detach: false }
dockerParser.parse(["-tid"]); // { tty: true, interactive: true, detach: true }
```

### Rules for Combined Flags

1. **Must enable feature**: Call `.combineShortFlags()` on the parser
2. **Only single-letter flags**: `-abc` works, but `-test` does not expand
3. **Only boolean flags**: All flags in the combination must be boolean type
4. **No equals syntax**: `-a=value` is not expanded (treated as single flag)
5. **All must exist**: If any letter is not a defined flag, the combination is not expanded

```ts
const parser = flags({
  all: flag("-a").boolean(),
  brief: flag("-b").boolean(),
  count: flag("-c").number(), // Not boolean!
}).combineShortFlags();

parser.parse(["-ab"]); // ✅ Works: { all: true, brief: true, count: null }
parser.parse(["-abc"]); // ❌ Throws: -c requires a value, cannot be combined
parser.parse(["-abx"]); // ❌ Throws: Unknown flag -x
```

## Complete Examples

### Basic CLI Tool

```ts
import { flags, flag, UnexpectedArgumentError } from "@jondotsoy/flags";

const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose logging"),
  output: flag("--output", "-o")
    .string()
    .default("dist")
    .describe("Output file path"),
  port: flag("--port", "-p")
    .number()
    .default(3000)
    .describe("Server port number"),
  help: flag("--help", "-h").boolean().describe("Show help message"),
})
  .program("mycli")
  .describe("A simple CLI tool");

try {
  const options = parser.parse(process.argv.slice(2));

  if (options.help) {
    console.log(parser.helpMessage());
    process.exit(0);
  }

  console.log("Starting with options:", options);
} catch (error) {
  if (error instanceof UnexpectedArgumentError) {
    console.error(`Error: ${error.message}`);
    console.log(parser.helpMessage());
    process.exit(1);
  }
  throw error;
}
```

### Multi-Command CLI (like npm/git)

```ts
import { flags, flag, command } from "@jondotsoy/flags";

const parser = flags({
  global: flag("--global", "-g").boolean().describe("Global mode"),
  verbose: flag("--verbose", "-v").boolean().describe("Verbose output"),
  build: command("build").restArgs().describe("Build the project"),
  test: command("test").restArgs().describe("Run tests"),
  serve: command("serve").restArgs().describe("Start dev server"),
})
  .program("mycli")
  .describe("Multi-command CLI tool");

const options = parser.parse(process.argv.slice(2));

if (options.build) {
  console.log("Building with args:", options.build);
  // Build logic here
} else if (options.test) {
  console.log("Testing with args:", options.test);
  // Test logic here
} else if (options.serve) {
  console.log("Serving with args:", options.serve);
  // Serve logic here
}

// Usage examples:
// mycli build --verbose
// mycli test src/**/*.test.ts
// mycli serve --port 8080
```

### File Processing Tool with Multiple Inputs

```ts
import { flags, flag, argument } from "@jondotsoy/flags";

const parser = flags({
  input: flag("--input", "-i").strings().describe("Input files"),
  output: flag("--output", "-o").string().describe("Output directory"),
  format: flag("--format", "-f")
    .string()
    .describe("Output format (json, yaml, xml)"),
  exclude: flag("--exclude").strings().describe("Exclude patterns"),
  recursive: flag("--recursive", "-r")
    .boolean()
    .describe("Process recursively"),
  dryRun: flag("--dry-run").boolean().describe("Dry run mode"),
  file: argument().string().describe("Input file (positional)"),
})
  .program("fileprocessor")
  .describe("Process files with various options");

const options = parser.parse(process.argv.slice(2));

// Usage: fileprocessor input.txt --input src/ --exclude node_modules --format json --output dist/
```

### Configuration with Key-Value Pairs

```ts
import { flags, flag } from "@jondotsoy/flags";

const parser = flags({
  env: flag("--env", "-e")
    .string()
    .default("development")
    .describe("Environment"),
  debug: flag("--debug", "-d").boolean().describe("Enable debug mode"),
  config: flag("--config", "-c")
    .keyValue()
    .describe("Configuration key-value pairs"),
  feature: flag("--feature").strings().describe("Enable features"),
})
  .program("myapp")
  .describe("Application with configuration");

const options = parser.parse(process.argv.slice(2));

console.log("Environment:", options.env);
console.log("Debug:", options.debug);
console.log("Config:", options.config);
console.log("Features:", options.feature);

// Usage: myapp --env production --config db=postgres --config port=5432 --feature auth --feature payments
// Result: {
//   env: "production",
//   debug: false,
//   config: { db: "postgres", port: "5432" },
//   feature: ["auth", "payments"]
// }
```

## Best Practices

### 1. Use the Fluent API

Chain methods for clear and concise flag definitions:

```ts
flag("--port", "-p")
  .number()
  .default(3000)
  .describe("Port number for the server");
```

### 2. Provide Defaults

Use `.default()` for sensible default values:

```ts
const parser = flags({
  port: flag("--port").number().default(3000),
  output: flag("--output").string().default("dist"),
  verbose: flag("--verbose").boolean(), // defaults to false
});
```

### 3. Add Descriptions

Use `.describe()` for automatic help generation:

```ts
const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
})
  .program("mycli")
  .describe("My CLI tool description");
```

### 4. Handle Errors Gracefully

Use `.safeParse()` to avoid try-catch boilerplate:

```ts
const [ok, error, options] = parser.safeParse(args);

if (!ok) {
  console.error(`Error: ${(error as Error).message}`);
  console.log(parser.helpMessage());
  process.exit(1);
}

// Use options
```

Or use `.parse()` with a try-catch block:

```ts
try {
  const options = parser.parse(args);
  // Use options
} catch (error) {
  if (error instanceof UnexpectedArgumentError) {
    console.error(`Error: ${error.message}`);
    console.log(parser.helpMessage());
    process.exit(1);
  }
  throw error;
}
```

### 5. Use Required for Mandatory Options

Mark required flags and arguments explicitly:

```ts
const parser = flags({
  output: flag("--output").string().required(),
  input: argument().string().required(),
});
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
const parser = flags({
  verbose: flag("--verbose", "-v").boolean(),
  port: flag("--port").number().default(3000),
});
const options = parser.parse(process.argv.slice(2));
```

#### From `commander`:

```ts
// Before (commander)
program
  .option("-v, --verbose", "verbose output")
  .option("-p, --port <port>", "port number", "3000")
  .parse();

// After (@jondotsoy/flags)
const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("verbose output"),
  port: flag("--port", "-p").number().default(3000).describe("port number"),
});
const options = parser.parse(process.argv.slice(2));
```

## FAQ

**Q: How do I handle subcommands like `git commit` or `npm install`?**

A: Use the `command()` builder with `.restArgs()`:

```ts
const parser = flags({
  commit: command("commit").restArgs(),
  install: command("install").restArgs(),
});
```

**Q: Can I have flags that don't require values?**

A: Yes! Use `.boolean()` for boolean flags:

```ts
flag("--verbose").boolean();
flag("--debug", "-d").boolean();
```

**Q: How do I validate flag values?**

A: Parse the result and validate after:

```ts
const options = parser.parse(args);
if (options.port && (options.port < 1 || options.port > 65535)) {
  throw new Error("Port must be between 1 and 65535");
}
```

**Q: Can I have the same flag appear multiple times?**

A: Yes! Use `.strings()` for string arrays:

```ts
flag("--include").strings();
// --include src --include lib → ["src", "lib"]
```

**Q: Can I combine short flags like `-abc`?**

A: Yes! Call `.combineShortFlags()` on the parser to enable automatic expansion of single-letter boolean flags:

```ts
const parser = flags({
  all: flag("-a").boolean(),
  brief: flag("-b").boolean(),
  color: flag("-c").boolean(),
}).combineShortFlags();

parser.parse(["-abc"]); // { all: true, brief: true, color: true }
```

Note: This only works for single-letter boolean flags. Flags with values or multi-letter flags are not expanded.

**Q: How do I handle key-value pairs?**

A: Use `.keyValue()`:

```ts
flag("--config").keyValue();
// --config db=postgres --config port=5432 → { db: "postgres", port: "5432" }
```

## License

MIT - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
name: flags-builder
description: "Use when building or extending a CLI tool that reads process.argv. Triggers for: defining --flags or -f aliases, parsing boolean/string/number/repeated flags, supporting subcommands with independent flag sets, adding defaults or required validation to CLI inputs, or any mention of 'parse argv', 'command-line flags', or argument parsing in a Node.js/TypeScript context."
---

# @jondotsoy/flags

A zero-dependency, type-safe CLI argument parser with a fluent builder API.

## Overview

### What this skill is for

Use this skill whenever the task involves **parsing command-line arguments** in a Node.js or TypeScript program. It covers the full lifecycle: reading `process.argv`, defining typed flags, handling subcommands, and validating inputs.

### When to use it

Trigger this skill when the user's request matches one of these scenarios:

**Building a CLI tool from scratch**

> "I want to create a CLI that accepts `--port` and `--verbose`"
> "Make a script that reads arguments from the terminal"

**Adding flags to an existing script**

> "Add a `--dry-run` flag to my deploy script"
> "Support `--output=dist` in my build tool"

**Parsing subcommands**

> "My CLI needs `serve` and `build` commands, each with their own flags"
> "How do I parse `mycli deploy --env production`?"

**Handling repeated or typed inputs**

> "I need `--tag` to be repeatable"
> "Validate that `--port` is a number and defaults to 3000"

**User phrases that signal this skill**

- "parse argv", "read CLI args", "command-line flags"
- "how do I get `--flag` from `process.argv`"
- mentions of `--flag`, `-f`, subcommands, or argument parsing in a Node.js/TypeScript context

### When NOT to use it

- The project already uses another parser (e.g. `yargs`, `commander`, `minimist`) — prefer extending the existing setup
- Arguments come from a config file, environment variables, or an HTTP request — this library is specifically for `argv`

## Getting Started

```ts
import { flags, flag, command } from "@jondotsoy/flags";

const args = process.argv.slice(2); // remove "node" and script path

const parser = flags({ ... });
const [ok, error, options] = parser.safeParse(args);
if (!ok) { console.error(parser.formatError(error)); process.exit(1); }
```

## Flag Types

All input styles are supported automatically — no extra config needed:

```ts
const parser = flags({
  verbose: flag("--verbose", "-v").boolean(), // --verbose
  version: flag("--version").number(),        // --version 1.2
  name:    flag("--name", "-n").string(),     // --name foo  OR  --name=foo
});

const [ok, error, output] = parser.safeParse(args);
if (!ok) { console.error(parser.formatError(error)); process.exit(1); }

const { verbose, version, name } = output;
```

### `.boolean()`

Presence of the flag sets the value to `true`. Default: `false`.

```ts
flag("--verbose", "-v").boolean();
// --verbose       → true
// (absent)        → false
```

### `.string()`

Reads the next token or the value after `=`. Returns `string | null` (null if absent).

```ts
flag("--name", "-n").string();
// --name foo      → "foo"
// --name=foo      → "foo"
// (absent)        → null
```

### `.number()`

Like `.string()` but coerces the value to a number. Returns `number | null`.

```ts
flag("--port", "-p").number();
// --port 3000     → 3000
// --port=3000     → 3000
// (absent)        → null
```

### `.strings()`

Accumulates repeated flags into an array. Returns `string[]` (always an array, never null).

```ts
flag("--tag").strings();
// --tag a --tag b --tag c   → ["a", "b", "c"]
// (absent)                  → []
```

### `.keyValue()`

Reads `key=value` pairs and merges them into a record. Returns `Record<string, string> | null`.

```ts
flag("--env").keyValue();
// --env NODE_ENV=production --env PORT=3000   → { NODE_ENV: "production", PORT: "3000" }
// (absent)                                    → null
```

## Modifiers

Chain modifiers after the type method:

```ts
flag("--port", "-p").number().default(3000);   // default value
flag("--output").string().required();           // throw if missing
flag("--tag").strings();                        // accumulate: --tag a --tag b → ["a", "b"]
flag("--count").number().positive();            // must be > 0
flag("--port").number().describe("HTTP port"); // help text
```

## Subcommands — Multi-Parser Pattern

Use `command().restArgs()` to capture a subcommand's raw arguments, then run a second `.safeParse()` on them:

```ts
import { flags, flag, command } from "@jondotsoy/flags";

// Level 1: identify which subcommand was used
const mainParser = flags({
  serve: command("serve").restArgs(),
});

const [ok, error, output] = mainParser.safeParse(process.argv.slice(2));
if (!ok) { console.error(mainParser.formatError(error)); process.exit(1); }

// Level 2: parse the subcommand's own flags
if (output.serve) {
  const serveParser = flags({
    port: flag("--port", "-p").number().default(3000),
  });

  const [ok2, error2, serveOutput] = serveParser.safeParse(output.serve);
  if (!ok2) { console.error(serveParser.formatError(error2)); process.exit(1); }

  startServer(serveOutput.port);
}
```

This pattern scales to any number of subcommands:

```ts
const mainParser = flags({
  build:  command("build").restArgs(),
  deploy: command("deploy").restArgs(),
});

const [ok, error, output] = mainParser.safeParse(process.argv.slice(2));
if (!ok) { console.error(mainParser.formatError(error)); process.exit(1); }

if (output.build) {
  const buildParser = flags({ outDir: flag("--out").string().default("dist") });
  const [ok2, error2, buildOutput] = buildParser.safeParse(output.build);
  if (!ok2) { console.error(buildParser.formatError(error2)); process.exit(1); }
}

if (output.deploy) {
  const deployParser = flags({ env: flag("--env").string().required() });
  const [ok2, error2, deployOutput] = deployParser.safeParse(output.deploy);
  if (!ok2) { console.error(deployParser.formatError(error2)); process.exit(1); }
}
```

## Recommended File Structure (Large Projects)

> **This is a recommendation, not a requirement.** Always ask the user before applying this structure — it may not fit every project.

As a program grows, putting all parsers in a single file becomes hard to maintain. The recommended approach is to split each parser into its own file under `src/args/`, mirroring the command hierarchy.

```
src/args/
  main.ts           ← top-level parser (subcommands)
  serve.ts          ← flags for `serve` subcommand
  containers/
    main.ts         ← flags for `containers` subcommand
    pull.ts         ← flags for `containers pull`
    push.ts         ← flags for `containers push`
```

Each file exports a named `parser` constant. The name should be descriptive of the command it handles:

```ts
// src/args/main.ts
import { flags, command } from "@jondotsoy/flags";

export const mainParserArgs = flags({
  serve:      command("serve").restArgs(),
  containers: command("containers").restArgs(),
});
```

```ts
// src/args/serve.ts
import { flags, flag } from "@jondotsoy/flags";

export const serveParserArgs = flags({
  port: flag("--port", "-p").number().default(3000),
  host: flag("--host").string().default("localhost"),
});
```

```ts
// src/args/containers/main.ts
import { flags, command } from "@jondotsoy/flags";

export const containersParserArgs = flags({
  pull: command("pull").restArgs(),
  push: command("push").restArgs(),
});
```

Consuming parsers in the entry point:

```ts
import { mainParserArgs } from "./args/main.js";
import { serveParserArgs } from "./args/serve.js";
import { containersParserArgs } from "./args/containers/main.js";

const [ok, error, output] = mainParserArgs.safeParse(process.argv.slice(2));
if (!ok) { console.error(mainParserArgs.formatError(error)); process.exit(1); }

if (output.serve) {
  const [ok2, error2, serveOutput] = serveParserArgs.safeParse(output.serve);
  if (!ok2) { console.error(serveParserArgs.formatError(error2)); process.exit(1); }
}

if (output.containers) {
  const [ok2, error2, containersOutput] = containersParserArgs.safeParse(output.containers);
  if (!ok2) { console.error(containersParserArgs.formatError(error2)); process.exit(1); }
}
```

**When to suggest this structure:**

- The program has 3 or more subcommands
- Each subcommand has its own set of flags
- The codebase is expected to grow or be maintained long-term

**When to keep it simple (single file):**

- Small scripts with 1–2 flags and no subcommands
- Throwaway or single-use tools

## Help Message

Call `.helpMessage()` on any parser to get a formatted help string. Use `.program()`, `.describe()`, and `.version()` to populate it, and add `.describe()` to individual flags for per-flag documentation.

```ts
const parser = flags({
  port:    flag("--port", "-p").number().default(3000).describe("Port to listen on"),
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
  output:  flag("--output", "-o").string().required().describe("Output directory"),
})
  .program("mycli")
  .describe("A simple CLI tool")
  .version("1.0.0");

console.log(parser.helpMessage());
```

Typical output:

```
mycli 1.0.0

A simple CLI tool

Options:
  --port, -p      Port to listen on (default: 3000)
  --verbose, -v   Enable verbose output
  --output, -o    Output directory (required)
```

### Common pattern — print help on `--help`

```ts
const [ok, error, output] = parser.safeParse(process.argv.slice(2));
if (!ok) { console.error(parser.formatError(error)); process.exit(1); }

if (output.help) {
  console.log(parser.helpMessage());
  process.exit(0);
}
```

### With the file structure pattern

Each sub-parser can expose its own help message independently:

```ts
// src/args/serve.ts
export const serveParserArgs = flags({
  port: flag("--port", "-p").number().default(3000).describe("Port to listen on"),
  host: flag("--host").string().default("localhost").describe("Host to bind"),
})
  .program("mycli serve")
  .describe("Start the development server");
```

```ts
if (output.serve) {
  const [ok2, error2, serveOutput] = serveParserArgs.safeParse(output.serve);
  if (!ok2) { console.error(serveParserArgs.formatError(error2)); process.exit(1); }
}
```

## Safe Parse

> **Prefer `.safeParse()` over `.parse()`** — it makes error handling explicit and avoids unexpected exceptions propagating through the program.

`.safeParse()` returns a tuple `[ok, error, output]`. When `ok` is `false`, `output` is `undefined` and `error` contains the caught value. When `ok` is `true`, `output` is the fully typed result.

```ts
const [ok, error, output] = parser.safeParse(process.argv.slice(2));

if (!ok) {
  console.error(parser.formatError(error));
  process.exit(1);
}

const port = output.port; // fully typed, no undefined check needed
```

**Tuple shape:**

| Position | Name | Value when ok | Value when error |
|---|---|---|---|
| `[0]` | `ok` | `true` | `false` |
| `[1]` | `error` | `undefined` | the caught error (`unknown`) |
| `[2]` | `output` | parsed result (fully typed) | `undefined` |

### When to use `.parse()` instead

Use `.parse()` only when you intentionally want to skip error handling — for example in quick scripts or tests where an unhandled exception is acceptable:

```ts
// ok for tests or throwaway scripts
const output = parser.parse(["--port", "3000"]);
```

Never use `.parse()` in production CLI entry points — prefer `.safeParse()` there.

## Error Handling

Use `parser.formatError(error)` to get a formatted message that includes the error and a hint to run `--help`. For advanced cases, the `error` value can also be narrowed with the exported error classes:

```ts
import { UnexpectedArgumentError, RequiredFlagMissingError } from "@jondotsoy/flags";

const [ok, error, output] = parser.safeParse(process.argv.slice(2));

if (!ok) {
  console.error(parser.formatError(error));
  process.exit(1);
}
```

Narrowing for specific messages:

```ts
if (!ok) {
  if (error instanceof UnexpectedArgumentError) console.error("Unknown argument:", error.message);
  else if (error instanceof RequiredFlagMissingError) console.error("Missing required flag:", error.message);
  else console.error(parser.formatError(error));
  process.exit(1);
}
```

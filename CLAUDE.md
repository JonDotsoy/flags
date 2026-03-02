# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
bun test

# Run a single test file
bun test src/FlagsParser.spec.ts

# Build (CJS + ESM + types)
make

# Format code
bun run fmt

# Individual build targets
make build@cjs
make build@esm
make build@types
```

## Architecture

`@jondotsoy/flags` is a zero-dependency TypeScript CLI argument parser library with a fluent builder API.

### Core Flow

1. User creates builders via aliases: `flag()`, `argument()`, `command()`
2. Builders are passed as a schema to `flags(schema)` → `FlagsParser`
3. `FlagsParser.parse(args)` or `safeParse(args)` iterates args, delegating to each builder
4. Each builder delegates to its `Spec`, which runs **refiners** (in sequence) to match/extract values
5. If a flag appears multiple times, an **accumulator** combines the values

### Key Files

- `src/flags.ts` — public API, re-exports everything
- `src/FlagsParser.ts` — main parser class (`parse`, `safeParse`, `helpMessage`)
- `src/builders/Spec.ts` — immutable spec holder; orchestrates refiners and accumulators
- `src/builders/` — `FlagBuilder`, `ArgumentBuilder`, `CommandBuilder` and their typed variants
- `src/builders/refiners/` — pure functions that match args and extract values
- `src/builders/accumulates/` — pure functions that combine multiple parsed values
- `src/errors/` — `FlagsParseError`, `RequiredFlagMissingError`, `RequiredArgumentMissingError`, `UnexpectedArgumentError`
- `src/aliases/` — `flag()`, `command()`, `argument()`, `flags()` convenience wrappers

### Builder Pattern

Each builder type extends the abstract `Builder` class and holds an immutable `Spec`. Mutating methods (e.g., `.string()`, `.required()`, `.default()`) return new `Spec` instances — they never mutate in place.

### Build Outputs

The Makefile compiles three formats from `src/`:
- `lib/cjs/` — CommonJS (ES2018 target)
- `lib/esm/` — ESM (ES2022 target)
- `lib/types/` — TypeScript declarations only

Each output directory gets its own `package.json` with the correct `"type"` field.

### Testing

Tests use Bun's built-in test runner. Test files are `*.spec.ts`, colocated with source files. Snapshots live in `__snapshots__/` directories.

### Git Workflow

- `develop` branch triggers release-please CI which auto-generates release PRs
- Merging release PRs to `main` publishes to npm

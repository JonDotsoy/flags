---
name: flags-test
description: Create and run tests for the @jondotsoy/flags project. Use when asked to write tests, add test cases, run the test suite, debug failing tests, or verify behavior of flags/argument/command builders.
compatibility: Requires bun runtime
---

## Overview

This skill helps write and run tests for `@jondotsoy/flags`, a TypeScript CLI argument parser library. Tests use Bun's built-in test runner.

## Running Tests

```bash
# Run all tests
bun test

# Run a single test file
bun test src/FlagsParser.spec.ts

# Run only failing tests
bun test --only-failures

# Filter by test name
bun test --only-failures --test-name-pattern="<pattern>"
```

## Writing Tests

### File placement

Test files are `*.spec.ts`, colocated with the source file they test:

```
src/
  FlagsParser.ts
  FlagsParser.spec.ts        ← test file lives next to source
  builders/
    FlagBuilder.ts
    FlagBuilder.spec.ts
```

### Test structure

Use `bun:test` imports. Follow the `describe` / `it` / `expect` pattern:

```typescript
import { describe, it, expect } from "bun:test";
import { flags, flag, argument, command } from "./flags.js";

describe("FeatureName", () => {
  describe("method or scenario", () => {
    it("should do X when Y", () => {
      // arrange
      const parser = flags({ verbose: flag().boolean() });

      // act
      const result = parser.parse(["--verbose"]);

      // assert
      expect(result.verbose).toBe(true);
    });
  });
});
```

### Importing

Always import from `.js` extensions (ESM convention):

```typescript
import { flags } from "./flags.js";
import { FlagsParser } from "./FlagsParser.js";
import { FlagBuilder } from "./builders/FlagBuilder.js";
import { ArgumentBuilder } from "./builders/ArgumentBuilder.js";
import { CommandBuilder } from "./builders/CommandBuilder.js";
```

### Testing parse results

```typescript
// Boolean flags
expect(parser.parse(["--verbose"]).verbose).toBe(true);

// String flags
expect(parser.parse(["--name", "Alice"]).name).toBe("Alice");

// Missing required flag throws
expect(() => parser.parse([])).toThrow();

// safeParse returns errors instead of throwing
const result = parser.safeParse([]);
expect(result.success).toBe(false);
```

### Testing error cases

```typescript
import { FlagsParseError } from "./errors/FlagsParseError.js";
import { RequiredFlagMissingError } from "./errors/RequiredFlagMissingError.js";

it("should throw when required flag is missing", () => {
  const parser = flags({ name: flag().string().required() });
  expect(() => parser.parse([])).toThrow(RequiredFlagMissingError);
});
```

### Snapshot testing

Use `toMatchSnapshot()` for complex outputs like help messages:

```typescript
it("should render help message", () => {
  const parser = flags({ verbose: flag().boolean() });
  expect(parser.helpMessage()).toMatchSnapshot();
});
```

Snapshots are stored in `__snapshots__/` next to the spec file. Update them with:

```bash
bun test --update-snapshots
```

## Workflow

1. Identify the source file to test (e.g. `src/builders/FlagBuilder.ts`)
2. Check if a `*.spec.ts` file already exists alongside it
3. If it exists, read it before adding new tests to match existing style
4. Write tests covering: happy path, edge cases, error cases
5. Run `bun test <file>` to verify they pass
6. Run `bun test` to confirm no regressions

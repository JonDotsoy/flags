---
inclusion: fileMatch
fileMatchPattern: ['**/*.spec.ts', 'src/new-flags.ts']
---

## Test-Driven Development

This project follows TDD. When adding features:

1. Write tests in `src/new-flags.spec.ts` BEFORE implementing in `src/new-flags.ts`
2. Validate both TypeScript type inference and runtime behavior

## Testing Framework

Use Bun's test framework:

```ts
import { describe, it, expect, expectTypeOf } from "bun:test";
```

## Test Structure

Structure tests with Gherkin-style comments (Given/When/Then):

```ts
describe("feature name", () => {
  it("should describe expected behavior", () => {
    // Given: Setup the parser configuration
    const flagsParser = flags({ /* config */ });

    // When: Parse the arguments
    const result = flagsParser.parse([ /* args */ ]);

    // Then: Validate TypeScript types
    expectTypeOf(result).toEqualTypeOf<{ /* expected type */ }>();

    // Then: Validate runtime values
    expect(result).toEqual({ /* expected values */ });
  });
});
```

**Gherkin Guidelines:**
- **Given**: Set up initial state (parser config, test data)
- **When**: Execute the action (parse arguments, call methods)
- **Then**: Assert outcomes (types and values)

## Testing Requirements

- Test type inference with `expectTypeOf()` for TypeScript correctness
- Test runtime behavior with `expect()` for value correctness
- Use snapshot testing for complex outputs (help messages)
- Cover edge cases: missing flags, defaults, errors
- Test both long (`--flag`) and short (`-f`) syntax
- Test both space (`--flag value`) and equals (`--flag=value`) syntax

## Type Checking

Always verify tests pass TypeScript compilation:

```bash
bunx tsc --noEmit src/new-flags.spec.ts
```

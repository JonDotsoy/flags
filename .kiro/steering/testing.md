---
inclusion: fileMatch
fileMatchPattern: ["**/*.spec.ts", "src/new-flags.ts"]
---

## Test-Driven Development Pattern

This project follows a test-first approach. When adding new features or scenarios:

1. Write tests in `src/new-flags.spec.ts` BEFORE implementing code in `src/new-flags.ts`
2. Tests validate both runtime behavior and TypeScript type inference

## Testing Framework

Use Bun's built-in test framework:

```ts
import { describe, it, expect, expectTypeOf } from "bun:test";
```

## Test Structure with Gherkin Syntax

Use Gherkin-style comments (Given/When/Then) to structure tests clearly:

```ts
describe("feature name", () => {
  it("should describe expected behavior", () => {
    // Given: Setup the parser configuration
    const flagsParser = flags({
      /* config */
    });

    // When: Parse the arguments
    const result = flagsParser.parse([
      /* args */
    ]);

    // Then: Validate TypeScript types
    expectTypeOf(result).toEqualTypeOf<{
      /* expected type */
    }>();

    // Then: Validate runtime values
    expect(result).toEqual({
      /* expected values */
    });
  });
});
```

### Gherkin Pattern Guidelines

- **Given**: Set up the initial state (parser configuration, test data)
- **When**: Execute the action being tested (parse arguments, call methods)
- **Then**: Assert the expected outcomes (types and values)
- Use multiple "Then" statements for type and value assertions
- Keep each section focused and clear

## Key Testing Principles

- Test type inference with `expectTypeOf()` to ensure correct TypeScript types
- Test runtime behavior with `expect()` to ensure correct values
- Use snapshot testing for complex outputs like help messages
- Cover edge cases: missing flags, default values, error conditions
- Test both long (`--flag`) and short (`-f`) flag syntax
- Test both space (`--flag value`) and equals (`--flag=value`) syntax

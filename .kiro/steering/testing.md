---
inclusion: fileMatch
fileMatchPattern: ["src/builders/**/*.ts", "**/*.spec.ts"]
---

## Builder Architecture

Builders are immutable classes that transform and extract values from command-line arguments.

### Core Patterns

- All builders follow the template pattern defined in `src/builders/TemplateBuilder.ts`
- Builders are immutable - once constructed, they cannot be modified
- Use the pipe pattern to chain refiners for argument validation

### Key Components

#### Spec (`src/builders/Spec.ts`)

Defines the builder specification. Contains the list of refiners to apply during parsing.

#### Refiners (`src/builders/refiners/*Refine.ts`)

- Validate argument values during parsing
- Return `null` when validation fails
- Applied in sequence (pipe pattern) - processing stops when any refiner returns `null`
- Reference: `src/builders/refiners/templateRefine.ts`

#### Accumulators (`src/builders/accumulates/*Accumulate.ts`)

- Accumulate argument values across multiple inputs
- Not used directly by builders - used for reusability when accumulating similar values
- Reference: `src/builders/accumulates/templateAccumulate.ts`

#### Builder Files (`src/builders/*Builder.ts`)

- Provide utility methods for defining builders with readable, developer-friendly APIs
- All builders are based on `src/builders/TemplateBuilder.ts`

### Testing

Run tests with: `bun test --only-failures`

Filter specific tests: `bun test --only-failures --test-name-pattern="<pattern>"`

Example: `bun test --only-failures --test-name-pattern="helpMessage"`

# `getSpecs()` - Metadata Extraction

Extract metadata (descriptions, categories, names) from parsing rules for programmatic access. This is useful for generating custom help messages, validation, or introspection of your CLI configuration.

## Syntax

```ts
getSpecs(rules: Rule<any>[]): Generator<Spec>
```

## Parameters

- `rules: Rule<any>[]` - Array of rules to extract specs from

## Returns

`Generator<Spec>` - Generator that yields spec objects containing metadata

## Spec Object

```ts
interface Spec {
  names?: string[]; // Flag/command names (e.g., ["--verbose", "-v"])
  category?: string; // Category for grouping (e.g., "Debug Options")
  description?: string; // Help text description
}
```

## Basic Usage

### Extracting All Metadata

```ts
import { getSpecs, rule, flag, describe, isBooleanAt } from "@jondotsoy/flags";

const rules = [
  rule(
    describe(flag("--verbose", "-v"), {
      category: "Debug",
      description: "Enable verbose output",
    }),
    isBooleanAt("verbose"),
  ),

  rule(
    describe(flag("--output", "-o"), {
      category: "Output",
      description: "Specify output file",
    }),
    isStringAt("output"),
  ),
];

// Extract all specs
for (const spec of getSpecs(rules)) {
  console.log("Names:", spec.names);
  console.log("Category:", spec.category);
  console.log("Description:", spec.description);
  console.log("---");
}

// Output:
// Names: ["--verbose", "-v"]
// Category: Debug
// Description: Enable verbose output
// ---
// Names: ["--output", "-o"]
// Category: Output
// Description: Specify output file
// ---
```

### Converting to Array

```ts
// Convert generator to array
const allSpecs = Array.from(getSpecs(rules));

console.log(`Found ${allSpecs.length} rules with metadata`);

// Filter by category
const debugSpecs = allSpecs.filter((spec) => spec.category === "Debug");
```

## Common Use Cases

### Custom Help Generation

```ts
function generateCustomHelp(rules: Rule<any>[]): string {
  const specsByCategory = new Map<string, typeof specs>();

  // Group specs by category
  for (const spec of getSpecs(rules)) {
    const category = spec.category || "Other";

    if (!specsByCategory.has(category)) {
      specsByCategory.set(category, []);
    }

    specsByCategory.get(category)!.push(spec);
  }

  // Generate help sections
  let help = "Usage: myapp [options]\n\n";

  for (const [category, specs] of specsByCategory) {
    help += `${category}:\n`;

    for (const spec of specs) {
      const names = spec.names?.join(", ") || "";
      const description = spec.description || "";
      help += `  ${names.padEnd(20)} ${description}\n`;
    }

    help += "\n";
  }

  return help;
}

const customHelp = generateCustomHelp(rules);
console.log(customHelp);
```

### Configuration Validation

```ts
function validateConfiguration(rules: Rule<any>[]): string[] {
  const errors: string[] = [];

  for (const spec of getSpecs(rules)) {
    // Check if all rules have descriptions
    if (!spec.description) {
      const names = spec.names?.join(", ") || "unknown";
      errors.push(`Rule ${names} is missing a description`);
    }

    // Check if categories are consistent
    if (
      spec.category &&
      !["Debug", "Input", "Output"].includes(spec.category)
    ) {
      errors.push(`Unknown category: ${spec.category}`);
    }

    // Check naming conventions
    if (spec.names) {
      for (const name of spec.names) {
        if (name.startsWith("--") && name.includes("_")) {
          errors.push(`Flag ${name} should use kebab-case, not snake_case`);
        }
      }
    }
  }

  return errors;
}

const validationErrors = validateConfiguration(rules);
if (validationErrors.length > 0) {
  console.error("Configuration issues:");
  validationErrors.forEach((error) => console.error(`  - ${error}`));
}
```

### Documentation Generation

````ts
function generateMarkdownDocs(rules: Rule<any>[]): string {
  let markdown = "# CLI Documentation\n\n";

  const categories = new Map<string, typeof specs>();

  // Group by category
  for (const spec of getSpecs(rules)) {
    const category = spec.category || "General";

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push(spec);
  }

  // Generate sections
  for (const [category, specs] of categories) {
    markdown += `## ${category}\n\n`;

    for (const spec of specs) {
      const names = spec.names?.join(", ") || "";
      markdown += `### \`${names}\`\n\n`;

      if (spec.description) {
        markdown += `${spec.description}\n\n`;
      }

      markdown += "```bash\n";
      markdown += `myapp ${names.split(",")[0]} [value]\n`;
      markdown += "```\n\n";
    }
  }

  return markdown;
}

const docs = generateMarkdownDocs(rules);
console.log(docs);
````

### Statistics and Analysis

```ts
function analyzeRules(rules: Rule<any>[]): void {
  const stats = {
    totalRules: 0,
    rulesWithDescriptions: 0,
    rulesWithCategories: 0,
    categoryCounts: new Map<string, number>(),
    flagTypes: {
      longOnly: 0, // --flag
      shortOnly: 0, // -f
      both: 0, // --flag, -f
    },
  };

  for (const spec of getSpecs(rules)) {
    stats.totalRules++;

    if (spec.description) {
      stats.rulesWithDescriptions++;
    }

    if (spec.category) {
      stats.rulesWithCategories++;

      const count = stats.categoryCounts.get(spec.category) || 0;
      stats.categoryCounts.set(spec.category, count + 1);
    }

    if (spec.names) {
      const hasLong = spec.names.some((name) => name.startsWith("--"));
      const hasShort = spec.names.some(
        (name) => name.startsWith("-") && !name.startsWith("--"),
      );

      if (hasLong && hasShort) {
        stats.flagTypes.both++;
      } else if (hasLong) {
        stats.flagTypes.longOnly++;
      } else if (hasShort) {
        stats.flagTypes.shortOnly++;
      }
    }
  }

  console.log("CLI Analysis:");
  console.log(`  Total rules: ${stats.totalRules}`);
  console.log(`  Rules with descriptions: ${stats.rulesWithDescriptions}`);
  console.log(`  Rules with categories: ${stats.rulesWithCategories}`);
  console.log(`  Flag types:`, stats.flagTypes);
  console.log(`  Categories:`, Object.fromEntries(stats.categoryCounts));
}

analyzeRules(rules);
```

## Advanced Examples

### Interactive Help Builder

```ts
function buildInteractiveHelp(rules: Rule<any>[]): void {
  const categories = new Map<string, any[]>();

  // Group specs by category
  for (const spec of getSpecs(rules)) {
    const category = spec.category || "Other";

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push(spec);
  }

  console.log("Available categories:");
  const categoryList = Array.from(categories.keys());
  categoryList.forEach((cat, i) => console.log(`  ${i + 1}. ${cat}`));

  // In a real implementation, you'd use readline or inquirer
  // to let users select categories and get filtered help
}
```

### Configuration File Generator

```ts
function generateConfigTemplate(rules: Rule<any>[]): any {
  const config: any = {};

  for (const spec of getSpecs(rules)) {
    if (spec.names) {
      // Use the first long flag name as the config key
      const longFlag = spec.names.find((name) => name.startsWith("--"));

      if (longFlag) {
        const key = longFlag.slice(2).replace(/-/g, "");
        config[key] = {
          description: spec.description,
          category: spec.category,
          // Add default value based on flag type (would need more analysis)
          default: null,
        };
      }
    }
  }

  return config;
}

const configTemplate = generateConfigTemplate(rules);
console.log(JSON.stringify(configTemplate, null, 2));
```

## Working with Generators

Since `getSpecs()` returns a generator, you can use it efficiently:

```ts
// Process one at a time (memory efficient)
for (const spec of getSpecs(rules)) {
  processSpec(spec);
}

// Convert to array (loads all into memory)
const allSpecs = Array.from(getSpecs(rules));

// Use generator methods
const descriptions = Array.from(getSpecs(rules))
  .map((spec) => spec.description)
  .filter(Boolean);

// Find first match
function findSpecByCategory(rules: Rule<any>[], category: string) {
  for (const spec of getSpecs(rules)) {
    if (spec.category === category) {
      return spec;
    }
  }
  return null;
}
```

## Testing `getSpecs()`

```ts
import { describe, test, expect } from "bun:test";
import {
  getSpecs,
  rule,
  flag,
  describe as desc,
  isBooleanAt,
} from "@jondotsoy/flags";

describe("getSpecs() function", () => {
  test("should extract metadata from rules", () => {
    const rules = [
      rule(
        desc(flag("--verbose", "-v"), {
          category: "Debug",
          description: "Enable verbose output",
        }),
        isBooleanAt("verbose"),
      ),
    ];

    const specs = Array.from(getSpecs(rules));

    expect(specs).toHaveLength(1);
    expect(specs[0].names).toEqual(["--verbose", "-v"]);
    expect(specs[0].category).toBe("Debug");
    expect(specs[0].description).toBe("Enable verbose output");
  });

  test("should handle rules without metadata", () => {
    const rules = [rule(flag("--simple"), isBooleanAt("simple"))];

    const specs = Array.from(getSpecs(rules));

    expect(specs).toHaveLength(1);
    expect(specs[0].names).toEqual(["--simple"]);
    expect(specs[0].category).toBeUndefined();
    expect(specs[0].description).toBeUndefined();
  });

  test("should work as generator", () => {
    const rules = [
      rule(desc(flag("--one"), { description: "First" }), isBooleanAt("one")),
      rule(desc(flag("--two"), { description: "Second" }), isBooleanAt("two")),
    ];

    const generator = getSpecs(rules);

    const first = generator.next();
    expect(first.done).toBe(false);
    expect(first.value.description).toBe("First");

    const second = generator.next();
    expect(second.done).toBe(false);
    expect(second.value.description).toBe("Second");

    const third = generator.next();
    expect(third.done).toBe(true);
  });
});
```

## Performance Considerations

`getSpecs()` is a generator function, making it memory-efficient for large rule sets:

```ts
// Memory efficient - processes one at a time
for (const spec of getSpecs(largeRuleSet)) {
  if (spec.category === "target") {
    return spec; // Can exit early
  }
}

// Less efficient - loads everything into memory
const allSpecs = Array.from(getSpecs(largeRuleSet));
const targetSpec = allSpecs.find((spec) => spec.category === "target");
```

## Related APIs

- [`describe()`](./describe.md) - Add metadata to test functions
- [`makeHelpMessage()`](./make-help-message.md) - Built-in help generation using specs
- [`rule()`](./rule.md) - Create parsing rules
- [`flag()`](./flag.md) - Test function that can be decorated with describe()

## Real-World Example

```ts
// CLI configuration validator
export function validateCLIConfiguration(rules: Rule<any>[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenNames = new Set<string>();
  const categories = new Set<string>();

  for (const spec of getSpecs(rules)) {
    // Check for duplicate flag names
    if (spec.names) {
      for (const name of spec.names) {
        if (seenNames.has(name)) {
          errors.push(`Duplicate flag name: ${name}`);
        }
        seenNames.add(name);
      }
    }

    // Collect categories
    if (spec.category) {
      categories.add(spec.category);
    }

    // Check for missing descriptions
    if (!spec.description) {
      warnings.push(
        `Missing description for: ${spec.names?.join(", ") || "unknown"}`,
      );
    }

    // Check description quality
    if (spec.description && spec.description.length < 10) {
      warnings.push(`Description too short for: ${spec.names?.join(", ")}`);
    }
  }

  // Check category consistency
  if (categories.size > 10) {
    warnings.push(
      `Too many categories (${categories.size}). Consider consolidating.`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

The `getSpecs()` function is essential for building sophisticated CLI tools that need to introspect their own configuration, generate custom documentation, or validate their setup programmatically.

# `isArrayStringAt()` - Flag Handler

Set a property to an array of string values, allowing the same flag to be used multiple times or accepting comma-separated values. This handler is perfect for flags like `--include file1 --include file2` or `--tags tag1,tag2,tag3`.

## Syntax

```ts
isArrayStringAt<T>(propName: keyof T): Handler<T>
```

## Parameters

- `propName: keyof T` - The property name in your options object to set to the string array

## Returns

`Handler<T>` - A handler function that accumulates string values into an array

## Basic Usage

### Multiple Flag Usage

```ts
import { rule, flag, isArrayStringAt } from "@jondotsoy/flags";

interface Options {
  files: string[];
}

const filesRule = rule(flag("--file", "-f"), isArrayStringAt("files"));

// Usage: --file src.js --file test.js --file config.js
// Result: { files: ["src.js", "test.js", "config.js"] }

// Usage: -f main.ts -f utils.ts
// Result: { files: ["main.ts", "utils.ts"] }
```

### Multiple Array Flags

```ts
interface BuildOptions {
  include: string[];
  exclude: string[];
  plugins: string[];
  externals: string[];
}

const rules = [
  rule(flag("--include", "-I"), isArrayStringAt("include")),
  rule(flag("--exclude", "-E"), isArrayStringAt("exclude")),
  rule(flag("--plugin", "-p"), isArrayStringAt("plugins")),
  rule(flag("--external"), isArrayStringAt("externals")),
];

// Usage: build --include src/ --include lib/ --exclude test/ --plugin minify --plugin gzip
// Result: { include: ["src/", "lib/"], exclude: ["test/"], plugins: ["minify", "gzip"] }
```

## Common Use Cases

### File and Path Lists

```ts
interface FileOptions {
  input: string[];
  output: string[];
  watch: string[];
  ignore: string[];
}

const rules = [
  rule(flag("--input", "-i"), isArrayStringAt("input")),
  rule(flag("--output", "-o"), isArrayStringAt("output")),
  rule(flag("--watch", "-w"), isArrayStringAt("watch")),
  rule(flag("--ignore"), isArrayStringAt("ignore")),
];

// Usage: processor -i file1.txt -i file2.txt -w src/ -w lib/ --ignore node_modules/
```

### Tag and Label Systems

```ts
interface ContentOptions {
  tags: string[];
  categories: string[];
  keywords: string[];
  authors: string[];
}

const rules = [
  rule(flag("--tag", "-t"), isArrayStringAt("tags")),
  rule(flag("--category", "-c"), isArrayStringAt("categories")),
  rule(flag("--keyword", "-k"), isArrayStringAt("keywords")),
  rule(flag("--author", "-a"), isArrayStringAt("authors")),
];

// Usage: publish -t javascript -t nodejs -c tutorial -a john -a jane
```

### Build System Dependencies

```ts
interface BuildDeps {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
  optionalDependencies: string[];
}

const rules = [
  rule(flag("--dep", "-d"), isArrayStringAt("dependencies")),
  rule(flag("--dev-dep"), isArrayStringAt("devDependencies")),
  rule(flag("--peer-dep"), isArrayStringAt("peerDependencies")),
  rule(flag("--optional-dep"), isArrayStringAt("optionalDependencies")),
];

// Usage: install -d react -d lodash --dev-dep typescript --dev-dep jest
```

## Array Accumulation Behavior

### Multiple Occurrences

```ts
const tagsRule = rule(flag("--tag"), isArrayStringAt("tags"));

// Each flag occurrence adds to the array
// --tag javascript --tag nodejs --tag react
// Result: { tags: ["javascript", "nodejs", "react"] }
```

### Order Preservation

```ts
// The order of flags is preserved in the array
// --file first.js --file second.js --file third.js
// Result: { files: ["first.js", "second.js", "third.js"] }
```

### Empty Arrays

```ts
// When no flags are provided, the property remains undefined
const options = flags([], {}, [tagsRule]);
console.log(options.tags); // undefined

// With defaults, you can initialize as empty array
const options2 = flags([], { tags: [] }, [tagsRule]);
console.log(options2.tags); // []
```

## Working with Defaults

### Empty Array Default

```ts
const options = flags<ContentOptions>(
  process.argv.slice(2),
  {
    tags: [], // Start with empty array
    categories: [], // Start with empty array
    keywords: [], // Start with empty array
    authors: ["system"], // Default author
  },
  rules,
);

// Usage: publish --tag javascript
// Result: { tags: ["javascript"], categories: [], keywords: [], authors: ["system"] }
```

### Conditional Defaults

```ts
const options = flags(args, {}, rules);

// Ensure arrays are initialized
options.tags = options.tags || [];
options.categories = options.categories || [];
options.keywords = options.keywords || [];
```

## Advanced Patterns

### Comma-Separated Values

While `isArrayStringAt` doesn't automatically split comma-separated values, you can combine it with custom processing:

```ts
const commaTagsRule = rule(flag("--tags"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  // Split comma-separated values
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  // Initialize array if needed
  if (!ctx.flags.tags) {
    ctx.flags.tags = [];
  }

  // Add all tags to the array
  ctx.flags.tags.push(...tags);
});

// Usage: --tags javascript,nodejs,react
// Result: { tags: ["javascript", "nodejs", "react"] }

// Can also combine with multiple flags:
// --tags frontend,react --tags backend,nodejs
// Result: { tags: ["frontend", "react", "backend", "nodejs"] }
```

### Deduplicated Arrays

```ts
const uniqueTagsRule = rule(flag("--tag"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  // Initialize set if needed
  if (!ctx.flags.tags) {
    ctx.flags.tags = [];
  }

  // Add only if not already present
  if (!ctx.flags.tags.includes(value)) {
    ctx.flags.tags.push(value);
  }
});

// Usage: --tag javascript --tag nodejs --tag javascript
// Result: { tags: ["javascript", "nodejs"] } (no duplicates)
```

### Array with Validation

```ts
const validatedIncludeRule = rule(flag("--include", "-I"), (ctx) => {
  const value = ctx.consumeArgument();
  if (!value) return;

  // Validate path exists (example)
  if (!fs.existsSync(value)) {
    throw new Error(`Include path does not exist: ${value}`);
  }

  // Initialize array if needed
  if (!ctx.flags.include) {
    ctx.flags.include = [];
  }

  // Add resolved absolute path
  ctx.flags.include.push(path.resolve(value));
});
```

### Mixed Individual and Batch Flags

```ts
interface MixedOptions {
  files: string[];
}

const rules = [
  // Individual file flags
  rule(flag("--file", "-f"), isArrayStringAt("files")),

  // Batch file flag (comma-separated)
  rule(flag("--files"), (ctx) => {
    const value = ctx.consumeArgument();
    if (!value) return;

    const files = value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    if (!ctx.flags.files) {
      ctx.flags.files = [];
    }

    ctx.flags.files.push(...files);
  }),
];

// Usage: --file a.js --file b.js --files c.js,d.js,e.js
// Result: { files: ["a.js", "b.js", "c.js", "d.js", "e.js"] }
```

## Array Processing Patterns

### Post-Processing Arrays

```ts
const options = flags(args, {}, rules);

// Remove empty strings
if (options.files) {
  options.files = options.files.filter((file) => file.trim() !== "");
}

// Remove duplicates
if (options.tags) {
  options.tags = [...new Set(options.tags)];
}

// Sort arrays
if (options.categories) {
  options.categories = options.categories.sort();
}

// Resolve paths
if (options.include) {
  options.include = options.include.map((path) => path.resolve(path));
}
```

### Array Transformation

```ts
const options = flags(args, {}, rules);

// Transform to lowercase
if (options.tags) {
  options.tags = options.tags.map((tag) => tag.toLowerCase());
}

// Normalize file extensions
if (options.files) {
  options.files = options.files.map((file) => {
    if (!path.extname(file)) {
      return file + ".js"; // Add default extension
    }
    return file;
  });
}

// Expand glob patterns
if (options.include) {
  options.include = options.include.flatMap((pattern) => glob.sync(pattern));
}
```

## Testing Array String Flags

### Unit Tests

```ts
import { describe, test, expect } from "bun:test";
import { flags, rule, flag, isArrayStringAt } from "@jondotsoy/flags";

describe("isArrayStringAt", () => {
  const filesRule = rule(flag("--file", "-f"), isArrayStringAt("files"));

  test("should create array from single flag", () => {
    const options = flags(["--file", "test.js"], {}, [filesRule]);
    expect(options.files).toEqual(["test.js"]);
  });

  test("should accumulate multiple flags", () => {
    const options = flags(
      ["--file", "a.js", "--file", "b.js", "--file", "c.js"],
      {},
      [filesRule],
    );

    expect(options.files).toEqual(["a.js", "b.js", "c.js"]);
  });

  test("should work with short flags", () => {
    const options = flags(["-f", "main.ts", "-f", "utils.ts"], {}, [filesRule]);

    expect(options.files).toEqual(["main.ts", "utils.ts"]);
  });

  test("should preserve order", () => {
    const options = flags(
      ["--file", "first.js", "--file", "second.js", "--file", "third.js"],
      {},
      [filesRule],
    );

    expect(options.files).toEqual(["first.js", "second.js", "third.js"]);
  });

  test("should handle mixed short and long flags", () => {
    const options = flags(
      ["--file", "long.js", "-f", "short.js", "--file", "another.js"],
      {},
      [filesRule],
    );

    expect(options.files).toEqual(["long.js", "short.js", "another.js"]);
  });

  test("should leave property undefined when no flags present", () => {
    const options = flags([], {}, [filesRule]);
    expect(options.files).toBeUndefined();
  });

  test("should work with defaults", () => {
    const options = flags([], { files: ["default.js"] }, [filesRule]);
    expect(options.files).toEqual(["default.js"]);

    const options2 = flags(["--file", "new.js"], { files: ["default.js"] }, [
      filesRule,
    ]);
    expect(options2.files).toEqual(["default.js", "new.js"]);
  });

  test("should handle empty string values", () => {
    const options = flags(["--file", ""], {}, [filesRule]);
    expect(options.files).toEqual([""]);
  });

  test("should handle spaces in values", () => {
    const options = flags(["--file", "file with spaces.txt"], {}, [filesRule]);
    expect(options.files).toEqual(["file with spaces.txt"]);
  });
});
```

### Multiple Array Flags Tests

```ts
describe("multiple array flags", () => {
  const rules = [
    rule(flag("--include", "-I"), isArrayStringAt("include")),
    rule(flag("--exclude", "-E"), isArrayStringAt("exclude")),
    rule(flag("--plugin", "-p"), isArrayStringAt("plugins")),
  ];

  test("should handle multiple different array flags", () => {
    const options = flags(
      [
        "--include",
        "src/",
        "--exclude",
        "test/",
        "--include",
        "lib/",
        "--plugin",
        "minify",
        "--exclude",
        "docs/",
        "--plugin",
        "gzip",
      ],
      {},
      rules,
    );

    expect(options.include).toEqual(["src/", "lib/"]);
    expect(options.exclude).toEqual(["test/", "docs/"]);
    expect(options.plugins).toEqual(["minify", "gzip"]);
  });

  test("should handle partial flag usage", () => {
    const options = flags(
      ["--include", "src/", "--plugin", "minify"],
      {},
      rules,
    );

    expect(options.include).toEqual(["src/"]);
    expect(options.exclude).toBeUndefined();
    expect(options.plugins).toEqual(["minify"]);
  });
});
```

### Integration Tests

```ts
describe("array string integration", () => {
  const rules = [
    rule(flag("--tag", "-t"), isArrayStringAt("tags")),
    rule(flag("--verbose", "-v"), isBooleanAt("verbose")),
    rule(flag("--output", "-o"), isStringAt("output")),
  ];

  test("should work with mixed flag types", () => {
    const options = flags(
      [
        "--tag",
        "javascript",
        "--verbose",
        "--tag",
        "nodejs",
        "--output",
        "bundle.js",
        "--tag",
        "react",
      ],
      {},
      rules,
    );

    expect(options.tags).toEqual(["javascript", "nodejs", "react"]);
    expect(options.verbose).toBe(true);
    expect(options.output).toBe("bundle.js");
  });
});
```

## Equivalent Implementation

Understanding how `isArrayStringAt` works internally:

```ts
// This is equivalent to isArrayStringAt
const customArrayStringHandler =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const value = ctx.consumeArgument();
    if (value !== undefined) {
      // Initialize array if it doesn't exist
      if (!ctx.flags[propName]) {
        ctx.flags[propName] = [] as T[keyof T];
      }

      // Add value to array
      (ctx.flags[propName] as string[]).push(value);
    }
  };

// Or using flagHandler with custom processing
const arrayStringWithFlagHandler = <T>(propName: keyof T): Handler<T> =>
  flagHandler<T>(
    propName,
    (value, current) => {
      const array = (current || []) as string[];
      return [...array, value] as T[keyof T];
    },
    [] as string[],
  );
```

## Common Mistakes

### ❌ Wrong: Expecting Comma-Splitting

```ts
// isArrayStringAt doesn't automatically split commas
const options = flags(["--tags", "javascript,nodejs"], {}, [tagsRule]);
console.log(options.tags); // ["javascript,nodejs"] - single element!
```

### ❌ Wrong: Not Handling Undefined

```ts
// Array might be undefined if no flags provided
const options = flags([], {}, [tagsRule]);
options.tags.push("new-tag"); // TypeError: Cannot read property 'push' of undefined
```

### ✅ Correct: Proper Array Handling

```ts
const options = flags(args, {}, rules);

// Initialize if undefined
if (!options.tags) {
  options.tags = [];
}

// Or use defaults
const options2 = flags(args, { tags: [] }, rules);

// Or use optional chaining and nullish coalescing
const tags = options.tags ?? [];
tags.push("new-tag");
```

### ❌ Wrong: Mutating Original Array

```ts
const defaultOptions = { tags: ["default"] };
const options = flags(args, defaultOptions, rules);
options.tags.push("new"); // This mutates defaultOptions.tags!
```

### ✅ Correct: Safe Array Handling

```ts
const defaultOptions = { tags: ["default"] };
const options = flags(
  args,
  { ...defaultOptions, tags: [...defaultOptions.tags] },
  rules,
);
// Or
const options2 = flags(args, {}, rules);
options2.tags = [...(options2.tags ?? []), ...defaultOptions.tags];
```

## Performance Considerations

Array operations are generally fast, but consider:

```ts
// Efficient for small to medium arrays
const options = flags(args, {}, rules);

// For large arrays, consider Set for deduplication
if (options.tags && options.tags.length > 1000) {
  options.tags = [...new Set(options.tags)];
}

// For frequent lookups, convert to Set after parsing
const tagsSet = new Set(options.tags || []);
if (tagsSet.has("javascript")) {
  // Fast lookup
}
```

## Related APIs

- [`flag()`](../api_references/flag.md) - Create flag test functions
- [`rule()`](../api_references/rule.md) - Combine flags with handlers
- [`isStringAt()`](./isStringAt.md) - Handle single string values
- [`isArrayNumberAt()`](./isArrayNumberAt.md) - Handle number arrays
- [`isBooleanAt()`](./isBooleanAt.md) - Handle boolean flags
- [`flagHandler()`](../api_references/flag-handler.md) - Create custom array processing

## Real-World Examples

### Webpack-like Build Tool

```ts
interface WebpackOptions {
  entry: string[];
  externals: string[];
  plugins: string[];
  alias: string[];
}

const rules = [
  rule(flag("--entry", "-e"), isArrayStringAt("entry")),
  rule(flag("--external"), isArrayStringAt("externals")),
  rule(flag("--plugin", "-p"), isArrayStringAt("plugins")),
  rule(flag("--alias", "-a"), isArrayStringAt("alias")),
];

// Usage: webpack -e src/main.js -e src/worker.js --external react --plugin minify --plugin gzip
```

### ESLint-like Linter

```ts
interface LintOptions {
  include: string[];
  exclude: string[];
  rules: string[];
  plugins: string[];
}

const rules = [
  rule(flag("--include"), isArrayStringAt("include")),
  rule(flag("--exclude"), isArrayStringAt("exclude")),
  rule(flag("--rule", "-r"), isArrayStringAt("rules")),
  rule(flag("--plugin", "-p"), isArrayStringAt("plugins")),
];

// Usage: lint --include src/ --include lib/ --exclude test/ --rule no-console --rule no-debugger
```

### Docker-like Container Tool

```ts
interface DockerOptions {
  volumes: string[];
  ports: string[];
  env: string[];
  labels: string[];
}

const rules = [
  rule(flag("--volume", "-v"), isArrayStringAt("volumes")),
  rule(flag("--port", "-p"), isArrayStringAt("ports")),
  rule(flag("--env", "-e"), isArrayStringAt("env")),
  rule(flag("--label", "-l"), isArrayStringAt("labels")),
];

// Usage: docker run -v /host:/container -p 8080:80 -e NODE_ENV=prod -l version=1.0
```

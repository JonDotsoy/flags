# Flags

A Javascript arguments processor.

**Sample:**

```ts
interface Options {
  version: boolean;
  name: string;
  help: boolean;
  run: string[];
  test: string[];
}

const args = ["--name=foo", "-v", "run", "hello", "world"];

const options = flags<Options>(args, {}, [
  rule(flag("--name"), isStringAt("name")),
  rule(flag("--version", "-v"), isBooleanAt("version")),
  rule(command("run"), restArgumentsAt("run")),
  rule(command("test"), restArgumentsAt("test")),
]);

expect(options.name).is.equal("foo");
expect(options.version).is.true;
expect(options.run).is.deep.equal(["hello", "world"]);
```

## Documentation

### Main Function: `flags`

The `flags` function processes an array of arguments according to a set of rules and returns an object with the parsed options.

```ts
const options = flags(args, initialOptions, rules);
```

- `args`: Array of string arguments (e.g., from `process.argv.slice(2)`).
- `initialOptions`: An object with initial/default values.
- `rules`: An array of rules created with `rule(...)`.

If an unknown argument is found, an `UnknownArgumentError` is thrown.

### Types

- `Rule<T>`: A tuple `[Test<T>, Handler<T>]` describing how to match and handle an argument.
- `Spec`: Metadata for a flag/command (names, category, description).
- `Context<T>`: The context object passed to tests and handlers, containing the current argument, index, flags, etc.
- `Test<T>`: A function that checks if an argument matches a pattern.

### Test Functions

Test functions provide a mechanism to evaluate an argument and determine whether to proceed with the next handler function.

#### `flag`

Matches arguments that begin with the given keyword(s). If the argument contains an `=`, the rest is considered the value.

```ts
const test = flag("--title", "-t");
```

#### `command`

Matches an argument that exactly equals the given string.

```ts
const test = command("run");
```

#### `commandOption` (deprecated)

Matches an argument as an option. Prefer using `argument()` instead.

```ts
const test = commandOption("filePath");
```

#### `describe`

Allows setting a description or category for a flag or command.

```ts
const test = describe(flag("--title", "-t"), {
  description: "Describe the title",
});
```

#### `argument`

Matches the next argument in the list (positional argument).

```ts
const rules: Rule<any>[] = [
  rule(argument(), isStringAt("firstArg")),
  rule(argument(), isStringAt("secondArg")),
];

const options = flags(["foo", "taz"], {}, rules);

options.firstArg; // => "foo"
options.secondArg; // => "taz"
```

#### `any`

Matches any argument (wildcard).

```ts
const test = any();
```

### Handler Functions

Handler functions describe what to do with a matched argument. The following helpers are provided:

#### `isStringAt`

Assigns the value of the argument (or its value after `=`) to the given property.

```ts
const handler = isStringAt("title");
// --title foo  => { title: "foo" }
```

#### `isBooleanAt`

Sets the given property to `true` if the flag is present.

```ts
const handler = isBooleanAt("showHelp");
// --showHelp  => { showHelp: true }
```

#### `isNumberAt`

Parses the value as a number and assigns it to the given property.

```ts
const handler = isNumberAt("count");
// --count 5  => { count: 5 }
```

#### `isArrayStringAt`

Accumulates all values for the flag as an array of strings.

```ts
const handler = isArrayStringAt("items");
// --items foo --items bar  => { items: ["foo", "bar"] }
```

#### `isArrayNumberAt`

Accumulates all values for the flag as an array of numbers.

```ts
const handler = isArrayNumberAt("nums");
// --nums 1 --nums 2  => { nums: [1, 2] }
```

### Custom Handler: `flagHandler`

The `flagHandler` utility allows you to define custom logic for how a flag or argument updates your options object. This is useful for advanced scenarios, such as accumulating values, transforming input, or handling non-standard flag behaviors.

#### Syntax

```ts
flagHandler(
  propName: keyof T,
  reducer: (ctx: Context<T>, accumulate: unknown, value: string | null) => unknown,
  requireValue?: boolean
): Handler<T>
```

- `propName`: The property of your options object to update.
- `reducer`: A function that receives the parsing context, the current value (accumulate), and the new value (from the argument or flag). It should return the new value to assign.
- `requireValue` (optional): If `true` (default), expects a value after the flag (e.g., `--foo bar`). If `false`, the flag is treated as a boolean (e.g., `--foo`).

#### Example: Boolean, String, Number, and Array

```ts
interface Options {
  bool: boolean;
  str: string;
  num: number;
  arr: string[];
}

const args = [
  "--bool",
  "--str",
  "hello",
  "--num",
  "42",
  "--arr",
  "a",
  "--arr",
  "b",
];

const options = flags<Options>(args, {}, [
  rule(
    flag("--bool"),
    flagHandler("bool", () => true, false),
  ),
  rule(
    flag("--str"),
    flagHandler("str", (_ctx, _, value) => value),
  ),
  rule(
    flag("--num"),
    flagHandler("num", (_ctx, _, value) => Number(value)),
  ),
  rule(
    flag("--arr"),
    flagHandler("arr", (_ctx, acc = [], value) => [
      ...(Array.isArray(acc) ? acc : [acc]),
      value,
    ]),
  ),
]);

// Results:
// options.bool === true
// options.str === "hello"
// options.num === 42
// options.arr === ["a", "b"]
```

#### Example: Custom Accumulation

You can use `flagHandler` to accumulate values or apply custom transformations:

```ts
const options = flags<{ count: number }>(["--count", "1", "--count", "2"], {}, [
  rule(
    flag("--count"),
    flagHandler("count", (_ctx, acc = 0, value) => acc + Number(value)),
  ),
]);
// options.count === 3
```

#### Notes

- The `ctx` parameter provides full context of the parsing state, including all arguments, current index, and the flags object.
- Use `requireValue: false` for boolean flags that do not take a value.
- You can combine `flagHandler` with any test function (e.g., `flag`, `command`, etc.) for maximum flexibility.

### Utilities

- `makeHelpMessage(command, rules, samples?)`: Generates a help message for your CLI based on the rules.
- `getSpecs(rules)`: Yields metadata for each rule (names, category, description).

### Error Handling

If an unknown argument is encountered, an `UnknownArgumentError` is thrown. You can catch this error to display a custom message or help output.

### Example: Custom Error Handling

```ts
try {
  const options = flags(args, {}, rules);
} catch (err) {
  if (err instanceof UnknownArgumentError) {
    console.error("Unknown argument:", err.message);
    // Optionally show help
  } else {
    throw err;
  }
}
```

For more advanced usage, see the source code and type definitions.

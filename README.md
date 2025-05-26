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

Handler functions describe what to do with a matched argument.

#### `isStringAt`

Assigns the value of the argument (or its value after `=`) to the given property.

```ts
const handler = isStringAt("title");
```

#### `isBooleanAt`

Sets the given property to `true` if the flag is present.

```ts
const handler = isBooleanAt("show-help");
```

#### `isNumberAt`

Parses the value as a number and assigns it to the given property.

```ts
const handler = isNumberAt("count");
```

#### `restArgumentsAt`

Assigns all remaining arguments to the given property as an array.

```ts
const handler = restArgumentsAt("args");
```

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

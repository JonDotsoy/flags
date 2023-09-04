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

### Test Functions

The test functions provide a mechanism eval an argument and its determine
whether if to proceed with the next handler function.

#### `flag`

The `flag` function provide a test function to match arguments that begin with
the keyword it's described. If the argument contains a `=` (equal symbol) this
test functions assumes that the rest of this argument content is the value.

```ts
const test = flag("--title", "-t");
```

#### `command`

The `command` function provide a test function to match a exactly argument.

```ts
const test = command("run");
```

#### Describe a flag or command

The `describe` function allow set a description or a category in your flag or
command.

```ts
const test = describe(flag("--title", "-t"), {
  description: "Describe the title",
});
```

### Handler

The handler function provides a machine to describe a behavior with the next
arguments.

#### `isStringAt`

The `isStringAt` function is a handler function to receive the the value
provided a test function or uses the next argument.

```ts
const handler = isStringAt("title");
```

#### `isBooleanAt`

The `isBooleanAt` function is a handler function. It's understand if it is
called then the value to it options is `true`.

```ts
const handler = isBooleanAt(`show-help`);
```

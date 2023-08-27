# Flags

A Javascript arguments processor.

**Sample:**

```ts
interface Options {
  version: boolean;
  name: string;
  help: boolean;
}

const { name, version } = flags<Options>(["--name=foo", "-v"], {}, [
  [withFlag("--name"), stringFlag("name")],
  [withFlag("--version", "-v"), booleanFlag("version")],
]);

expect(name).is.equal("foo");
expect(version).is.true;
```

# Flags

A Javascript arguments processor.

**Sample:**

```ts
interface Options {
  name: string;
  version: boolean;
  help: boolean;
}

const options = flag<Options>(args, {}, {});

console.log(options.version);
console.log(options.name);
console.log(options.help);
```

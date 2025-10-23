import { expect, test } from "bun:test";
import {
  any,
  argument,
  command,
  describe,
  flag,
  flags,
  getSpecs,
  isBooleanAt,
  isStringAt,
  isArrayStringAt,
  isNumberAt,
  makeHelpMessage,
  restArgumentsAt,
  rule,
  flagHandler,
  type Rule,
  isArrayNumberAt,
} from "./flags";

test("expect run flag function", () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  flags<Options>([], {}, []);
});

test("expect version flag is undefined", () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { version } = flags<Options>([], {}, []);

  expect(version).toBeUndefined();
});

test("expect version flag is true with argument `['--version']`", () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { version } = flags<Options>(["--version"], {}, [
    [flag("--version", "-v"), isBooleanAt("version")],
  ]);

  expect(version).toBeTrue();
});

test(`expect name flag is "foo" with argument \`['--name','foo']\``, () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { name } = flags<Options>(["--name", "foo"], {}, [
    [flag("--name"), isStringAt("name")],
  ]);

  expect(name).toEqual("foo");
});

test(`expect name flag is "foo" with argument \`['--name=foo']\``, () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { name } = flags<Options>(["--name=foo"], {}, [
    [flag("--name"), isStringAt("name")],
  ]);

  expect(name).toEqual("foo");
});

test(`expect name flag is "foo" and version flag is true with argument \`['--name=foo','-v']\``, () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { name, version } = flags<Options>(["--name=foo", "-v"], {}, [
    [flag("--name"), isStringAt("name")],
    [flag("--version", "-v"), isBooleanAt("version")],
  ]);

  expect(name).toEqual("foo");
  expect(version).toBeTrue();
});

test("expect reject if not match argument", () => {
  const args = ["-V", "unknown"];

  expect(() => {
    flags<any>(args, {}, [[flag("--verbose", "-V"), isBooleanAt("verbose")]]);
  }).toThrow(/unknown argument/i);
});

test("expect group rest of arguments on a property", () => {
  const args = [
    "-V",
    "unknown",
    "unknown2",
    "unknown3",
    "unknown4",
    "unknown5",
  ];
  const options = flags<any>(args, {}, [
    [flag("--verbose", "-V"), isBooleanAt("verbose")],
    [any(), restArgumentsAt("rest")],
  ]);
  expect(options.rest).toEqual([
    "unknown",
    "unknown2",
    "unknown3",
    "unknown4",
    "unknown5",
  ]);
});

test("expect group rest of arguments on a property", () => {
  const args = [
    "name",
    "unknown",
    "-V",
    "unknown2",
    "unknown3",
    "unknown4",
    "unknown5",
  ];

  const options = flags<any>(args, {}, [
    [flag("--verbose", "-V"), isBooleanAt("verbose")],
    [command("name"), restArgumentsAt("rest")],
  ]);

  expect(options.rest).toEqual([
    "unknown",
    "-V",
    "unknown2",
    "unknown3",
    "unknown4",
    "unknown5",
  ]);
});

test("expect match command", () => {
  const args = ["-V", "say", "hello"];

  type Options = {
    verbose: boolean;
    say: string[];
  };

  const options = flags<Options>(args, {}, [
    [flag("-V", "--verbose"), isBooleanAt("verbose")],
    [command("say"), restArgumentsAt("say")],
  ]);

  expect(options.verbose).toBeTrue();
  expect(options.say).toEqual(["hello"]);
});

test("expect recover the specification", () => {
  type Options = {
    verbose: boolean;
    say: string[];
  };

  const rules: Rule<Options>[] = [
    [
      describe(flag("-V", "--verbose"), { description: "" }),
      isBooleanAt("verbose"),
    ],
    [flag("-t", "--times"), isBooleanAt("verbose")],
    [flag("-sleep"), isStringAt("verbose")],
    [command("say"), isBooleanAt("say")],
  ];

  expect(Array.from(getSpecs(rules))).toMatchSnapshot();
});

test("expect make a help message", () => {
  const rules: Rule<any>[] = [
    [
      describe(flag("-V", "--verbose"), {
        description: "Print more information",
      }),
      isBooleanAt("verbose"),
    ],
    [flag("-t", "--times"), isBooleanAt("verbose")],
    [flag("-sleep"), isStringAt("verbose")],
    [command("say"), isBooleanAt("say")],
  ];

  const helmMessage = makeHelpMessage("cli", rules, ["foo", "baz -V taz"]);

  expect(helmMessage).toMatchSnapshot();
});

test("expect get the first argument", () => {
  const rules: Rule<any>[] = [rule(argument(), isStringAt("firstArg"))];

  const options = flags(["foo"], {}, rules);

  expect(options.firstArg).toEqual("foo");
});

test("expect get the second argument", () => {
  const rules: Rule<any>[] = [
    rule(argument(), isStringAt("firstArg")),
    rule(argument(), isStringAt("secondArg")),
  ];

  const options = flags(["foo", "taz"], {}, rules);

  expect(options.secondArg).toEqual("taz");
});

test("expect throw error if more arguments than rules", () => {
  const rules: Rule<any>[] = [rule(argument(), isStringAt("firstArg"))];

  expect(() => {
    flags(["foo", "taz"], {}, rules);
  }).toThrow();
});

test("expect collect multiple values into a list", () => {
  interface Options {
    items: string[];
  }

  const rules: Rule<Options>[] = [
    rule(flag("--taz"), isArrayStringAt("items")),
  ];

  const args = ["--taz", "foo", "--taz", "buz"];
  const options = flags<Options>(args, {}, rules);

  expect(options.items).toEqual(["foo", "buz"]);
});

test("expect parse numbers with isNumberAt", () => {
  interface Options {
    num1: number;
    num2: number;
    num3: number;
  }

  const args = ["--num1", "1", "--num2", "1.24", "--num3", "foo"];
  const options = flags<Options>(args, {}, [
    [flag("--num1"), isNumberAt("num1")],
    [flag("--num2"), isNumberAt("num2")],
    [flag("--num3"), isNumberAt("num3")],
  ]);

  expect(options.num1).toBe(1);
  expect(options.num2).toBeCloseTo(1.24);
  expect(options.num3).toBeNaN();
});

test("expect parse values with flagHandler", () => {
  interface Options {
    bool: boolean;
    str: string;
    num: number;
    arr: string[];
  }

  const args: string[] = [
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

  expect(options.bool).toBeTrue();
  expect(options.str).toBe("hello");
  expect(options.num).toBe(42);
  expect(options.arr).toEqual(["a", "b"]);
});

test("expect collect multiple numbers into a list with isArrayNumberAt", () => {
  interface Options {
    nums: number[];
  }

  const args = ["--nums", "1", "--nums", "2.5", "--nums", "-3"];
  const options = flags<Options>(args, {}, [
    rule(flag("--nums"), isArrayNumberAt("nums")),
  ]);

  expect(options.nums).toEqual([1, 2.5, -3]);
});

test("expect chained syntax: flag().isBooleanAt()", () => {
  interface Options {
    version: boolean;
  }

  const rules: Rule<Options>[] = [
    flag("--version", "-v").isBooleanAt("version"),
  ];

  const options = flags<Options>(["--version"], {}, rules);

  expect(options.version).toBeTrue();
});

test("expect chained syntax: flag().isBooleanAt().describe()", () => {
  interface Options {
    version: boolean;
  }

  const rules: Rule<Options>[] = [
    flag("--version", "-v").isBooleanAt("version").describe("Show version"),
  ];

  const options = flags<Options>(["--version"], {}, rules);

  expect(options.version).toBeTrue();

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Show version");
});

test("expect chained syntax: flag().isStringAt()", () => {
  interface Options {
    name: string;
  }

  const rules: Rule<Options>[] = [flag("--name", "-n").isStringAt("name")];

  const options = flags<Options>(["--name", "foo"], {}, rules);

  expect(options.name).toBe("foo");
});

test("expect chained syntax: flag().isStringAt().describe()", () => {
  interface Options {
    name: string;
  }

  const rules: Rule<Options>[] = [
    flag("--name", "-n").isStringAt("name").describe("Set the name"),
  ];

  const options = flags<Options>(["--name", "bar"], {}, rules);

  expect(options.name).toBe("bar");

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Set the name");
});

test("expect chained syntax: flag().isNumberAt().describe()", () => {
  interface Options {
    port: number;
  }

  const rules: Rule<Options>[] = [
    flag("--port", "-p").isNumberAt("port").describe("Port number"),
  ];

  const options = flags<Options>(["--port", "3000"], {}, rules);

  expect(options.port).toBe(3000);

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Port number");
});

test("expect chained syntax: flag().isArrayStringAt().describe()", () => {
  interface Options {
    items: string[];
  }

  const rules: Rule<Options>[] = [
    flag("--item").isArrayStringAt("items").describe("Add an item"),
  ];

  const options = flags<Options>(["--item", "a", "--item", "b"], {}, rules);

  expect(options.items).toEqual(["a", "b"]);

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Add an item");
});

test("expect chained syntax: flag().isArrayNumberAt().describe()", () => {
  interface Options {
    nums: number[];
  }

  const rules: Rule<Options>[] = [
    flag("--num").isArrayNumberAt("nums").describe("Add a number"),
  ];

  const options = flags<Options>(["--num", "1", "--num", "2"], {}, rules);

  expect(options.nums).toEqual([1, 2]);

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Add a number");
});

test("expect multiple chained flags in rules array", () => {
  interface Options {
    version: boolean;
    name: string;
    port: number;
  }

  const rules: Rule<Options>[] = [
    flag("--version", "-v").isBooleanAt("version").describe("Show version"),
    flag("--name", "-n").isStringAt("name").describe("Set name"),
    flag("--port", "-p").isNumberAt("port"),
  ];

  const options = flags<Options>(
    ["--version", "--name", "test", "--port", "8080"],
    {},
    rules,
  );

  expect(options.version).toBeTrue();
  expect(options.name).toBe("test");
  expect(options.port).toBe(8080);

  const specs = Array.from(getSpecs(rules));
  expect(specs[0].description).toBe("Show version");
  expect(specs[1].description).toBe("Set name");
  expect(specs[2].description).toBeUndefined();
});

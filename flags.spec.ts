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

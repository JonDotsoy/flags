import { expect, test } from "vitest";
import {
  any,
  command,
  consoleDraw,
  describe,
  flag,
  flags,
  getSpecs,
  isBooleanAt,
  isStringAt,
  makeHelmMessage,
  restArgumentsAt,
  Rule,
} from "./flags";
import { inspect } from "util";

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

  expect(version).is.undefined;
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

  expect(version).is.true;
});

test(`expect name flag is "foo" with argument \`['--name','foo']\``, () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { name } = flags<Options>(["--name", "foo"], {}, [
    [
      flag("--name"),
      isStringAt("name"),
    ],
  ]);

  expect(name).is.equal("foo");
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

  expect(name).is.equal("foo");
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

  expect(name).is.equal("foo");
  expect(version).is.true;
});

test("expect reject if not match argument", () => {
  const args = ["-V", "unknown"];

  expect(() => {
    flags<any>(args, {}, [
      [flag("--verbose", "-V"), isBooleanAt("verbose")],
    ]);
  }).throw(/unknown argument/i);
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
  expect(options.rest).deep.equal([
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

  expect(options.rest).deep.equal([
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

  expect(options.verbose).to.be.true;
  expect(options.say).deep.equal(["hello"]);
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

  expect(Array.from(getSpecs(rules))).toMatchInlineSnapshot(`
    [
      {
        "category": "flag",
        "description": undefined,
        "names": [
          "-V",
          "--verbose",
        ],
      },
      {
        "category": "flag",
        "description": undefined,
        "names": [
          "-t",
          "--times",
        ],
      },
      {
        "category": "flag",
        "description": undefined,
        "names": [
          "-sleep",
        ],
      },
      {
        "category": "command",
        "description": undefined,
        "names": [
          "say",
        ],
      },
    ]
  `);
});

test("expect make a helm message", () => {
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

  const helmMessage = makeHelmMessage("cli", rules, ["foo", "baz -V taz"]);

  expect(helmMessage).toMatchInlineSnapshot(`
    "Usage: cli foo
           cli baz -V taz

    flag:
        -V,             Print more information
        --verbose
        -t, --times
        -sleep

    command:
        say
    "
  `);
});

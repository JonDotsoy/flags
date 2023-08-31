import { expect, test } from "vitest";
import {
  booleanFlag,
  flags,
  restArgumentsAt,
  stringFlag,
  withAnyFlag,
  withCommand,
  withFlag,
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

  expect(version).is.undefined;
});

test("expect version flag is true with argument `['--version']`", () => {
  interface Options {
    version: boolean;
    name: string;
    help: boolean;
  }

  const { version } = flags<Options>(["--version"], {}, [
    [withFlag("--version", "-v"), booleanFlag("version")],
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
      withFlag("--name"),
      stringFlag("name"),
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
    [withFlag("--name"), stringFlag("name")],
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
    [withFlag("--name"), stringFlag("name")],
    [withFlag("--version", "-v"), booleanFlag("version")],
  ]);

  expect(name).is.equal("foo");
  expect(version).is.true;
});

test("expect reject if not match argument", () => {
  const args = ["-V", "unknown"];

  expect(() => {
    flags<any>(args, {}, [
      [withFlag("--verbose", "-V"), booleanFlag("verbose")],
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
    [withFlag("--verbose", "-V"), booleanFlag("verbose")],
    [withAnyFlag(), restArgumentsAt("rest")],
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
    [withFlag("--verbose", "-V"), booleanFlag("verbose")],
    [withCommand("name"), restArgumentsAt("rest")],
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
    [withFlag("-V", "--verbose"), booleanFlag("verbose")],
    [withCommand("say"), restArgumentsAt("say")],
  ]);

  expect(options.verbose).to.be.true;
  expect(options.say).deep.equal(["hello"]);
});

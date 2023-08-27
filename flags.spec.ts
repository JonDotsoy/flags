import { expect, test } from "vitest";
import { booleanFlag, flags, stringFlag, withFlag } from "./flags";

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

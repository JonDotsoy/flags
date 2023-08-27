"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const flags_1 = require("./flags");
(0, vitest_1.test)("expect run flag function", () => {
    (0, flags_1.flags)([], {}, []);
});
(0, vitest_1.test)("expect version flag is undefined", () => {
    const { version } = (0, flags_1.flags)([], {}, []);
    (0, vitest_1.expect)(version).is.undefined;
});
(0, vitest_1.test)("expect version flag is true with argument `['--version']`", () => {
    const { version } = (0, flags_1.flags)(["--version"], {}, [
        [(0, flags_1.withFlag)("--version", "-v"), (0, flags_1.booleanFlag)("version")],
    ]);
    (0, vitest_1.expect)(version).is.true;
});
(0, vitest_1.test)(`expect name flag is "foo" with argument \`['--name','foo']\``, () => {
    const { name } = (0, flags_1.flags)(["--name", "foo"], {}, [
        [
            (0, flags_1.withFlag)("--name"),
            (0, flags_1.stringFlag)("name"),
        ],
    ]);
    (0, vitest_1.expect)(name).is.equal("foo");
});
(0, vitest_1.test)(`expect name flag is "foo" with argument \`['--name=foo']\``, () => {
    const { name } = (0, flags_1.flags)(["--name=foo"], {}, [
        [(0, flags_1.withFlag)("--name"), (0, flags_1.stringFlag)("name")],
    ]);
    (0, vitest_1.expect)(name).is.equal("foo");
});
(0, vitest_1.test)(`expect name flag is "foo" and version flag is true with argument \`['--name=foo','-v']\``, () => {
    const { name, version } = (0, flags_1.flags)(["--name=foo", "-v"], {}, [
        [(0, flags_1.withFlag)("--name"), (0, flags_1.stringFlag)("name")],
        [(0, flags_1.withFlag)("--version", "-v"), (0, flags_1.booleanFlag)("version")],
    ]);
    (0, vitest_1.expect)(name).is.equal("foo");
    (0, vitest_1.expect)(version).is.true;
});
//# sourceMappingURL=flags.spec.js.map
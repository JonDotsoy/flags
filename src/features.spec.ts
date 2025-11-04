import { flags, flag, command, argument, Builder } from "./flags";
import { test as test, expect, describe } from "bun:test";

const testCase = <T extends Record<string, () => Builder<any>>>({ args, schema, expected }: { args: string[], schema: T, expected: any }) => {
    const formatSchema = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()]));
    const parsed = flags(formatSchema).parse(args);
    const customFailMessage = `Failed parsing args: [${args.map(a => `"${a}"`).join(", ")}]\nSchema: ${Object.keys(schema).join(", ")}\nExpected: ${JSON.stringify(expected, null, 2)}\nReceived: ${JSON.stringify(parsed, null, 2)}`;

    expect(parsed, customFailMessage).toEqual(expected);
}

describe("flags parser", () => {
    test("should parse empty args with empty schema", () => {
        testCase({
            args: [],
            schema: {},
            expected: {},
        });
    });

    test("should return false for boolean flag when not provided", () => {
        testCase({
            args: [],
            schema: { verbose: () => flag("--verbose").boolean() },
            expected: { verbose: false }
        });
    });

    test("should parse boolean flag --foo", () => {
        testCase({
            args: ["--foo"],
            schema: { foo: () => flag("--foo").boolean() },
            expected: { foo: true }
        });
    });

    test("should parse string flag with space syntax", () => {
        testCase({
            args: ["--name", "jhon"],
            schema: { name: () => flag("--name", '-n').string() },
            expected: { name: 'jhon' }
        });
    });

    test("should parse string flag with value starting with =", () => {
        testCase({
            args: ["--name", "=jhon"],
            schema: { name: () => flag("--name", '-n').string() },
            expected: { name: '=jhon' }
        });
    });

    test("should parse string flag with = syntax", () => {
        testCase({
            args: ["--name=jhon"],
            schema: { name: () => flag("--name", '-n').string() },
            expected: { name: 'jhon' }
        });
    });

    test("should parse string flag with multiple = in value", () => {
        testCase({
            args: ["--name=jhon=clip"],
            schema: { name: () => flag("--name", '-n').string() },
            expected: { name: 'jhon=clip' }
        });
    });

    test("should parse single dash flag with space syntax", () => {
        testCase({
            args: ["-name", "jhon"],
            schema: { name: () => flag("-name", '-n').string() },
            expected: { name: 'jhon' }
        });
    });

    test("should parse single dash flag with = syntax", () => {
        testCase({
            args: ["-name=jhon"],
            schema: { name: () => flag("-name", '-n').string() },
            expected: { name: 'jhon' }
        });
    });

    test("should parse short flag alias", () => {
        testCase({
            args: ["-n", "jhon"],
            schema: { name: () => flag("--name", '-n').string() },
            expected: { name: 'jhon' }
        });
    });

    test("should return empty object for keyValue flag when not provided", () => {
        testCase({
            args: [],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: null }
        });
    });

    test("should parse keyValue flag with space syntax", () => {
        testCase({
            args: ["--set", "foo", "taz"],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with key=value syntax", () => {
        testCase({
            args: ["--set", "foo=taz"],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with --flag=key=value syntax", () => {
        testCase({
            args: ["--set=foo=taz"],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with flag-like key", () => {
        testCase({
            args: ["--set", "--foo", "taz"],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: { '--foo': 'taz' } }
        });
    });

    test("should parse keyValue flag with flag-like key using = syntax", () => {
        testCase({
            args: ["--set=--foo=taz"],
            schema: { configs: () => flag("--set").keyValue() },
            expected: { configs: { '--foo': 'taz' } }
        });
    });

    test("should return false for --color flag when not provided", () => {
        testCase({
            args: [],
            schema: { color: () => flag("--color").boolean() },
            expected: { color: false }
        });
    });

    test("should parse --no-color boolean flag", () => {
        testCase({
            args: ['--no-color'],
            schema: { noColor: () => flag("--no-color").boolean() },
            expected: { noColor: true }
        });
    });

    test("should parse multiple string flags into array", () => {
        testCase({
            args: ['-l', "blue", '-l', 'red'],
            schema: { labels: () => flag("-l").strings() },
            expected: { labels: ['blue', 'red'] }
        });
    });

    test("should parse strings flag with flag-like value", () => {
        testCase({
            args: ['-l', "-l", '-l', 'red'],
            schema: { labels: () => flag("-l").strings() },
            expected: { labels: ['-l', 'red'] }
        });
    });

    test("should parse strings flag with = syntax and flag-like value", () => {
        testCase({
            args: ['-l=-l', '-l', 'red'],
            schema: { labels: () => flag("-l").strings() },
            expected: { labels: ['-l', 'red'] }
        });
    });

    test("should parse multiple strings flags with = syntax", () => {
        testCase({
            args: ['-l=-l', '-l=red'],
            schema: { labels: () => flag("-l").strings() },
            expected: { labels: ['-l', 'red'] }
        });
    });

    test("should parse multiple boolean commands", () => {
        testCase({
            args: ['user', 'info'],
            schema: { user: () => command('user').boolean(), info: () => command('info').boolean() },
            expected: { user: true, info: true }
        });
    });

    test("should parse command with restArgs consuming remaining arguments", () => {
        testCase({
            args: ['user', 'info'],
            schema: { user: () => command('user').restArgs(), info: () => command('info').restArgs() },
            expected: { user: ['info'], info: null }
        });
    });

    test("should parse boolean command and restArgs command", () => {
        testCase({
            args: ['user', 'info'],
            schema: { user: () => command('user').boolean(), info: () => command('info').restArgs() },
            expected: { user: true, info: [] }
        });
    });

    test("should parse multiple arguments", () => {
        testCase({
            args: ['user', 'info'],
            schema: { user: () => argument(), info: () => argument() },
            expected: { user: 'user', info: 'info' }
        });
    });

    test("should parse single argument", () => {
        testCase({
            args: ['pr'],
            schema: { command: () => argument() },
            expected: { command: 'pr' }
        });
    });

    test("should parse flag with delimiter", () => {
        testCase({
            args: ['pr:foo'],
            schema: { command: () => flag('pr').string().delimiter(':') },
            expected: { command: "foo" }
        });
    });

    test("should return null for delimiter flag when not provided", () => {
        testCase({
            args: [],
            schema: { command: () => flag('pr').string().delimiter(":") },
            expected: { command: null }
        });
    });

    test("should parse argument with regex match and named groups", () => {
        testCase({
            args: ['tar:foo'],
            schema: { command1: () => argument().match(/^TAR-(?<part2>\w+)$/), command2: () => argument().match(/^(?<part1>\w+):(?<part2>\w+)$/) },
            expected: { command1: null, command2: { 'part1': 'tar', 'part2': 'foo' } }
        });
    });

    test("should parse argument with custom refine function", () => {
        testCase({
            args: ['tar:foo'],
            schema: {
                arg: () => argument().refine((arg: string, index: number, args: string[], context) => arg.startsWith("tar:") ? { index: index + 1, args: [arg], value: arg.split(":")[1] } : null)
            },
            expected: { arg: "foo" }
        });
    });

    test("should parse argument with transform function", () => {
        testCase({
            args: ['tar'],
            schema: {
                arg: () => argument().string().transform((value) => value.toUpperCase())
            },
            expected: { arg: "TAR" }
        });
    });

    test("should parse argument consuming all remaining non-flag arguments", () => {
        testCase({
            args: ['tar', 'biz', 'foo', 'faz'],
            schema: {
                arg: () => argument().refine((arg: string, index: number, args: string[], context) => {
                    if (arg !== 'tar') return null;

                    // Consume all remaining non-flag arguments after 'tar'
                    const consumedArgs: string[] = [];
                    for (let i = index + 1; i < args.length; i++) {
                        if (!args[i].startsWith("-")) {
                            consumedArgs.push(args[i]);
                        } else {
                            break;
                        }
                    }

                    return {
                        index: index + 1 + consumedArgs.length,
                        args: [arg, ...consumedArgs],
                        value: consumedArgs
                    };
                })
            },
            expected: { arg: ['biz', 'foo', 'faz'] }
        });
    });

    test("should parse strings flags and argument together", () => {
        testCase({
            args: ['-l=-l', '-l=red', "foo"],
            schema: { labels: () => flag("-l").strings(), arg: () => argument() },
            expected: { labels: ['-l', 'red'], arg: "foo" }
        });
    });

    test("should parse mixed flags, commands, and arguments with descriptions", () => {
        testCase({
            schema: {
                verbose: () => flag("--verbose", "-v").boolean().describe("Enable verbose output"),
                name: () => flag("--name", "-n").string().describe("Set application name"),
                port: () => flag("--port", "-p").number().default(3000).describe("Server port"),
                help: () => flag("--help", "-h").boolean().describe("Show help message"),
                serve: () => command("serve").restArgs().describe("Start the server"),
                input: () => argument().string().required().describe("Input file"),
            },
            args: ["input.txt", "--name=myapp", "-v", "--port", "8080"],
            expected: {
                verbose: true,
                name: "myapp",
                port: 8080,
                help: false,
                serve: null,
                input: "input.txt"
            }
        });
    })

    // TODO: 
    // testCase({
    //     args: ["foo", "tar", "biz"],
    //     schema: { names: () => argument().strings() },
    //     expected: { names: ["foo", "tar", "biz"] }
    // });
    // testCase({
    //     args: ["foo", "--verbose", "tar", "biz"],
    //     schema: { verbose: () => flag('-V', '--verbose'), names: () => argument().strings() },
    //     expected: { verbose: true, names: ["foo", "tar", "biz"] }
    // });
    // testCase({
    //     args: ["foo", "--verbose", "tar", "biz"],
    //     schema: { names: () => argument().strings() },
    //     expected: { verbose: true, names: ["foo", "--verbose", "tar", "biz"] }
    // });

    // TODO: Implement schema order priority - when argument() is defined first, it should prevent
    // flags that appear before the consumed argument from being processed
    // testCase({
    //     args: ['-l=-l', '-l=red', "foo"],
    //     schema: { arg: () => argument(), labels: () => flag("-l").strings() },
    //     expected: { labels: [], arg: "foo" }
    // });
});
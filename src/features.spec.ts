import { flags, flag, command, argument, Builder } from "./flags";
import { test as realTest, expect, describe } from "bun:test";

const testCase = <T extends Record<string, () => Builder<any>>>({ args, schema, expected }: { args: string[], schema: T, expected: any }) => {
    const titleTest = `should parse ${args.length > 0 ? args.join(" ") : "no arguments"} with ${Object.entries(schema).map(([key, value]) => `${key}:${String(value).replace(/^\(\) \=\>/, '')}`).join(", ")} and return ${Object.entries(expected).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(", ")}`;

    realTest(titleTest, () => {
        const formatSchema = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()]));
        const parsed = flags(formatSchema).parse(args);
        expect(parsed).toEqual(expected);
    });
}

describe("flags parser", () => {
    testCase({
        args: [],
        schema: {},
        expected: {},
    });

    testCase({
        args: [],
        schema: { verbose: () => flag("--verbose") },
        expected: { verbose: false }
    });

    testCase({
        args: ["--foo"],
        schema: { foo: () => flag("--foo") },
        expected: { foo: true }
    });

    testCase({
        args: ["--name", "jhon"],
        schema: { name: () => flag("--name", '-n').string() },
        expected: { name: 'jhon' }
    });

    testCase({
        args: ["--name", "=jhon"],
        schema: { name: () => flag("--name", '-n').string() },
        expected: { name: '=jhon' }
    });

    testCase({
        args: ["--name=jhon"],
        schema: { name: () => flag("--name", '-n').string() },
        expected: { name: 'jhon' }
    });

    testCase({
        args: ["--name=jhon=clip"],
        schema: { name: () => flag("--name", '-n').string() },
        expected: { name: 'jhon=clip' }
    });

    testCase({
        args: ["-name", "jhon"],
        schema: { name: () => flag("-name", '-n').string() },
        expected: { name: 'jhon' }
    });

    testCase({
        args: ["-name=jhon"],
        schema: { name: () => flag("-name", '-n').string() },
        expected: { name: 'jhon' }
    });

    testCase({
        args: ["-n", "jhon"],
        schema: { name: () => flag("--name", '-n').string() },
        expected: { name: 'jhon' }
    });

    testCase({
        args: [],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: {} }
    });

    testCase({
        args: ["--set", "foo", "taz"],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: { foo: 'taz' } }
    });

    testCase({
        args: ["--set", "foo=taz"],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: { foo: 'taz' } }
    });

    testCase({
        args: ["--set=foo=taz"],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: { foo: 'taz' } }
    });

    testCase({
        args: ["--set", "--foo", "taz"],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: { '--foo': 'taz' } }
    });

    testCase({
        args: ["--set=--foo=taz"],
        schema: { configs: () => flag("--set").keyValue() },
        expected: { configs: { '--foo': 'taz' } }
    });

    testCase({
        args: [],
        schema: { color: () => flag("--color").boolean() },
        expected: { color: false }
    });

    testCase({
        args: [],
        schema: { color: () => flag("--color").boolean().default(true) },
        expected: { color: true }
    });

    testCase({
        args: ['--no-color'],
        schema: { noColor: () => flag("--no-color").boolean() },
        expected: { noColor: true }
    });

    testCase({
        args: ['-l', "blue", '-l', 'red'],
        schema: { labels: () => flag("-l").strings() },
        expected: { labels: ['blue', 'red'] }
    });

    testCase({
        args: ['-l', "-l", '-l', 'red'],
        schema: { labels: () => flag("-l").strings() },
        expected: { labels: ['-l', 'red'] }
    });

    testCase({
        args: ['-l=-l', '-l', 'red'],
        schema: { labels: () => flag("-l").strings() },
        expected: { labels: ['-l', 'red'] }
    });

    testCase({
        args: ['-l=-l', '-l=red'],
        schema: { labels: () => flag("-l").strings() },
        expected: { labels: ['-l', 'red'] }
    });

    testCase({
        args: ['user', 'info'],
        schema: { user: () => command('user'), info: () => command('info') },
        expected: { user: true, info: true }
    });

    testCase({
        args: ['user', 'info'],
        schema: { user: () => command('user').restArgs(), info: () => command('info').restArgs() },
        expected: { user: ['info'], info: null }
    });

    testCase({
        args: ['user', 'info'],
        schema: { user: () => command('user'), info: () => command('info').restArgs() },
        expected: { user: true, info: [] }
    });

    testCase({
        args: ['user', 'info'],
        schema: { user: () => argument(), info: () => argument() },
        expected: { user: 'user', info: 'info' }
    });

    testCase({
        args: ['pr'],
        schema: { command: () => argument() },
        expected: { command: 'pr' }
    });

    testCase({
        args: ['pr:foo'],
        schema: { command: () => flag('pr').string({ valueDelimiter: ':' }) },
        expected: { command: "foo" }
    });

    testCase({
        args: [],
        schema: { command: () => flag('pr').string().delimiter(":") },
        expected: { command: null }
    });

    testCase({
        args: ['tar:foo'],
        schema: { command1: () => argument().match(/^TAR-(?<part2>\w+)$/), command2: () => argument().match(/^(?<part1>\w+):(?<part2>\w+)$/) },
        expected: { command1: null, command2: { 'part1': 'tar', 'part2': 'foo' } }
    });

    testCase({
        args: ['tar:foo'],
        schema: {
            arg: () => argument().refine((arg: string, index: number, args: string[], context) => arg.startsWith("tar:") ? { index: index + 1, args: [arg], value: arg.split(":")[1] } : null)
        },
        expected: { arg: "foo" }
    });

    testCase({
        args: ['tar'],
        schema: {
            arg: () => argument().transform((value: string) => value.toUpperCase())
        },
        expected: { arg: "TAR" }
    });

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

    testCase({
        args: ['-l=-l', '-l=red', "foo"],
        schema: { labels: () => flag("-l").strings(), arg: () => argument() },
        expected: { labels: ['-l', 'red'], arg: "foo" }
    });

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
import { flags, flag, command, argument, Builder } from "./flags";
import { test as test, expect, describe } from "bun:test";
import type { FlagsParser } from "./FlagsParser";

/** @deprecated */
const testCase = <T extends Record<string, () => Builder<any>>>({ args, schema, expected }: { args: string[], schema: T, expected: any }) => {
    const formatSchema = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()]));
    const parsed = flags(formatSchema).parse(args);
    const customFailMessage = `Failed parsing args: [${args.map(a => `"${a}"`).join(", ")}]\nSchema: ${Object.keys(schema).join(", ")}\nExpected: ${JSON.stringify(expected, null, 2)}\nReceived: ${JSON.stringify(parsed, null, 2)}`;

    expect(parsed, customFailMessage).toEqual(expected);
}

// Gherkin
/**
 * @gherkindef
 * Feature: Flags Parser
 *   Scenario: Parse flags
 *     Given a flags parser with a schema
 *     When the flags are parsed
 *     Then the expected result is returned
 * 
 * @param obj - Object with the following properties:
 * - given: The flags parser
 * - "when": The flags to parse
 * - "then": The expected result
 */
const scenarioParseFlags = <T extends FlagsParser<Record<string, Builder<any>>>>(obj: {
    "given a flags parser configured with a schema": T,
    "when the command line flags are parsed": string[],
    "then the expected parsed result should be returned": ReturnType<T["parse"]>,
}) => {
    const given = obj["given a flags parser configured with a schema"];
    const when = obj["when the command line flags are parsed"];
    const then = obj["then the expected parsed result should be returned"];
    const parsed = given.parse(when);
    expect(parsed).toEqual(then);
}

describe("flags parser", () => {
    test("should parse empty args with empty schema", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({}),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": {}
        });
    });

    test("should return false for boolean flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                verbose: flag("--verbose").boolean()
            }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": {
                verbose: false
            }
        });
    });

    test("should parse boolean flag --foo", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ foo: flag("--foo").boolean() }),
            "when the command line flags are parsed": ["--foo"],
            "then the expected parsed result should be returned": { foo: true }
        });
    });

    test("should parse string flag with space syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name", '-n').string() }),
            "when the command line flags are parsed": ["--name", "jhon"],
            "then the expected parsed result should be returned": { name: 'jhon' }
        });
    });

    test("should parse string flag with value starting with =", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name", '-n').string() }),
            "when the command line flags are parsed": ["--name", "=jhon"],
            "then the expected parsed result should be returned": { name: '=jhon' }
        });
    });

    test("should parse string flag with = syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name", '-n').string() }),
            "when the command line flags are parsed": ["--name=jhon"],
            "then the expected parsed result should be returned": { name: 'jhon' }
        });
    });

    test("should parse string flag with multiple = in value", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name", '-n').string() }),
            "when the command line flags are parsed": ["--name=jhon=clip"],
            "then the expected parsed result should be returned": { name: 'jhon=clip' }
        });
    });

    test("should parse single dash flag with space syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("-name", '-n').string() }),
            "when the command line flags are parsed": ["-name", "jhon"],
            "then the expected parsed result should be returned": { name: 'jhon' }
        });
    });

    test("should parse single dash flag with = syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("-name", '-n').string() }),
            "when the command line flags are parsed": ["-name=jhon"],
            "then the expected parsed result should be returned": { name: 'jhon' }
        });
    });

    test("should parse short flag alias", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name", '-n').string() }),
            "when the command line flags are parsed": ["-n", "jhon"],
            "then the expected parsed result should be returned": { name: 'jhon' }
        });
    });

    test("rn empty object for keyValue flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { configs: null }
        });
    });

    test("should parse keyValue flag with space syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": ["--set", "foo", "taz"],
            "then the expected parsed result should be returned": { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with key=value syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": ["--set", "foo=taz"],
            "then the expected parsed result should be returned": { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with --flag=key=value syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": ["--set=foo=taz"],
            "then the expected parsed result should be returned": { configs: { foo: 'taz' } }
        });
    });

    test("should parse keyValue flag with flag-like key", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": ["--set", "--foo", "taz"],
            "then the expected parsed result should be returned": { configs: { '--foo': 'taz' } }
        });
    });

    test("should parse keyValue flag with flag-like key using = syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ configs: flag("--set").keyValue() }),
            "when the command line flags are parsed": ["--set=--foo=taz"],
            "then the expected parsed result should be returned": { configs: { '--foo': 'taz' } }
        });
    });

    test("should return false for --color flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ color: flag("--color").boolean() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { color: false }
        });
    });

    test("should parse --no-color boolean flag", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ noColor: flag("--no-color").boolean() }),
            "when the command line flags are parsed": ['--no-color'],
            "then the expected parsed result should be returned": { noColor: true }
        });
    });

    test("should parse multiple string flags into array", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("-l").strings() }),
            "when the command line flags are parsed": ['-l', "blue", '-l', 'red'],
            "then the expected parsed result should be returned": { labels: ['blue', 'red'] }
        });
    });

    test("should parse strings flag with flag-like value", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("-l").strings() }),
            "when the command line flags are parsed": ['-l', "-l", '-l', 'red'],
            "then the expected parsed result should be returned": { labels: ['-l', 'red'] }
        });
    });

    test("should parse strings flag with = syntax and flag-like value", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("-l").strings() }),
            "when the command line flags are parsed": ['-l=-l', '-l', 'red'],
            "then the expected parsed result should be returned": { labels: ['-l', 'red'] }
        });
    });

    test("should parse multiple strings flags with = syntax", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("-l").strings() }),
            "when the command line flags are parsed": ['-l=-l', '-l=red'],
            "then the expected parsed result should be returned": { labels: ['-l', 'red'] }
        });
    });

    test("should parse multiple boolean commands", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ user: command('user').boolean(), info: command('info').boolean() }),
            "when the command line flags are parsed": ['user', 'info'],
            "then the expected parsed result should be returned": { user: true, info: true }
        });
    });

    test("should parse command with restArgs consuming remaining arguments", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ user: command('user').restArgs(), info: command('info').restArgs() }),
            "when the command line flags are parsed": ['user', 'info'],
            "then the expected parsed result should be returned": { user: ['info'], info: null }
        });
    });

    test("should parse boolean command and restArgs command", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ user: command('user').boolean(), info: command('info').restArgs() }),
            "when the command line flags are parsed": ['user', 'info'],
            "then the expected parsed result should be returned": { user: true, info: [] }
        });
    });

    test("should parse multiple arguments", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ user: argument(), info: argument() }),
            "when the command line flags are parsed": ['user', 'info'],
            "then the expected parsed result should be returned": { user: 'user', info: 'info' }
        });
    });

    test("should parse single argument", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ command: argument() }),
            "when the command line flags are parsed": ['pr'],
            "then the expected parsed result should be returned": { command: 'pr' }
        });
    });

    test("should parse flag with delimiter", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ command: flag('pr').string().delimiter(':') }),
            "when the command line flags are parsed": ['pr:foo'],
            "then the expected parsed result should be returned": { command: "foo" }
        });
    });

    test("should return null for delimiter flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ command: flag('pr').string().delimiter(":") }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { command: null }
        });
    });

    test("should parse argument with regex match and named groups", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                command1: argument().match(/^TAR-(?<part2>\w+)$/),
                command2: argument().match(/^(?<part1>\w+):(?<part2>\w+)$/)
            }),
            "when the command line flags are parsed": ['tar:foo'],
            "then the expected parsed result should be returned": { command1: null, command2: { 'part1': 'tar', 'part2': 'foo' } }
        });
    });

    test("should parse argument with custom refine function", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                arg: argument().refine((arg: string, index: number, args: string[], context) =>
                    arg.startsWith("tar:") ? { index: index + 1, args: [arg], value: arg.split(":")[1] } : null
                )
            }),
            "when the command line flags are parsed": ['tar:foo'],
            "then the expected parsed result should be returned": { arg: "foo" }
        });
    });

    test("should parse argument with transform function", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                arg: argument().string().transform((value) => value.toUpperCase())
            }),
            "when the command line flags are parsed": ['tar'],
            "then the expected parsed result should be returned": { arg: "TAR" }
        });
    });

    test("should parse argument consuming all remaining non-flag arguments", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                arg: argument().refine((arg: string, index: number, args: string[], context) => {
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
            }),
            "when the command line flags are parsed": ['tar', 'biz', 'foo', 'faz'],
            "then the expected parsed result should be returned": { arg: ['biz', 'foo', 'faz'] }
        });
    });

    test("should parse strings flags and argument together", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("-l").strings(), arg: argument() }),
            "when the command line flags are parsed": ['-l=-l', '-l=red', "foo"],
            "then the expected parsed result should be returned": { labels: ['-l', 'red'], arg: "foo" }
        });
    });

    test("should parse mixed flags, commands, and arguments with descriptions", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
                name: flag("--name", "-n").string().describe("Set application name"),
                port: flag("--port", "-p").number().default(3000).describe("Server port"),
                help: flag("--help", "-h").boolean().describe("Show help message"),
                serve: command("serve").restArgs().describe("Start the server"),
                input: argument().string().required().describe("Input file"),
            }),
            "when the command line flags are parsed": ["input.txt", "--name=myapp", "-v", "--port", "8080"],
            "then the expected parsed result should be returned": {
                verbose: true,
                name: "myapp",
                port: 8080,
                help: false,
                serve: null,
                input: "input.txt"
            }
        });
    });

    test("should parse number flag", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ port: flag("--port").number() }),
            "when the command line flags are parsed": ["--port", "3000"],
            "then the expected parsed result should be returned": { port: 3000 }
        });
    });

    test("should return null for number flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ port: flag("--port").number() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { port: null }
        });
    });

    test("should return default value for number flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ port: flag("--port").number().default(3000) }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { port: 3000 }
        });
    });

    test("should return default value for string flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ output: flag("--output").string().default("dist") }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { output: "dist" }
        });
    });

    test("should return null for string flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ name: flag("--name").string() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { name: null }
        });
    });

    test("should return empty array for strings flag when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ labels: flag("--label").strings() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { labels: [] }
        });
    });

    test("should parse combined short boolean flags", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                all: flag("-a").boolean(),
                long: flag("-l").boolean(),
                human: flag("-h").boolean()
            }),
            "when the command line flags are parsed": ["-alh"],
            "then the expected parsed result should be returned": { all: true, long: true, human: true }
        });
    });

    test("should parse combined short boolean flags in different order", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                all: flag("-a").boolean(),
                long: flag("-l").boolean(),
                human: flag("-h").boolean()
            }),
            "when the command line flags are parsed": ["-lah"],
            "then the expected parsed result should be returned": { all: true, long: true, human: true }
        });
    });

    test("should parse partially combined short boolean flags", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                all: flag("-a").boolean(),
                long: flag("-l").boolean(),
                human: flag("-h").boolean()
            }),
            "when the command line flags are parsed": ["-al", "-h"],
            "then the expected parsed result should be returned": { all: true, long: true, human: true }
        });
    });

    test("should parse docker-style combined flags", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                tty: flag("-t", "--tty").boolean(),
                interactive: flag("-i", "--interactive").boolean()
            }),
            "when the command line flags are parsed": ["-ti"],
            "then the expected parsed result should be returned": { tty: true, interactive: true }
        });
    });

    test("should parse docker-style combined flags with three flags", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                tty: flag("-t", "--tty").boolean(),
                interactive: flag("-i", "--interactive").boolean(),
                detach: flag("-d", "--detach").boolean()
            }),
            "when the command line flags are parsed": ["-tid"],
            "then the expected parsed result should be returned": { tty: true, interactive: true, detach: true }
        });
    });

    test("should parse multiple aliases for same flag", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                help: flag("--help", "-h", "-?").boolean()
            }),
            "when the command line flags are parsed": ["-?"],
            "then the expected parsed result should be returned": { help: true }
        });
    });

    test("should parse flag with long and short aliases using long form", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                verbose: flag("-v", "--verbose").boolean()
            }),
            "when the command line flags are parsed": ["--verbose"],
            "then the expected parsed result should be returned": { verbose: true }
        });
    });

    test("should parse flag with long and short aliases using short form", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                verbose: flag("-v", "--verbose").boolean()
            }),
            "when the command line flags are parsed": ["-v"],
            "then the expected parsed result should be returned": { verbose: true }
        });
    });

    test("should accumulate multiple keyValue flags into single object", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                config: flag("--config").keyValue()
            }),
            "when the command line flags are parsed": ["--config", "db=postgres", "--config", "port=5432"],
            "then the expected parsed result should be returned": { config: { db: "postgres", port: "5432" } }
        });
    });

    test("should parse command with restArgs capturing all remaining", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                serve: command("serve").restArgs()
            }),
            "when the command line flags are parsed": ["serve", "--watch", "--port", "3000"],
            "then the expected parsed result should be returned": { serve: ["--watch", "--port", "3000"] }
        });
    });

    test("should return null for argument when not provided", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ input: argument() }),
            "when the command line flags are parsed": [],
            "then the expected parsed result should be returned": { input: null }
        });
    });

    test("should parse argument with string type explicitly", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({ file: argument().string() }),
            "when the command line flags are parsed": ["input.txt"],
            "then the expected parsed result should be returned": { file: "input.txt" }
        });
    });

    test("should parse multiple commands with different types", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                build: command("build").boolean(),
                test: command("test").restArgs(),
                serve: command("serve").restArgs()
            }),
            "when the command line flags are parsed": ["build"],
            "then the expected parsed result should be returned": { build: true, test: null, serve: null }
        });
    });

    test("should parse flags with descriptions without affecting parsing", () => {
        scenarioParseFlags({
            "given a flags parser configured with a schema": flags({
                verbose: flag("--verbose").boolean().describe("Enable verbose output"),
                port: flag("--port").number().describe("Server port")
            }),
            "when the command line flags are parsed": ["--verbose", "--port", "8080"],
            "then the expected parsed result should be returned": { verbose: true, port: 8080 }
        });
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
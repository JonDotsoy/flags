import { flags, flag, command, argument } from "./flags";
import { ArgumentBuilder as Builder } from "./builders/ArgumentBuilder";
import { test as realTest, expect, describe } from "bun:test";

type T =
    | [`should parse no arguments with empty schema and return empty object`]
    | [`should parse no arguments with `, Record<string, () => Builder<any, any>>, ` and return `, Record<string, any>]
    | [`should parse `, string[], ` arguments with `, Record<string, () => Builder<any, any>>, ` and return `, Record<string, any>]

const test = (...template: T) => {
    if (template[0] === `should parse no arguments with empty schema and return empty object`) {
        realTest("should parse no arguments with empty schema and return empty object", () => {
            expect(flags({}).parse([])).toEqual({})
        })
    }
    if (template[0] === `should parse no arguments with `) {
        const schema = template[1]
        const schemaDesc = Object.entries(schema).map(([key, value]) => `${key}:${String(value).replace(/^\(\) \=\>/, '')}`).join(", ")
        const expected = template[3]
        const expectedDesc = Object.entries(expected).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(", ")
        realTest(`should parse no arguments with ${schemaDesc} and return ${expectedDesc}`, () => {
            expect(flags(Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()]))).parse([])).toEqual(expected)
        })
    }
    if (template[0] === `should parse `) {
        const args = template[1]
        const schema = template[3]
        const schemaDesc = Object.entries(schema).map(([key, value]) => `${key}:${String(value).replace(/^\(\) \=\>/, '')}`).join(", ")
        const expected = template[5]
        const expectedDesc = Object.entries(expected).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(", ")
        realTest(`should parse ${args.join(" ")} with ${schemaDesc} and return ${expectedDesc}`, () => {
            expect(flags(Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, v()]))).parse(args)).toEqual(expected)
        })
    }
}

describe("flags parser", () => {
    test(`should parse no arguments with empty schema and return empty object`);
    test(`should parse no arguments with `, { verbose: () => flag("--verbose") }, ` and return `, { verbose: false });
    test(`should parse `, ["--foo"], ` arguments with `, { foo: () => flag("--foo") }, ` and return `, { foo: true });
    test(`should parse `, ["--name", "jhon"], ` arguments with `, { name: () => flag("--name", '-n').string() }, ` and return `, { name: 'jhon' });
    test(`should parse `, ["--name", "=jhon"], ` arguments with `, { name: () => flag("--name", '-n').string() }, ` and return `, { name: '=jhon' });
    test(`should parse `, ["--name=jhon"], ` arguments with `, { name: () => flag("--name", '-n').string() }, ` and return `, { name: 'jhon' });
    test(`should parse `, ["--name=jhon=clip"], ` arguments with `, { name: () => flag("--name", '-n').string() }, ` and return `, { name: 'jhon=clip' });
    test(`should parse `, ["-name", "jhon"], ` arguments with `, { name: () => flag("-name", '-n').string() }, ` and return `, { name: 'jhon' });
    test(`should parse `, ["-name=jhon"], ` arguments with `, { name: () => flag("-name", '-n').string() }, ` and return `, { name: 'jhon' });
    test(`should parse `, ["-n", "jhon"], ` arguments with `, { name: () => flag("--name", '-n').string() }, ` and return `, { name: 'jhon' });
    test(`should parse no arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: {} })
    test(`should parse `, ["--set", "foo", "taz"], ` arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: { foo: 'taz' } })
    test(`should parse `, ["--set", "foo=taz"], ` arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: { foo: 'taz' } })
    test(`should parse `, ["--set=foo=taz"], ` arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: { foo: 'taz' } })
    test(`should parse `, ["--set", "--foo", "taz"], ` arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: { '--foo': 'taz' } })
    test(`should parse `, ["--set=--foo=taz"], ` arguments with `, { configs: () => flag("--set").keyValue() }, ` and return `, { configs: { '--foo': 'taz' } })
    test(`should parse no arguments with `, { color: () => flag("--color").boolean() }, ` and return `, { color: false })
    test(`should parse no arguments with `, { color: () => flag("--color").boolean().default(true) }, ` and return `, { color: true })
    test(`should parse `, ['--no-color'], ` arguments with `, { noColor: () => flag("--no-color").boolean() }, ` and return `, { noColor: true })
    test(`should parse `, ['-l', "blue", '-l', 'red'], ` arguments with `, { labels: () => flag("-l").strings() }, ` and return `, { labels: ['blue', 'red'] })
    test(`should parse `, ['-l', "-l", '-l', 'red'], ` arguments with `, { labels: () => flag("-l").strings() }, ` and return `, { labels: ['-l', 'red'] })
    test(`should parse `, ['-l=-l', '-l', 'red'], ` arguments with `, { labels: () => flag("-l").strings() }, ` and return `, { labels: ['-l', 'red'] })
    test(`should parse `, ['-l=-l', '-l=red'], ` arguments with `, { labels: () => flag("-l").strings() }, ` and return `, { labels: ['-l', 'red'] })
    test(`should parse `, ['user', 'info'], ` arguments with `, { user: () => command('user'), info: () => command('info') }, ` and return `, { user: true, info: true })
    test(`should parse `, ['user', 'info'], ` arguments with `, { user: () => command('user').restArgs(), info: () => command('info').restArgs() }, ` and return `, { user: ['info'], info: null })
    test(`should parse `, ['user', 'info'], ` arguments with `, { user: () => command('user'), info: () => command('info').restArgs() }, ` and return `, { user: true, info: [] })
    test(`should parse `, ['user', 'info'], ` arguments with `, { user: () => argument(), info: () => argument() }, ` and return `, { user: 'user', info: 'info' })
    test(`should parse `, ['pr'], ` arguments with `, { command: () => argument() }, ` and return `, { command: 'pr' });
    test(`should parse `, ['pr:foo'], ` arguments with `, { command: () => flag('pr').string({ valueDelimiter: ':' }) }, ` and return `, { command: "foo" });
    test(`should parse `, [], ` arguments with `, { command: () => flag('pr').string({ valueDelimiter: ':' }) }, ` and return `, { command: null });
    test(`should parse `, ['tar:foo'], ` arguments with `, { command1: () => argument().match(/^TAR-(?<part2>\w+)$/), command2: () => argument().match(/^(?<part1>\w+):(?<part2>\w+)$/) }, ` and return `, { command1: null, command2: { 'part1': 'tar', 'part2': 'foo' } });
    test(`should parse `, ['tar:foo'], ` arguments with `, {
        arg: () => argument().refine((arg: string, index: number, args: string[], context) => arg.startsWith("tar:") ? { index: index + 1, args: [arg], value: arg.split(":")[1] } : null)
    }, ` and return `, { arg: "foo" });
    test(`should parse `, ['tar'], ` arguments with `, {
        arg: () => argument().transform((arg: string, index: number, args: string[]) => arg.toUpperCase())
    }, ` and return `, { arg: "TAR" });
    test(`should parse `, ['tar', 'biz', 'foo', 'faz'], ` arguments with `, {
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
    }, ` and return `, { arg: ['biz', 'foo', 'faz'] });

    test(`should parse `, ['-l=-l', '-l=red', "foo"], ` arguments with `, { labels: () => flag("-l").strings(), arg: () => argument() }, ` and return `, { labels: ['-l', 'red'], arg: "foo" });

    // TODO: 
    // test(`should parse `, ["foo", "tar", "biz"], ` arguments with `, { names: () => argument().strings() }, ` and return `, { names: ["foo", "tar", "biz"] });
    // test(`should parse `, ["foo", "--verbose", "tar", "biz"], ` arguments with `, { verbose: () => flag('-V', '--verbose'), names: () => argument().strings() }, ` and return `, { verbose: true, names: ["foo", "tar", "biz"] });
    // test(`should parse `, ["foo", "--verbose", "tar", "biz"], ` arguments with `, { names: () => argument().strings() }, ` and return `, { verbose: true, names: ["foo", "--verbose", "tar", "biz"] });

    // TODO: Implement schema order priority - when argument() is defined first, it should prevent
    // flags that appear before the consumed argument from being processed
    // test(`should parse `, ['-l=-l', '-l=red', "foo"], ` arguments with `, { arg: () => argument(), labels: () => flag("-l").strings() }, ` and return `, { labels: [], arg: "foo" });
});
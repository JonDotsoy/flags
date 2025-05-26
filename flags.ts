import { render, componentModules } from "@jondotsoy/console-draw";
import { UnknownArgumentError } from "./src/common/errors/unknown-argument.error.js";

const h = componentModules.createElement.bind(componentModules);

export interface Spec {
  names?: string[];
  category?: string;
  description?: string;
}

export interface Context<T> {
  nextIndex: number;
  args: string[];
  index: number;
  arg: string;
  argValue: null | string;
  flags: Partial<T>;
}

export type Test<T> = ((arg: string, ctx: Context<T>) => boolean) & Spec;

export interface Handler<T> {
  (ctx: Context<T>): void;
}

export type Rule<T> = [Test<T>, Handler<T>];

export const rule = <T>(
  test: Test<T>,
  handler: Handler<T>,
  ...specs: Spec[]
): Rule<T> => [describe(test, ...specs), handler];

export const flag = <T>(...flags: string[]): Test<T> =>
  describe(
    (arg, ctx: Context<T>) =>
      flags.some((flag) => {
        if (flag === arg) return true;
        if (arg.startsWith(`${flag}=`)) {
          ctx.argValue = arg.substring(`${flag}=`.length);
          return true;
        }
      }),
    { category: "flag", names: flags },
  );

export const command = <T>(command: string): Test<T> =>
  describe(
    (arg, ctx) => {
      if (arg === command) {
        ctx.index += 1;
        return true;
      }
      return false;
    },
    { category: "command", names: [command] },
  );

/** @deprecated prefer {@link argument} */
export const commandOption =
  <T>(optionName: keyof T) =>
  (arg: string, ctx: Context<T>): boolean => {
    if (ctx.flags[optionName] === undefined) {
      ctx.argValue = arg;
      return true;
    }

    return false;
  };

export const isBooleanAt =
  <T>(propName: keyof T): Handler<T> =>
  ({ flags }) =>
    Reflect.set(flags, propName, true);

export const isStringAt =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const { flags, argValue, args, nextIndex } = ctx;
    if (argValue) {
      Reflect.set(flags, propName, argValue);
    } else {
      Reflect.set(flags, propName, args.at(nextIndex));
      ctx.nextIndex += 1;
    }
  };

export const isNumberAt =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const { flags, argValue, args, nextIndex } = ctx;
    const rawValue = argValue ?? args.at(nextIndex);
    if (!argValue) {
      ctx.nextIndex += 1;
    }
    Reflect.set(flags, propName, Number(rawValue));
  };

export const any =
  <T>(): Test<T> =>
  () =>
    true;

export const restArgumentsAt =
  <T>(propName: keyof T): Handler<T> =>
  (ctx) => {
    const restArgs = ctx.args.slice(ctx.index, ctx.args.length);
    ctx.nextIndex = ctx.args.length;
    Reflect.set(ctx.flags, propName, restArgs);
  };

export const describe = <D extends Test<any>>(test: D, ...specs: Spec[]): D => {
  const { description, category, names }: Spec = Object.assign({}, ...specs);

  if (description) {
    test.description = description;
  }
  if (category) {
    test.category = category;
  }
  if (names) {
    test.names = names;
  }

  return test;
};

export function* getSpecs(
  rules: Rule<any>[],
): Generator<{ description?: string; category?: string; names?: string[] }> {
  for (const [test] of rules) {
    yield {
      names: test.names,
      category: test.category,
      description: test.description,
    };
  }
}

export const makeHelpMessage = (
  command: string,
  rules: Rule<any>[],
  samples?: string[],
) => {
  const terminalWidth = parseInt(process.env.COLUMNS ?? "80");

  const byCategory: Record<string, Spec[]> = {};
  const specNames = new Map<string[], string>();
  const lengthPerCategory = new Map<string, number>();

  for (const spec of getSpecs(rules)) {
    if (spec.category) {
      byCategory[spec.category] = [...(byCategory[spec.category] ?? []), spec];
      if (spec.names && !specNames.has(spec.names)) {
        const namesLiteral = spec.names.join(", ");
        specNames.set(spec.names, namesLiteral);
        const currentLength = lengthPerCategory.get(spec.category) ?? 0;
        if (namesLiteral.length > currentLength) {
          lengthPerCategory.set(spec.category, namesLiteral.length);
        }
      }
    }
  }

  const lines: string[] = [];

  const w = (str: string | undefined, callbackfn: (str: string) => string) =>
    str ? callbackfn(str) : undefined;

  const usageSection = h(
    "columns",
    { columns: 2, gap: 1, columnsTemplate: [{ width: 6 }] },
    [
      h("text", "Usage:"),
      h("div", [
        h("text", w(samples?.at(0), (e) => `${command} ${e}`) ?? command),
        ...Array.from(
          samples?.slice(1).map((e) => `${command} ${e}`) ?? [],
          (e) => h("text", e),
        ),
      ]),
    ],
  );

  const otherComponents: ReturnType<typeof h>[] = [];

  for (const [categoryName, specs] of Object.entries(byCategory)) {
    const sectionComponents: ReturnType<typeof h>[] = [];
    sectionComponents.push(h("text", `${categoryName}:`));
    let widthFlags = 0;
    const linesOptions: ReturnType<typeof h>[][] = [];
    for (const spec of specs) {
      if (spec.names) {
        const flags = specNames.get(spec.names) ?? "";
        const description = spec.description ?? "";
        widthFlags = Math.max(widthFlags, flags.length);
        linesOptions.push([h("text", flags), h("text", description)]);
      }
    }

    for (const [flags, desc] of linesOptions) {
      sectionComponents.push(
        h(
          "columns",
          {
            gap: 3,
            columns: 3,
            columnsTemplate: [{ width: 0 }, { width: widthFlags }],
          },
          [h("text"), flags, desc],
        ),
      );
    }

    otherComponents.push(...sectionComponents, h("text"));
  }

  return render(h("div", [usageSection, h("text"), ...otherComponents]), {
    width: terminalWidth,
  });
};

export const flags = <T>(
  args: string[],
  init: Partial<T>,
  parses: Rule<T>[],
): Partial<T> => {
  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    const ctx: Context<T> = {
      arg,
      argValue: null,
      args,
      flags: init,
      index,
      nextIndex: index + 1,
    };
    const rule = parses.find(([test]) => {
      return test(ctx.arg, ctx);
    });
    if (!rule) throw new UnknownArgumentError(arg);
    const [, handler] = rule;
    handler(ctx);
    index = ctx.nextIndex;
  }
  return init;
};

/**
 * Catch the next argument.
 *
 * @example
 * const options = flags(["foo"],{}, [rule(argument(), isStringAt("arg"))])
 * options.arg // => "foo"
 */
export const argument = () => {
  const uniqueInvocation = Symbol();
  return (arg: string, ctx: Context<any>) => {
    if (argument.visited.has(uniqueInvocation)) return false;
    argument.visited.add(uniqueInvocation);
    ctx.argValue = arg;
    return true;
  };
};

argument.visited = new Set<symbol>();

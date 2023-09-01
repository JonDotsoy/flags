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

export type Rule<T> = [Test<T>, Handler<T>] | {
  category?: string;
  description?: string;
  test: Test<T>;
  handler: Handler<T>;
};

export const flag = <T>(...flags: string[]): Test<T> =>
  describe((arg, ctx: Context<T>) =>
    flags.some((flag) => {
      if (flag === arg) return true;
      if (arg.startsWith(`${flag}=`)) {
        ctx.argValue = arg.substring(`${flag}=`.length);
        return true;
      }
    }), { category: "flag", names: flags });

export const command = <T>(command: string): Test<T> =>
  describe((arg, ctx) => {
    if (arg === command) {
      ctx.index += 1;
      return true;
    }
    return false;
  }, { category: "command", names: [command] });

export const isBooleanAt = <T>(propName: keyof T): Handler<T> => ({ flags }) =>
  Reflect.set(flags, propName, true);

export const isStringAt = <T>(propName: keyof T): Handler<T> => (ctx) => {
  const { flags, argValue, args, nextIndex } = ctx;
  if (argValue) {
    Reflect.set(flags, propName, argValue);
  } else {
    Reflect.set(flags, propName, args.at(nextIndex));
    ctx.nextIndex += 1;
  }
};

export const isNumberAt = <T>(propName: keyof T): Handler<T> => (ctx) => {
  const { flags, argValue, args, nextIndex } = ctx;
  const rawValue = argValue ?? args.at(nextIndex);
  if (!argValue) {
    ctx.nextIndex += 1;
  }
  Reflect.set(flags, propName, Number(rawValue));
};

export const any = <T>(): Test<T> => () => true;

export const restArgumentsAt = <T>(propName: keyof T): Handler<T> => (ctx) => {
  const restArgs = ctx.args.slice(ctx.index, ctx.args.length);
  ctx.nextIndex = ctx.args.length;
  Reflect.set(ctx.flags, propName, restArgs);
};

export const describe = <D extends Test<any>>(
  test: D,
  ...specs: Spec[]
): D => {
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
  for (const rule of rules) {
    const test = Array.isArray(rule) ? rule[0] : rule.test;
    yield {
      names: test.names,
      category: test.category,
      description: test.description,
    };
  }
}

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
    const e = parses.find((o) => {
      const test: Test<T> = Array.isArray(o) ? o[0] : o.test;
      return test(ctx.arg, ctx);
    });
    if (!e) throw new Error(`Unknown argument: ${arg}`);
    const handler = Array.isArray(e) ? e[1] : e.handler;
    handler(ctx);
    index = ctx.nextIndex;
  }
  return init;
};

export interface Ctx<T> {
  nextIndex: number;
  args: string[];
  index: number;
  arg: string;
  argValue: null | string;
  flags: Partial<T>;
}

export interface FlagParserTest<T> {
  (arg: string, ctx: Ctx<T>): boolean;
}

export interface FlagParserHandler<T> {
  (ctx: Ctx<T>): void;
}

export type FlagParser<T> = [FlagParserTest<T>, FlagParserHandler<T>] | {
  test: FlagParserTest<T>;
  handler: FlagParserHandler<T>;
};

export const withFlag =
  <T>(...flags: string[]): FlagParserTest<T> => (arg, ctx: Ctx<T>) =>
    flags.some((flag) => {
      if (flag === arg) return true;
      if (arg.startsWith(`${flag}=`)) {
        ctx.argValue = arg.substring(`${flag}=`.length);
        return true;
      }
    });

export const booleanFlag =
  <T>(propName: keyof T): FlagParserHandler<T> => ({ flags }) =>
    Reflect.set(flags, propName, true);

export const stringFlag =
  <T>(propName: keyof T): FlagParserHandler<T> => (ctx) => {
    const { flags, argValue, args, nextIndex } = ctx;
    if (argValue) {
      Reflect.set(flags, propName, argValue);
    } else {
      Reflect.set(flags, propName, args.at(nextIndex));
      ctx.nextIndex = +1;
    }
  };

export const flags = <T>(
  args: string[],
  init: Partial<T>,
  parses: FlagParser<T>[],
): Partial<T> => {
  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    const ctx: Ctx<T> = {
      arg,
      argValue: null,
      args,
      flags: init,
      index,
      nextIndex: index + 1,
    };
    const e = parses.find((o) => {
      const test: FlagParserTest<T> = Array.isArray(o) ? o[0] : o.test;
      return test(ctx.arg, ctx);
    });
    if (e) {
      const handler = Array.isArray(e) ? e[1] : e.handler;
      handler(ctx);
    }
    index = ctx.nextIndex;
  }
  return init;
};

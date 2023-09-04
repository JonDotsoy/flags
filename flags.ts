export namespace consoleDraw {
  export const EOL = "\n";

  export const raw = (lines: string[], options?: { endLine?: boolean }) => {
    const endLine = options?.endLine ?? false;
    return `${lines.join(EOL)}${endLine ? EOL : ""}`;
  };

  export const box = (
    body: string,
    options?: { maxWidth?: number; space?: string },
  ) => {
    const maxWidth: number = options?.maxWidth ?? Infinity;
    const space = options?.space ?? " ";
    const lines: string[] = [];

    const chunks = body.split(space);
    let line = chunks.at(0) ?? "";

    for (const chunk of chunks.slice(1)) {
      const nextLine = `${line}${space}${chunk}`;
      if (nextLine.length < maxWidth) {
        line = nextLine;
      } else {
        lines.push(line);
        line = `${chunk}`;
      }
    }

    lines.push(line);

    return lines;
  };

  export const grid = (
    rows: string[][],
    initColsOptions?: { flex?: boolean }[],
    options?: { gap?: number; marginStart?: number },
  ) => {
    const lines: string[] = [];
    const maxWidth = 80;
    const space = " ";
    const gap = options?.gap ?? 3;
    const marginStart = options?.marginStart ?? 0;

    const sizeCols: number[] = [];

    rows.forEach((cols) =>
      cols.forEach((cel, indexCol) => {
        const i = indexCol;
        sizeCols[i] = Math.max(sizeCols[i] ?? 0, cel.length);
      })
    );

    const widthCols = sizeCols.length;

    const colsOptions = sizeCols
      .map((size, index) => {
        const colOption = initColsOptions?.at(index);
        const flex = colOption?.flex ?? false;
        return { size, flex, actualSize: size };
      });

    const gameFlexible = maxWidth - marginStart -
      (gap * (colsOptions.length - 1)) -
      colsOptions.reduce(
        (a, colOption) => colOption.flex ? a : colOption.size,
        0,
      );

    const countTotalFlexible = colsOptions.reduce(
      (n, colOption) => colOption.flex ? n + 1 : n,
      0,
    );

    colsOptions
      .forEach((colOption, index, colsOptions) => {
        if (colOption.flex) {
          colOption.actualSize = gameFlexible / countTotalFlexible;
        }
      });

    rows.forEach((colsRaw, rowIndex) => {
      const cols = Array(widthCols).fill(null).map((_, index) =>
        colsRaw[index] ?? ""
      );
      let heightRows = 0;
      const colsLines: string[][] = [];

      cols.forEach((cel, colIndex) => {
        const colOption = colsOptions.at(colIndex)!;
        const lines = box(cel, { maxWidth: colOption.actualSize });
        heightRows = Math.max(heightRows, lines.length);
        colsLines[colIndex] = lines;
      });

      Array(widthCols).fill(null).forEach((cel, colIndex) => {
        const colOption = colsOptions.at(colIndex)!;
        colsLines[colIndex] = [
          ...colsLines[colIndex].map((e) => e.padEnd(colOption.actualSize)),
          ...Array(heightRows - colsLines[colIndex].length).fill(
            " ".repeat(colOption.actualSize),
          ),
        ];
      });

      // Add lines
      const nextLines = Array(heightRows).fill(null).map((_, indexLine) =>
        `${space.repeat(marginStart)}${
          Array(sizeCols.length).fill(null).map((_, indexCol) => {
            return colsLines[indexCol][indexLine];
          }).join(space.repeat(gap))
        }`.trimEnd()
      );

      lines.push(...nextLines);
    });

    return lines;
  };
}

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
): Rule<T> => [
  describe(test, ...specs),
  handler,
];

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
  for (const [test] of rules) {
    yield {
      names: test.names,
      category: test.category,
      description: test.description,
    };
  }
}

export const makeHelmMessage = (
  command: string,
  rules: Rule<any>[],
  samples?: string[],
) => {
  const byCategory: Record<string, Spec[]> = {};
  const specNames = new Map<string[], string>();
  const lengthPerCategory = new Map<string, number>();

  for (const spec of getSpecs(rules)) {
    if (spec.category) {
      byCategory[spec.category] = [...byCategory[spec.category] ?? [], spec];
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

  lines.push(
    ...consoleDraw.grid(
      [
        ["Usage:", w(samples?.at(0), (e) => `${command} ${e}`) ?? command],
        ...(samples?.slice(1).map((e) => ["", `${command} ${e}`]) ?? []),
      ],
      [{}, { flex: true }],
      {
        gap: 1,
      },
    ),
  );
  lines.push(``);

  for (const [categoryName, specs] of Object.entries(byCategory)) {
    lines.push(`${categoryName}:`);
    const s: [string, string][] = [];
    for (const spec of specs) {
      if (spec.names) {
        const name = specNames.get(spec.names)!;
        s.push([name, spec.description ?? ""]);
      }
    }
    lines.push(
      ...consoleDraw.grid(s, [{}, { flex: true }], { marginStart: 4 }),
    );
    lines.push(``);
  }

  return consoleDraw.raw(lines);
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
    if (!rule) throw new Error(`Unknown argument: ${arg}`);
    const [, handler] = rule;
    handler(ctx);
    index = ctx.nextIndex;
  }
  return init;
};

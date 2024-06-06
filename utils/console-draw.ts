export namespace ConsoleSpace {
  class ConsoleComponent {}

  export class Text extends ConsoleComponent {
    constructor(readonly text: string) {
      super();
    }
    toString() {
      return this.text;
    }
  }

  type GridOptions = {
    gap: number;
  };

  export class Grid extends ConsoleComponent {
    options: GridOptions;

    constructor(
      readonly elemens: ConsoleComponent[],
      readonly cols: number = 1,
      options: Partial<GridOptions> = {},
    ) {
      super();
      this.options = {
        gap: 1,
        ...options,
      };
    }

    static getPosByIndex(index: number, cols: number) {
      return {
        col: index % cols,
        row: Math.floor(index / cols),
      };
    }

    toString() {
      type Cel = { toString(): string };
      const grid: Cel[][] = [];
      const getCol = (row: number) => (grid[row] ??= []);
      const getCel = (row: number, col: number) =>
        (getCol(row)[col] ??= { toString: () => "" });

      const lines: string[] = [];
      const colOptions: { width: number }[] = [];
      const getColOption = (col: number) => (colOptions[col] ??= { width: 0 });

      let index = -1;
      for (const a of this.elemens) {
        index += 1;

        const { col, row } = Grid.getPosByIndex(index, this.cols);

        const cel = getCel(row, col);
        const colOption = getColOption(col);

        let text = a.toString();
        colOption.width = Math.max(colOption.width, text.length);
        cel.toString = () => text.padEnd(colOption.width, " ");
      }

      for (const row of grid) {
        lines.push(
          row.map((cel) => cel.toString()).join(" ".repeat(this.options.gap)),
        );
      }

      return lines.join("\n");
    }
  }

  export const render = (component: ConsoleComponent) => {
    return `${component}`;
  };
}

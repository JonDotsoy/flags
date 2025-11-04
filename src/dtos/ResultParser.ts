export type ResultParser<ParseResult> = {
  args: string[];
  index: number;
  value: ParseResult;
};

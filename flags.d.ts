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
export declare const withFlag: <T>(...flags: string[]) => FlagParserTest<T>;
export declare const booleanFlag: <T>(propName: keyof T) => FlagParserHandler<T>;
export declare const stringFlag: <T>(propName: keyof T) => FlagParserHandler<T>;
export declare const flags: <T>(args: string[], init: Partial<T>, parses: FlagParser<T>[]) => Partial<T>;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flags = exports.stringFlag = exports.booleanFlag = exports.withFlag = void 0;
const withFlag = (...flags) => (arg, ctx) => flags.some((flag) => {
    if (flag === arg)
        return true;
    if (arg.startsWith(`${flag}=`)) {
        ctx.argValue = arg.substring(`${flag}=`.length);
        return true;
    }
});
exports.withFlag = withFlag;
const booleanFlag = (propName) => ({ flags }) => Reflect.set(flags, propName, true);
exports.booleanFlag = booleanFlag;
const stringFlag = (propName) => (ctx) => {
    const { flags, argValue, args, nextIndex } = ctx;
    if (argValue) {
        Reflect.set(flags, propName, argValue);
    }
    else {
        Reflect.set(flags, propName, args.at(nextIndex));
        ctx.nextIndex = +1;
    }
};
exports.stringFlag = stringFlag;
const flags = (args, init, parses) => {
    let index = 0;
    while (index < args.length) {
        const arg = args[index];
        const ctx = {
            arg,
            argValue: null,
            args,
            flags: init,
            index,
            nextIndex: index + 1,
        };
        const e = parses.find((o) => {
            const test = Array.isArray(o) ? o[0] : o.test;
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
exports.flags = flags;
//# sourceMappingURL=flags.js.map
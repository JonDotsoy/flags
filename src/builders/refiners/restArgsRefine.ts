import type { Refine } from "../../flags";

export const restArgsRefine: Refine = (
  _arg,
  index,
  args,
  context,
  _builder,
) => {
  if (!context) {
    return null;
  }

  // Consume all remaining arguments after the current one
  const remainingArgs = args.slice(index + 1);

  return {
    args: [...context.args, ...remainingArgs],
    index: context.index,
    value: remainingArgs,
  };
};

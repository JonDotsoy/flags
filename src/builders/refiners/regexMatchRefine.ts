import type { Refine } from "../../flags";

export const regexMatchRefine =
  (regex: RegExp): Refine =>
  (arg, index, args, context) => {
    const value = context?.value ?? arg;
    const match = String(value).match(regex);

    if (!match) {
      return null;
    }

    // If there are named groups, return them as an object
    if (match.groups && Object.keys(match.groups).length > 0) {
      return {
        args: context?.args ?? args.slice(index, index + 1),
        index: context?.index ?? index,
        value: match.groups,
      };
    }

    // Otherwise return the full match
    return {
      args: context?.args ?? args.slice(index, index + 1),
      index: context?.index ?? index,
      value: match[0],
    };
  };

import { numberGreaterThanOrEqualRefine } from "./numberGreaterThanOrEqualRefine.js";

export const numberPositiveRefine = numberGreaterThanOrEqualRefine(0);

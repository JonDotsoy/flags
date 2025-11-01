import { numberGreaterThanOrEqualRefine } from "./numberGreaterThanOrEqualRefine";

export const numberPositiveRefine = numberGreaterThanOrEqualRefine(0);

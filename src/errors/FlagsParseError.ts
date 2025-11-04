// Error classes
export class FlagsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlagsParseError";
  }
}

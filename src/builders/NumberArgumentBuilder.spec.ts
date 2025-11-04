import { test, describe, expect } from "bun:test";
import { ArgumentBuilder } from "./ArgumentBuilder";
import { NumberArgumentBuilder } from "./NumberArgumentBuilder";

describe("NumberArgumentBuilder", () => {
  test("should create NumberArgumentBuilder instance", () => {
    const builder = ArgumentBuilder.create().number();

    expect(builder).toBeInstanceOf(NumberArgumentBuilder);
  });

  test("should parse valid number argument", () => {
    const builder = ArgumentBuilder.create().number();

    const parsed = builder.parse(0, ["42"]);

    expect(parsed).toEqual({ args: ["42"], index: 0, value: 42 });
  });

  test("should parse invalid number as NaN", () => {
    const builder = ArgumentBuilder.create().number();

    const parsed = builder.parse(0, ["invalid"]);

    expect(parsed).toEqual({ args: ["invalid"], index: 0, value: NaN });
  });

  test("should return null with notNaN() when parsing invalid number", () => {
    const builder = ArgumentBuilder.create().number().notNaN();

    const parsed = builder.parse(0, ["invalid"]);

    expect(parsed).toBeNull();
  });

  test("should parse valid number with notNaN() validation", () => {
    const builder = ArgumentBuilder.create().number().notNaN();

    const parsed = builder.parse(0, ["42"]);

    expect(parsed).toEqual({ args: ["42"], index: 0, value: 42 });
  });

  test("should validate number greaterThan() threshold", () => {
    const builder = ArgumentBuilder.create().number().greaterThan(10);

    const parsed = builder.parse(0, ["15"]);

    expect(parsed).toEqual({ args: ["15"], index: 0, value: 15 });
  });

  test("should return null when number not greaterThan() threshold", () => {
    const builder = ArgumentBuilder.create().number().greaterThan(10);

    const parsed = builder.parse(0, ["5"]);

    expect(parsed).toBeNull();
  });

  test("should validate number greaterThanOrEqual() threshold", () => {
    const builder = ArgumentBuilder.create().number().greaterThanOrEqual(10);

    const parsed = builder.parse(0, ["10"]);

    expect(parsed).toEqual({ args: ["10"], index: 0, value: 10 });
  });

  test("should return null when number not greaterThanOrEqual() threshold", () => {
    const builder = ArgumentBuilder.create().number().greaterThanOrEqual(10);

    const parsed = builder.parse(0, ["9"]);

    expect(parsed).toBeNull();
  });

  test("should validate number lessThan() threshold", () => {
    const builder = ArgumentBuilder.create().number().lessThan(10);

    const parsed = builder.parse(0, ["5"]);

    expect(parsed).toEqual({ args: ["5"], index: 0, value: 5 });
  });

  test("should return null when number not lessThan() threshold", () => {
    const builder = ArgumentBuilder.create().number().lessThan(10);

    const parsed = builder.parse(0, ["15"]);

    expect(parsed).toBeNull();
  });

  test("should validate number lessThanOrEqual() threshold", () => {
    const builder = ArgumentBuilder.create().number().lessThanOrEqual(10);

    const parsed = builder.parse(0, ["10"]);

    expect(parsed).toEqual({ args: ["10"], index: 0, value: 10 });
  });

  test("should return null when number not lessThanOrEqual() threshold", () => {
    const builder = ArgumentBuilder.create().number().lessThanOrEqual(10);

    const parsed = builder.parse(0, ["11"]);

    expect(parsed).toBeNull();
  });

  test("should validate positive() number", () => {
    const builder = ArgumentBuilder.create().number().positive();

    const parsed = builder.parse(0, ["5"]);

    expect(parsed).toEqual({ args: ["5"], index: 0, value: 5 });
  });

  test("should return null when number is not positive()", () => {
    const builder = ArgumentBuilder.create().number().positive();

    const parsed = builder.parse(0, ["-5"]);

    expect(parsed).toBeNull();
  });

  test("should validate negative() number", () => {
    const builder = ArgumentBuilder.create().number().negative();

    const parsed = builder.parse(0, ["-5"]);

    expect(parsed).toEqual({ args: ["-5"], index: 0, value: -5 });
  });

  test("should return null when number is not negative()", () => {
    const builder = ArgumentBuilder.create().number().negative();

    const parsed = builder.parse(0, ["5"]);

    expect(parsed).toBeNull();
  });

  test("should validate number is multipleOf() value", () => {
    const builder = ArgumentBuilder.create().number().multipleOf(5);

    const parsed = builder.parse(0, ["15"]);

    expect(parsed).toEqual({ args: ["15"], index: 0, value: 15 });
  });

  test("should return null when number not multipleOf() value", () => {
    const builder = ArgumentBuilder.create().number().multipleOf(5);

    const parsed = builder.parse(0, ["7"]);

    expect(parsed).toBeNull();
  });

  test("should pass multiple chained validations", () => {
    const builder = ArgumentBuilder.create()
      .number()
      .notNaN()
      .positive()
      .greaterThan(10)
      .lessThan(100);

    const parsed = builder.parse(0, ["50"]);

    expect(parsed).toEqual({ args: ["50"], index: 0, value: 50 });
  });

  test("should return null when any chained validation fails", () => {
    const builder = ArgumentBuilder.create()
      .number()
      .notNaN()
      .positive()
      .greaterThan(10)
      .lessThan(100);

    const parsed = builder.parse(0, ["150"]);

    expect(parsed).toBeNull();
  });
});

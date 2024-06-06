import { test, expect, mock } from "bun:test";
import { ConsoleSpace } from "./console-draw";

test("should render a single text element", () => {
  expect(ConsoleSpace.render(new ConsoleSpace.Text("hello"))).toEqual(`hello`);
});

test("should render a grid with single text elements", () => {
  expect(
    ConsoleSpace.render(
      new ConsoleSpace.Grid([new ConsoleSpace.Text("hello")]),
    ),
  ).toEqual(`hello`);
});

test("should render a grid with multiple text elements", () => {
  expect(
    ConsoleSpace.render(
      new ConsoleSpace.Grid([
        new ConsoleSpace.Text("hello"),
        new ConsoleSpace.Text("hello"),
      ]),
    ),
  ).toEqual(`hello\nhello`);
});

test("should render a grid with multiple text elements on multiple lines", () => {
  expect(
    ConsoleSpace.render(
      new ConsoleSpace.Grid(
        [
          new ConsoleSpace.Text("hello"),
          new ConsoleSpace.Text("hello"),
          new ConsoleSpace.Text("a"),
        ],
        2,
      ),
    ),
  ).toEqual(`hello hello\na    `);
});

test("should get the position of an element at a specific index", () => {
  expect(ConsoleSpace.Grid.getPosByIndex(2, 2)).toEqual({ col: 0, row: 1 });
});

test("should get the position of an element at a specific index on a new line", () => {
  expect(ConsoleSpace.Grid.getPosByIndex(4, 2)).toEqual({ col: 0, row: 2 });
});

test("should get the position of an element at a specific index in a different column", () => {
  expect(ConsoleSpace.Grid.getPosByIndex(5, 2)).toEqual({ col: 1, row: 2 });
});

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  computeCursorPos,
  nextLineFeed,
  prevLineFeed,
  NAKPos,
} from "../../src/utils/utility.js";

const e = (s) => new TextEncoder().encode(s);
const TAB_STOP = 4;

describe("Testing utility", () => {
  describe("testing computeCursorPos", () => {
    it("should return row and col of one, when pos is zero", () => {
      assertEquals(computeCursorPos(e("ab"), 0, TAB_STOP), { row: 1, col: 1 });
    });

    it("should advance the column, when pos moves over plain chars", () => {
      assertEquals(computeCursorPos(e("abc"), 3, TAB_STOP), { row: 1, col: 4 });
    });

    it("should move to a new row and reset the column, when a newline is crossed", () => {
      const buffer = e("ab\ncd");
      assertEquals(computeCursorPos(buffer, 3, TAB_STOP), { row: 2, col: 1 });
    });

    it("should advance the column by the tab stop, when a tab is crossed", () => {
      const buffer = e("a\tb");
      assertEquals(computeCursorPos(buffer, 2, TAB_STOP), { row: 1, col: 6 });
    });

    it("should handle mixed newlines, tabs and chars, when spanning multiple lines", () => {
      const buffer = e("a\tb\nc");
      assertEquals(computeCursorPos(buffer, 5, TAB_STOP), { row: 2, col: 2 });
    });
  });

  describe("testing nextLineFeed", () => {
    const buffer = e("ab\ncd\nef");

    it("should return the next newline index, when one exists ahead", () => {
      assertEquals(nextLineFeed(0, buffer), 2);
    });

    it("should return the current index, when pos is already on a newline", () => {
      assertEquals(nextLineFeed(2, buffer), 2);
    });

    it("should return pos, when no newline exists ahead", () => {
      assertEquals(nextLineFeed(7, buffer), 7);
    });
  });

  describe("testing prevLineFeed", () => {
    const buffer = e("ab\ncd\nef");

    it("should return the line start index, when a newline is behind", () => {
      assertEquals(prevLineFeed(4, buffer), 3);
    });

    it("should return the current index, when pos is at a line start", () => {
      assertEquals(prevLineFeed(3, buffer), 3);
    });

    it("should return zero, when pos is on the first line", () => {
      assertEquals(prevLineFeed(2, buffer), 0);
    });
  });

  describe("testing NAKPos", () => {
    it("should return pos minus one, when at column one on a later line", () => {
      const buffer = e("ab\ncd");
      assertEquals(NAKPos(3, buffer), 2);
    });

    it("should return the previous line feed, when mid-line on a later line", () => {
      const buffer = e("ab\ncd");
      assertEquals(NAKPos(4, buffer), 3);
    });

    it("should return zero, when on the first line", () => {
      const buffer = e("abc");
      assertEquals(NAKPos(2, buffer), 0);
    });
  });
});

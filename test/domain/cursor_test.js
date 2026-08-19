import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import Cursor from "../../src/domain/cursor.js";

const e = (s) => new TextEncoder().encode(s);

describe("Testing Cursor", () => {
  describe("testing initialization", () => {
    it("should default pos and prevCol to zero, when no position is given", () => {
      const cursor = new Cursor();
      assertEquals(cursor.pos, 0);
      assertEquals(cursor.prevCol, 0);
    });

    it("should set pos and prevCol, when a position is given", () => {
      const cursor = new Cursor(5);
      assertEquals(cursor.pos, 5);
      assertEquals(cursor.prevCol, 5);
    });
  });

  describe("testing horizontal movement", () => {
    const buffer = e("abc\ndef");

    it("should move left, when within the line", () => {
      const cursor = new Cursor(2);
      cursor.moveLeft(buffer);
      assertEquals(cursor.pos, 1);
      assertEquals(cursor.prevCol, 1);
    });

    it("should move right, when within the line", () => {
      const cursor = new Cursor(1);
      cursor.moveRight(buffer);
      assertEquals(cursor.pos, 2);
      assertEquals(cursor.prevCol, 2);
    });

    it("should stay put, when moving left at the line start", () => {
      const cursor = new Cursor(0);
      cursor.moveLeft(buffer);
      assertEquals(cursor.pos, 0);
    });

    it("should stay put, when moving left across a newline", () => {
      const cursor = new Cursor(4);
      cursor.moveLeft(buffer);
      assertEquals(cursor.pos, 4);
    });

    it("should stay put, when moving right at a newline position", () => {
      const cursor = new Cursor(3);
      cursor.moveRight(buffer);
      assertEquals(cursor.pos, 3);
    });

    it("should stay put, when moving right at the buffer end", () => {
      const cursor = new Cursor(7);
      cursor.moveRight(buffer);
      assertEquals(cursor.pos, 7);
    });

    it("should move to the first column, when moving to first", () => {
      const cursor = new Cursor(5);
      cursor.moveToFirst(buffer);
      assertEquals(cursor.pos, 4);
      assertEquals(cursor.prevCol, 0);
    });

    it("should move to the last column of the line, when moving to last", () => {
      const cursor = new Cursor(0);
      cursor.moveToLast(buffer);
      assertEquals(cursor.pos, 3);
      assertEquals(cursor.prevCol, 3);
    });
  });

  describe("testing word movement", () => {
    const buffer = e("Hello World foo");

    it("should move to the next word start, when at a word start", () => {
      const cursor = new Cursor(0);
      cursor.moveToNextWord(buffer);
      assertEquals(cursor.pos, 6);
    });

    it("should move to the next word start, when in the middle of a word", () => {
      const cursor = new Cursor(2);
      cursor.moveToNextWord(buffer);
      assertEquals(cursor.pos, 6);
    });

    it("should stay put, when already at the buffer end", () => {
      const cursor = new Cursor(15);
      cursor.moveToNextWord(buffer);
      assertEquals(cursor.pos, 15);
    });

    it("should move to the previous word start, when at a word start", () => {
      const cursor = new Cursor(6);
      cursor.moveToPreviousWord(buffer);
      assertEquals(cursor.pos, 0);
    });

    it("should move to the current word start, when in the middle of a word", () => {
      const cursor = new Cursor(8);
      cursor.moveToPreviousWord(buffer);
      assertEquals(cursor.pos, 6);
    });

    it("should stay put, when at the buffer start", () => {
      const cursor = new Cursor(0);
      cursor.moveToPreviousWord(buffer);
      assertEquals(cursor.pos, 0);
    });
  });

  describe("testing vertical movement", () => {
    const buffer = e("abc\ndef\nghi");

    it("should move down preserving the column, when the next line is long enough", () => {
      const cursor = new Cursor(1);
      cursor.updatePrevCol(buffer);
      cursor.moveDown(buffer);
      assertEquals(cursor.pos, 5);
    });

    it("should move up preserving the column, when the previous line is long enough", () => {
      const cursor = new Cursor(5);
      cursor.updatePrevCol(buffer);
      cursor.moveUp(buffer);
      assertEquals(cursor.pos, 1);
    });

    it("should clamp to the line end, when the next line is shorter than the column", () => {
      const shortBuffer = e("abc\nd\nefgh");
      const cursor = new Cursor(1);
      cursor.updatePrevCol(shortBuffer);
      cursor.moveDown(shortBuffer);
      assertEquals(cursor.pos, 5);
    });

    it("should clamp to the line end, when the previous line is shorter than the column", () => {
      const shortBuffer = e("abc\nd\nefgh");
      const cursor = new Cursor(7);
      cursor.updatePrevCol(shortBuffer);
      cursor.moveUp(shortBuffer);
      assertEquals(cursor.pos, 5);
    });

    it("should stay put, when moving down from the last line", () => {
      const cursor = new Cursor(8);
      cursor.moveDown(buffer);
      assertEquals(cursor.pos, 8);
    });

    it("should stay put, when moving up from the first line", () => {
      const cursor = new Cursor(1);
      cursor.moveUp(buffer);
      assertEquals(cursor.pos, 1);
    });
  });

  describe("testing row computation", () => {
    const buffer = e("ab\ncd\nef");

    it("should return zero, when pos is on the first line", () => {
      const cursor = new Cursor(1);
      assertEquals(cursor.getRow(buffer), 0);
    });

    it("should count newlines, when pos is on a later line", () => {
      const cursor = new Cursor(5);
      assertEquals(cursor.getRow(buffer), 1);
    });
  });

  describe("testing edge cases", () => {
    const empty = e("");

    it("should keep pos zero for all movements, when the buffer is empty", () => {
      const cursor = new Cursor(0);
      cursor.moveLeft(empty);
      cursor.moveRight(empty);
      cursor.moveToFirst(empty);
      cursor.moveToLast(empty);
      cursor.moveToNextWord(empty);
      cursor.moveToPreviousWord(empty);
      cursor.moveDown(empty);
      cursor.moveUp(empty);
      assertEquals(cursor.pos, 0);
    });

    it("should stay put on moveDown, when the buffer has a single line", () => {
      const single = e("abc");
      const cursor = new Cursor(1);
      cursor.moveDown(single);
      assertEquals(cursor.pos, 1);
    });

    it("should stay put on moveUp, when the buffer has a single line", () => {
      const single = e("abc");
      const cursor = new Cursor(1);
      cursor.moveUp(single);
      assertEquals(cursor.pos, 1);
    });
  });
});

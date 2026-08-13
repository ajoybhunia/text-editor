import { assertEquals, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import TextBuffer from "../../src/domain/text_buffer.js";
import { KEYS } from "../../src/config/keys.js";

const decoder = new TextDecoder();

const text = (buffer) => decoder.decode(buffer.bytes);

describe("Testing TextBuffer", () => {
  describe("testing initialization", () => {
    it("should return the given content, when a buffer is created with text", () => {
      const buffer = new TextBuffer("Hello");
      assertEquals(text(buffer), "Hello");
      assertEquals(buffer.length, 5);
    });

    it("should have zero length, when initialized with an empty string", () => {
      const buffer = new TextBuffer("");
      assertEquals(text(buffer), "");
      assertEquals(buffer.length, 0);
    });
  });

  describe("testing insert", () => {
    let buffer;

    beforeEach(() => {
      buffer = new TextBuffer("Hello World");
    });

    it("should insert at the start, when position is 0", () => {
      buffer.insert(0, KEYS.y);
      assertEquals(text(buffer), "yHello World");
    });

    it("should insert in the middle, when position is within content", () => {
      buffer.insert(5, KEYS[","]);
      assertEquals(text(buffer), "Hello, World");
    });

    it("should insert at the end, when position equals length", () => {
      buffer.insert(11, KEYS["!"]);
      assertEquals(text(buffer), "Hello World!");
    });

    it("should insert into an empty buffer, when there is no content", () => {
      buffer = new TextBuffer("");
      buffer.insert(0, KEYS.a);
      assertEquals(text(buffer), "a");
    });

    it("should handle a newline char, when inserting a line break", () => {
      buffer.insert(5, KEYS.LF);
      assertEquals(text(buffer), "Hello\n World");
    });

    it("should reflect multiple sequential inserts, when several chars are added", () => {
      buffer.insert(5, KEYS[","]);
      buffer.insert(12, KEYS["!"]);
      buffer.insert(0, KEYS.y);
      assertEquals(text(buffer), "yHello, World!");
    });

    it("should return position plus one, when a single char is inserted", () => {
      const pos = buffer.insert(5, KEYS.a);
      assertEquals(pos, 6);
    });

    it("should throw, when position is less than zero", () => {
      assertThrows(() => buffer.insert(-1, KEYS.a));
    });

    it("should throw, when position exceeds the length", () => {
      assertThrows(() => buffer.insert(100, KEYS.a));
    });
  });

  describe("testing insertString", () => {
    let buffer;

    beforeEach(() => {
      buffer = new TextBuffer("Hello World");
    });

    it("should insert a string at the start, when position is 0", () => {
      buffer.insertString(0, "Yo ");
      assertEquals(text(buffer), "Yo Hello World");
    });

    it("should insert a string in the middle, when position is within content", () => {
      buffer.insertString(5, " there");
      assertEquals(text(buffer), "Hello there World");
    });

    it("should insert a string at the end, when position equals length", () => {
      buffer.insertString(11, "!");
      assertEquals(text(buffer), "Hello World!");
    });

    it("should insert a string into an empty buffer, when there is no content", () => {
      buffer = new TextBuffer("");
      buffer.insertString(0, "Hello");
      assertEquals(text(buffer), "Hello");
    });

    it("should return position plus the string length, when text is inserted", () => {
      const pos = buffer.insertString(5, "abc");
      assertEquals(pos, 8);
    });
  });

  describe("testing delete", () => {
    let buffer;

    beforeEach(() => {
      buffer = new TextBuffer("Hello World");
    });

    it("should delete a single char by default, when length is omitted", () => {
      buffer.delete(5);
      assertEquals(text(buffer), "Hell World");
    });

    it("should delete at the start, when position equals length of removed span", () => {
      buffer.delete(6, 6);
      assertEquals(text(buffer), "World");
    });

    it("should delete in the middle, when position is within content", () => {
      buffer.delete(5, 1);
      assertEquals(text(buffer), "Hell World");
    });

    it("should delete at the end, when position equals length", () => {
      buffer.delete(11, 6);
      assertEquals(text(buffer), "Hello");
    });

    it("should delete across a piece boundary, when the range spans old and new pieces", () => {
      buffer.insert(5, ",");
      buffer.delete(6, 2);
      assertEquals(text(buffer), "Hell World");
    });

    it("should empty the buffer, when deleting the whole content", () => {
      buffer.delete(11, 11);
      assertEquals(text(buffer), "");
      assertEquals(buffer.length, 0);
    });

    it("should return zero, when position is zero", () => {
      const pos = buffer.delete(0, 1);
      assertEquals(pos, 0);
    });

    it("should return position minus length, when text is deleted", () => {
      const pos = buffer.delete(5, 2);
      assertEquals(pos, 3);
    });

    it("should throw, when position exceeds the length", () => {
      assertThrows(() => buffer.delete(100, 1));
    });
  });

  describe("testing save, undo and redo", () => {
    let buffer;

    beforeEach(() => {
      buffer = new TextBuffer("Hello World");
    });

    it("should restore previous content, when undo is called after a saved edit", () => {
      buffer.save(5);
      buffer.insert(5, KEYS.a);
      buffer.undo(6);
      assertEquals(text(buffer), "Hello World");
    });

    it("should return the saved cursor position, when undo is called", () => {
      buffer.save(5);
      buffer.insert(5, KEYS.a);
      const pos = buffer.undo(6);
      assertEquals(pos, 5);
    });

    it("should return null, when undo is called with no history", () => {
      assertEquals(buffer.undo(0), null);
    });

    it("should re-apply the edit, when redo is called after an undo", () => {
      buffer.save(5);
      buffer.insert(5, KEYS.a);
      buffer.undo(6);
      buffer.redo(5);
      assertEquals(text(buffer), "Helloa World");
    });

    it("should return null, when redo is called with no history", () => {
      assertEquals(buffer.redo(0), null);
    });

    it("should clear redo history, when save is called after an undo", () => {
      buffer.save(5);
      buffer.insert(5, KEYS.a);
      buffer.undo(6);
      buffer.save(5);
      assertEquals(buffer.redo(5), null);
    });

    it("should restore original content, when undo and redo are round-tripped", () => {
      buffer.save(5);
      buffer.insert(5, KEYS.a);
      buffer.undo(6);
      assertEquals(text(buffer), "Hello World");
      buffer.redo(5);
      assertEquals(text(buffer), "Helloa World");
    });
  });
});

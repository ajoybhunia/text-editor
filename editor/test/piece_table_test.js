import { assertEquals, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { PieceTable } from "../ds/piece_table.js";

describe("Testing piece table data structure", () => {
  it("should initialize with original text", () => {
    const pt = new PieceTable("Hello");
    assertEquals(pt.getText(), "Hello");
  });

  describe("testing insert in a piece table", () => {
    let pt;

    beforeEach(() => {
      pt = new PieceTable("Hello World");
    });

    it("throws an error when insert position is not valid", () => {
      assertThrows(() => pt.insert(100, "A"));
    });

    it("successfully insert when original buffer is empty", () => {
      pt = new PieceTable("");
      pt.insert(0, "Hello");
      assertEquals(pt.getText(), "Hello");
    });

    it("should insert text in the middle", () => {
      pt.insert(5, ",");
      assertEquals(pt.getText(), "Hello, World");
    });

    it("should insert text at the beginning", () => {
      pt.insert(0, "Yo, ");
      assertEquals(pt.getText(), "Yo, Hello World");
    });

    it("should insert text at the end", () => {
      pt.insert(11, "!");
      assertEquals(pt.getText(), "Hello World!");
    });

    it("should handle multiple inserts", () => {
      pt.insert(5, ",");
      pt.insert(12, "!");
      pt.insert(0, "Yo ");
      assertEquals(pt.getText(), "Yo Hello, World!");
    });
  });

  describe("testing delete in a piece table", () => {
    let pt;

    beforeEach(() => {
      pt = new PieceTable("Hello World");
    });

    it("throws an error when delete position is not valid", () => {
      assertThrows(() => pt.insert(-100, 1));
    });

    it("should delete text in the middle", () => {
      const pt = new PieceTable("Hello, World");
      pt.delete(5, 1);
      assertEquals(pt.getText(), "Hello World");
    });

    it("should delete text from the beginning", () => {
      pt.delete(0, 6);
      assertEquals(pt.getText(), "World");
    });

    it("should delete text from the end", () => {
      pt.delete(5, 6);
      assertEquals(pt.getText(), "Hello");
    });

    it("should delete across multiple pieces", () => {
      pt.insert(5, ",");
      pt.delete(5, 2);
      assertEquals(pt.getText(), "HelloWorld");
    });

    it("should delete entire content", () => {
      pt.delete(0, 11);
      assertEquals(pt.getText(), "");
    });
  });
});

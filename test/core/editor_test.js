import { assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { spy, stub } from "@std/testing/mock";
import Editor from "../../src/core/editor.js";
import TextBuffer from "../../src/domain/buffer.js";
import Cursor from "../../src/domain/cursor.js";
import Terminal from "../../src/terminal/terminal.js";
import { KEYS } from "../../src/config/keys.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const stubs = [];

const reset = () => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
};

const noop = () => Promise.resolve();

const stubEnvironment = () => {
  stubs.push(stub(Deno, "consoleSize", () => ({ rows: 24, cols: 80 })));
  stubs.push(stub(Terminal, "clear", noop));
  stubs.push(stub(Terminal, "write", noop));
  stubs.push(stub(Terminal, "placeCursor", noop));
  stubs.push(stub(Terminal, "enableBracketedPaste", noop));
  stubs.push(stub(Terminal, "disableBracketedPaste", noop));
};

const scriptKeys = (keys) => {
  const queue = [...keys];
  stubs.push(stub(Terminal, "readKey", () =>
    queue.length ? Promise.resolve(queue.shift()) : Promise.resolve(KEYS.ESC)
  ));
};

const stubClipboard = (text) => {
  const bytes = encoder.encode(text);
  stubs.push(stub(Deno, "Command", function () {
    return { output: () => Promise.resolve({ stdout: bytes, success: text !== "" }) };
  }));
};

const stubWrite = () => {
  const s = spy(() => Promise.resolve());
  stubs.push(stub(Deno, "writeFile", s));
  stubs.push(stub(Deno, "chmod", noop));
  return s;
};

let editor;
let buffer;
let cursor;

const makeEditor = (text, pos = 0) => {
  buffer = new TextBuffer(text);
  cursor = new Cursor(pos);
  editor = new Editor(buffer, cursor);
  return { editor, buffer, cursor };
};

const bytes = () => decoder.decode(buffer.bytes);

beforeEach(() => {
  stubEnvironment();
});

afterEach(reset);

describe("Testing Editor", () => {
  describe("testing insert mode", () => {
    it("should insert chars at the cursor, when text is typed", async () => {
      makeEditor("hello", 5);
      scriptKeys([KEYS.a, KEYS.b, KEYS.ESC]);
      const res = await editor.handleInsert();
      assertEquals(res, { shouldReturn: false });
      assertEquals(bytes(), "helloab");
      assertEquals(cursor.pos, 7);
    });

    it("should insert into the middle of the buffer, when the cursor is mid-line", async () => {
      makeEditor("hello", 3);
      scriptKeys([KEYS.X, KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(bytes(), "helXlo");
      assertEquals(cursor.pos, 4);
    });

    it("should insert a line feed, when CR is pressed", async () => {
      makeEditor("hello", 5);
      scriptKeys([KEYS.CR, KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(bytes(), "hello\n");
      assertEquals(cursor.pos, 6);
    });

    it("should delete the previous char, when DELETE is pressed", async () => {
      makeEditor("hello", 5);
      scriptKeys([KEYS.DELETE, KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(bytes(), "hell");
      assertEquals(cursor.pos, 4);
    });

    it("should delete to the start of the line, when NAK is pressed", async () => {
      makeEditor("hello", 5);
      scriptKeys([KEYS.NAK, KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(bytes(), "");
      assertEquals(cursor.pos, 0);
    });

    it("should leave insert mode, when ESC is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS.X, KEYS.ESC]);
      await editor.handleInsert();
      editor.handleNormal(KEYS.l);
      assertEquals(cursor.pos, 2);
    });

    it("should move the cursor right, when the right arrow is pressed in insert mode", async () => {
      makeEditor("abcde", 2);
      scriptKeys(["right", KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(cursor.pos, 3);
      assertEquals(bytes(), "abcde");
    });
  });

  describe("testing mode entry", () => {
    it("should enter insert mode, when i is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS.X, KEYS.ESC]);
      const res = await editor.handleNormal(KEYS.i);
      assertEquals(res, { shouldReturn: false });
      assertEquals(bytes(), "Xhello");
    });

    it("should enter command line mode, when colon is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS.q, KEYS.CR]);
      const res = await editor.handleNormal(KEYS[":"]);
      assertEquals(res, { shouldReturn: true, shouldWrite: false });
    });
  });

  describe("testing normal mode navigation", () => {
    it("should move right, when l is pressed", async () => {
      makeEditor("hello");
      await editor.handleNormal(KEYS.l);
      assertEquals(cursor.pos, 1);
    });

    it("should not move left past the start, when h is pressed at the start", async () => {
      makeEditor("hello");
      await editor.handleNormal(KEYS.h);
      assertEquals(cursor.pos, 0);
    });

    it("should move to the first column, when 0 is pressed", async () => {
      makeEditor("hello\nworld", 8);
      await editor.handleNormal(KEYS["0"]);
      assertEquals(cursor.pos, 6);
    });

    it("should move to the last column, when $ is pressed", async () => {
      makeEditor("hello\nworld");
      await editor.handleNormal(KEYS.$);
      assertEquals(cursor.pos, 5);
    });

    it("should move to the next word, when w is pressed", async () => {
      makeEditor("hello world");
      await editor.handleNormal(KEYS.w);
      assertEquals(cursor.pos, 6);
    });

    it("should move to the previous word, when b is pressed", async () => {
      makeEditor("hello world", 6);
      await editor.handleNormal(KEYS.b);
      assertEquals(cursor.pos, 0);
    });

    it("should move down, when j is pressed", async () => {
      makeEditor("hello\nworld");
      await editor.handleNormal(KEYS.j);
      assertEquals(cursor.pos, 6);
    });

    it("should move up, when k is pressed", async () => {
      makeEditor("hello\nworld", 6);
      await editor.handleNormal(KEYS.k);
      assertEquals(cursor.getRow(buffer.bytes), 0);
    });

    it("should move right, when the right arrow is pressed", async () => {
      makeEditor("hello");
      await editor.handleNormal("right");
      assertEquals(cursor.pos, 1);
    });

    it("should move left, when the left arrow is pressed", async () => {
      makeEditor("hello", 1);
      await editor.handleNormal("left");
      assertEquals(cursor.pos, 0);
    });

    it("should move down, when the down arrow is pressed", async () => {
      makeEditor("hello\nworld");
      await editor.handleNormal("down");
      assertEquals(cursor.pos, 6);
    });

    it("should move up, when the up arrow is pressed", async () => {
      makeEditor("hello\nworld", 6);
      await editor.handleNormal("up");
      assertEquals(cursor.getRow(buffer.bytes), 0);
    });
  });

  describe("testing undo and redo", () => {
    it("should undo an insert, when u is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS.X, KEYS.ESC]);
      await editor.handleNormal(KEYS.i);
      await editor.handleNormal(KEYS.u);
      assertEquals(bytes(), "hello");
      assertEquals(cursor.pos, 0);
    });

    it("should redo an undone insert, when Ctrl+R is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS.X, KEYS.ESC]);
      await editor.handleNormal(KEYS.i);
      await editor.handleNormal(KEYS.u);
      await editor.handleNormal(KEYS.DC2);
      assertEquals(bytes(), "Xhello");
      assertEquals(cursor.pos, 1);
    });
  });

  describe("testing delete line commands", () => {
    it("should delete to the end of the line, when d$ is pressed", async () => {
      makeEditor("hello\nworld");
      scriptKeys([KEYS.$]);
      await editor.handleNormal(KEYS.d);
      assertEquals(bytes(), "\nworld");
    });

    it("should delete to the start of the line, when d0 is pressed", async () => {
      makeEditor("hello\nworld", 8);
      scriptKeys([KEYS["0"]]);
      await editor.handleNormal(KEYS.d);
      assertEquals(bytes(), "hello\nrld");
    });

    it("should delete the whole line, when dd is pressed", async () => {
      makeEditor("hello\nworld");
      scriptKeys([KEYS.d]);
      await editor.handleNormal(KEYS.d);
      assertEquals(bytes(), "world");
    });

    it("should delete the last line, when dd is pressed with the cursor at the end of the buffer", async () => {
      makeEditor("line1\nline2", 11);
      scriptKeys([KEYS.d]);
      await editor.handleNormal(KEYS.d);
      assertEquals(bytes(), "line1");
    });
  });

  describe("testing the delete-line fallthrough", () => {
    it("should enter command line mode, when d followed by colon is pressed", async () => {
      makeEditor("hello");
      scriptKeys([KEYS[":"], KEYS.q, KEYS.CR]);
      const res = await editor.handleNormal(KEYS.d);
      assertEquals(res, { shouldReturn: true, shouldWrite: false });
    });
  });

  describe("testing paste", () => {
    it("should insert clipboard text at the cursor, when p is pressed", async () => {
      makeEditor("hello");
      stubClipboard(" PASTE");
      await editor.handleNormal(KEYS.p);
      assertEquals(bytes(), " PASTEhello");
      assertEquals(cursor.pos, 6);
    });

    it("should do nothing, when the clipboard is empty", async () => {
      makeEditor("hello");
      stubClipboard("");
      await editor.handleNormal(KEYS.p);
      assertEquals(bytes(), "hello");
    });
  });

  describe("testing bracketed paste", () => {
    it("should insert the paste payload, when pasting in normal mode", async () => {
      makeEditor("hello");
      await editor.handleNormal({ paste: "Hi" });
      assertEquals(bytes(), "Hihello");
    });

    it("should insert the paste payload, when pasting in insert mode", async () => {
      makeEditor("hello");
      scriptKeys([{ paste: "Hi" }, KEYS.ESC]);
      await editor.handleInsert();
      assertEquals(bytes(), "Hihello");
    });
  });

  describe("testing run", () => {
    const stubSetRaw = () => {
      stubs.push(stub(Deno.stdin, "setRaw", () => {}));
    };

    it("should write the file and return, when :wq is entered", async () => {
      makeEditor("hello");
      const writeSpy = stubWrite();
      stubSetRaw();
      scriptKeys([KEYS[":"], KEYS.w, KEYS.q, KEYS.CR]);
      await editor.run("file.txt", true, 0o100644);
      assertEquals(writeSpy.calls.length, 1);
      assertEquals(writeSpy.calls[0].args[0], "file.txt");
      assertEquals(decoder.decode(writeSpy.calls[0].args[1]), "hello");
    });

    it("should return without writing, when :q is entered", async () => {
      makeEditor("hello");
      const writeSpy = stubWrite();
      stubSetRaw();
      scriptKeys([KEYS[":"], KEYS.q, KEYS.CR]);
      await editor.run("file.txt", true, 0o100644);
      assertEquals(writeSpy.calls.length, 0);
    });

    it("should restore raw mode and paste handling, when run returns", async () => {
      makeEditor("hello");
      stubWrite();
      const setRawSpy = spy();
      stubs.push(stub(Deno.stdin, "setRaw", setRawSpy));
      scriptKeys([KEYS[":"], KEYS.q, KEYS.CR]);
      await editor.run("file.txt", true, 0o100644);
      assertEquals(setRawSpy.calls.map((c) => c.args[0]), [true, false]);
    });
  });
});

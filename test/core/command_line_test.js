import { assertEquals } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { handleCommandLine } from "../../src/core/command_line.js";
import { MODES } from "../../src/config/modes.js";
import { KEYS } from "../../src/config/keys.js";
import Terminal from "../../src/terminal/terminal.js";

const e = (s) => new TextEncoder().encode(s);

const stubs = [];

const reset = () => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
};

const noop = () => Promise.resolve();

const stubConsoleAndOutput = () => {
  stubs.push(stub(Deno, "consoleSize", () => ({ rows: 24, cols: 80 })));
  stubs.push(stub(Terminal, "clear", noop));
  stubs.push(stub(Terminal, "write", noop));
  stubs.push(stub(Terminal, "placeCursor", noop));
};

const scriptKeys = (keys) => {
  const queue = [...keys];
  stubs.push(stub(Terminal, "readKey", () => queue.length ? Promise.resolve(queue.shift()) : Promise.resolve(KEYS.ESC)));
};

afterEach(reset);

describe("Testing command line", () => {
  const buffer = e("hello");

  describe("testing exit paths", () => {
    it("should return normal mode without writing, when ESC is pressed", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.ESC]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.mode, MODES.NORMAL);
      assertEquals(res.ctx, { shouldReturn: false });
    });

    it("should return normal mode, when the sole colon is deleted", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.DELETE]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.mode, MODES.NORMAL);
      assertEquals(res.ctx, { shouldReturn: false });
    });
  });

  describe("testing delete edge cases", () => {
    it("should delete the sole colon and exit, when only the colon is present", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.DELETE]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: false });
    });

    it("should not delete the colon, when other content exists and cursor is on the colon", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.w, "left", KEYS.DELETE, KEYS.CR]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should delete an interior char, when content is present", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.w, KEYS.q, KEYS.DELETE, KEYS.DELETE, KEYS.CR]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: false });
    });

    it("should keep the colon intact, when deleting after building content", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.w, KEYS.DELETE, KEYS.w, KEYS.CR]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });
  });

  describe("testing command parsing", () => {
    const run = async (keys) => {
      stubConsoleAndOutput();
      scriptKeys(keys);
      return await handleCommandLine(MODES.NORMAL, buffer);
    };

    it("should quit without writing, when :q is entered", async () => {
      const res = await run([KEYS.q, KEYS.CR]);
      assertEquals(res.mode, MODES.NORMAL);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: false });
    });

    it("should quit without writing, when :q! is entered", async () => {
      const res = await run([KEYS.q, KEYS["!"], KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: false });
    });

    it("should quit without writing, when :qa is entered", async () => {
      const res = await run([KEYS.q, KEYS.a, KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: false });
    });

    it("should quit without writing, when :qa! is entered", async () => {
      const res = await run([KEYS.q, KEYS.a, KEYS["!"], KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: false });
    });

    it("should write without quitting, when :w is entered", async () => {
      const res = await run([KEYS.w, KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should force write without quitting, when :w! is entered", async () => {
      const res = await run([KEYS.w, KEYS["!"], KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: true, data: buffer });
    });

    it("should write and quit, when :wq is entered", async () => {
      const res = await run([KEYS.w, KEYS.q, KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should force write and quit, when :wq! is entered", async () => {
      const res = await run([KEYS.w, KEYS.q, KEYS["!"], KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: true, forceWrite: true, data: buffer });
    });

    it("should do nothing, when an unknown command is entered", async () => {
      const res = await run([KEYS.f, KEYS.o, KEYS.o, KEYS.CR]);
      assertEquals(res.mode, MODES.NORMAL);
      assertEquals(res.ctx, { shouldReturn: false });
    });
  });

  describe("testing arrow navigation", () => {
    const run = async (keys) => {
      stubConsoleAndOutput();
      scriptKeys(keys);
      return await handleCommandLine(MODES.NORMAL, buffer);
    };

    it("should advance the cursor, when the right arrow is pressed mid-command", async () => {
      const res = await run([KEYS.w, "right", KEYS.q, KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should stay put, when the right arrow is pressed at the end", async () => {
      const res = await run([KEYS.w, "right", KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should stay put, when the left arrow is pressed at the start", async () => {
      const res = await run(["left", KEYS.w, KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should decrease the cursor, when the left arrow is pressed mid-command", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.w, KEYS.q, "left", KEYS.DELETE, KEYS.CR]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: false });
    });

    it("should ignore the up arrow, when pressed in the command line", async () => {
      const res = await run([KEYS.w, "up", KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });

    it("should ignore the down arrow, when pressed in the command line", async () => {
      const res = await run([KEYS.w, "down", KEYS.CR]);
      assertEquals(res.ctx, { shouldReturn: false, shouldWrite: true, forceWrite: false, data: buffer });
    });
  });

  describe("testing typing mechanics", () => {
    it("should build a :wq command from typed chars, when w q and enter are pressed", async () => {
      stubConsoleAndOutput();
      scriptKeys([KEYS.w, KEYS.q, KEYS.CR]);
      const res = await handleCommandLine(MODES.NORMAL, buffer);
      assertEquals(res.ctx, { shouldReturn: true, shouldWrite: true, forceWrite: false, data: buffer });
    });
  });
});

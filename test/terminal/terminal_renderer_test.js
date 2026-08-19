import { assertEquals } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { spy, stub } from "@std/testing/mock";
import { render } from "../../src/terminal/terminal_renderer.js";
import Terminal from "../../src/terminal/terminal.js";
import { MODES } from "../../src/config/modes.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const stubs = [];

const reset = () => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
};

const noop = () => Promise.resolve();

const stubTerminal = () => {
  stubs.push(stub(Deno, "consoleSize", () => ({ rows: 24, cols: 80 })));
  stubs.push(stub(Terminal, "clear", noop));
  stubs.push(stub(Terminal, "placeCursor", noop));
  const s = spy(noop);
  stubs.push(stub(Terminal, "write", s));
  return s;
};

afterEach(reset);

describe("Testing terminal renderer", () => {
  it("should expand tabs to spaces, when a tab is present in the buffer", async () => {
    const writeSpy = stubTerminal();
    await render(
      encoder.encode("a\tb"),
      0,
      MODES.NORMAL,
      0,
      MODES.NORMAL,
    );
    const writes = writeSpy.calls.map((c) => decoder.decode(c.args[0]));
    assertEquals(writes.includes("a    b"), true);
  });

  it("should draw an undecorated status bar, when in command line mode", async () => {
    const writeSpy = stubTerminal();
    await render(
      encoder.encode("hello"),
      0,
      "hello",
      0,
      MODES.CLI,
    );
    assertEquals(writeSpy.calls.length, 2);
    assertEquals(decoder.decode(writeSpy.calls[1].args[0]), "hello");
  });
});
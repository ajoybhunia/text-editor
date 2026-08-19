import { assertEquals, assertNotEquals } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { spy, stub } from "@std/testing/mock";
import Terminal from "../../src/terminal/terminal.js";
import { KEYS } from "../../src/config/keys.js";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const stubs = [];

const stubStdin = (fakeRead) => {
  stubs.push(stub(Deno.stdin, "read", fakeRead));
};

const stubStdout = () => {
  const s = spy();
  stubs.push(stub(Deno.stdout, "write", s));
  return s;
};

const makeReader = (bytes) => {
  let i = 0;
  return (buf) => {
    if (i >= bytes.length) return Promise.resolve(null);
    const n = Math.min(buf.length, bytes.length - i);
    buf.set(bytes.subarray(i, i + n));
    i += n;
    return Promise.resolve(n);
  };
};

afterEach(() => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
});

describe("Testing Terminal", () => {
  describe("testing readKey", () => {
    it("should return a plain byte, when the input is a single printable char", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.a])));
      assertEquals(await Terminal.readKey(), KEYS.a);
    });

    it("should return null, when the input is empty", async () => {
      stubStdin(makeReader(new Uint8Array([])));
      assertEquals(await Terminal.readKey(), null);
    });

    it("should map to up, when an arrow up escape sequence is received", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.A])));
      assertEquals(await Terminal.readKey(), "up");
    });

    it("should map to down, when an arrow down escape sequence is received", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.B])));
      assertEquals(await Terminal.readKey(), "down");
    });

    it("should map to right, when an arrow right escape sequence is received", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.C])));
      assertEquals(await Terminal.readKey(), "right");
    });

    it("should map to left, when an arrow left escape sequence is received", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.D])));
      assertEquals(await Terminal.readKey(), "left");
    });

    it("should return null, when an unknown escape sequence is received", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.Z])));
      assertEquals(await Terminal.readKey(), null);
    });

    it("should return a paste payload, when a bracketed paste sequence is received", async () => {
      const frame = encoder.encode("\x1b[200~Hi\x1b[201~");
      stubStdin(makeReader(frame));
      assertEquals(await Terminal.readKey(), { paste: "Hi" });
    });
  });

  describe("testing lone ESC race", () => {
    it("should return ESC, when the timeout wins over the second read", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC])));
      stubs.push(stub(globalThis, "setTimeout", (fn) => {
        fn();
        return 0;
      }));

      assertEquals(await Terminal.readKey(), KEYS.ESC);
    });

    it("should consume the bracket, when the second read wins over the timeout", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["], KEYS.A])));
      const result = await Terminal.readKey();
      assertEquals(result, "up");
      assertNotEquals(result, KEYS.ESC);
    });

    it("should return the ESC byte, when the stream ends right after an ESC", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC])));
      stubs.push(stub(globalThis, "setTimeout", () => 0));

      assertEquals(await Terminal.readKey(), KEYS.ESC);
    });

    it("should return the ESC byte, when the stream ends after ESC and bracket", async () => {
      stubStdin(makeReader(new Uint8Array([KEYS.ESC, KEYS["["]])));
      stubs.push(stub(globalThis, "setTimeout", () => 0));

      assertEquals(await Terminal.readKey(), KEYS.ESC);
    });
  });

  describe("testing paste content", () => {
    it("should return an empty paste, when the stream ends without a closing sequence", async () => {
      stubStdin(makeReader(encoder.encode("\x1b[200~")));
      stubs.push(stub(globalThis, "setTimeout", () => 0));

      assertEquals(await Terminal.readKey(), { paste: "" });
    });

    it("should assemble the paste across multiple reads, when the content spans chunks", async () => {
      const content = encoder.encode("a".repeat(4096) + "b");
      stubStdin(makeReader(
        new Uint8Array([...encoder.encode("\x1b[200~"), ...content, ...encoder.encode("\x1b[201~")]),
      ));
      stubs.push(stub(globalThis, "setTimeout", () => 0));

      const result = await Terminal.readKey();
      assertEquals(result, { paste: "a".repeat(4096) + "b" });
    });
  });

  describe("testing write", () => {
    it("should write the bytes to stdout, when writing data", async () => {
      const writeSpy = stubStdout();
      const bytes = new Uint8Array([0x68, 0x69]);
      await Terminal.write(bytes);
      assertEquals(writeSpy.calls.length, 1);
      assertEquals(decoder.decode(writeSpy.calls[0].args[0]), "hi");
    });

    it("should write the clear sequence, when clearing the screen", async () => {
      const writeSpy = stubStdout();
      await Terminal.clear();
      assertEquals(decoder.decode(writeSpy.calls[0].args[0]), "\x1b[2J\x1b[H");
    });

    it("should write the cursor placement sequence, when placing the cursor", async () => {
      const writeSpy = stubStdout();
      await Terminal.placeCursor(3, 5);
      assertEquals(decoder.decode(writeSpy.calls[0].args[0]), "\x1b[3;5H");
    });

    it("should write the bracketed paste enable sequence, when enabled", async () => {
      const writeSpy = stubStdout();
      await Terminal.enableBracketedPaste();
      assertEquals(decoder.decode(writeSpy.calls[0].args[0]), "\x1b[?2004h");
    });

    it("should write the bracketed paste disable sequence, when disabled", async () => {
      const writeSpy = stubStdout();
      await Terminal.disableBracketedPaste();
      assertEquals(decoder.decode(writeSpy.calls[0].args[0]), "\x1b[?2004l");
    });
  });
});

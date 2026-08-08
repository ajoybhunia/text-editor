import { cursorNavigationMap } from "../config/key-maps/arrows.js";
import { KEYS } from "../config/keys.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CLEAR = "\x1b[2J\x1b[H";
const BRACKETED_PASTE_ENABLE = "\x1b[?2004h";
const BRACKETED_PASTE_DISABLE = "\x1b[?2004l";

export default class Terminal {
  static async write(bytes) {
    await Deno.stdout.write(bytes);
  }

  static async clear() {
    await Deno.stdout.write(encoder.encode(CLEAR));
  }

  static async placeCursor(row, col) {
    await this.write(encoder.encode(`\x1b[${row};${col}H`));
  }

  static async enableBracketedPaste() {
    await Deno.stdout.write(encoder.encode(BRACKETED_PASTE_ENABLE));
  }

  static async disableBracketedPaste() {
    await Deno.stdout.write(encoder.encode(BRACKETED_PASTE_DISABLE));
  }

  static #pendingByte = null;

  static #readByte() {
    if (this.#pendingByte === null) {
      this.#pendingByte = (async () => {
        const byte = new Uint8Array(1);
        const n = await Deno.stdin.read(byte);
        this.#pendingByte = null;
        return n ? byte[0] : null;
      })();
    }
    return this.#pendingByte;
  }

  static async readKey() {
    const firstByte = await Terminal.#readByte();
    if (firstByte === null) return null;
    if (firstByte !== KEYS.ESC) return firstByte;

    const IS_LONE_ESC = Symbol("lone-esc");
    const ESC_TIMEOUT_MS = 30;
    const escTimeout = new Promise((resolve) =>
      setTimeout(() => resolve(IS_LONE_ESC), ESC_TIMEOUT_MS)
    );

    const secondByte = await Promise.race([Terminal.#readByte(), escTimeout]);
    if (secondByte === IS_LONE_ESC) return firstByte;
    if (secondByte === null || secondByte !== KEYS["["]) return firstByte;

    const thirdByte = await Terminal.#readByte();
    if (thirdByte === null) return firstByte;

    if (cursorNavigationMap[thirdByte] !== undefined) {
      return cursorNavigationMap[thirdByte];
    }

    if (thirdByte === 0x32) {
      const fourthByte = await Terminal.#readByte();
      const fifthByte = await Terminal.#readByte();
      const sixthByte = await Terminal.#readByte();

      if (fourthByte === 0x30 && fifthByte === 0x30 && sixthByte === 0x7E) {
        const pasteText = await Terminal.#readPasteContent();
        return { paste: pasteText };
      }
    }

    return null;
  }

  static async #readPasteContent() {
    const chunks = [];
    const endSeq = new Uint8Array([0x1B, 0x5B, 0x32, 0x30, 0x31, 0x7E]);
    const endLen = endSeq.length;
    let tail = new Uint8Array(0);

    while (true) {
      const buf = new Uint8Array(4096);
      const n = await Deno.stdin.read(buf);
      if (n === null) break;

      const slice = buf.subarray(0, n);
      const combined = new Uint8Array(tail.length + slice.length);
      combined.set(tail, 0);
      combined.set(slice, tail.length);

      let endIdx = -1;
      for (let i = 0; i <= combined.length - endLen; i++) {
        let match = true;
        for (let j = 0; j < endLen; j++) {
          if (combined[i + j] !== endSeq[j]) { match = false; break; }
        }
        if (match) { endIdx = i; break; }
      }

      if (endIdx !== -1) {
        chunks.push(combined.subarray(0, endIdx));
        break;
      }

      const keep = Math.min(combined.length, endLen - 1);
      const commitLen = combined.length - keep;
      if (commitLen > 0) chunks.push(combined.subarray(0, commitLen));
      tail = combined.subarray(commitLen);
    }

    const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
    const all = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      all.set(c, offset);
      offset += c.length;
    }

    return decoder.decode(all);
  }
}

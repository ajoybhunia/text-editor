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

  static async #readByte() {
    const buf = new Uint8Array(1);
    const n = await Deno.stdin.read(buf);
    return n ? buf[0] : null;
  }

  static async readKey() {
    const b0 = await Terminal.#readByte();
    if (b0 === null) return null;
    if (b0 !== KEYS.ESC) return b0;

    const b1 = await Terminal.#readByte();
    if (b1 === null || b1 !== KEYS["["]) return b0;

    const b2 = await Terminal.#readByte();
    if (b2 === null) return b0;

    if (cursorNavigationMap[b2] !== undefined) {
      return cursorNavigationMap[b2];
    }

    if (b2 === 0x32) {
      const b3 = await Terminal.#readByte();
      const b4 = await Terminal.#readByte();
      const b5 = await Terminal.#readByte();

      if (b3 === 0x30 && b4 === 0x30 && b5 === 0x7E) {
        const text = await Terminal.#readPasteContent();
        return { paste: text };
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

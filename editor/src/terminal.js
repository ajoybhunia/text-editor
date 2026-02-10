import { KEYS } from "./utils.js";

const encoder = new TextEncoder();
const CLEAR = "\x1b[2J\x1b[H";

export class Terminal {
  static async write(bytes) {
    await Deno.stdout.write(bytes);
  }

  static async clear() {
    await Deno.stdout.write(encoder.encode(CLEAR));
  }

  static async placeCursor(row, col) {
    await this.write(encoder.encode(`\x1b[${row};${col}H`));
  }

  #mapKeys() {
    return {
      [KEYS.A]: () => KEYS.UP,
      [KEYS.B]: () => KEYS.DOWN,
      [KEYS.C]: () => KEYS.RIGHT,
      [KEYS.D]: () => KEYS.LEFT,
    };
  }

  static async readKey() {
    const buf = new Uint8Array(3);
    const n = await Deno.stdin.read(buf);

    if (!n) return null;

    if (buf[0] === KEYS.ESC && buf[1] === KEYS["["]) {
      const terminal = new Terminal();
      return terminal.#mapKeys()[buf[2]]();
    }

    return buf[0];
  }
}

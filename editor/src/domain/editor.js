import { Terminal } from "./terminal.js";
import { Cursor } from "./cursor.js";
import { TextBuffer } from "./text_buffer.js";
import {
  arrowKeyMovementMap,
  KEYS,
  MODES,
  normalModeMovementMap,
  quitOptions,
} from "../utils/utils.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class Editor {
  #buffer;
  #cursor;
  #mode;
  #insertByteMap;

  constructor(bytes) {
    this.#buffer = new TextBuffer(decoder.decode(bytes));
    this.#cursor = new Cursor();
    this.#mode = MODES.NORMAL;

    this.#insertByteMap = {
      [KEYS.BACKSPACE]: () => this.#buffer.delete(this.#cursor.pos, 1),
      [KEYS.CR]: () => this.#buffer.insert(this.#cursor.pos, KEYS.NEW_LINE),
      [KEYS.NAK]: () =>
        this.#buffer.delete(
          this.#cursor.pos,
          this.#cursor.pos - this.#NAKPos(),
        ),
    };
  }

  async run() {
    Deno.stdin.setRaw(true);

    while (true) {
      await this.#render(this.#buffer.bytes, this.#cursor.pos);
      const key = await Terminal.readKey();
      const info = await this.#handleNormal(key);

      if (info.shouldReturn) {
        Deno.stdin.setRaw(false);
        return info;
      }
    }
  }

  #nextLineFeed() {
    for (let i = this.#cursor.pos; i < this.#buffer.length; i++) {
      if (this.#buffer.bytes[i] === KEYS.NEW_LINE) return i;
    }

    return this.#buffer.length;
  }

  #prevLineFeed() {
    for (let i = this.#cursor.pos; i > 0; i--) {
      if (this.#buffer.bytes[i - 1] === KEYS.NEW_LINE) return i;
    }

    return 0;
  }

  async #handleDeleteLine(motion) {
    if (motion === KEYS["0"]) {
      this.#cursor.pos = this.#buffer.delete(
        this.#cursor.pos,
        this.#cursor.pos - this.#prevLineFeed(),
      );

      return { shouldReturn: false };
    }

    if (motion === KEYS.$) {
      this.#cursor.pos = this.#buffer.delete(
        this.#nextLineFeed(),
        this.#nextLineFeed() - this.#cursor.pos,
      );

      return { shouldReturn: false };
    }

    if (motion === KEYS.d) {
      const nextLineFeed = this.#nextLineFeed();
      const next = nextLineFeed === this.#buffer.length
        ? this.#buffer.length
        : nextLineFeed + 1;

      this.#cursor.pos = this.#buffer.delete(
        next,
        next - this.#cursor.pos,
      );
      this.#cursor.pos = this.#buffer.delete(
        this.#cursor.pos,
        this.#cursor.pos - this.#prevLineFeed(),
      );

      return { shouldReturn: false };
    }

    return await this.#handleModes(motion);
  }

  async #handleModes(key) {
    if (key === KEYS[":"]) { // : -> CLI
      const _pos = this.#buffer.undo();
      this.#mode = MODES.CLI;
      return await this.#handleCLI();
    }

    if (key === KEYS.i) { // i -> insert
      this.#mode = MODES.INSERT;
      return await this.#handleInsert();
    }
  }

  async #handleNormal(key) {
    if (key === KEYS.i || key === KEYS[":"]) {
      this.#buffer.save(this.#cursor.pos);
      return this.#handleModes(key);
    }

    if (key === KEYS.u) { // u -> undo
      const cursorPosition = this.#buffer.undo();

      if (cursorPosition !== null) {
        this.#cursor.pos = cursorPosition;
      }

      return { shouldReturn: false };
    }

    if (key === KEYS.d) { // d -> delete line command
      const motion = await Terminal.readKey();

      if ([KEYS["0"], KEYS.$, KEYS.d, KEYS[":"]].includes(motion)) {
        this.#buffer.save(this.#cursor.pos);
        return await this.#handleDeleteLine(motion);
      }
    }

    const mapper = normalModeMovementMap[key] || arrowKeyMovementMap[key];
    if (mapper !== undefined) {
      this.#cursor[mapper](this.#buffer.bytes);
    }

    return { shouldReturn: false };
  }

  #NAKPos() {
    const { row, col } = this.#computeCursor(
      this.#buffer.bytes,
      this.#cursor.pos,
    );

    if (col === 1 && row !== 1) return this.#cursor.pos - 1;

    return this.#prevLineFeed();
  }

  async #handleInsert() {
    while (true) {
      await this.#render(this.#buffer.bytes, this.#cursor.pos);
      const key = await Terminal.readKey();

      if (key === KEYS.ESC) {
        this.#mode = MODES.NORMAL;
        return { shouldReturn: false };
      } else if (key in arrowKeyMovementMap) {
        this.#cursor[arrowKeyMovementMap[key]](this.#buffer.bytes);
      } else if (key in this.#insertByteMap) {
        this.#cursor.pos = this.#insertByteMap[key]();
      } else if (typeof key === "number") {
        this.#cursor.pos = this.#buffer.insert(this.#cursor.pos, key);
      }
    }
  }

  async #handleCLI() {
    const cmdBuff = new TextBuffer(":");
    let pos = cmdBuff.length;

    while (true) {
      await this.#render(cmdBuff.bytes, pos);
      const key = await Terminal.readKey();

      pos = (key === KEYS.BACKSPACE)
        ? cmdBuff.delete(pos)
        : cmdBuff.insert(pos, key);

      if (key === KEYS.ESC || cmdBuff.length === 0) {
        this.#mode = MODES.NORMAL;
        return { shouldReturn: false };
      }

      if (key === KEYS.CR) {
        const cmd = decoder.decode(cmdBuff.bytes).trim();
        if (cmd in quitOptions) return quitOptions[cmd](this.#buffer.bytes);

        this.#mode = MODES.NORMAL;
        return { shouldReturn: false };
      }
    }
  }

  #computeCursor(bytes, pos) {
    let row = 1, col = 1;

    for (let i = 0; i < pos; i++) {
      bytes[i] === KEYS.NEW_LINE ? (row++, col = 1) : col++;
    }

    return { row, col };
  }

  async #placeCursor(bytes, pos) {
    const { row, col } = this.#computeCursor(bytes, pos);
    await Terminal.placeCursor(row, col);
  }

  async #drawStatus() {
    const status = this.#mode;
    await Terminal.write(
      new Uint8Array([KEYS.NEW_LINE, KEYS.NEW_LINE, ...encoder.encode(status)]),
    );
  }

  async #render(bytes, pos) {
    await Terminal.clear();
    await Terminal.write(bytes);
    await this.#drawStatus();
    await this.#placeCursor(bytes, pos);
  }
}

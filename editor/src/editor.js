import { Terminal } from "./terminal.js";
import { Cursor } from "./cursor.js";
import { TextBuffer } from "./text_buffer.js";
import { KEYS, MODES } from "./utils.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class Editor {
  #buffer;
  #cursor;
  #mode;

  constructor(bytes) {
    this.#buffer = new TextBuffer(bytes);
    this.#cursor = new Cursor();
    this.#cursor.pos = this.#buffer.length;
    this.#mode = MODES.MODE_NORMAL;
  }

  async run() {
    Deno.stdin.setRaw(true);

    while (true) {
      await this.#render(this.#buffer.bytes, this.#cursor.pos);
      const key = await Terminal.readKey();
      const info = await this.#handleNormal(key);

      if (info && info.shouldReturn) {
        Deno.stdin.setRaw(false);
        return info;
      }
    }
  }

  #normalModeCursorCallback() {
    return {
      [KEYS.LEFT]: () => this.#cursor.moveLeft(this.#buffer.bytes),
      [KEYS.RIGHT]: () => this.#cursor.moveRight(this.#buffer.bytes),
      [KEYS.UP]: () => this.#cursor.moveUp(this.#buffer.bytes),
      [KEYS.DOWN]: () => this.#cursor.moveDown(this.#buffer.bytes),
      [KEYS.h]: () => this.#cursor.moveLeft(this.#buffer.bytes),
      [KEYS.l]: () => this.#cursor.moveRight(this.#buffer.bytes),
      [KEYS.j]: () => this.#cursor.moveDown(this.#buffer.bytes),
      [KEYS.k]: () => this.#cursor.moveUp(this.#buffer.bytes),
    };
  }

  async #handleNormal(key) {
    if (key === KEYS.i) {
      this.#mode = MODES.MODE_INSERT;
      return await this.#handleInsert();
    }

    if (key === KEYS[":"]) {
      this.#mode = MODES.MODE_CLI;
      return await this.#handleCLI();
    }

    const mapperFns = this.#normalModeCursorCallback();
    if (mapperFns[key]) return mapperFns[key]();
  }

  #insertModeCursorCallback() {
    return {
      [KEYS.LEFT]: () => this.#cursor.moveLeft(this.#buffer.bytes),
      [KEYS.RIGHT]: () => this.#cursor.moveRight(this.#buffer.bytes),
      [KEYS.UP]: () => this.#cursor.moveUp(this.#buffer.bytes),
      [KEYS.DOWN]: () => this.#cursor.moveDown(this.#buffer.bytes),
    };
  }

  #insertByteCallback() {
    return {
      [KEYS.BACKSPACE]: () => this.#buffer.delete(this.#cursor.pos),
      [KEYS.CR]: () => this.#buffer.insert(this.#cursor.pos, KEYS.NEW_LINE),
    };
  }

  async #handleInsert() {
    while (true) {
      await this.#render(this.#buffer.bytes, this.#cursor.pos);
      const key = await Terminal.readKey();

      const cursorFns = this.#insertModeCursorCallback();
      const byteFns = this.#insertByteCallback();

      if (key === KEYS.ESC) {
        this.#mode = MODES.MODE_NORMAL;
        return { shouldReturn: false };
      } else if (cursorFns[key]) {
        cursorFns[key]();
      } else if (byteFns[key]) {
        this.#cursor.pos = byteFns[key]();
      } else {
        if (typeof key === "number") {
          this.#cursor.pos = this.#buffer.insert(this.#cursor.pos, key);
        }
      }
    }
  }

  #quitOptions() {
    return {
      ":qa!\r": () => ({ shouldReturn: true, shouldWrite: false }),
      ":wq!\r": () => ({
        shouldReturn: true,
        shouldWrite: true,
        data: this.#buffer.bytes,
      }),
    };
  }

  async #handleCLI() {
    const cmdBuff = new TextBuffer(new Uint8Array([58]));
    let pos = cmdBuff.length;

    await this.#render(cmdBuff.bytes, pos);

    while (true) {
      const key = await Terminal.readKey();

      pos = (key === KEYS.BACKSPACE)
        ? cmdBuff.delete(pos)
        : cmdBuff.insert(pos, key);

      if (key === KEYS.ESC || cmdBuff.length === 0) {
        this.#mode = MODES.MODE_NORMAL;
        return;
      }

      if (key === KEYS.CR) {
        const quitOptions = this.#quitOptions();
        const callback = quitOptions[decoder.decode(cmdBuff.bytes)];

        if (callback) return callback();

        this.#mode = MODES.MODE_NORMAL;
        return;
      }

      this.#render(cmdBuff.bytes, pos);
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

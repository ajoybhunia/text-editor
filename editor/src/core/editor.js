import { KEYS } from "../config/keys.js";
import { MODES } from "../config/modes.js";
import Cursor from "../domain/cursor.js";
import TextBuffer from "../domain/text_buffer.js";
import { Terminal } from "../terminal/terminal.js";
import { render } from "../terminal/terminal_renderer.js";
import { normalModeMovementMap } from "../config/keymaps.js/normal.js";
import { arrowKeyMovementMap } from "../config/keymaps.js/arrows.js";
import { handleCommandLine } from "./command_line.js";
import { NAKPos, nextLineFeed, prevLineFeed } from "../utils/utility.js";

const decoder = new TextDecoder();

export default class Editor {
  #buffer;
  #cursor;
  #mode;
  #insertByteMap;
  #viewportTop;

  constructor(bytes) {
    this.#buffer = new TextBuffer(decoder.decode(bytes));
    this.#cursor = new Cursor();
    this.#mode = MODES.NORMAL;
    this.#viewportTop = 0;

    this.#insertByteMap = {
      [KEYS.BACKSPACE]: () => this.#buffer.delete(this.#cursor.pos, 1),
      [KEYS.CR]: () => this.#buffer.insert(this.#cursor.pos, KEYS.NEW_LINE),
      [KEYS.NAK]: () =>
        this.#buffer.delete(
          this.#cursor.pos,
          this.#cursor.pos - NAKPos(this.#cursor.pos, this.#buffer.bytes),
        ),
    };
  }

  async run() {
    Deno.stdin.setRaw(true);

    while (true) {
      await render(
        this.#buffer.bytes,
        this.#cursor.pos,
        this.#mode,
        this.#viewportTop,
      );
      const key = await Terminal.readKey();
      const info = await this.#handleNormal(key);

      if (info.shouldReturn) {
        Deno.stdin.setRaw(false);
        return info;
      }
    }
  }

  #updateViewport() {
    const { rows } = Deno.consoleSize();
    const cursorRow = this.#cursor.getRow(this.#buffer.bytes);

    if (cursorRow < this.#viewportTop) this.#viewportTop = cursorRow;

    if (cursorRow >= this.#viewportTop + rows - 1) {
      this.#viewportTop = cursorRow - (rows - 2);
    }
  }

  #deleteTextSpan(position, length) {
    this.#cursor.pos = this.#buffer.delete(position, length);
    this.#cursor.updatePrevCol(this.#buffer.bytes);

    return { shouldReturn: false };
  }

  async #handleDeleteLine(motion) {
    if (motion === KEYS["0"]) {
      const lengthToDelete = this.#cursor.pos -
        prevLineFeed(this.#cursor.pos, this.#buffer.bytes);
      return this.#deleteTextSpan(this.#cursor.pos, lengthToDelete);
    }

    if (motion === KEYS.$) {
      const nextLF = nextLineFeed(this.#cursor.pos, this.#buffer.bytes);
      const lengthToDelete = nextLF - this.#cursor.pos;
      return this.#deleteTextSpan(nextLF, lengthToDelete);
    }

    if (motion === KEYS.d) {
      const nextLF = nextLineFeed(this.#cursor.pos, this.#buffer.bytes);
      const prevLF = prevLineFeed(this.#cursor.pos, this.#buffer.bytes);

      const [next, lengthToDelete] = this.#cursor.pos === this.#buffer.length
        ? [this.#cursor.pos, this.#cursor.pos - prevLF + 1]
        : [nextLF + 1, nextLF - prevLF + 1];

      return this.#deleteTextSpan(next, lengthToDelete);
    }

    return await this.#handleModes(motion);
  }

  async #handleModes(key) {
    if (key === KEYS[":"]) { // : -> CLI
      const _pos = this.#buffer.undo();
      this.#mode = MODES.CLI;

      return await this.#handleCLI();
    }

    if (key === KEYS.i || key === KEYS.I) { // i -> insert
      this.#mode = MODES.INSERT;
      return await this.#handleInsert();
    }
  }

  async #handleNormal(key) {
    if (key === KEYS.i || key === KEYS.I || key === KEYS[":"]) {
      this.#buffer.save(this.#cursor.pos);
      return this.#handleModes(key);
    }

    if (key === KEYS.u) { // u -> undo
      const cursorPosition = this.#buffer.undo();

      if (cursorPosition !== null) this.#cursor.pos = cursorPosition;

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
      this.#updateViewport();
    }

    return { shouldReturn: false };
  }

  async #handleInsert() {
    while (true) {
      await render(
        this.#buffer.bytes,
        this.#cursor.pos,
        this.#mode,
        this.#viewportTop,
      );
      const key = await Terminal.readKey();

      if (key === KEYS.ESC) {
        this.#mode = MODES.NORMAL;
        return { shouldReturn: false };
      } else if (key in arrowKeyMovementMap) {
        this.#cursor[arrowKeyMovementMap[key]](this.#buffer.bytes);
        this.#updateViewport();
      } else if (key in this.#insertByteMap) {
        this.#cursor.pos = this.#insertByteMap[key]();
        this.#updateViewport();
      } else if (typeof key === "number") {
        this.#cursor.pos = this.#buffer.insert(this.#cursor.pos, key);
        this.#updateViewport();
      }
    }
  }

  async #handleCLI() {
    const res = await handleCommandLine(this.#mode, this.#buffer.bytes);
    this.#mode = res.mode;

    return res.ins;
  }
}

import { KEYS } from "../config/keys.js";

export default class Cursor {
  constructor(pos = 0) {
    this.pos = pos;
    this.prevCol = this.pos;
  }

  getRow(buffer) {
    let row = 0;

    for (let index = 0; index < this.pos; index++) {
      if (buffer[index] === KEYS.NEW_LINE) row++;
    }

    return row;
  }

  updatePrevCol(buffer) {
    this.prevCol = this.#column(buffer);
  }

  #lineStart(buffer) {
    let p = this.pos;
    while (p > 0 && buffer[p - 1] !== KEYS.NEW_LINE) p--;
    return p;
  }

  #lineEnd(buffer) {
    let p = this.pos;
    while (p < buffer.length && buffer[p] !== KEYS.NEW_LINE) p++;
    return p;
  }

  #isWhitespace(char) {
    return char === KEYS.SPACE || char === KEYS.TAB || char === KEYS.NEW_LINE;
  }

  #column(buffer) {
    return this.pos - this.#lineStart(buffer);
  }

  moveToFirst(buffer) {
    this.pos = this.#lineStart(buffer);
    this.prevCol = this.#column(buffer);
  }

  moveToLast(buffer) {
    this.pos = this.#lineEnd(buffer);
    this.prevCol = this.#column(buffer);
  }

  moveLeft(buffer) {
    if (this.pos > 0 && buffer[this.pos - 1] !== KEYS.NEW_LINE) {
      this.pos--;
    }
    this.prevCol = this.#column(buffer);
  }

  moveRight(buffer) {
    if (this.pos < buffer.length && buffer[this.pos] !== KEYS.NEW_LINE) {
      this.pos++;
    }
    this.prevCol = this.#column(buffer);
  }

  moveToNextWord(buffer) {
    const len = buffer.length;
    if (this.pos >= len) return;

    while (this.pos < len && !this.#isWhitespace(buffer[this.pos])) {
      this.pos++;
    }

    while (this.pos < len && this.#isWhitespace(buffer[this.pos])) {
      this.pos++;
    }

    this.prevCol = this.#column(buffer);
  }

  moveToPreviousWord(buffer) {
    if (this.pos <= 0) return;

    let p = this.pos - 1;
    while (p > 0 && this.#isWhitespace(buffer[p])) {
      p--;
    }

    while (p > 0 && !this.#isWhitespace(buffer[p - 1])) {
      p--;
    }

    this.pos = p;
    this.prevCol = this.#column(buffer);
  }

  moveDown(buffer) {
    const col = this.#column(buffer);
    const end = this.#lineEnd(buffer);

    if (end >= buffer.length) return;

    const nextStart = end + 1;
    let nextEnd = nextStart;

    while (nextEnd < buffer.length && buffer[nextEnd] !== KEYS.NEW_LINE) {
      nextEnd++;
    }

    this.pos = Math.min(nextStart + col, nextEnd);

    if (nextEnd > this.pos) {
      this.pos = Math.min(nextStart + this.prevCol, nextEnd);
    }
  }

  moveUp(buffer) {
    const col = this.#column(buffer);
    const start = this.#lineStart(buffer);

    if (start === 0) return;

    const prevEnd = start - 1;
    let prevStart = prevEnd;

    while (prevStart > 0 && buffer[prevStart - 1] !== KEYS.NEW_LINE) {
      prevStart--;
    }

    this.pos = prevStart + Math.min(col, prevEnd - prevStart);

    if (prevEnd > this.pos) {
      this.pos = prevStart + Math.min(this.prevCol, prevEnd - prevStart);
    }
  }
}

import { KEYS } from "../utils/utils.js";

export class Cursor {
  constructor() {
    this.pos = 0;
    this.prevCol = this.pos;
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

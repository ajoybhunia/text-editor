/* export class TextBuffer {
  constructor(buffer) {
    this.bytes = buffer;
  }

  insert(pos, byte) {
    const newBuffer = new Uint8Array(this.bytes.length + 1);
    newBuffer.set(this.bytes.subarray(0, pos));
    newBuffer[pos] = byte;
    newBuffer.set(this.bytes.subarray(pos), pos + 1);
    this.bytes = newBuffer;

    return pos + 1;
  }

  delete(pos) {
    if (pos === 0) return pos;

    const newBuffer = new Uint8Array(this.bytes.length - 1);
    newBuffer.set(this.bytes.subarray(0, pos - 1));
    newBuffer.set(this.bytes.subarray(pos), pos - 1);
    this.bytes = newBuffer;

    return pos - 1;
  }

  get length() {
    return this.bytes.length;
  }
} */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class TextBuffer {
  #original;
  #add;
  #pieces;

  constructor(buffer) {
    this.#original = buffer;
    this.#add = "";
    this.#pieces = [
      { source: this.#original, start: 0, length: this.#original.length },
    ];
    this.bytes = encoder.encode(this.#getText());
    // this.records = [this.#pieces];
  }

  get length() {
    return this.bytes.length;
  }

  #getText() {
    return this.#pieces.map((piece) => {
      const buffer = piece.source;
      return buffer.slice(piece.start, piece.start + piece.length);
    }).join("");
  }

  #validatePos(position) {
    const totalLength = this.#getText().length;

    if (position < 0 || position > totalLength) {
      throw new Error("Position out of bounds");
    }
  }

  #findPiece(position) {
    let currentPos = 0;
    let i = 0;

    do {
      const piece = this.#pieces[i];
      const nextPos = currentPos + piece.length;

      if (nextPos >= position) {
        return { index: i, offset: position - currentPos };
      }

      [currentPos, i] = [nextPos, i + 1];
    } while (i < this.#pieces.length);
  }

  insert(position, char) {
    this.#validatePos(position);

    const newPieceStart = this.#add.length;
    this.#add += decoder.decode(new Uint8Array([char]));

    const { index, offset } = this.#findPiece(position);
    const piece = this.#pieces[index];

    const newPiece = {
      source: this.#add,
      start: newPieceStart,
      length: [char].length,
    };

    if (offset === 0) {
      this.#pieces.splice(index, 0, newPiece);
      this.bytes = encoder.encode(this.#getText());

      return position + 1;
    }

    if (offset === piece.length) {
      this.#pieces.splice(index + 1, 0, newPiece);
      this.bytes = encoder.encode(this.#getText());

      return position + 1;
    }

    const before = {
      source: piece.source,
      start: piece.start,
      length: offset,
    };

    const after = {
      source: piece.source,
      start: piece.start + offset,
      length: piece.length - offset,
    };

    this.#pieces.splice(index, 1, before, newPiece, after);
    this.bytes = encoder.encode(this.#getText());

    return position + 1;
  }

  delete(position, length = 1) {
    this.#validatePos(position);

    let currentPos = 0;
    const newPieces = [];

    for (const piece of this.#pieces) {
      const pieceStart = currentPos;
      const pieceEnd = currentPos + piece.length;

      const deleteStart = position - length;
      const deleteEnd = position;

      const before = {
        source: piece.source,
        start: piece.start,
        length: deleteStart - pieceStart,
      };

      const after = {
        source: piece.source,
        start: piece.start + (deleteEnd - pieceStart),
        length: pieceEnd - deleteEnd,
      };

      if (pieceEnd <= deleteStart || pieceStart >= deleteEnd) {
        newPieces.push(piece);
      } else {
        if (deleteStart > pieceStart) newPieces.push(before);
        if (pieceEnd > deleteEnd) newPieces.push(after);
      }

      currentPos = pieceEnd;
    }

    this.#pieces = newPieces.length === 0
      ? [{ source: this.#original, start: 0, length: 0 }]
      : newPieces;
    this.bytes = encoder.encode(this.#getText());

    return position - length;
  }
}

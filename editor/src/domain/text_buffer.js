const encoder = new TextEncoder();
const decoder = new TextDecoder();

export default class TextBuffer {
  #original;
  #add;
  #pieces;
  #records;

  constructor(buffer) {
    this.#original = buffer;
    this.#add = "";
    this.#pieces = [
      { source: this.#original, start: 0, length: this.#original.length },
    ];
    this.bytes = encoder.encode(this.#getText());
    this.#records = [];
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
    } while (i <= this.#pieces.length);
  }

  save(cursorPos) {
    this.#records.push({
      pieces: this.#pieces.map((p) => ({ ...p })),
      cursorPos,
    });
  }

  undo() {
    if (this.#records.length === 0) return null;

    const currentContent = this.#records.pop();
    this.#pieces = currentContent.pieces;
    this.bytes = encoder.encode(this.#getText());

    return currentContent.cursorPos;
  }

  #getPiece(source, start, length) {
    return { source, start, length };
  }

  insert(position, char) {
    this.#validatePos(position);

    const newPieceStart = this.#add.length;
    this.#add += decoder.decode(new Uint8Array([char]));

    const { index, offset } = this.#findPiece(position);
    const piece = this.#pieces[index];

    const newPiece = this.#getPiece(this.#add, newPieceStart, [char].length);

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

    const before = this.#getPiece(piece.source, piece.start, offset);
    const after = this.#getPiece(
      piece.source,
      piece.start + offset,
      piece.length - offset,
    );

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

      const before = this.#getPiece(
        piece.source,
        piece.start,
        deleteStart - pieceStart,
      );

      const after = this.#getPiece(
        piece.source,
        piece.start + (deleteEnd - pieceStart),
        pieceEnd - deleteEnd,
      );

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

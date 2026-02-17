export class PieceTable {
  constructor(text) {
    this.original = text;
    this.add = "";
    this.pieces = [
      { source: this.original, start: 0, length: this.original.length },
    ];
  }

  getText() {
    return this.pieces.map((piece) => {
      const buffer = piece.source;
      return buffer.slice(piece.start, piece.start + piece.length);
    }).join("");
  }

  validatePos(position) {
    const totalLength = this.getText().length;

    if (position < 0 || position > totalLength) {
      throw new Error("Position out of bounds");
    }
  }

  findPiece(position) {
    let currentPos = 0;
    let i = 0;

    do {
      const piece = this.pieces[i];
      const nextPos = currentPos + piece.length;

      if (nextPos >= position) {
        return { index: i, offset: position - currentPos };
      }

      currentPos = nextPos;
      i++;
    } while (i < this.pieces.length);
  }

  insert(position, text) {
    this.validatePos(position);

    const newPieceStart = this.add.length;
    this.add += text;

    const { index, offset } = this.findPiece(position);
    const piece = this.pieces[index];

    const newPiece = {
      source: this.add,
      start: newPieceStart,
      length: text.length,
    };

    if (offset === 0) {
      this.pieces.splice(index, 0, newPiece);
      return;
    }

    if (offset === piece.length) {
      this.pieces.splice(index + 1, 0, newPiece);
      return;
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

    this.pieces.splice(index, 1, before, newPiece, after);
  }

  delete(position, length) {
    this.validatePos(position);

    let currentPos = 0;
    const newPieces = [];

    for (const piece of this.pieces) {
      const pieceStart = currentPos;
      const pieceEnd = currentPos + piece.length;

      const deleteStart = position;
      const deleteEnd = position + length;

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

    this.pieces = newPieces;
  }
}

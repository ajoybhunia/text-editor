import { start } from "node:repl";

export class PieceTable {
  constructor(text) {
    this.original = text;
    this.add = "";
    this.pieces = [
      { source: this.original, start: 0, length: this.original.length },
    ];
  }

  getText() {
    return this.pieces.map((each) => {
      const buffer = each.source;
      return buffer.slice(each.start, each.start + each.length);
    }).join("");
  }

  insert(position, text) {
    const newPieceStart = this.add.length;
    this.add += text;

    let currentPos = 0;

    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const nextPos = currentPos + piece.length;

      if (position <= nextPos) {
        const offset = position - currentPos;
        const newPieces = [];

        if (offset > 0) {
          newPieces.push({
            source: piece.source,
            start: piece.start,
            length: offset,
          });
        }

        newPieces.push({
          source: this.add,
          start: newPieceStart,
          length: text.length,
        });

        if (offset < piece.length) {
          newPieces.push({
            source: piece.source,
            start: piece.start + offset,
            length: piece.length - offset,
          });
        }

        this.pieces.splice(i, 1, ...newPieces);
        return;
      }

      currentPos = nextPos;
    }
  }

  delete(position, length) {
    let currentPos = 0;
    const newPieces = [];

    for (const piece of this.pieces) {
      const pieceStart = currentPos;
      const pieceEnd = currentPos + piece.length;

      const deleteStart = position;
      const deleteEnd = position + length;

      if (pieceEnd <= deleteStart || pieceStart >= deleteEnd) {
        newPieces.push(piece);
      } else if (deleteStart > pieceStart) {
        newPieces.push({
          source: piece.source,
          start: piece.start,
          length: deleteStart - pieceStart,
        });
      } else if (pieceEnd > deleteEnd) {
        newPieces.push({
          source: piece.source,
          start: piece.start + (deleteEnd - pieceStart),
          length: pieceEnd - deleteEnd,
        });
      }

      currentPos = pieceEnd;
    }

    this.pieces = newPieces;
  }
}

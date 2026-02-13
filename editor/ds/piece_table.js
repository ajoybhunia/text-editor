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
  }
}

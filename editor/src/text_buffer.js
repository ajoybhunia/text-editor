export class TextBuffer {
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
}

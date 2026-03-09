import { KEYS } from "../config/keys.js";

export const computeCursorPos = (bytes, pos) => {
  let row = 1, col = 1;

  for (let i = 0; i < pos; i++) {
    bytes[i] === KEYS.NEW_LINE ? (row++, col = 1) : col++;
  }

  return { row, col };
};

export const nextLineFeed = (pos, buffer) => {
  for (let i = pos; i < buffer.length; i++) {
    if (buffer[i] === KEYS.NEW_LINE) return i;
  }

  return pos;
};

export const prevLineFeed = (pos, buffer) => {
  for (let i = pos; i > 0; i--) {
    if (buffer[i - 1] === KEYS.NEW_LINE) return i;
  }

  return 0;
};

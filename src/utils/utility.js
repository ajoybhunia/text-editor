import { KEYS } from "../config/keys.js";

export const computeCursorPos = (buffer, pos) => {
  let row = 1, col = 1;

  for (let i = 0; i < pos; i++) {
    buffer[i] === KEYS.NEW_LINE ? (row++, col = 1) : col++;
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

export const NAKPos = (pos, buffer) => {
  const { row, col } = computeCursorPos(buffer, pos);

  if (col === 1 && row !== 1) return pos - 1;

  return prevLineFeed(pos, buffer);
};

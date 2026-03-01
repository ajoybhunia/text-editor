import { KEYS } from "../config/keys.js";

export const computeCursorPos = (bytes, pos) => {
  let row = 1, col = 1;

  for (let i = 0; i < pos; i++) {
    bytes[i] === KEYS.NEW_LINE ? (row++, col = 1) : col++;
  }

  return { row, col };
};

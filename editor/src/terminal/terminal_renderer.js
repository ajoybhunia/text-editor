import { Terminal } from "./terminal.js";
import { KEYS } from "../config/keys.js";
import { computeCursorPos } from "../utils/compute_cursor.js";

const encoder = new TextEncoder();

const placeCursor = async (bytes, pos) => {
  const { row, col } = computeCursorPos(bytes, pos);
  await Terminal.placeCursor(row, col);
};

const drawStatus = async (mode) => {
  await Terminal.write(
    new Uint8Array([KEYS.NEW_LINE, KEYS.NEW_LINE, ...encoder.encode(mode)]),
  );
};

export const render = async (bytes, pos, mode) => {
  await Terminal.clear();
  await Terminal.write(bytes);
  await drawStatus(mode);
  await placeCursor(bytes, pos);
};

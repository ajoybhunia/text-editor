import Terminal from "./terminal.js";
import { computeCursorPos } from "../utils/utility.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const status = (mode) => `\x1b[7m --${mode}-- \x1b[0m`;

const drawStatus = async (mode, rows) => {
  await Terminal.placeCursor(rows, 1);
  await Terminal.write(encoder.encode(status(mode)));
};

const placeTheCursor = async (bytes, pos, viewportTop) => {
  const { row, col } = computeCursorPos(bytes, pos);
  const screenRow = row - viewportTop;

  await Terminal.placeCursor(screenRow, col);
};

const viewportText = (rows, bytes, viewportTop) => {
  const contentRows = rows - 1;
  const text = decoder.decode(bytes);
  const lines = text.split("\n");

  return lines.slice(viewportTop, viewportTop + contentRows);
};

export const render = async (bytes, pos, mode, viewportTop) => {
  const { rows } = Deno.consoleSize();
  const visibleContent = viewportText(rows, bytes, viewportTop);

  await Terminal.clear();
  await Terminal.write(encoder.encode(visibleContent.join("\n")));
  await drawStatus(mode, rows);
  await placeTheCursor(bytes, pos, viewportTop);
};

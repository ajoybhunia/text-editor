import Terminal from "./terminal.js";
import { computeCursorPos } from "../utils/utility.js";
import { MODES } from "../config/modes.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const TAB_STOP = 4;

const expandTabs = (line) => {
  let result = "";
  let col = 0;

  for (const char of line) {
    if (char === "\t") {
      result += " ".repeat(TAB_STOP);
      col += TAB_STOP;
    } else {
      result += char;
      col++;
    }
  }

  return result;
};

const status = (text) => `\x1b[7m --${text}-- \x1b[0m`;

const drawStatus = async (statusText, rows, activeMode) => {
  await Terminal.placeCursor(rows, 1);
  const decoratedStatus = activeMode && (activeMode === MODES.CLI)
  ? statusText
  : status(statusText);
  await Terminal.write(encoder.encode(decoratedStatus));
};

const placeTheCursor = async (bytes, pos, viewportTop) => {
  const { row, col } = computeCursorPos(bytes, pos, TAB_STOP);
  const screenRow = row - viewportTop;

  await Terminal.placeCursor(screenRow, col);
};

const viewportText = (rows, bytes, viewportTop) => {
  const contentRows = rows - 1;
  const text = decoder.decode(bytes);
  const lines = text.split("\n");

  return lines.slice(viewportTop, viewportTop + contentRows).map(expandTabs);
};

export const render = async (bytes, pos, statusText, viewportTop, activeMode) => {
  const { rows } = Deno.consoleSize();
  const visibleContent = viewportText(rows, bytes, viewportTop);

  await Terminal.clear();
  await Terminal.write(encoder.encode(visibleContent.join("\n")));
  await drawStatus(statusText, rows, activeMode);

  (MODES.CLI === activeMode)
  ? await Terminal.placeCursor(rows, pos)
  : await placeTheCursor(bytes, pos, viewportTop);
};

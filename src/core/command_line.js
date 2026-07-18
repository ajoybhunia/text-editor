import { KEYS } from "../config/keys.js";
import { MODES } from "../config/modes.js";
import { render } from "../terminal/terminal_renderer.js";
import { cliArrowKeyDelta } from "../config/key-maps/arrows.js";
import { quitOptions } from "../config/commands/quit_options.js";
import Terminal from "../terminal/terminal.js";
import TextBuffer from "../domain/text_buffer.js";
import Cursor from "../domain/cursor.js";

const decoder = new TextDecoder();

export const handleCommandLine = async (mode, buffer, viewportTop = 0) => {
  const cmdBuff = new TextBuffer(":");
  const cursor = new Cursor(1);

  while (true) {
    const decoded = decoder.decode(cmdBuff.bytes);
    await render(buffer, cursor.pos + 1, decoded, viewportTop, mode);

    const key = await Terminal.readKey();
    const delta = cliArrowKeyDelta[key];


    if (delta === 1) {
      cursor.pos = (cursor.pos === cmdBuff.length) ? cursor.pos : cursor.pos + delta;
    } else if (delta === -1) {
      cursor.pos = (cursor.pos === 1) ? cursor.pos : cursor.pos + delta;
    } else if ((key === KEYS.DELETE) && (cursor.pos !== 1 || cmdBuff.length === 1)) {
      cursor.pos = cmdBuff.delete(cursor.pos);
    } else if (typeof key === "number") {
      cursor.pos = cmdBuff.insert(cursor.pos, key);
    }

    if (key === KEYS.ESC || cmdBuff.length === 0) {
      return { mode: MODES.NORMAL, ctx: { shouldReturn: false } };
    }

    if (key === KEYS.CR) {
      const cmd = decoder.decode(cmdBuff.bytes).trim();

      if (cmd in quitOptions) {
        return { mode: MODES.NORMAL, ctx: quitOptions[cmd](buffer) };
      }

      return { mode: MODES.NORMAL, ctx: { shouldReturn: false } };
    }
  }
};

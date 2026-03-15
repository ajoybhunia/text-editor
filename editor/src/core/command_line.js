import { KEYS } from "../config/keys.js";
import { MODES } from "../config/modes.js";
import { render } from "../terminal/terminal_renderer.js";
import { cliArrowKeyDelta } from "../config/keymaps.js/arrows.js";
import { quitOptions } from "../config/commands/quit_options.js";
import { Terminal } from "../terminal/terminal.js";
import TextBuffer from "../domain/text_buffer.js";

const decoder = new TextDecoder();

export const handleCommandLine = async (mode, buffer, viewportTop = 0) => {
  const cmdBuff = new TextBuffer(":");
  let pos = cmdBuff.length;

  while (true) {
    await render(cmdBuff.bytes, pos, mode, viewportTop);
    const key = await Terminal.readKey();

    const delta = cliArrowKeyDelta[key];

    if (delta === 1) {
      pos = (pos === cmdBuff.length) ? pos : pos + delta;
    } else if (delta === -1) {
      pos = (pos === 1) ? pos : pos + delta;
    } else if (key === KEYS.BACKSPACE) {
      pos = cmdBuff.delete(pos);
    } else if (typeof key === "number") {
      pos = cmdBuff.insert(pos, key);
    }

    if (key === KEYS.ESC || cmdBuff.length === 0) {
      return { mode: MODES.NORMAL, ins: { shouldReturn: false } };
    }

    if (key === KEYS.CR) {
      const cmd = decoder.decode(cmdBuff.bytes).trim();
      if (cmd in quitOptions) return { mode, ins: quitOptions[cmd](buffer) };

      return { mode: MODES.NORMAL, ins: { shouldReturn: false } };
    }
  }
};

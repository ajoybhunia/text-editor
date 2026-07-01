import Editor from "../core/editor.js";
import Cursor from "../domain/cursor.js";
import TextBuffer from "../domain/text_buffer.js";
import Terminal from "../terminal/terminal.js";

const decoder = new TextDecoder();

export const editAndPersist = async (
  fileContent,
  filePath,
  hasWritePermission = true,
  mode = 0o100644, // mode: 33188
) => {
  const buffer = new TextBuffer(decoder.decode(fileContent));
  const cursor = new Cursor();

  const editor = new Editor(buffer, cursor);

  try {
    await editor.run(filePath, hasWritePermission, mode);
  } finally {
    await Terminal.clear();
  }
};

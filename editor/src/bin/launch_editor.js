import Editor from "../core/editor.js";
import { Terminal } from "../terminal/terminal.js";

export const editAndPersist = async (
  buffer,
  filePath,
  hasWritePermission = true,
  mode = 0o100644, // mode: 33188
) => {
  const editor = new Editor(buffer);

  try {
    await editor.run(filePath, hasWritePermission, mode);
  } finally {
    await Terminal.clear();
  }
};

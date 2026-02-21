import { editFile } from "./edit_file.js";
import { writeFile } from "../utils/fs_utils.js";
import { Terminal } from "../domain/terminal.js";

export const editAndPersist = async (buffer, filePath) => {
  const info = await editFile(buffer);
  if (info.shouldWrite) await writeFile(filePath, info.data);
  await Terminal.clear();
};

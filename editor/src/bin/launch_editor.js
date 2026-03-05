import { editFile } from "./edit_file.js";
import { writeFile } from "../utils/fs_utils.js";
import { Terminal } from "../terminal/terminal.js";

const extractPermission = (mode) => mode & 0o777;

const handleForceWrite = async (mode, filePath, data) => {
  const permission = extractPermission(mode);

  await Deno.chmod(filePath, 0o600);
  await writeFile(filePath, data);
  await Deno.chmod(filePath, permission);
};

export const editAndPersist = async (
  buffer,
  filePath,
  hasWritePermision = true,
  mode = 33188,
) => {
  const info = await editFile(buffer);
  if (info.shouldWrite) {
    if (hasWritePermision) {
      await writeFile(filePath, info.data);
    } else {
      if (info.forceWrite) {
        await handleForceWrite(mode, filePath, info.data);
      } else {
        await Terminal.clear();
        console.log(`Error: permission denied: ${filePath}`);
        return;
      }
    }
  }
  await Terminal.clear();
};

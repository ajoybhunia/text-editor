import { editFile } from "./edit_file.js";
import { writeFile } from "../utils/fs_utils.js";
import { Terminal } from "../terminal/terminal.js";

const extractPermission = (mode) => mode & 0o777;

const forceWriteFile = async (mode, filePath, data) => {
  const originalPermission = extractPermission(mode);

  await Deno.chmod(filePath, 0o600);
  await writeFile(filePath, data);
  await Deno.chmod(filePath, originalPermission);
};

const writeWithPermission = async (
  { filePath, data, hasWritePermission, forceWrite, mode },
) => {
  if (hasWritePermission) return writeFile(filePath, data);
  if (forceWrite) return forceWriteFile(mode, filePath, data);

  throw new Error(`permission denied: ${filePath}`);
};

export const editAndPersist = async (
  buffer,
  filePath,
  hasWritePermission = true,
  mode = 0o100644, // mode: 33188
) => {
  const { shouldWrite, data, forceWrite } = await editFile(buffer);

  if (!shouldWrite) {
    await Terminal.clear();
    return;
  }

  try {
    await writeWithPermission(
      { filePath, data, hasWritePermission, forceWrite, mode },
    );
  } catch (err) {
    throw err;
  } finally {
    await Terminal.clear();
  }
};

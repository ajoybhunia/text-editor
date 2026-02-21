import { getFileBuffer } from "./src/utils/fs_utils.js";
import { editAndPersist } from "./src/core/launch_editor.js";

const main = async (filePath) => {
  const encoder = new TextEncoder();

  try {
    const { isFile, isDirectory } = await Deno.stat(filePath);

    if (isFile) {
      const buffer = await getFileBuffer(filePath);
      await editAndPersist(buffer, filePath);
    }

    if (isDirectory) {
      await Deno.stdout.write(
        encoder.encode("Boom: Failed to open a directory!\n"),
      );
    }
  } catch {
    await editAndPersist(new Uint8Array(0), filePath);
  }
};

await main(Deno.args[0]);

#! /usr/bin/env -S deno run --allow-read --allow-write

import { getFileBuffer } from "./src/utils/fs_utils.js";
import { editAndPersist } from "./src/bin/launch_editor.js";

const main = async () => {
  const filePath = Deno.args[0];

  if (!filePath) {
    console.log("Usage: ted <file>");
    return;
  }

  try {
    const stat = await Deno.stat(filePath);

    if (stat.isFile) {
      const buffer = await getFileBuffer(filePath);
      await editAndPersist(buffer, filePath);
    }

    if (stat.isDirectory) {
      console.log("Oops! Failed to open a directory!");
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return await editAndPersist(new Uint8Array(0), filePath);
    }

    console.error("Error: ", err.message);
  }
};

await main();

#! /usr/bin/env -S deno run --allow-read --allow-write

import { editAndPersist } from "./src/bin/launch_editor.js";
import { readFile } from "./src/fs/read_file.js";

const main = async () => {
  const filePath = Deno.args[0];

  try {
    if (!filePath) throw new Error("Usage: ted <file>");

    const stat = await Deno.stat(filePath);
    const ownerWrite = Boolean(stat.mode & 0o200);

    if (stat.isDirectory) throw new Error("Oops! Failed to open a directory!");

    if (stat.isFile) {
      const buffer = await readFile(filePath);
      await editAndPersist(buffer, filePath, ownerWrite, stat.mode);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return await editAndPersist(new Uint8Array(0), filePath);
    }

    console.error("Error: ", err.message);
  }
};

await main();

import { Editor } from "./src/editor.js";
import { Terminal } from "./src/terminal.js";

const main = async (filePath) => {
  const file = await Deno.open(filePath, {
    read: true,
    write: true,
    create: true,
  });

  const { size } = await Deno.stat(filePath);

  const buffer = new Uint8Array(size);
  const n = await file.read(buffer);
  file.close();

  const editor = new Editor(buffer.subarray(0, n));
  const info = await editor.run();

  if (info.shouldWrite) await Deno.writeFile(filePath, info.data);
  await Terminal.clear();
};

await main(Deno.args[0]);

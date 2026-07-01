export const writeFile = async (filePath, data) =>
  await Deno.writeFile(filePath, data);

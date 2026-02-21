export const getFileBuffer = async (filePath) => {
  return await Deno.readFile(filePath);
};

export const writeFile = async (filePath, data) => {
  await Deno.writeFile(filePath, data);
};

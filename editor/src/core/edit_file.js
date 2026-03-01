import Editor from "../domain/editor.js";

export const editFile = async (buffer) => {
  const editor = new Editor(buffer);
  return await editor.run();
};

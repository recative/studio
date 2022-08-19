import { server } from 'utils/rpc';

export const uploadSingleFile = async (file: File, replaceFileId?: string) => {
  const filePath = file.path;

  const result = await server.importFile(filePath, replaceFileId);

  return result;
};

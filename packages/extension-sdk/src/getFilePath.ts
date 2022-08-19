import { fileSync } from 'tmp';
import { writeFile } from 'fs/promises';

import { xxHash } from './xxHash';

const fileCache = new Map<string, string>();

export const getFilePath = async (x: string | Buffer) => {
  if (typeof x === 'string') {
    return x;
  }

  const fileHash = await xxHash(x);

  if (fileCache.has(fileHash)) {
    return fileCache.get(fileHash) as string;
  }

  const inputPath = fileSync().name;

  await writeFile(inputPath, x);
  fileCache.set(fileHash, inputPath);

  return inputPath;
};

import { readFile } from 'fs/promises';

export const getFileBuffer = async (x: string | Buffer) => {
  if (typeof x === 'string') {
    return readFile(x);
  }

  return x;
};

import { h32 } from 'xxhashjs';
import { readFile } from 'fs-extra';

export const xxHash = async (x: string | Buffer) => {
  const binary = Buffer.isBuffer(x) ? x : await readFile(x);
  return h32(binary, 0x1bf52).toString(16);
};

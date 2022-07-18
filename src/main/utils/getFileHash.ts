import crypto from 'crypto';
import { h32 } from 'xxhashjs';
import { readFile } from 'fs-extra';

import type { IResourceFile } from '@recative/definitions';

import { getResourceFilePath } from './getResourceFile';

export const getFilePathHash = async (filePath: string) => {
  const binary = await readFile(filePath);
  return h32(binary, 0x1bf52).toString(16);
};

export const getFileHash = async (file: Pick<IResourceFile, 'id'>) => {
  const filePath = getResourceFilePath(file);

  const binary = await readFile(filePath);

  const md5Hash = crypto.createHash('md5');

  const md5 = md5Hash.update(binary).digest('hex');

  return {
    md5,
    xxHash: h32(binary, 0x1bf52).toString(16),
  };
};

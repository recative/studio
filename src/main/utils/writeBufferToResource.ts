import { join } from 'path';
import { writeFile } from 'fs/promises';

import { IResourceFile } from '@recative/definitions';

import { getResourceFilePath } from './getResourceFile';

import { getWorkspace } from '../rpc/workspace';

export const writeBufferToResource = async (
  buffer: Buffer,
  fileName: string | Pick<IResourceFile, 'id'>
) => {
  const workspace = getWorkspace();
  const filePath = join(
    workspace.mediaPath,
    typeof fileName === 'string'
      ? fileName
      : await getResourceFilePath(fileName)
  );
  await writeFile(filePath, buffer);
  return filePath;
};

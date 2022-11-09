import { join } from 'path';
import { copy } from 'fs-extra';

import { IResourceFile } from '@recative/definitions';

import { getResourceFilePath } from './getResourceFile';

import { getWorkspace } from '../rpc/workspace';

export const writePathToResource = async (
  path: string,
  fileName: string | Pick<IResourceFile, 'id'>
) => {
  const workspace = getWorkspace();
  const filePath = join(
    workspace.mediaPath,
    typeof fileName === 'string'
      ? fileName
      : await getResourceFilePath(fileName)
  );
  await copy(path, filePath);
  return filePath;
};

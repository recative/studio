/* eslint-disable no-await-in-loop */
import { cloneDeep } from 'lodash';
import { copyFile, writeFile } from 'fs/promises';

import type { IResourceFile } from '@recative/definitions';

import { Writable } from '@recative/extension-sdk';
import type { IPostProcessedResourceFileForImport } from '@recative/extension-sdk';

import { getResourceFilePath } from '../../../utils/getResourceFile';

export const importedFileToFile = async (
  file: IPostProcessedResourceFileForImport
): Promise<IResourceFile> => {
  const {
    postProcessedFile,
    postProcessedThumbnail,
    ...internalResourceDefinition
  } = file;

  const resourceDefinition = cloneDeep(
    internalResourceDefinition
  ) as Writable<IResourceFile>;

  if (typeof postProcessedFile === 'string') {
    await copyFile(postProcessedFile, getResourceFilePath(file));
  } else {
    await writeFile(getResourceFilePath(file), postProcessedFile);
  }

  const thumbnailFilePath = getResourceFilePath(file, true);
  if (typeof postProcessedThumbnail === 'string') {
    await copyFile(postProcessedThumbnail, thumbnailFilePath);
    resourceDefinition.thumbnailSrc = thumbnailFilePath;
  } else if (postProcessedThumbnail) {
    await writeFile(thumbnailFilePath, postProcessedThumbnail);
    resourceDefinition.thumbnailSrc = thumbnailFilePath;
  }

  return resourceDefinition;
};

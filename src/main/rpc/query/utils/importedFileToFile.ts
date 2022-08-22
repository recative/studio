/* eslint-disable no-await-in-loop */
import log from 'electron-log';
import { cloneDeep } from 'lodash';
import { copyFile, writeFile } from 'fs/promises';

import { Writable } from '@recative/extension-sdk';
import type { IResourceFile } from '@recative/definitions';
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

  log.log(`:: [${file.id}] Converting post-processed file to file.`);

  if (typeof postProcessedFile === 'string') {
    log.log(`:: [${file.id}] Post-processed file: ${postProcessedFile}.`);

    await copyFile(postProcessedFile, getResourceFilePath(file));
  } else {
    await writeFile(getResourceFilePath(file), postProcessedFile);
  }

  const thumbnailFilePath = getResourceFilePath(file, true);
  if (postProcessedThumbnail) {
    if (typeof postProcessedThumbnail === 'string') {
      log.log(`:: [${file.id}] Thumbnail: ${postProcessedThumbnail}.`);
      await copyFile(postProcessedThumbnail, thumbnailFilePath);
    } else if (postProcessedThumbnail) {
      await writeFile(thumbnailFilePath, postProcessedThumbnail);
    }

    resourceDefinition.thumbnailSrc = `jb-media:///${resourceDefinition.id}-thumbnail.png`;
  }

  return resourceDefinition;
};

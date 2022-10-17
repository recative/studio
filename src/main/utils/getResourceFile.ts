import { join, basename } from 'path';

import { WorkspaceNotReadyError } from '@recative/definitions';

import type { IResourceFile } from '@recative/definitions';
import type { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';

import { readFile } from 'fs/promises';
import { getDb } from '../rpc/db';
import { getWorkspace } from '../rpc/workspace';

export const getResourceFileName = (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >,
  isPostProcessed: boolean,
  thumbnail = false
) => {
  if (thumbnail) {
    return isPostProcessed && 'fileName' in resource
      ? `${basename(resource.fileName)}-thumbnail.png`
      : `${resource.id}-thumbnail.png`;
  }

  return isPostProcessed && 'fileName' in resource
    ? resource.fileName
    : `${resource.id}.resource`;
};

export const getResourceFilePath = async (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >,
  thumbnail = false,
  validate = false
) => {
  const db = await getDb();
  const config = getWorkspace();

  if (!config) throw new WorkspaceNotReadyError();

  if (!validate) {
    return 'fileName' in resource
      ? join(
          config.mediaPath,
          'post-processed',
          getResourceFileName(resource, true, thumbnail)
        )
      : join(config.mediaPath, getResourceFileName(resource, false, thumbnail));
  }

  const isPostProcessed = !!db.resource.postProcessed.findOne({
    id: resource.id,
  });
  const isNormal = !!db.resource.resources.findOne({ id: resource.id });

  if (isPostProcessed) {
    return join(
      config.mediaPath,
      'post-processed',
      getResourceFileName(resource, isPostProcessed, thumbnail)
    );
  }

  if (isNormal) {
    return join(
      config.mediaPath,
      getResourceFileName(resource, isPostProcessed, thumbnail)
    );
  }

  throw new TypeError(`Invalid record`);
};

export const getResourceFileBinary = async (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >
) => {
  return readFile(await getResourceFilePath(resource, false, true));
};

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

export const ifIsPostProcessed = async (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >
): Promise<'postProcessed' | 'raw' | null> => {
  const db = await getDb();

  const isPostProcessed = !!db.resource.postProcessed.findOne({
    id: resource.id,
  });

  if (isPostProcessed) return 'postProcessed';

  const isNormal = !!db.resource.resources.findOne({ id: resource.id });

  if (isNormal) return 'raw';

  return null;
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

  const resourceType = await ifIsPostProcessed(resource);

  if (resourceType === 'postProcessed') {
    return join(
      config.mediaPath,
      'post-processed',
      getResourceFileName(resource, true, thumbnail)
    );
  }

  if (resourceType === 'raw') {
    return join(
      config.mediaPath,
      getResourceFileName(resource, false, thumbnail)
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

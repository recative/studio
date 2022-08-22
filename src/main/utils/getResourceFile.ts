import { join, basename } from 'path';

import { WorkspaceNotReadyError } from '@recative/definitions';

import type { IResourceFile } from '@recative/definitions';
import type { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';

import { getWorkspace } from '../rpc/workspace';

export const getResourceFileName = (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >,
  thumbnail = false
) => {
  if (thumbnail) {
    return 'fileName' in resource
      ? `${basename(resource.fileName)}-thumbnail.png`
      : `${resource.id}-thumbnail.png`;
  }

  return 'fileName' in resource ? resource.fileName : `${resource.id}.resource`;
};

export const getResourceFilePath = (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >,
  thumbnail = false
) => {
  const config = getWorkspace();

  if (!config) throw new WorkspaceNotReadyError();

  if ('fileName' in resource) {
    return join(
      config.mediaPath,
      'post-processed',
      getResourceFileName(resource, thumbnail)
    );
  }

  return join(config.mediaPath, getResourceFileName(resource, thumbnail));
};

import { join } from 'path';

import { WorkspaceNotReadyError } from '@recative/definitions';

import type { IResourceFile } from '@recative/definitions';

import { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';
import { getWorkspace } from '../rpc/workspace';

export const getResourceFileName = (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >
) =>
  'fileName' in resource && 'postProcessRecord' in resource
    ? `${resource.fileName}.resource`
    : `${resource.id}.resource`;

export const getResourceFilePath = (
  resource:
    | Pick<IResourceFile, 'id'>
    | Pick<
        IPostProcessedResourceFileForUpload,
        'id' | 'fileName' | 'postProcessRecord'
      >
) => {
  const config = getWorkspace();

  if (!config) throw new WorkspaceNotReadyError();

  if ('fileName' in resource && 'postProcessRecord' in resource) {
    return join(
      config.mediaPath,
      'post-processed',
      getResourceFileName(resource)
    );
  }

  return join(config.mediaPath, getResourceFileName(resource));
};

import { join } from 'path';

import { WorkspaceNotReadyError } from '@recative/definitions';

import type { IResourceFile } from '@recative/definitions';

import { getWorkspace } from '../rpc/workspace';

export const getResourceFileName = (resource: Pick<IResourceFile, 'id'>) =>
  `${resource.id}.resource`;

export const getResourceFilePath = (resource: Pick<IResourceFile, 'id'>) => {
  const config = getWorkspace();

  if (!config) throw new WorkspaceNotReadyError();

  return join(config.mediaPath, getResourceFileName(resource));
};

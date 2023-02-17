import console from 'electron-log';
import { join as joinPath, normalize as normalizePath } from 'path';
import { ensureDir } from 'fs-extra';

import {
  WorkspaceNotReadyError,
  CodeRepositoryPathNotSetError,
} from '@recative/definitions';

import type { IWorkspaceConfiguration } from '@recative/definitions';

let currentWorkspace: IWorkspaceConfiguration | null = null;

export const getWorkspace = () => {
  if (!currentWorkspace) throw new WorkspaceNotReadyError();

  return currentWorkspace;
};

export const getCodeRepositoryPath = () => {
  const workspace = getWorkspace();
  if (!workspace.codeRepositoryPath) throw new CodeRepositoryPathNotSetError();

  return workspace.codeRepositoryPath;
};

export const setupWorkspace = async (
  mediaWorkspacePath: string,
  codeRepositoryPath?: string,
  readonly = false
): Promise<IWorkspaceConfiguration> => {
  console.log(`:: Setting up workspace, ${mediaWorkspacePath}`);

  // Check if paths exists, if not, create them.
  await ensureDir(mediaWorkspacePath);
  if (codeRepositoryPath) {
    await ensureDir(codeRepositoryPath);
  }

  // Media binary file and db file path.
  const mediaPath = normalizePath(joinPath(mediaWorkspacePath, 'media'));
  const dbPath = normalizePath(joinPath(mediaWorkspacePath, 'db'));
  const buildPath = normalizePath(joinPath(mediaWorkspacePath, 'build'));
  const assetsPath = normalizePath(joinPath(mediaWorkspacePath, 'assets'));

  // Ensure the code structure of media workspace is correct.
  await ensureDir(mediaPath);
  await ensureDir(dbPath);
  await ensureDir(buildPath);
  await ensureDir(assetsPath);

  const result = {
    mediaWorkspacePath: normalizePath(mediaWorkspacePath),
    codeRepositoryPath: codeRepositoryPath
      ? normalizePath(codeRepositoryPath)
      : undefined,
    mediaPath,
    dbPath,
    buildPath,
    assetsPath,
    readonly,
  };

  currentWorkspace = result;

  return result;
};

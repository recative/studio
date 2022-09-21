import { setupDb } from './db';
import { setupWorkspace } from './workspace';

export * from './db';
export * from './workspace';
export * from './query';
export * from '../server/main';
export * from './window/mainWindow';

export const setupStudio = async (
  mediaWorkspacePath: string,
  codeRepositoryPath?: string,
  readonly = false
) => {
  const result = await setupWorkspace(
    mediaWorkspacePath,
    codeRepositoryPath,
    readonly
  );
  await setupDb(result.dbPath);

  return result;
};

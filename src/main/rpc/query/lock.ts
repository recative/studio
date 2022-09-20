import { join } from 'path';
import { nanoid } from 'nanoid';

import { check, lock, unlock } from 'proper-lockfile';
import { readJsonSync, writeJsonSync, removeSync, pathExists } from 'fs-extra';

import { getWorkspace } from '../workspace';

const processId = nanoid();

export const ifDbLocked = async () => {
  const workspace = getWorkspace();

  if (workspace.readonly) return true;

  const lockFilePath = join(workspace.dbPath, '.lock');
  const processIdFilePath = join(workspace.dbPath, '.lock-process');

  if (!(await pathExists(processIdFilePath))) return false;
  try {
    const locked = await check(workspace.dbPath, {
      lockfilePath: lockFilePath,
    });

    const isThisProcess = (await readJsonSync(processIdFilePath)) === processId;

    return locked && !isThisProcess;
  } catch (error) {
    if (error instanceof Error && error.name === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

export const lockDb = async () => {
  if (await ifDbLocked()) {
    return false;
  }

  const workspace = getWorkspace();

  if (workspace.readonly) {
    return false;
  }

  const lockFilePath = join(workspace.dbPath, '.lock');
  const processIdFilePath = join(workspace.dbPath, '.lock-process');

  await writeJsonSync(processIdFilePath, processId);

  try {
    await lock(workspace.dbPath, {
      lockfilePath: lockFilePath,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'Lock file is already being held') {
      return true;
    }
    throw e;
  }

  return true;
};

export const unlockDb = async () => {
  const workspace = getWorkspace();

  if (workspace.readonly) {
    return false;
  }

  const lockFilePath = join(workspace.dbPath, '.lock');
  const processIdFilePath = join(workspace.dbPath, '.lock-process');

  removeSync(processIdFilePath);
  return unlock(workspace.dbPath, {
    lockfilePath: lockFilePath,
  });
};

import log from 'electron-log';
import Loki from 'lokijs';

import { ensureDir } from 'fs-extra';

import type { IDbInstance } from '@recative/studio-definitions';

import { install, uninstall } from '../utils/cleanup';

import { initializeDb } from './db/initializer';

let currentProgress = 'Starting';

export const setProgress = (x: string) => {
  currentProgress = x;

  return x;
};

export const getProgress = () => currentProgress;

let currentDb: IDbInstance<Record<string, unknown>> | null = null;

Reflect.set(globalThis, '__getDatabase__', () => currentDb);

export const getDb = async (
  yamlPath: string | null = null,
  temporary = false,
  additionalData: Record<string, unknown> = {}
) => {
  const trueRootPath = temporary
    ? yamlPath
    : yamlPath || currentDb?.path || null;

  if (!trueRootPath) {
    throw new TypeError(
      'Root path not defined. No previous path has been cached.'
    );
  }

  if (currentDb && currentDb.path === trueRootPath && !temporary) {
    return currentDb;
  }

  await ensureDir(trueRootPath);

  const newDb = await initializeDb(trueRootPath, additionalData);

  if (!temporary) {
    currentDb = newDb;
  }

  return newDb;
};

export const forceRefreshDb = async () => {
  const oldDb = currentDb;

  if (!oldDb) {
    throw new TypeError(
      'Root path not defined. No previous path has been cached.'
    );
  }

  const newDb = await initializeDb(oldDb.path, oldDb.additionalData);
  currentDb = newDb;

  if (oldDb) {
    Object.values(oldDb).forEach((x) => {
      if (x.$db instanceof Loki) {
        x.$db.close();
      }
    });
  }
};

export const saveAllDatabase = async <T>(db: IDbInstance<T>) => {
  const waitFor = Object.entries(db)
    .filter(([, value]) => Object.hasOwn(value, '$db'))
    .map(([key]) => key) as Array<keyof IDbInstance<T>>;

  setProgress(`Saving database`);
  log.info('::', waitFor.length, 'database will be saved');

  for (let i = 0; i < waitFor.length; i += 1) {
    const key = waitFor[i];
    const collection = db[key] as { $db: Loki };

    await new Promise<void>((resolve, reject) => {
      setProgress(`Saving ${key}`);
      collection.$db.saveDatabase((err) => {
        if (err) {
          reject(err);
        } else {
          log.info('::', key, 'saved');
          resolve();
        }
      });
    });
  }
};

export const cleanupDb = async () => {
  if (!currentDb) return null;

  setProgress(`Cleanup database`);
  log.log(`:: Cleanup database at ${currentDb.path}`);
  await saveAllDatabase(currentDb);
  return null;
};

let cleanupListenerInitialized = false;

const initializeCleanupListener = () => {
  if (cleanupListenerInitialized) return;
  setProgress(`Setting up cleanup listener`);
  log.info(`:: Setting up cleanup listener`);
  cleanupListenerInitialized = true;
  install((_, signal) => {
    if (signal) {
      setProgress(`Saving data`);
      log.info(':: Trying to save your data');
      cleanupDb()
        .then(() => {
          process.kill(process.pid, signal);
          return null;
        })
        .catch((error) => {
          throw error;
        });

      uninstall();
      return false;
    }

    return true;
  });
};

export const setupDb = async (yamlPath: string) => {
  initializeCleanupListener();
  await cleanupDb();

  setProgress(`Setting up database`);
  log.info(`:: Setting up db: ${yamlPath}`);
  await getDb(yamlPath);
};

export const resetDb = async () => {
  await cleanupDb();
  currentDb = null;
};

import StreamZip from 'node-stream-zip';

import { copy } from 'fs-extra';
import { join } from 'path';
import { dirSync } from 'tmp';

import { DB_CONFIG } from '@recative/studio-definitions';

import type {
  IViewDbConfigItem,
  ICollectionDbConfigItem,
} from '@recative/studio-definitions';

import { getDb, saveAllDatabase } from 'rpc/db';
import { JoinMode, mergeCollection } from './mergeCollection';

export const extractDb = async (filePath: string) => {
  const dbPath = dirSync().name;

  const newZip = new StreamZip.async({ file: filePath });
  await Promise.all(
    Object.values(DB_CONFIG).map(({ file }) => {
      return newZip.extract(file, join(dbPath, file));
    })
  );

  return dbPath;
};

export const replaceDatabase = async (toDbPath: string, fromDbPath: string) => {
  await Promise.all(
    Object.values(DB_CONFIG).map(({ file }) => {
      return copy(join(fromDbPath, file), join(toDbPath, file));
    })
  );
};

export const mergeDatabase = async (
  toDbPath: string,
  fromDbPath: string,
  joinMode: JoinMode
) => {
  const toDb = await getDb(toDbPath, true);
  const fromDb = await getDb(fromDbPath, true);

  (Object.keys(DB_CONFIG) as (keyof typeof DB_CONFIG)[]).forEach((dbKey) => {
    const db = DB_CONFIG[dbKey];

    if (!('config' in db)) return;

    (Object.keys(db.config) as (keyof typeof db.config)[]).forEach(
      (collectionKey) => {
        const config = db[collectionKey] as unknown as
          | ICollectionDbConfigItem<unknown>
          | IViewDbConfigItem<unknown>;

        if (!('key' in config)) return;

        const toCollection = toDb[dbKey][collectionKey] as Collection<
          Record<string, unknown>
        >;
        const fromCollection = fromDb[dbKey][collectionKey] as Collection<
          Record<string, unknown>
        >;

        mergeCollection(toCollection, fromCollection, config.key, joinMode);
      }
    );
  });

  return saveAllDatabase(toDb);
};

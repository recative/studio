import console from 'electron-log';
import { join } from 'path';

import Loki, { LokiFsAdapter } from 'lokijs';
import type { LokiFsStructuredAdapter } from 'loki-fs-structured-adapter';

import { IDbInstance, DB_CONFIG } from '@recative/studio-definitions';

let dbLoadingProgress = 0;
let dbLoadingStatus = 'Not initialized';

export const getDbProgress = () => ({
  totalDatabases: Object.keys(DB_CONFIG).length,
  dbLoadingProgress,
  dbLoadingStatus,
});

export const initializeDb = async <T>(
  dbPath: string,
  adapter: LokiFsAdapter | LokiFsStructuredAdapter,
  additionalData: T
) => {
  const dbInstance = {
    path: dbPath,
    additionalData,
  } as IDbInstance<T>;

  for (const [internalDbId, dbDefinition] of Object.entries(DB_CONFIG)) {
    dbLoadingProgress += 1;

    const logDbId = internalDbId[0].toUpperCase() + internalDbId.substring(1);
    dbLoadingStatus = `${logDbId} Database`;

    const dbId = internalDbId as keyof IDbInstance<T>;
    if (dbId === 'path' || dbId === 'additionalData') {
      continue;
    }

    // Initialize the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dbInstance[dbId] as any) = {};

    await new Promise((resolve) => {
      let db: Loki | null = null;
      const fullPath = join(dbPath, dbDefinition.file);

      db = new Loki(fullPath, {
        adapter,
        autoload: true,
        autoloadCallback: () => resolve(db as unknown as Loki),
        autosave: true,
        autosaveInterval: 500,
      });

      dbInstance[dbId].$db = db;
    });

    // Initialize collections
    for (const [collectionId, collectionDefinition] of Object.entries(
      dbDefinition.config
    )) {
      console.log(`:: :: Initializing ${collectionId}`);
      if (collectionDefinition.type === 'collection') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const collection = dbInstance[dbId].$db.addCollection(collectionId, {
          autoupdate: collectionDefinition.autoupdate,
          indices: collectionDefinition.indices,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dbInstance[dbId] as any)[collectionId] = collection;

        const deduplicateSet = new Set();

        const data = collection.data
          .sort((a, b) => a.meta.created - b.meta.created)
          .filter((x) => {
            const duplicated = deduplicateSet.has(x.$loki);
            deduplicateSet.add(x.$loki);

            if (duplicated) {
              console.warn(
                `collection=${collection.name}&$loki=${x.$loki} duplicated, will remove it`
              );
            }
            return !duplicated;
          })
          .sort((a, b) => a.$loki - b.$loki);

        const index = new Array(data.length);
        for (let i = 0; i < data.length; i += 1) {
          index[i] = data[i].$loki;
        }

        collection.idIndex = index;
        collection.maxId = collection.data?.length
          ? Math.max(...collection.data.map((x) => x.$loki))
          : 0;
        collection.checkAllIndexes({
          randomSampling: true,
          repair: true,
        });
      }

      if (collectionDefinition.type === 'view') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const collection = (dbInstance[dbId] as any)[
          collectionDefinition.target
        ];
        if (!collection) {
          throw new TypeError(
            `Collection "${collectionDefinition.target}" not found`
          );
        }

        const view = collection.addDynamicView('files');
        view.applyFind(collectionDefinition.query);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dbInstance[dbId] as any)[collectionId] = view;
      }
    }
  }

  return dbInstance;
};

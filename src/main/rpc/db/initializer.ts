import { join } from 'path';

import Loki, { LokiFsAdapter } from 'lokijs';

import { IDbInstance, DB_CONFIG } from './config';

export const initializeDb = async <T>(
  dbPath: string,
  adapter: LokiFsAdapter,
  additionalData: T
) => {
  const dbInstance = {
    path: dbPath,
    additionalData,
  } as IDbInstance<T>;

  for (const [internalDbId, dbDefinition] of Object.entries(DB_CONFIG)) {
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
      if (collectionDefinition.type === 'collection') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dbInstance[dbId] as any)[collectionId] = dbInstance[
          dbId
        ].$db.addCollection(collectionId, {
          autoupdate: collectionDefinition.autoupdate,
          indices: collectionDefinition.indices,
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

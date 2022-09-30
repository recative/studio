import tmp from 'tmp';
import Loki from 'lokijs';
import { readFileSync } from 'fs';

import { LokiFsStructuredAdapter } from '../../main';

const DATA_SIZE = 2;

export const createTestEnvironment = async (
  dbPath = tmp.fileSync().name,
  collectionName = Math.random().toString(36)
) => {
  const randomData: number[] = [];

  const adapter = new LokiFsStructuredAdapter();
  const db = await new Promise<Loki>((resolve) => {
    let internalDb: Loki | null = null;

    internalDb = new Loki(dbPath, {
      adapter,
      autoload: true,
      autoloadCallback: () => resolve(internalDb as unknown as Loki),
      autosave: true,
      autosaveInterval: 500,
    });
  });

  const collection = db.addCollection(collectionName);

  const fillData = () => {
    console.log('== Writing data');
    for (let id = 0; id < DATA_SIZE; id += 1) {
      const data = Math.random();
      randomData.push(data);

      collection.insert({ id, data });
    }
  };

  const save = () =>
    new Promise((resolve, reject) => {
      db.saveDatabase((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });

  const validateRaw = () => {
    const lines = readFileSync(`${dbPath}.0`, { encoding: 'utf-8' });

    return lines.split(/[\r\n]+/).filter(Boolean);
  };

  return {
    db,
    collection,
    collectionName,
    path: dbPath,
    save,
    fillData,
    validateRaw,
    randomData,
  };
};

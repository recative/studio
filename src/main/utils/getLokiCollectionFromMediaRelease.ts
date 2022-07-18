import { join } from 'path';
import StreamZip from 'node-stream-zip';

import type { LokiDbFile, Collection } from '@recative/definitions';

import { CollectionNotFoundError } from './errors/CollectionNotFoundError';

import { getBuildPath } from '../rpc/query/setting';

export const getLokiCollectionFromMediaRelease = async <T>(
  mediaReleaseId: number | string,
  dbName: string,
  collectionName: string
) => {
  const buildPath = await getBuildPath();

  const dbBundlePath = join(
    buildPath,
    `db-${mediaReleaseId.toString().padStart(4, '0')}.zip`
  );

  const dbBundle = new StreamZip.async({ file: dbBundlePath });

  const resourceDb = JSON.parse(
    (await dbBundle.entryData(`${dbName}.json`)).toString()
  ) as LokiDbFile<T>;

  const collection = resourceDb.collections.find(
    (x) => x.name === collectionName
  ) as Collection<T>;

  if (!collection) throw new CollectionNotFoundError(collectionName);

  return collection;
};

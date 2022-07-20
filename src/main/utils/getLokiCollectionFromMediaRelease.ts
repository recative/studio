import { join } from 'path';
import { readFile } from 'fs/promises';
import StreamZip from 'node-stream-zip';

import type { LokiDbFile, Collection } from '@recative/definitions';

import { CollectionNotFoundError } from './errors/CollectionNotFoundError';

import { getWorkspace } from '../rpc/workspace';
import { getBuildPath } from '../rpc/query/setting';

export const getLokiCollectionFromMediaRelease = async <T>(
  mediaReleaseId: number | string,
  dbName: string,
  collectionName: string
) => {
  let resourceDb: LokiDbFile<T>;

  if (mediaReleaseId === 'current' || mediaReleaseId === -1) {
    const workspace = getWorkspace();

    if (!workspace) {
      throw new Error('No workspace found');
    }

    resourceDb = JSON.parse(
      (await readFile(join(workspace.dbPath, `${dbName}.json`))).toString()
    );
  } else {
    const buildPath = await getBuildPath();

    const dbBundlePath = join(
      buildPath,
      `db-${mediaReleaseId.toString().padStart(4, '0')}.zip`
    );

    const dbBundle = new StreamZip.async({ file: dbBundlePath });

    resourceDb = JSON.parse(
      (await dbBundle.entryData(`${dbName}.json`)).toString()
    ) as LokiDbFile<T>;
  }

  const collection = resourceDb.collections.find(
    (x) => x.name === collectionName
  ) as Collection<T>;

  if (!collection) throw new CollectionNotFoundError(collectionName);

  return collection;
};

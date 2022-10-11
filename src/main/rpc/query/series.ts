import { groupBy } from 'lodash';

import type { ISeriesMetadata, IResourceItem } from '@recative/definitions';

import { getDb } from '../db';

export const getSeriesMetadata = async () => {
  const db = await getDb();

  const metadata = db.series.metadata.findOne() as ISeriesMetadata;

  const resources = db.resource.resources.find({
    id: {
      $in: [
        metadata?.loadingCoverForCatalogPageResourceId || '',
        metadata?.loadingCoverForMainContentsResourceId || '',
      ],
    },
  }) as IResourceItem[];

  const resourcesMap = groupBy(resources, 'id');

  return {
    metadata,
    resources: resourcesMap,
  };
};

export const getSeriesId = async () => {
  const db = await getDb();

  const seriesId = db.series.metadata.data[0]?.id;
  if (!seriesId) throw new Error('Series id not found!');

  return seriesId;
};

export const updateOrInsertMetadata = async (item: ISeriesMetadata) => {
  const db = await getDb();

  const itemInDb = db.series.metadata.findOne();

  if (itemInDb) {
    // Update
    Object.assign(itemInDb, item);
    db.series.metadata.update(itemInDb);
  } else {
    // Insert
    db.series.metadata.insert(item);
  }
};

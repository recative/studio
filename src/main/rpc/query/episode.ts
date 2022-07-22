import { groupBy } from 'lodash';
import type {
  IEpisode,
  IResourceItem,
  IActPoint,
  IAsset,
} from '@recative/definitions';

import { getClientSideAssetList } from './asset';

import { getDb } from '../db';

import { getProfile } from '../../dataGenerationProfiles';
import type { ProfileConfig } from '../../dataGenerationProfiles';
import { cleanupLoki } from './utils';
import { getResource } from './resource';

export const getResourceAndActPoints = async (itemIds: string[]) => {
  const db = await getDb();

  const resources = db.resource.resources.find({
    id: { $in: itemIds },
  }) as IResourceItem[];

  const actPoints = db.actPoint.actPoints.find({
    id: { $in: itemIds },
  }) as IActPoint[];

  return [...resources, ...actPoints];
};

export const getResourceListOfEpisode = async (
  episodeId: string,
  request: ProfileConfig,
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const db = await (dbPromise || getDb());

  const profile = getProfile(request);

  const resourceFiles = profile.injectResourceUrls([
    ...(await Promise.all(
      db.resource.resources
        .find({
          $or: [
            { episodeIds: { $contains: episodeId }, removed: false },
            { episodeIds: { $size: 0 }, removed: false },
          ],
        })
        .map(async (x) => {
          if (x.type === 'group') return x;

          const latestResource = await getResource(x.id);

          if (!latestResource) {
            return x;
          }

          if (latestResource.type === 'group') {
            throw new TypeError('Mismatch resource type');
          }

          return {
            ...x,
            url: latestResource.url,
          };
        })
    )),
    ...db.resource.postProcessed.find({
      $or: [
        { episodeIds: { $contains: episodeId }, removed: false },
        { episodeIds: { $size: 0 }, removed: false },
      ],
    }),
  ]);

  const resourceGroups = db.resource.resources.find({
    files: { $containsAny: resourceFiles.map((x) => x.id) },
  });

  return cleanupLoki([...resourceGroups, ...resourceFiles], true);
};

export const listEpisodes = async (
  itemIds: string[] | null = null,
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const db = await (dbPromise || getDb());

  const episodes = db.episode.episodes.find(
    itemIds ? { id: { $in: itemIds } } : {}
  ) as IEpisode[];

  const assets = db.episode.assets.find(
    itemIds ? { episodeId: { $in: itemIds } } : {}
  );

  const assetsMap = groupBy(assets, 'episodeId');

  const resources = await getResourceAndActPoints(
    assets.map((asset) => asset.contentId)
  );

  const resourcesMap = groupBy(resources, 'id');

  return episodes.map((episode) => ({
    id: episode.id,
    episode,
    assets: (assetsMap[episode.id] || []) as IAsset[],
    resources: resourcesMap,
  }));
};

export const getEpisode = async (itemId: string) => {
  const db = await getDb();

  const episode = db.episode.episodes.findOne({ id: itemId });

  return episode;
};

export const getEpisodeList = async (
  episodeIds: string[] | null = null,
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const db = await (dbPromise || getDb());
  const internalEpisodeIds =
    episodeIds ?? (db.episode.episodes.find({}) as IEpisode[]).map((x) => x.id);

  return db.episode.episodes.find({
    id: { $in: internalEpisodeIds },
  });
};

export const getEpisodeDetail = async (
  episodeId: string,
  request: ProfileConfig,
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const db = await (dbPromise || getDb());

  const episode = db.episode.episodes.findOne({ id: episodeId }) as IEpisode;
  const assets = await getClientSideAssetList(episodeId, request, dbPromise);
  const resources = await getResourceListOfEpisode(
    episodeId,
    request,
    dbPromise
  );
  const key = episode.id;

  return { episode, assets, resources, key };
};

export const getEpisodeDetailList = async (
  episodeIds: string[] | null = null,
  request: ProfileConfig,
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const internalEpisodeIds =
    episodeIds ??
    (
      (await (dbPromise || getDb())).episode.episodes.find({}) as IEpisode[]
    ).map((x) => x.id);

  return Promise.all(
    internalEpisodeIds.map((episodeId) =>
      getEpisodeDetail(episodeId, request, dbPromise)
    )
  );
};

export const updateOrInsertEpisodes = async (items: IEpisode[]) => {
  const db = await getDb();

  items.forEach((item) => {
    const itemInDb = db.episode.episodes.findOne({ id: item.id });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      db.episode.episodes.update(itemInDb);
    } else {
      // Insert
      db.episode.episodes.insert(item);
    }
  });
};

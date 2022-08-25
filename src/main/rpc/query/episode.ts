import log from 'electron-log';
import { groupBy } from 'lodash';

import { cleanUpResourceListForClient } from '@recative/definitions';
import type {
  IAsset,
  IEpisode,
  IActPoint,
  IResourceItem,
} from '@recative/definitions';
import type { PostProcessedResourceItemForUpload } from '@recative/extension-sdk';

import { getClientSideAssetList } from './asset';

import { getDb } from '../db';

import { getProfile } from '../../dataGenerationProfiles';
import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';

import type { ProfileConfig } from '../../dataGenerationProfiles';

import { cleanupLoki } from './utils';

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
  const db0 = await getDb();
  const db = await (dbPromise || getDb());

  let lastTime = performance.now();
  let currentTime = performance.now();

  const profile = getProfile(request);

  const mediaBundleId =
    typeof db.additionalData.mediaBundleId === 'number'
      ? db.additionalData.mediaBundleId
      : db0.release.mediaReleases
          .chain()
          .simplesort('id', { desc: true })
          .limit(1)
          .find({})
          .data()[0].id;

  currentTime = performance.now();
  log.log(`:: :: :: [${episodeId}] [query] Took ${currentTime - lastTime} ms`);
  lastTime = currentTime;

  const importedResourceFiles = db.resource.resources
    .find({
      $or: [
        { episodeIds: { $contains: episodeId }, removed: false },
        { episodeIds: { $size: 0 }, removed: false },
      ],
    })
    .map((x) => {
      if (x.type === 'group') return x;

      const latestResource = db0.resource.resources.findOne({ id: x.id });

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
    });

  const groupIds = [
    ...new Set(importedResourceFiles.map((x) => x.resourceGroupId)),
  ].filter(Boolean);

  const importedResourceGroups = db.resource.resources.find({
    id: {
      $in: groupIds,
    },
  });

  const postProcessedResourceFiles = db.resource.postProcessed
    .find({
      $or: [
        { episodeIds: { $contains: episodeId }, removed: false },
        { episodeIds: { $size: 0 }, removed: false },
      ],
    })
    .filter((x) => x.postProcessRecord.mediaBundleId.includes(mediaBundleId));

  const queriedResources = [
    ...importedResourceFiles,
    ...importedResourceGroups,
    ...postProcessedResourceFiles,
  ];

  const injectedResources = await profile.injectResourceUrls(queriedResources);

  currentTime = performance.now();
  log.log(`:: :: :: [${episodeId}] [inject] Took ${currentTime - lastTime} ms`);
  lastTime = currentTime;

  const resourceGroups = db.resource.resources.find({
    files: { $containsAny: injectedResources.map((x) => x.id) },
  });

  let resources: (PostProcessedResourceItemForUpload | IResourceItem)[] =
    JSON.parse(
      JSON.stringify([...injectedResources, ...resourceGroups].map(cleanupLoki))
    );

  currentTime = performance.now();
  log.log(`:: :: :: [${episodeId}] [clone] Took ${currentTime - lastTime} ms`);
  lastTime = currentTime;

  const extensionInstances = Object.entries(
    await getResourceProcessorInstances('')
  );

  for (let i = 0; i < extensionInstances.length; i += 1) {
    const [extensionKey, extension] = extensionInstances[i];

    try {
      const processResult = await extension.beforePublishApplicationBundle(
        resources,
        request.type
      );
      if (processResult) {
        resources = processResult;
      }
    } catch (e) {
      log.error(e);
      throw e;
    }

    const splittedKey = extensionKey.split('/');

    currentTime = performance.now();
    log.log(
      `:: :: :: [${episodeId}] [${
        splittedKey[splittedKey.length - 1]
      }] [b4PublishBundle] Took ${currentTime - lastTime} ms`
    );
    lastTime = currentTime;
  }

  const cleanupResult = cleanUpResourceListForClient(resources, false);

  currentTime = performance.now();
  log.log(
    `:: :: :: [${episodeId}] [cleanup] Took ${currentTime - lastTime} ms`
  );

  return cleanupResult;
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
  requestId: string,
  request: ProfileConfig,
  dbPromise: ReturnType<typeof getDb> | null = null,
  skipResources = false
) => {
  const db = await (dbPromise || getDb());

  const isAssetRequest = requestId.startsWith('as:');
  const assetId = requestId.replace('as:', '');

  const episodeIdOfAsset = isAssetRequest
    ? db.episode.assets.findOne({ id: assetId })?.episodeId
    : null;

  if (episodeIdOfAsset === undefined) {
    throw new TypeError(`Episode of asset not found: ${requestId}`);
  }

  const episode = db.episode.episodes.findOne({
    id: episodeIdOfAsset ?? requestId,
  });

  if (!episode) {
    throw new TypeError(`Episode not found: ${requestId}`);
  }

  const rawAssets = await getClientSideAssetList(
    episode.id,
    request,
    dbPromise
  );
  const assets = rawAssets.filter((x) =>
    isAssetRequest ? x.id === assetId : true
  );

  try {
    const resources = skipResources
      ? []
      : await getResourceListOfEpisode(episode.id, request, dbPromise);

    const key = episode.id;

    return { episode: cleanupLoki(episode), assets, resources, key };
  } catch (e) {
    if (e instanceof Error) {
      e.message = `Failed to get resource list of ${requestId}: ${e.message}`;
      throw e;
    } else {
      throw e;
    }
  }
};

export const getEpisodeDetailList = async (
  episodeIds: string[] | null = null,
  request: ProfileConfig,
  dbPromise: ReturnType<typeof getDb> | null = null,
  skipResources = false
) => {
  const internalEpisodeIds =
    episodeIds ??
    (
      (await (dbPromise || getDb())).episode.episodes.find({}) as IEpisode[]
    ).map((x) => x.id);

  return Promise.all(
    internalEpisodeIds.map((episodeId) =>
      getEpisodeDetail(episodeId, request, dbPromise, skipResources)
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

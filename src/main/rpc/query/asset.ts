import { nanoid } from 'nanoid';
import { uniqBy } from 'lodash';

import {
  videoGroupResourceTag,
  VIDEO_CONTENT_EXTENSION_ID,
  ACT_POINT_CONTENT_EXTENSION_ID,
} from '@recative/definitions';
import type {
  IAsset,
  IActPoint,
  IResourceItem,
  IAssetForClient,
} from '@recative/definitions';

import { getResource, getResourceWithDetailedFileList } from './resource';

import { getDb } from '../db';

import { getProfile } from '../../dataGenerationProfiles';
import type { ProfileConfig } from '../../dataGenerationProfiles';

import { noNulls } from '../../../utils/noNulls';
import { getActPoint } from './actPoint';
import { cleanupLoki } from './utils';

export const searchAssetResources = async (query = '', limit = 40) => {
  const db = await getDb();

  const videoSearchResult: IResourceItem[] = db.resource.resources
    .chain()
    .find({
      $or: [{ id: { $contains: query } }, { label: { $regex: [query, 'i'] } }],
      tags: {
        $containsAny: [videoGroupResourceTag.id],
      },
    })
    .limit(limit)
    .data();

  const apSearchResult: IActPoint[] = db.actPoint.actPoints
    .chain()
    .find({
      $or: [
        { id: { $contains: query } },
        { fullPath: { $regex: [query, 'i'] } },
      ],
    })
    .limit(limit)
    .data();

  type Asset = IResourceItem | IActPoint;
  const getLabel = (a: Asset) => {
    if ('type' in a) {
      return a.label;
    }
    return a.fullPath;
  };
  const result = uniqBy([...videoSearchResult, ...apSearchResult], 'id').sort(
    (a, b) => getLabel(a as Asset).localeCompare(getLabel(b as Asset))
  );

  return result;
};

export const updateOrInsertAssets = async (items: IAsset[]) => {
  const db = await getDb();

  items.forEach((item) => {
    const itemInDb = db.episode.assets.findOne({ id: item.id });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      db.episode.assets.update(itemInDb);
    } else {
      // Insert
      db.episode.assets.insert(cleanupLoki(item));
    }
  });
};

export const removeAssets = async (ids: string[]) => {
  const db = await getDb();

  const itemInDb = db.episode.assets.find({ id: { $in: [ids] } });
  itemInDb.forEach((item) => {
    db.episode.assets.remove(item);
  });
};

export const addEmptyAsset = async (episodeId: string) => {
  const db = await getDb();

  const newAsset: IAsset = {
    id: nanoid(),
    episodeId,
    contentId: '',
    contentExtensionId: '',
    order: 0,
    notes: '',
    createTime: Date.now(),
    updateTime: Date.now(),
    preloadDisabled: false,
    earlyDestroyOnSwitch: false,
  };

  db.episode.assets.insert(newAsset);

  return newAsset;
};

// This is only for debug purpose.
export const getAssetDescription = async (assetId: string) => {
  const db = await getDb();

  const asset = db.episode.assets.findOne({ id: assetId });

  if (!asset) return null;

  if (asset.contentExtensionId === VIDEO_CONTENT_EXTENSION_ID) {
    const resource = await getResource(asset.contentId);

    return {
      ...asset,
      ...resource,
    };
  }

  if (asset.contentExtensionId === ACT_POINT_CONTENT_EXTENSION_ID) {
    const actPoint = await getActPoint(asset.contentId);

    return {
      ...asset,
      ...actPoint,
    };
  }

  return null;
};

export const getClientSideAssetList = async (
  episodeId: string,
  request: ProfileConfig = {
    type: 'apPackDistPreview',
    resourceHostName: 'localhost:9999',
    apHostName: 'localhost:9999',
    apProtocol: 'http',
  },
  dbPromise: ReturnType<typeof getDb> | null = null
) => {
  const db = await (dbPromise || getDb());

  if (!db.episode) {
    return [];
  }

  const assets = db.episode.assets.find({ episodeId });

  const contentIds = assets.map((asset) => asset.contentId);

  const profile = getProfile(request);

  const actPointsOfEpisode = profile.injectApEntryPoints(
    db.actPoint.actPoints.find({
      id: { $in: contentIds },
    })
  );

  const resourcesOfEpisode = noNulls(
    await Promise.all(contentIds.map(getResourceWithDetailedFileList))
  );

  const assetList = assets
    .sort((a, b) => a.order - b.order)
    .map(async (asset) => {
      if (asset.contentExtensionId === VIDEO_CONTENT_EXTENSION_ID) {
        const matchedResource = resourcesOfEpisode.find((resource) => {
          if (!resource.group) return false;
          return resource.group.id === asset.contentId;
        });

        if (!matchedResource) return null;
        // We expect that there must be a group.
        if (!matchedResource.group) return null;

        const maxDuration = Math.max(
          ...matchedResource.files.map((file) => file.duration || -1)
        );

        return {
          id: asset.id,
          duration: maxDuration === -1 ? Infinity : maxDuration * 1000,
          order: asset.order,
          triggers: asset.triggers,
          spec: {
            contentExtensionId: asset.contentExtensionId,
            resourceId: matchedResource.group.id,
          },
          preloadDisabled: asset.preloadDisabled,
          earlyDestroyOnSwitch: asset.earlyDestroyOnSwitch,
        } as IAssetForClient;
      }

      if (asset.contentExtensionId === ACT_POINT_CONTENT_EXTENSION_ID) {
        const actPoint = (await actPointsOfEpisode).find(
          (item) => item.id === asset.contentId
        );

        if (!actPoint) {
          throw new Error('Act point not found');
        }

        const injectedActPoint = (
          await profile.injectApEntryPoints([actPoint])
        )[0];

        return {
          id: asset.id,
          duration: Infinity,
          order: asset.order,
          triggers: asset.triggers,
          spec: {
            contentExtensionId: asset.contentExtensionId,
            ...injectedActPoint,
          },
          preloadDisabled: asset.preloadDisabled,
          earlyDestroyOnSwitch: asset.earlyDestroyOnSwitch,
        } as IAssetForClient;
      }

      return null;
    });

  return Promise.all(assetList).then(noNulls);
};
